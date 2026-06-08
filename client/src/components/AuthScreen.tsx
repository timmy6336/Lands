// ─────────────────────────────────────────────────────────────────────────────
// client/src/components/AuthScreen.tsx — login / register screen
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { AuthState } from '../hooks/useAuth';

interface Props {
  auth: AuthState;
  serverUrl: string;
  onBack: () => void;
}

export function AuthScreen({ auth, serverUrl, onBack }: Props) {
  const [tab, setTab]           = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [localErr, setLocalErr] = useState('');

  const isLogin = tab === 'login';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalErr('');
    if (!username.trim()) { setLocalErr('Username is required'); return; }
    if (!passcode)         { setLocalErr('Passcode is required'); return; }
    try {
      if (isLogin) {
        await auth.login(username.trim(), passcode, serverUrl);
      } else {
        await auth.register(username.trim(), passcode, serverUrl);
      }
      onBack(); // success — go back to home
    } catch (err: unknown) {
      setLocalErr((err as Error).message || 'Something went wrong');
    }
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', padding: '2rem', gap: 24,
  };
  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '2rem 2.5rem',
    width: '100%', maxWidth: 360,
    display: 'flex', flexDirection: 'column', gap: 20,
  };
  const tabBarStyle: React.CSSProperties = {
    display: 'flex', gap: 0,
    background: 'var(--bg)',
    borderRadius: 8, overflow: 'hidden',
    border: '1px solid var(--border)',
  };
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '0.55rem 1rem', border: 'none', cursor: 'pointer',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--muted)',
    fontWeight: active ? 700 : 400,
    fontSize: '0.9rem', transition: 'background 0.15s',
  });
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--foreground)', fontSize: '0.95rem',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4,
    display: 'block',
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.6rem' }}>
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
          {isLogin ? 'Track your ELO and stats across games' : 'Join the ranked ladder'}
        </p>
      </div>

      <div style={cardStyle}>
        {/* Tab bar */}
        <div style={tabBarStyle}>
          <button style={tabStyle(tab === 'login')}    onClick={() => { setTab('login');    setLocalErr(''); }}>Login</button>
          <button style={tabStyle(tab === 'register')} onClick={() => { setTab('register'); setLocalErr(''); }}>Register</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Username */}
          <div>
            <label style={labelStyle}>Username</label>
            <input
              style={inputStyle}
              type="text"
              autoComplete="username"
              autoFocus
              maxLength={24}
              placeholder="e.g. Timmy"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            {tab === 'register' && (
              <span style={{ color: 'var(--muted2)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                2–24 chars, letters/numbers/_ and -
              </span>
            )}
          </div>

          {/* Passcode */}
          <div>
            <label style={labelStyle}>Passcode</label>
            <input
              style={inputStyle}
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              maxLength={72}
              placeholder={isLogin ? '••••••••' : 'At least 4 characters'}
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
            />
          </div>

          {/* Error */}
          {(localErr || auth.error) && (
            <p style={{ margin: 0, color: '#e74c3c', fontSize: '0.85rem', textAlign: 'center' }}>
              {localErr || auth.error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={auth.loading}
            style={{ padding: '0.7rem', fontSize: '1rem', marginTop: 4 }}
          >
            {auth.loading ? '…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* Back / Guest */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
          ← Back
        </button>
        <span style={{ color: 'var(--muted2)', fontSize: '0.8rem' }}>
          Profiles are optional — you can play as a guest anytime.
        </span>
      </div>
    </div>
  );
}
