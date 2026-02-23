// Customization + ready screen shown after both players join.
// Each player can customize their land display names before clicking Ready.
// Shows the opponent’s customizations live as they update.
// When both players are ready, RPS begins.
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
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <h2 className="text-accent m-0">Game Ready</h2>

      <div className="bg-surface border border-border rounded-xl px-10 py-6 flex gap-12">
        <div className="text-center">
          <p className="text-muted text-[0.8rem] mb-1 m-0">YOU</p>
          <p className="font-bold text-[1.1rem] m-0">{me.name}</p>
        </div>
        <div className="text-center">
          <p className="text-muted text-[0.8rem] mb-1 m-0">OPPONENT</p>
          <p className="font-bold text-[1.1rem] m-0" style={{ color: opponent.name ? 'var(--text)' : 'var(--muted)' }}>
            {opponent.name || 'Waiting…'}
          </p>
        </div>
      </div>

      {!opponent.name && (
        <p className="text-muted text-sm m-0">Waiting for opponent to join…</p>
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
