// Counter window — renders as a collapsible bottom sheet so the game board
// (and your hand) stays visible above. Tap "▼ hide" to collapse, tap the
// floating tab to bring it back. Timer keeps ticking while collapsed.
import { useEffect, useRef, useState } from 'react';
import { GameState } from '@lands/shared';
import { Card } from './Card';

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onCounter: (blueCardId: string, matchingCardId: string) => void;
  onPass: () => void;
  isCounterCounter?: boolean;
}

export function CounterPrompt({ gameState, myIndex, onCounter, onPass, isCounterCounter }: Props) {
  const me = gameState.players[myIndex];
  const pendingCard = gameState.pendingPlay!;
  const deadline = gameState.counterDeadline;
  const isInfinite = gameState.settings.counterTimeLimitSeconds === null;

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const onPassRef = useRef(onPass);
  onPassRef.current = onPass;

  useEffect(() => {
    if (isInfinite || !deadline) { setTimeLeft(null); return; }
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) onPassRef.current();
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline, isInfinite]);

  const needsTwoBlues = isCounterCounter || gameState.counterChain.length >= 2;
  const blueCards = me.hand.filter(c => c.color === 'blue');
  const matchingCards = needsTwoBlues
    ? blueCards
    : me.hand.filter(c => c.color === pendingCard.color);

  const canCounter = needsTwoBlues
    ? blueCards.length >= 2
    : pendingCard.color === 'blue'
      ? blueCards.length >= 2
      : blueCards.length >= 1 && matchingCards.length >= 1;

  function getAutoCards(): { blueId: string; matchingId: string } | null {
    const blue = blueCards[0];
    if (!blue) return null;
    if (needsTwoBlues) {
      const second = blueCards.find(c => c.id !== blue.id);
      if (!second) return null;
      return { blueId: blue.id, matchingId: second.id };
    }
    if (pendingCard.color === 'blue') {
      const second = blueCards.find(c => c.id !== blue.id);
      if (!second) return null;
      return { blueId: blue.id, matchingId: second.id };
    }
    const match = matchingCards.find(c => c.id !== blue.id) ?? matchingCards[0];
    if (!match) return null;
    return { blueId: blue.id, matchingId: match.id };
  }

  const autoPicked = getAutoCards();

  function confirm() {
    if (autoPicked) onCounter(autoPicked.blueId, autoPicked.matchingId);
  }

  const spentCards = autoPicked
    ? [
        me.hand.find(c => c.id === autoPicked.blueId)!,
        me.hand.find(c => c.id === autoPicked.matchingId)!,
      ].filter(Boolean)
    : [];

  const label = needsTwoBlues ? 'Counter-Counter' : 'Counter';

  return (
    <>
      <div style={{ display: collapsed ? 'none' : undefined }}>
        <div className="decision-overlay">
          <div className="decision-box">
            <button
              onClick={() => setCollapsed(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'none', border: 'none',
                width: '100%',
                padding: '10px 0 4px',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.72rem', fontWeight: 500,
              }}
            >
              <span style={{ fontSize: '0.6rem' }}>▼</span>
              <span>hide</span>
              <span style={{ fontSize: '0.6rem' }}>▼</span>
            </button>

            <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.1rem' }}>
              {needsTwoBlues ? 'Counter the Counter?' : 'Counter Opportunity'}
            </h2>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Card card={pendingCard} customizations={gameState.players[1 - myIndex].customizations} />
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  {needsTwoBlues
                    ? 'Your land was countered. Spend 2 Blue cards to counter their counter.'
                    : `Opponent played ${pendingCard.color}. Spend 1 Blue + 1 ${pendingCard.color} to counter.`}
                </p>
                {timeLeft !== null && (
                  <p style={{ marginTop: 8, fontSize: '1.5rem', fontWeight: 800, color: timeLeft <= 3 ? '#e74c3c' : 'var(--text)', margin: '6px 0 0' }}>
                    {timeLeft}s
                  </p>
                )}
                {isInfinite && <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 6, margin: '6px 0 0' }}>No time limit</p>}
              </div>
            </div>

            {!confirming && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-primary"
                  disabled={!canCounter}
                  onClick={() => setConfirming(true)}
                  style={{ flex: 1, minHeight: 50 }}
                >
                  Counter {!canCounter && '(no cards)'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={onPass}
                  style={{ flex: 1, minHeight: 50 }}
                >
                  Pass
                </button>
              </div>
            )}

            {confirming && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>These cards will be discarded:</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {spentCards.map(c => (
                    <Card key={c.id} card={c} customizations={me.customizations} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-primary" onClick={confirm} style={{ flex: 1, minHeight: 50 }}>Confirm Counter</button>
                  <button className="btn-secondary" onClick={() => setConfirming(false)} style={{ flex: 1, minHeight: 50 }}>Back</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            zIndex: 100,
            background: '#0c1128',
            borderTop: '2px solid var(--border)',
            borderRadius: '12px 12px 0 0',
            padding: '0.6rem 1rem',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.6rem)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--accent)',
            fontSize: '0.9rem', fontWeight: 600,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
            minHeight: 44,
          }}
        >
          <span style={{ fontSize: '0.75rem' }}>▲</span>
          {label}
          {timeLeft !== null && (
            <span style={{ color: timeLeft <= 3 ? '#e74c3c' : 'var(--muted)', fontWeight: 800 }}>
              {timeLeft}s
            </span>
          )}
        </button>
      )}
    </>
  );
}
