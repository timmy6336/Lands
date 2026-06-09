import { useEffect, useState } from 'react';

interface Props {
  playerName: string;
  queuePosition: number | null;
  found: boolean;
  connected: boolean;
  onCancel: () => void;
}

export function MatchmakingScreen({ playerName, queuePosition, found, connected, onCancel }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (found) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [found]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100dvh', gap: 28, textAlign: 'center',
      padding: '1.5rem',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 1.5rem)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
    }}>
      <div>
        <h2 style={{ color: 'var(--accent)', fontSize: '1.6rem', margin: '0 0 4px' }}>Matchmaking</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
          Playing as <strong style={{ color: 'var(--text)' }}>{playerName}</strong>
        </p>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        width: '100%', maxWidth: 320,
      }}>
        {found ? (
          <>
            <p style={{ fontSize: '2.5rem', margin: 0 }}>🎮</p>
            <p style={{ color: 'var(--text)', fontWeight: 700, margin: 0 }}>Match found!</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Starting game…</p>
          </>
        ) : !connected ? (
          <>
            <Spinner />
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Connecting to server…</p>
          </>
        ) : (
          <>
            <Spinner />
            <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>Searching for opponent…</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
              {queuePosition !== null ? `Queue position: ${queuePosition}` : 'Joining queue…'}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>{fmt(elapsed)}</p>
          </>
        )}
      </div>

      {!found && (
        <button
          className="btn-secondary"
          onClick={onCancel}
          style={{ minHeight: 52, padding: '0.6rem 2.5rem', width: '100%', maxWidth: 280, fontSize: '0.95rem' }}
        >
          ✕ Cancel
        </button>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 36, height: 36,
      border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    }} />
  );
}
