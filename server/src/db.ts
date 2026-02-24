// ─────────────────────────────────────────────────────────────────────────────
// server/src/db.ts — SQLite via @libsql/client (drop-in Turso migration path)
//
// DB_PATH env var lets you point at a persistent file (e.g. on a Railway volume).
// Falls back to ./data/lands.db in the process working directory.
// Set DB_PATH=:memory: to use an in-memory DB (useful for unit tests).
// ─────────────────────────────────────────────────────────────────────────────
import { createClient, type Client } from '@libsql/client';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

export interface UserRow {
  id: string;
  username: string;
  username_lower: string;
  passcode_hash: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
  best_win_streak: number;
  wins_five_kind: number;
  wins_rainbow: number;
  games_for_k: number; // tracks K-factor threshold (0-39 = K40; 40+ = K32; ELO 2000+ = K20)
  active_pack_id: string | null;
  created_at: string;
  last_seen: string;
}

export interface SkinPackRow {
  id: string;          // e.g. 'autumn'
  name: string;        // e.g. 'Autumn Lands'
  description: string;
  price_cents: number; // 0 = free, 499 = $4.99
  preview_url: string; // shown in the shop
  released_at: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
  best_win_streak: number;
  wins_five_kind: number;
  wins_rainbow: number;
  active_pack_id: string | null;
  owned_pack_ids: string[];
  created_at: string;
  last_seen: string;
}

export interface GameResultInsert {
  p0id: string;
  p1id: string;
  winnerIndex: 0 | 1 | null; // null = draw
  winReason: string | null;
  turnCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────

let _client: Client | null = null;

function getClient(): Client {
  if (_client) return _client;

  const url = process.env.DB_PATH?.trim()
    ? (process.env.DB_PATH === ':memory:'
        ? ':memory:'
        : `file:${process.env.DB_PATH}`)
    : 'file:data/lands.db';

  // Ensure the data directory exists for file-based DBs
  if (url.startsWith('file:') && url !== 'file::memory:') {
    try { mkdirSync(dirname(url.slice(5)), { recursive: true }); } catch {}
  }

  _client = createClient({ url });
  return _client;
}

// ── Schema ────────────────────────────────────────────────────────────────────

// Built-in skin packs seeded on every startup if they don't already exist.
// To add a new pack: add an entry here, add images to client/public/cards/skins/{id}/.
export const BUILTIN_PACKS: SkinPackRow[] = [
  {
    id:          'default',
    name:        'Classic',
    description: 'The original Lands card art.',
    price_cents: 0,
    preview_url: '/cards/skins/default/preview.svg',
    released_at: '2024-01-01T00:00:00.000Z',
  },
  // ─── Test packs (free, SVG-based) ────────────────────────────────────────
  {
    id:          'gilded',
    name:        'Gilded',
    description: 'Warm gold and amber tones — the lands as ancient treasure.',
    price_cents: 0,
    preview_url: '/cards/skins/gilded/preview.svg',
    released_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id:          'obsidian',
    name:        'Obsidian',
    description: 'Dark crystalline geometry. Cold. Precise. Beautiful.',
    price_cents: 0,
    preview_url: '/cards/skins/obsidian/preview.svg',
    released_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id:          'neon',
    name:        'Neon',
    description: 'Synthwave grid-scapes. All five lands, re-imagined in electric light.',
    price_cents: 0,
    preview_url: '/cards/skins/neon/preview.svg',
    released_at: '2026-01-01T00:00:00.000Z',
  },
  // ─── Add new packs below ────────────────────────────────────────────────
  // {
  //   id:          'autumn',
  //   name:        'Autumn Lands',
  //   description: 'Warm autumn colours for every element.',
  //   price_cents: 499,
  //   preview_url: '/cards/skins/autumn/preview.svg',
  //   released_at: '2025-06-01T00:00:00.000Z',
  // },
];

export async function initDB(): Promise<void> {
  const client = getClient();

  // ── Create tables ────────────────────────────────────────────────────────
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id             TEXT PRIMARY KEY,
      username       TEXT NOT NULL,
      username_lower TEXT UNIQUE NOT NULL,
      passcode_hash  TEXT NOT NULL,
      elo            INTEGER NOT NULL DEFAULT 1000,
      wins           INTEGER NOT NULL DEFAULT 0,
      losses         INTEGER NOT NULL DEFAULT 0,
      draws          INTEGER NOT NULL DEFAULT 0,
      win_streak     INTEGER NOT NULL DEFAULT 0,
      best_win_streak INTEGER NOT NULL DEFAULT 0,
      wins_five_kind INTEGER NOT NULL DEFAULT 0,
      wins_rainbow   INTEGER NOT NULL DEFAULT 0,
      games_for_k    INTEGER NOT NULL DEFAULT 0,
      active_pack_id TEXT DEFAULT NULL,
      created_at     TEXT NOT NULL,
      last_seen      TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS game_results (
      id            TEXT PRIMARY KEY,
      p0_id         TEXT NOT NULL REFERENCES users(id),
      p1_id         TEXT NOT NULL REFERENCES users(id),
      winner_index  INTEGER,
      win_reason    TEXT,
      turn_count    INTEGER NOT NULL,
      elo_delta_p0  INTEGER NOT NULL DEFAULT 0,
      elo_delta_p1  INTEGER NOT NULL DEFAULT 0,
      played_at     TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS skin_packs (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL DEFAULT 0,
      preview_url TEXT NOT NULL,
      released_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_owned_packs (
      user_id      TEXT NOT NULL REFERENCES users(id),
      pack_id      TEXT NOT NULL REFERENCES skin_packs(id),
      purchased_at TEXT NOT NULL,
      PRIMARY KEY (user_id, pack_id)
    );
  `);

  // ── Migrations for existing databases ───────────────────────────────────
  // Safe to run repeatedly — errors from already-existing columns are swallowed.
  const migrations = [
    'ALTER TABLE users ADD COLUMN active_pack_id TEXT DEFAULT NULL',
  ];
  for (const sql of migrations) {
    await client.execute({ sql, args: [] }).catch(() => { /* column already exists */ });
  }

  // ── Seed built-in packs ──────────────────────────────────────────────────
  for (const pack of BUILTIN_PACKS) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO skin_packs (id, name, description, price_cents, preview_url, released_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [pack.id, pack.name, pack.description, pack.price_cents, pack.preview_url, pack.released_at],
    });
  }
}

// ── Helper: pick from a column-indexed row ────────────────────────────────────

function rowToUser(row: Record<string, unknown>): UserRow {
  return row as unknown as UserRow;
}

// ── User CRUD ─────────────────────────────────────────────────────────────────

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  const result = await getClient().execute({
    sql: 'SELECT * FROM users WHERE username_lower = ?',
    args: [username.toLowerCase()],
  });
  if (result.rows.length === 0) return null;
  return rowToUser(result.rows[0] as Record<string, unknown>);
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await getClient().execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return rowToUser(result.rows[0] as Record<string, unknown>);
}

export async function createUser(
  id: string,
  username: string,
  passcode_hash: string,
): Promise<UserRow> {
  const now = new Date().toISOString();
  await getClient().execute({
    sql: `INSERT INTO users
            (id, username, username_lower, passcode_hash, elo, wins, losses, draws,
             win_streak, best_win_streak, wins_five_kind, wins_rainbow, games_for_k,
             created_at, last_seen)
          VALUES (?, ?, ?, ?, 1000, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?)`,
    args: [id, username, username.toLowerCase(), passcode_hash, now, now],
  });
  return (await findUserById(id))!;
}

export async function touchLastSeen(id: string): Promise<void> {
  await getClient().execute({
    sql: 'UPDATE users SET last_seen = ? WHERE id = ?',
    args: [new Date().toISOString(), id],
  });
}

export function toPublicProfile(u: UserRow, ownedPackIds: string[] = []): PublicProfile {
  const { passcode_hash: _, username_lower: __, games_for_k: ___, ...pub } = u;
  return { ...pub, owned_pack_ids: ownedPackIds } as PublicProfile;
}

// ── Skin pack queries ─────────────────────────────────────────────────────────

export async function getAllSkinPacks(): Promise<SkinPackRow[]> {
  const result = await getClient().execute({ sql: 'SELECT * FROM skin_packs ORDER BY released_at', args: [] });
  return result.rows as unknown as SkinPackRow[];
}

export async function getUserOwnedPackIds(userId: string): Promise<string[]> {
  const result = await getClient().execute({
    sql: 'SELECT pack_id FROM user_owned_packs WHERE user_id = ?',
    args: [userId],
  });
  return result.rows.map(r => (r as Record<string, unknown>).pack_id as string);
}

/** Grant a pack to a user (idempotent — safe to call on duplicate purchase). */
export async function grantPack(userId: string, packId: string): Promise<void> {
  await getClient().execute({
    sql: 'INSERT OR IGNORE INTO user_owned_packs (user_id, pack_id, purchased_at) VALUES (?, ?, ?)',
    args: [userId, packId, new Date().toISOString()],
  });
}

/** Set the user's active skin pack. */
export async function setActivePack(userId: string, packId: string | null): Promise<void> {
  await getClient().execute({
    sql: 'UPDATE users SET active_pack_id = ? WHERE id = ?',
    args: [packId, userId],
  });
}

// ── ELO & stats ───────────────────────────────────────────────────────────────

function kFactor(u: UserRow): number {
  if (u.elo >= 2000) return 20;
  if (u.games_for_k >= 40) return 32;
  return 40;
}

function eloExpected(myElo: number, oppElo: number): number {
  return 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
}

/**
 * Persist a multiplayer game result.
 * Updates both players' ELO, win/loss/draw counters, and win-condition tallies.
 * Returns the ELO deltas [deltaP0, deltaP1].
 */
export async function recordGameResult(
  result: GameResultInsert,
): Promise<[number, number]> {
  const { p0id, p1id, winnerIndex, winReason, turnCount } = result;

  const [p0, p1] = await Promise.all([findUserById(p0id), findUserById(p1id)]);
  if (!p0 || !p1) return [0, 0];

  // Scores: 1 = win, 0 = loss, 0.5 = draw
  const score0 = winnerIndex === null ? 0.5 : winnerIndex === 0 ? 1 : 0;
  const score1 = 1 - score0;

  const exp0 = eloExpected(p0.elo, p1.elo);
  const exp1 = eloExpected(p1.elo, p0.elo);

  const delta0 = Math.round(kFactor(p0) * (score0 - exp0));
  const delta1 = Math.round(kFactor(p1) * (score1 - exp1));

  const newElo0 = Math.max(100, p0.elo + delta0);
  const newElo1 = Math.max(100, p1.elo + delta1);

  // Win-condition bonus counters
  const isFiveKind = winReason === 'five_of_a_kind';
  const isRainbow  = winReason === 'rainbow';

  const now = new Date().toISOString();
  const resultId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Update both players atomically-ish (libsql doesn't support multi-statement txn in one call via executeMultiple + args)
  await Promise.all([
    getClient().execute({
      sql: `UPDATE users SET
              elo            = ?,
              wins           = wins + ?,
              losses         = losses + ?,
              draws          = draws + ?,
              win_streak     = CASE WHEN ? > 0 THEN win_streak + 1 ELSE 0 END,
              best_win_streak = MAX(best_win_streak, CASE WHEN ? > 0 THEN win_streak + 1 ELSE best_win_streak END),
              wins_five_kind = wins_five_kind + ?,
              wins_rainbow   = wins_rainbow + ?,
              games_for_k    = MIN(games_for_k + 1, 9999),
              last_seen      = ?
            WHERE id = ?`,
      args: [
        newElo0,
        score0 === 1 ? 1 : 0,
        score0 === 0 ? 1 : 0,
        score0 === 0.5 ? 1 : 0,
        score0 === 1 ? 1 : 0,
        score0 === 1 ? 1 : 0,
        score0 === 1 && isFiveKind ? 1 : 0,
        score0 === 1 && isRainbow  ? 1 : 0,
        now, p0id,
      ],
    }),
    getClient().execute({
      sql: `UPDATE users SET
              elo            = ?,
              wins           = wins + ?,
              losses         = losses + ?,
              draws          = draws + ?,
              win_streak     = CASE WHEN ? > 0 THEN win_streak + 1 ELSE 0 END,
              best_win_streak = MAX(best_win_streak, CASE WHEN ? > 0 THEN win_streak + 1 ELSE best_win_streak END),
              wins_five_kind = wins_five_kind + ?,
              wins_rainbow   = wins_rainbow + ?,
              games_for_k    = MIN(games_for_k + 1, 9999),
              last_seen      = ?
            WHERE id = ?`,
      args: [
        newElo1,
        score1 === 1 ? 1 : 0,
        score1 === 0 ? 1 : 0,
        score1 === 0.5 ? 1 : 0,
        score1 === 1 ? 1 : 0,
        score1 === 1 ? 1 : 0,
        score1 === 1 && isFiveKind ? 1 : 0,
        score1 === 1 && isRainbow  ? 1 : 0,
        now, p1id,
      ],
    }),
    getClient().execute({
      sql: `INSERT INTO game_results
              (id, p0_id, p1_id, winner_index, win_reason, turn_count, elo_delta_p0, elo_delta_p1, played_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [resultId, p0id, p1id, winnerIndex ?? null, winReason ?? null, turnCount, delta0, delta1, now],
    }),
  ]);

  return [delta0, delta1];
}
