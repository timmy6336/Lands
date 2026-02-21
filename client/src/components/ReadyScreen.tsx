import { useState } from 'react';
import { GameState, DEFAULT_CUSTOMIZATIONS } from '@lands/shared';

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onReady: (customizations: typeof DEFAULT_CUSTOMIZATIONS) => void;
}

export function ReadyScreen({ gameState, myIndex, onReady }: Props) {
  const [readySent, setReadySent] = useState(false);
  const me = gameState.players[myIndex];
  const opponent = gameState.players[1 - myIndex];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '2rem',
    }}>
      <h2 style={{ color: 'var(--accent)' }}>Game Ready</h2>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '1.5rem 2.5rem',
        display: 'flex', gap: '3rem',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 4 }}>YOU</p>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{me.name}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 4 }}>OPPONENT</p>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: opponent.name ? 'var(--text)' : 'var(--muted)' }}>
            {opponent.name || 'Waiting…'}
          </p>
        </div>
      </div>

      {!opponent.name && (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          Waiting for opponent to join…
        </p>
      )}

      <button
        className="btn-primary"
        disabled={readySent || !opponent.name}
        onClick={() => {
          setReadySent(true);
          onReady(DEFAULT_CUSTOMIZATIONS);
        }}
        style={{ minWidth: 160, fontSize: '1rem', padding: '0.75rem 2.5rem' }}
      >
        {readySent ? '✓ Ready! Waiting…' : "I'm Ready"}
      </button>
    </div>
  );
}
