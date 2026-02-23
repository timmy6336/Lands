// MatchmakingScreen — shown while the player is in the matchmaking queue.
// Once the server pairs two players it emits game_state with phase 'customizing',
// which App.tsx intercepts automatically.  This screen just shows queue status.
import { useEffect, useState } from 'react';

interface Props {
  playerName: string;
  /** Current queue position from the server (null while connecting). */
  queuePosition: number | null;
  /** True once the server has found an opponent but before game_state arrives. */
  found: boolean;
  /** Whether the socket is connected to the server. */
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
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center p-8">
      <div>
        <h2 className="text-accent mb-1 m-0">Matchmaking</h2>
        <p className="text-muted text-sm m-0">Playing as <strong className="text-foreground">{playerName}</strong></p>
      </div>

      <div
        className="bg-surface border border-border rounded-xl px-10 py-8 flex flex-col items-center gap-4"
        style={{ minWidth: 280 }}
      >
        {found ? (
          <>
            <p className="text-2xl m-0">🎮</p>
            <p className="text-foreground font-semibold m-0">Match found!</p>
            <p className="text-muted text-sm m-0">Starting game…</p>
          </>
        ) : !connected ? (
          <>
            <Spinner />
            <p className="text-muted text-sm m-0">Connecting to server…</p>
          </>
        ) : (
          <>
            <Spinner />
            <p className="text-foreground font-semibold m-0">Searching for opponent…</p>
            <p className="text-muted text-sm m-0">
              {queuePosition !== null
                ? `Queue position: ${queuePosition}`
                : 'Joining queue…'}
            </p>
            <p className="text-muted text-xs m-0">{fmt(elapsed)}</p>
          </>
        )}
      </div>

      {!found && (
        <button
          className="btn-secondary"
          onClick={onCancel}
          style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}
        >
          ✕ Cancel
        </button>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="animate-spin"
      style={{
        width: 36, height: 36,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
      }}
    />
  );
}
