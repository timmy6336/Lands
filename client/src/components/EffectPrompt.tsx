import { useState } from 'react';
import { GameState, Card as CardType } from '@lands/shared';
import { Card } from './Card';

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onRespond: (data: Record<string, unknown>) => void;
}

export function EffectPrompt({ gameState, myIndex, onRespond }: Props) {
  const effect = gameState.pendingEffect;
  const me = gameState.players[myIndex];
  const opponent = gameState.players[1 - myIndex];
  const isMyTurn = gameState.currentPlayerIndex === myIndex;

  if (!effect) return null;

  // ── Red: attacker picks opponent land to destroy ──────────────────────────
  if (effect.type === 'red_pick' && isMyTurn) {
    return <PickPrompt
      title="Red Land Effect"
      subtitle="Choose one of your opponent's lands to destroy."
      cards={opponent.field}
      customizations={opponent.customizations}
      allowFizzle={opponent.field.length === 0}
      onConfirm={(id) => onRespond({ type: 'red_pick', targetCardId: id })}
    />;
  }

  // ── Green: attacker picks from own graveyard ──────────────────────────────
  if (effect.type === 'green_pick' && isMyTurn) {
    return <PickPrompt
      title="Green Land Effect"
      subtitle="Choose a land from your graveyard to return to your hand."
      cards={me.graveyard}
      customizations={me.customizations}
      allowFizzle={me.graveyard.length === 0}
      onConfirm={(id) => onRespond({ type: 'green_pick', targetCardId: id })}
    />;
  }

  // ── Blue: attacker sees top card ──────────────────────────────────────────
  if (effect.type === 'blue_look' && isMyTurn) {
    const topCard = effect.topCard;
    return (
      <div className="overlay">
        <div className="overlay-box">
          <h2 style={{ color: 'var(--blue-land)' }}>Blue Land Effect</h2>
          <p style={{ color: 'var(--muted)' }}>Top card of your deck:</p>
          {topCard
            ? <Card card={topCard} customizations={me.customizations} />
            : <p style={{ color: 'var(--muted)' }}>Deck is empty.</p>
          }
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={() => onRespond({ type: 'blue_look', keepOnTop: true })}>
              Keep on Top
            </button>
            <button className="btn-secondary" disabled={!topCard} onClick={() => onRespond({ type: 'blue_look', keepOnTop: false })}>
              Move to Bottom
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Black phase 1: opponent selects which 3 cards to reveal ──────────────
  if (effect.type === 'black_show' && !isMyTurn) {
    return <BlackShowPrompt
      hand={me.hand}
      customizations={me.customizations}
      onConfirm={(ids) => onRespond({ type: 'black_show', cardIds: ids })}
    />;
  }

  // ── Black phase 2: attacker picks which revealed card to discard ──────────
  if (effect.type === 'black_pick' && isMyTurn) {
    const shown = effect.shownCards ?? [];
    return (
      <div className="overlay">
        <div className="overlay-box">
          <h2 style={{ color: '#888' }}>Black Land Effect</h2>
          <p style={{ color: 'var(--muted)' }}>
            Your opponent revealed these cards. Choose one to discard.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {shown.map(c => (
              <Card
                key={c.id} card={c}
                customizations={opponent.customizations}
                onClick={() => onRespond({ type: 'black_pick', targetCardId: c.id })}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting states ────────────────────────────────────────────────────────
  const waitingMessages: Partial<Record<typeof effect.type, string>> = {
    red_pick:    "Waiting for opponent to choose which land to destroy…",
    green_pick:  "Waiting for opponent to retrieve a land from their graveyard…",
    blue_look:   "Opponent is looking at the top of their deck…",
    black_show:  "Waiting for you to reveal 3 cards to your opponent…",
    black_pick:  "Opponent is choosing which card to discard…",
  };

  const msg = waitingMessages[effect.type];
  if (msg) {
    return (
      <div className="overlay">
        <div className="overlay-box" style={{ alignItems: 'center' }}>
          <p style={{ color: 'var(--muted)', textAlign: 'center' }}>{msg}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PickPrompt({
  title, subtitle, cards, customizations, allowFizzle, onConfirm,
}: {
  title: string;
  subtitle: string;
  cards: CardType[];
  customizations: any;
  allowFizzle: boolean;
  onConfirm: (id: string | undefined) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2>{title}</h2>
        <p style={{ color: 'var(--muted)' }}>{subtitle}</p>
        {cards.length === 0
          ? <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No valid targets — effect fizzles.</p>
          : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {cards.map(c => (
                <Card
                  key={c.id} card={c}
                  customizations={customizations}
                  selected={c.id === selected}
                  onClick={() => setSelected(prev => prev === c.id ? null : c.id)}
                />
              ))}
            </div>
          )
        }
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-primary"
            disabled={!selected && !allowFizzle}
            onClick={() => onConfirm(selected ?? undefined)}
          >
            {cards.length === 0 ? 'OK' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BlackShowPrompt({
  hand, customizations, onConfirm,
}: {
  hand: CardType[];
  customizations: any;
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const maxSelect = Math.min(3, hand.length);
  const mustShowAll = hand.length <= 3;

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < maxSelect) { next.add(id); }
      return next;
    });
  }

  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2 style={{ color: '#888' }}>Black Land Effect</h2>
        <p style={{ color: 'var(--muted)' }}>
          {mustShowAll
            ? 'Your entire hand will be revealed to your opponent.'
            : 'Choose 3 cards from your hand to reveal to your opponent.'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {hand.map(c => (
            <Card
              key={c.id} card={c}
              customizations={customizations}
              selected={mustShowAll || selected.has(c.id)}
              onClick={mustShowAll ? undefined : () => toggle(c.id)}
              disabled={!mustShowAll && !selected.has(c.id) && selected.size >= maxSelect}
            />
          ))}
        </div>
        <button
          className="btn-primary"
          disabled={!mustShowAll && selected.size < maxSelect}
          onClick={() => onConfirm(mustShowAll ? hand.map(c => c.id) : [...selected])}
        >
          Reveal {mustShowAll ? 'All' : 'Selected'}
        </button>
      </div>
    </div>
  );
}
