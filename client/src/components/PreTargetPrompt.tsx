import { useState } from 'react';
import { GameState } from '@lands/shared';
import { Card } from './Card';

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onTarget: (cardId: string) => void;
}

export function PreTargetPrompt({ gameState, myIndex, onTarget }: Props) {
  const phase = gameState.phase;
  const me = gameState.players[myIndex];
  const opponent = gameState.players[1 - myIndex];
  const isMyTurn = gameState.currentPlayerIndex === myIndex;
  const isRed = phase === 'pre_target_red';

  const [selected, setSelected] = useState<string | null>(null);

  if (!isMyTurn) {
    return (
      <div className="overlay">
        <div className="overlay-box" style={{ alignItems: 'center' }}>
          <p style={{ color: 'var(--muted)', textAlign: 'center' }}>
            {isRed
              ? `${opponent.name} is choosing which land to destroy…`
              : `${opponent.name} is choosing which land to retrieve from graveyard…`}
          </p>
        </div>
      </div>
    );
  }

  const cards = isRed ? opponent.field : me.graveyard;
  const customizations = isRed ? opponent.customizations : me.customizations;
  const accentColor = isRed ? 'var(--red-land)' : 'var(--green-land)';

  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2 style={{ color: accentColor }}>
          {isRed ? 'Red Land — Choose Target' : 'Green Land — Choose Target'}
        </h2>
        <p style={{ color: 'var(--muted)' }}>
          {isRed
            ? 'Select an opponent land to destroy. Your opponent will see your target before deciding whether to counter.'
            : 'Select a land from your graveyard to retrieve. Your opponent will see your choice before deciding whether to counter.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {cards.map(c => (
            <Card
              key={c.id}
              card={c}
              customizations={customizations}
              selected={c.id === selected}
              onClick={() => setSelected(prev => prev === c.id ? null : c.id)}
            />
          ))}
        </div>
        <button
          className="btn-primary"
          disabled={!selected}
          onClick={() => selected && onTarget(selected)}
        >
          Confirm Target
        </button>
      </div>
    </div>
  );
}
