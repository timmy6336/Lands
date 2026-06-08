// ─────────────────────────────────────────────────────────────────────────────
// server/src/RoomManager.ts
//
// In-memory registry of all active game rooms.  There is one shared instance
// per server process (see socketHandlers.ts: `const rooms = new RoomManager()`).
//
// Lifecycle of a multiplayer room:
//   createRoom()  — host connects
//   joinRoom()    — second player connects
//   setReady()    — both players click Ready (RPS begins)
//   startGame()   — called after RPS, creates the GameEngine
//   removePlayer()/reconnectPlayer() — disconnect/reconnect handling
//
// Single-player rooms skip all of the above: createSinglePlayerRoom() does
// everything in one call and returns a running GameEngine + AIPlayer.
// ─────────────────────────────────────────────────────────────────────────────
import { GameEngine } from './game/GameEngine';
import { GameSettings, Customizations, AIDifficulty } from '../../shared/types';
import { AIPlayer, AI_NAMES } from './ai/AIPlayer';

/** A player slot before the GameEngine starts (no cards yet). */
interface PendingPlayer {
  id: string;
  name: string;
  customizations?: Customizations;
  ready: boolean;
}

/** A room before and during a game. `engine` is null until both players are ready and RPS resolves. */
interface Room {
  code: string;
  players: [PendingPlayer] | [PendingPlayer, PendingPlayer];
  engine: GameEngine | null;
  settings: GameSettings;
}

/** Generate a random 4-letter room code, avoiding I and O to prevent confusion. */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * In-memory registry of all active rooms.
 * Lives for the lifetime of the server process.
 */
export class RoomManager {
  private rooms = new Map<string, Room>();

  /** Create a new room for the host player and return its 4-letter code. */
  createRoom(playerId: string, playerName: string, settings: GameSettings): string {
    let code: string;
    do { code = generateCode(); } while (this.rooms.has(code));

    this.rooms.set(code, {
      code,
      players: [{ id: playerId, name: playerName, ready: false }],
      engine: null,
      settings,
    });
    return code;
  }

  /** Add the second player to an existing room. Returns the room, or null if not found/already full. */
  joinRoom(roomCode: string, playerId: string, playerName: string): Room | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.players.length !== 1) return null;

    (room.players as PendingPlayer[]).push({ id: playerId, name: playerName, ready: false });
    return room;
  }

  /** Look up a room by its code; returns null if not found. */
  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) ?? null;
  }

  /** Find which room a given player ID belongs to (walks all rooms). */
  getRoomByPlayerId(playerId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === playerId)) return room;
    }
    return null;
  }

  /** Persist a player's card display name overrides and forward them to the running engine if any. */
  setCustomization(playerId: string, customizations: Customizations) {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.customizations = customizations;
      // Propagate to engine if game already started
      room.engine?.applyCustomization(playerId, customizations);
    }
  }

  /** Mark player as ready. Returns true when BOTH players are now ready (engine not yet created). */
  setReady(playerId: string): boolean {
    const room = this.getRoomByPlayerId(playerId);
    if (!room || room.players.length !== 2) return false;

    const player = room.players.find(p => p.id === playerId);
    if (player) player.ready = true;

    const [p0, p1] = room.players as [PendingPlayer, PendingPlayer];
    return p0.ready && p1.ready && !room.engine;
  }

  /** Create the GameEngine for a room, with a specific first player. Call after RPS. */
  startGame(roomCode: string, firstPlayerIndex: 0 | 1): GameEngine | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.players.length !== 2 || room.engine) return null;

    const [p0, p1] = room.players as [PendingPlayer, PendingPlayer];
    // Reorder so the chosen first player is index 0 in the engine
    const [first, second] = firstPlayerIndex === 0 ? [p0, p1] : [p1, p0];

    room.engine = new GameEngine(room.code, first, second, room.settings);
    if (p0.customizations) room.engine.applyCustomization(p0.id, p0.customizations);
    if (p1.customizations) room.engine.applyCustomization(p1.id, p1.customizations);
    return room.engine;
  }

  /**
   * Create a room for single-player vs AI.
   * Immediately starts the game (no customization/RPS phase).
   * Returns the room code, engine, and the AIPlayer (caller must activate it).
   */
  createSinglePlayerRoom(
    humanId: string,
    humanName: string,
    difficulty: AIDifficulty,
    settings: GameSettings,
  ): { roomCode: string; engine: GameEngine; aiPlayer: AIPlayer } {
    let code: string;
    do { code = generateCode(); } while (this.rooms.has(code));

    const aiPlayer = new AIPlayer(difficulty);
    const aiName   = AI_NAMES[difficulty];

    // Randomly decide whether human or AI goes first
    const humanFirst = Math.random() < 0.5;
    const p0 = humanFirst ? { id: humanId,            name: humanName } : { id: aiPlayer.playerId, name: aiName };
    const p1 = humanFirst ? { id: aiPlayer.playerId, name: aiName   } : { id: humanId,            name: humanName };

    const spSettings: GameSettings = { ...settings, isSinglePlayer: true };
    const engine = new GameEngine(code, p0, p1, spSettings);

    this.rooms.set(code, {
      code,
      players: [
        { id: p0.id, name: p0.name, ready: true },
        { id: p1.id, name: p1.name, ready: true },
      ] as [PendingPlayer, PendingPlayer],
      engine,
      settings: spSettings,
    });

    return { roomCode: code, engine, aiPlayer };
  }

  /** Remove a player on disconnect.  If the game has started, tells the engine; otherwise deletes the whole room. */
  removePlayer(playerId: string) {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return;

    if (room.engine) {
      room.engine.playerDisconnected(playerId);
      // Clean up rooms whose game has ended (normal finish or forfeit on disconnect)
      // so they don't accumulate in memory indefinitely.
      if (room.engine.state.phase === 'ended') {
        this.rooms.delete(room.code);
      }
    } else {
      // Room not started — delete entirely so the slot is freed
      this.rooms.delete(room.code);
    }
  }

  /** Reconnect a player who dropped and rejoined.  Returns the running engine so its state can be re-emitted. */
  reconnectPlayer(roomCode: string, playerId: string): GameEngine | null {
    const room = this.rooms.get(roomCode);
    if (!room?.engine) return null;
    room.engine.playerReconnected(playerId);
    return room.engine;
  }
}
