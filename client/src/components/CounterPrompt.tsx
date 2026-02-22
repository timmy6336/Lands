import { useEffect, useState } from 'react';
import { Card as CardType, Color, GameState } from '@lands/shared';
import { Card } from './Card';

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onCounter: (blueCardId: string, matchingCardId: string) => void;
  onPass: () => void;
  isCounterCounter?: boolean; // attacker responding to counter
}

export function CounterPrompt({ gameState, myIndex, onCounter, onPass, isCounterCounter }: Props) {
  const me = gameState.players[myIndex];
  const pendingCard = gameState.pendingPlay!;
  const deadline = gameState.counterDeadline;
  const isInfinite = gameState.settings.counterTimeLimitSeconds === null;

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selectedBlue1, setSelectedBlue1] = useState<string | null>(null);
  const [selectedBlue2, setSelectedBlue2] = useState<string | null>(null);
  const [selectedMatching, setSelectedMatching] = useState<string | null>(null);
  const [mode, setMode] = useState<'prompt' | 'select'>('prompt');

  useEffect(() => {
    if (isInfinite || !deadline) { setTimeLeft(null); return; }
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) onPass();
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline, isInfinite, onPass]);

  const blueCards = me.hand.filter(c => c.color === 'blue');
  const matchingCards = isCounterCounter
    ? blueCards
    : me.hand.filter(c => c.color === pendingCard.color);

  function submitCounter() {
    if (isCounterCounter) {
      if (selectedBlue1 && selectedBlue2 && selectedBlue1 !== selectedBlue2) {
        onCounter(selectedBlue1, selectedBlue2);
      }
    } else {
      if (selectedBlue1 && selectedMatching) {
        onCounter(selectedBlue1, selectedMatching);
      }
    }
  }

  const canCounter = isCounterCounter
    ? blueCards.length >= 2
    : pendingCard.color === 'blue'
      ? blueCards.length >= 2            // need 2 blues: one to counter, one as the matching blue
      : blueCards.length >= 1 && matchingCards.length >= 1;

  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2 className="text-accent m-0">
          {isCounterCounter ? 'Counter the Counter?' : 'Counter Opportunity'}
        </h2>

        <div className="flex items-start gap-4">
          <Card card={pendingCard} customizations={gameState.players[1 - myIndex].customizations} />
          <div>
            <p className="text-muted text-sm m-0">
              {isCounterCounter
                ? 'Your land was countered. Spend 2 Blue cards to counter their counter.'
                : `Opponent played a ${pendingCard.color} land. Spend 1 Blue + 1 ${pendingCard.color} to counter.`}
            </p>
            {timeLeft !== null && (
              <p className="mt-2 text-[1.4rem] font-bold m-0" style={{ color: timeLeft <= 3 ? '#e74c3c' : 'var(--text)' }}>
                {timeLeft}s
              </p>
            )}
            {isInfinite && <p className="text-muted text-sm mt-2 m-0">No time limit</p>}
          </div>
        </div>

        {mode === 'prompt' && (
          <div className="flex gap-3">
            <button
              className="btn-primary"
              disabled={!canCounter}
              onClick={() => setMode('select')}
            >
              Counter {!canCounter && '(no cards)'}
            </button>
            <button className="btn-secondary" onClick={onPass}>Pass</button>
          </div>
        )}

        {mode === 'select' && (
          <div className="flex flex-col gap-4">
            {isCounterCounter ? (
              <>
                <p className="text-muted text-sm m-0">
                  Select 2 Blue cards: ({[selectedBlue1, selectedBlue2].filter(Boolean).length}/2)
                </p>
                <div className="flex flex-wrap gap-2">
                  {blueCards.map(c => {
                    const selIdx = c.id === selectedBlue1 ? 1 : c.id === selectedBlue2 ? 2 : undefined;
                    return (
                      <Card
                        key={c.id}
                        card={c}
                        customizations={me.customizations}
                        selected={c.id === selectedBlue1 || c.id === selectedBlue2}
                        selectionIndex={selIdx}
                        onClick={() => {
                          if (c.id === selectedBlue1) { setSelectedBlue1(null); return; }
                          if (c.id === selectedBlue2) { setSelectedBlue2(null); return; }
                          if (!selectedBlue1) setSelectedBlue1(c.id);
                          else if (!selectedBlue2) setSelectedBlue2(c.id);
                        }}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="text-muted text-sm m-0">Select 1 Blue card:</p>
                <div className="flex flex-wrap gap-2">
                  {blueCards.map(c => (
                    <Card key={c.id} card={c} customizations={me.customizations}
                      selected={c.id === selectedBlue1}
                      onClick={() => setSelectedBlue1(prev => prev === c.id ? null : c.id)}
                    />
                  ))}
                </div>
                <p className="text-muted text-sm m-0">Select 1 {pendingCard.color} card:</p>
                <div className="flex flex-wrap gap-2">
                  {matchingCards.filter(c => c.id !== selectedBlue1).map(c => (
                    <Card key={c.id} card={c} customizations={me.customizations}
                      selected={c.id === selectedMatching}
                      onClick={() => setSelectedMatching(prev => prev === c.id ? null : c.id)}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                className="btn-primary"
                disabled={isCounterCounter
                  ? !(selectedBlue1 && selectedBlue2 && selectedBlue1 !== selectedBlue2)
                  : !(selectedBlue1 && selectedMatching)}
                onClick={submitCounter}
              >
                Confirm Counter
              </button>
              <button className="btn-secondary" onClick={() => setMode('prompt')}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
