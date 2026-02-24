// ─────────────────────────────────────────────────────────────────────────────
// client/src/hooks/useAuth.ts — authenticated user session hook
//
// Persists the JWT token in localStorage under key 'authToken'.
// On mount, re-validates the stored token against the server to refresh the
// profile (e.g. updated ELO).  Auth is optional — the app works without it.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect } from 'react';
import { UserProfile } from '@lands/shared';

const TOKEN_KEY = 'authToken';

export interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (username: string, passcode: string, serverUrl: string) => Promise<void>;
  register: (username: string, passcode: string, serverUrl: string) => Promise<void>;
  logout: () => void;
  refreshProfile: (serverUrl: string) => Promise<void>;
  /** Replace the in-memory profile with a freshly-fetched copy (e.g. after equipping a skin). */
  updateProfile: (profile: UserProfile) => void;
}

function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function useAuth(): AuthState {
  const [token, setToken]     = useState<string | null>(getStoredToken);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ── helpers ─────────────────────────────────────────────────────────────────

  function persistToken(t: string | null) {
    setToken(t);
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else   localStorage.removeItem(TOKEN_KEY);
  }

  // ── refresh profile from server on mount (if token exists) ──────────────────

  const refreshProfile = useCallback(async (serverUrl: string) => {
    const t = getStoredToken();
    if (!t) return;
    try {
      const res = await fetch(`${serverUrl}/profile/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json() as { profile: UserProfile };
        setProfile(data.profile);
      } else {
        // Token might be expired — silently clear it
        persistToken(null);
        setProfile(null);
      }
    } catch {
      // Server unreachable — keep token optimistically, don't wipe profile
    }
  }, []);

  // ── auth actions ─────────────────────────────────────────────────────────────

  const login = useCallback(async (username: string, passcode: string, serverUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passcode }),
      });
      const data = await res.json() as { token?: string; profile?: UserProfile; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Login failed');
      persistToken(data.token!);
      setProfile(data.profile!);
    } catch (err: unknown) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, passcode: string, serverUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passcode }),
      });
      const data = await res.json() as { token?: string; profile?: UserProfile; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');
      persistToken(data.token!);
      setProfile(data.profile!);
    } catch (err: unknown) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setProfile(null);
    setError(null);
  }, []);

  const updateProfile = useCallback((p: UserProfile) => {
    setProfile(p);
  }, []);

  return { token, profile, loading, error, login, register, logout, refreshProfile, updateProfile };
}
