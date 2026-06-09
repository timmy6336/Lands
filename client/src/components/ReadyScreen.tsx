// Customization + ready screen — mobile-first layout.
import { useState } from 'react';
import { DEFAULT_CUSTOMIZATIONS, GameState } from '@lands/shared';

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 28, paddingTop: 'max(env(safe-area-inset-top,0px),1.5rem)', paddingBottom: 'max(env(safe-area-inset-bottom,0px),1.5rem)', paddingLeft: '1.25rem', paddingRight: '1.25rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.6rem' }}>Game Ready</h2>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem 2rem', display: 'flex', gap: 36, justifyContent: 'center', width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>YOU</p>
          <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{me.name}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>OPPONENT</p>
          <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0, color: opponent.name ? 'var(--text)' : 'var(--muted)' }}>
            {opponent.name || 'Waiting…'}
          </p>
        </div>
      </div>

      {!opponent.name && (
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Waiting for opponent to join…</p>
      )}

      <button
        className="btn-primary"
        disabled={readySent || !opponent.name}
        onClick={() => {
          setReadySent(true);
          onReady(DEFAULT_CUSTOMIZATIONS);
        }}
        style={{ width: '100%', maxWidth: 360, minHeight: 56, fontSize: '1.05rem' }}
      >
        {readySent ? '✓ Ready! Waiting…' : "I'm Ready"}
      </button>
    </div>
  );
}
