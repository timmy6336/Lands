// ─────────────────────────────────────────────────────────────────────────────
// server/src/auth.ts — Express REST routes for account creation and login
//
// Endpoints:
//   POST /auth/register  { username, passcode }  → { token, profile }
//   POST /auth/login     { username, passcode }  → { token, profile }
//   GET  /profile/me                              → { profile }  (requires Bearer token)
//   GET  /profile/:id                             → { profile }  (public)
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  findUserByUsername, findUserById, createUser, touchLastSeen, toPublicProfile,
  getUserOwnedPackIds,
} from './db';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'lands-dev-secret-change-in-production';
const SALT_ROUNDS = 10;

// ─────────────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ── Middleware: require a valid Bearer token ──────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing auth token' });
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  (req as Request & { auth: JwtPayload }).auth = payload;
  next();
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateUsername(u: string): string | null {
  if (!u || typeof u !== 'string') return 'Username is required';
  const trimmed = u.trim();
  if (trimmed.length < 2)  return 'Username must be at least 2 characters';
  if (trimmed.length > 24) return 'Username must be 24 characters or fewer';
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return 'Username may only contain letters, numbers, _ and -';
  return null;
}

function validatePasscode(p: string): string | null {
  if (!p || typeof p !== 'string') return 'Passcode is required';
  if (p.length < 4)  return 'Passcode must be at least 4 characters';
  if (p.length > 72) return 'Passcode is too long';
  return null;
}

// ── Router ────────────────────────────────────────────────────────────────────

export function createAuthRouter(): Router {
  const router = Router();

  // POST /auth/register
  router.post('/register', async (req, res) => {
    try {
      const { username, passcode } = req.body as { username?: string; passcode?: string };

      const usernameErr = validateUsername(username ?? '');
      if (usernameErr) { res.status(400).json({ error: usernameErr }); return; }

      const passcodeErr = validatePasscode(passcode ?? '');
      if (passcodeErr) { res.status(400).json({ error: passcodeErr }); return; }

      const clean = username!.trim();

      const existing = await findUserByUsername(clean);
      if (existing) { res.status(409).json({ error: 'Username already taken' }); return; }

      const hash = await bcrypt.hash(passcode!, SALT_ROUNDS);
      const user = await createUser(uuidv4(), clean, hash);

      const ownedIds = await getUserOwnedPackIds(user.id);
      const token = signToken({ userId: user.id, username: user.username });
      res.status(201).json({ token, profile: toPublicProfile(user, ownedIds) });
    } catch (err) {
      console.error('[auth] register error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /auth/login
  router.post('/login', async (req, res) => {
    try {
      const { username, passcode } = req.body as { username?: string; passcode?: string };

      if (!username || !passcode) {
        res.status(400).json({ error: 'Username and passcode are required' });
        return;
      }

      const user = await findUserByUsername(username);
      if (!user) { res.status(401).json({ error: 'Invalid username or passcode' }); return; }

      const match = await bcrypt.compare(passcode, user.passcode_hash);
      if (!match) { res.status(401).json({ error: 'Invalid username or passcode' }); return; }

      await touchLastSeen(user.id);

      const ownedIds = await getUserOwnedPackIds(user.id);
      const token = signToken({ userId: user.id, username: user.username });
      res.json({ token, profile: toPublicProfile(user, ownedIds) });
    } catch (err) {
      console.error('[auth] login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

// ── Profile router ────────────────────────────────────────────────────────────

export function createProfileRouter(): Router {
  const router = Router();

  // GET /profile/me — requires auth
  router.get('/me', requireAuth as (req: Request, res: Response, next: NextFunction) => void, async (req, res) => {
    try {
      const auth = (req as Request & { auth: JwtPayload }).auth;
      const user = await findUserById(auth.userId);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      await touchLastSeen(user.id);
      const ownedIds = await getUserOwnedPackIds(user.id);
      res.json({ profile: toPublicProfile(user, ownedIds) });
    } catch (err) {
      console.error('[profile] /me error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /profile/:id — public
  router.get('/:id', async (req, res) => {
    try {
      const user = await findUserById(req.params.id);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      const ownedIds = await getUserOwnedPackIds(user.id);
      res.json({ profile: toPublicProfile(user, ownedIds) });
    } catch (err) {
      console.error('[profile] /:id error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}
