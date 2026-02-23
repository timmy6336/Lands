// Floating overlay shown to the defender during the counter window (phase === 'counter_window')
// and to the attacker during the counter-counter window (phase === 'counter_response').
// Handles automatic card pre-selection and shows a confirm step listing which cards will be spent.
import { useEffect, useState } from 'react';
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

  // After the first counter, every subsequent counter in the chain costs 2 Blues.
  // isCounterCounter covers the attacker's response (counter_response phase);
  // chain.length >= 2 covers the defender's response when the chain has grown (counter_window phase).
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

  // Auto-select the cards that will be spent — no manual selection needed
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

  // Cards that will be spent, for display in confirmation
  const spentCards = autoPicked
    ? [
        me.hand.find(c => c.id === autoPicked.blueId)!,
        me.hand.find(c => c.id === autoPicked.matchingId)!,
      ].filter(Boolean)
    : [];

  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2 className="text-accent m-0">
          {needsTwoBlues ? 'Counter the Counter?' : 'Counter Opportunity'}
        </h2>

        <div className="flex items-start gap-4">
          <Card card={pendingCard} customizations={gameState.players[1 - myIndex].customizations} />
          <div>
            <p className="text-muted text-sm m-0">
              {needsTwoBlues
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

        {!confirming && (
          <div className="flex gap-3">
            <button
              className="btn-primary"
              disabled={!canCounter}
              onClick={() => setConfirming(true)}
            >
              Counter {!canCounter && '(no cards)'}
            </button>
            <button className="btn-secondary" onClick={onPass}>Pass</button>
          </div>
        )}

        {confirming && (
          <div className="flex flex-col gap-3">
            <p className="text-muted text-sm m-0">These cards will be discarded:</p>
            <div className="flex flex-wrap gap-2">
              {spentCards.map(c => (
                <Card key={c.id} card={c} customizations={me.customizations} />
              ))}
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" onClick={confirm}>Confirm Counter</button>
              <button className="btn-secondary" onClick={() => setConfirming(false)}>Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
