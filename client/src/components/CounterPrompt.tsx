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
    : blueCards.length >= 1 && matchingCards.length >= 1;

  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2 style={{ color: 'var(--accent)' }}>
          {isCounterCounter ? 'Counter the Counter?' : 'Counter Opportunity'}
        </h2>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <Card card={pendingCard} customizations={gameState.players[1 - myIndex].customizations} />
          <div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {isCounterCounter
                ? 'Your land was countered. Spend 2 Blue cards to counter their counter.'
                : `Opponent played a ${pendingCard.color} land. Spend 1 Blue + 1 ${pendingCard.color} to counter.`}
            </p>
            {/* Show pre-targeted card (red = your land being destroyed, green = their graveyard retrieve) */}
            {!isCounterCounter && gameState.preTargetCardId && (() => {
              if (pendingCard.color === 'red') {
                const target = gameState.players[myIndex].field.find(c => c.id === gameState.preTargetCardId);
                if (target) return (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--red-land)', flexShrink: 0 }}>Targeting your land:</span>
                    <Card card={target} customizations={gameState.players[myIndex].customizations} small />
                  </div>
                );
              }
              if (pendingCard.color === 'green') {
                const target = gameState.players[1 - myIndex].graveyard.find(c => c.id === gameState.preTargetCardId);
                if (target) return (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--green-land)', flexShrink: 0 }}>Retrieving from graveyard:</span>
                    <Card card={target} customizations={gameState.players[1 - myIndex].customizations} small />
                  </div>
                );
              }
              return null;
            })()}
            {timeLeft !== null && (
              <p style={{
                marginTop: 8, fontSize: '1.4rem', fontWeight: 700,
                color: timeLeft <= 3 ? '#e74c3c' : 'var(--text)',
              }}>
                {timeLeft}s
              </p>
            )}
            {isInfinite && <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: '0.85rem' }}>No time limit</p>}
          </div>
        </div>

        {mode === 'prompt' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isCounterCounter ? (
              <>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Select 2 Blue cards:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {blueCards.map(c => (
                    <Card
                      key={c.id}
                      card={c}
                      customizations={me.customizations}
                      selected={c.id === selectedBlue1 || c.id === selectedBlue2}
                      onClick={() => {
                        if (c.id === selectedBlue1) { setSelectedBlue1(null); return; }
                        if (c.id === selectedBlue2) { setSelectedBlue2(null); return; }
                        if (!selectedBlue1) setSelectedBlue1(c.id);
                        else if (!selectedBlue2) setSelectedBlue2(c.id);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Select 1 Blue card:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {blueCards.map(c => (
                    <Card key={c.id} card={c} customizations={me.customizations}
                      selected={c.id === selectedBlue1}
                      onClick={() => setSelectedBlue1(prev => prev === c.id ? null : c.id)}
                    />
                  ))}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Select 1 {pendingCard.color} card:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {matchingCards.filter(c => c.id !== selectedBlue1).map(c => (
                    <Card key={c.id} card={c} customizations={me.customizations}
                      selected={c.id === selectedMatching}
                      onClick={() => setSelectedMatching(prev => prev === c.id ? null : c.id)}
                    />
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
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
