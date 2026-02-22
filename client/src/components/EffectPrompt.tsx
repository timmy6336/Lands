// EffectPrompt.tsx — Handles all interactive effect resolution prompts that require
// the active player to make a choice. Covers:
//   • Red   — pick one of the opponent's lands to destroy
//   • Green — pick one of the opponent's hand cards to steal (shown face-down)
//   • Blue  — look at opponent's top deck card; optionally put it on bottom
//   • Black / show — view opponent's whole hand (no choice needed, auto-confirms)
//   • Black / pick — pick a card from opponent's hand to destroy
// The component receives the relevant subset of GameState and fires onAction when
// the player confirms their selection.

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
    // Deduplicate by color — one representative card per type is shown;
    // destroying it removes one land of that color from the field.
    const seen = new Set<string>();
    const dedupedField = opponent.field.filter(c => {
      if (seen.has(c.color)) return false;
      seen.add(c.color);
      return true;
    });
    return <PickPrompt
      title="Red Land Effect"
      subtitle="Choose a land type to destroy. One land of that type will be removed."
      cards={dedupedField}
      customizations={opponent.customizations}
      allowFizzle={opponent.field.length === 0}
      onConfirm={(id) => onRespond({ type: 'red_pick', targetCardId: id })}
    />;
  }

  // ── Green: attacker picks from own graveyard ──────────────────────────────
  if (effect.type === 'green_pick' && isMyTurn) {
    // Deduplicate by color — one representative per type shown.
    const seen = new Set<string>();
    const dedupedGraveyard = me.graveyard.filter(c => {
      if (seen.has(c.color)) return false;
      seen.add(c.color);
      return true;
    });
    return <PickPrompt
      title="Green Land Effect"
      subtitle="Choose a land type to retrieve from your graveyard."
      cards={dedupedGraveyard}
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
          <h2 className="m-0" style={{ color: 'var(--blue-land)' }}>Blue Land Effect</h2>
          <p className="text-muted m-0">Top card of your deck:</p>
          {topCard
            ? <Card card={topCard} customizations={me.customizations} />
            : <p className="text-muted m-0">Deck is empty.</p>
          }
          <div className="flex gap-3">
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
          <h2 className="m-0" style={{ color: '#888' }}>Black Land Effect</h2>
          <p className="text-muted m-0">
            Your opponent revealed these cards. Choose one to discard.
          </p>
          <div className="flex flex-wrap gap-2">
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
        <div className="overlay-box items-center">
          <p className="text-muted text-center m-0">{msg}</p>
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
        <h2 className="m-0">{title}</h2>
        <p className="text-muted m-0">{subtitle}</p>
        {cards.length === 0
          ? <p className="text-muted text-sm m-0">No valid targets — effect fizzles.</p>
          : (
            <div className="flex flex-wrap gap-2">
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
        <div className="flex gap-3">
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
  // Track as ordered array so we can show selection order numbers
  const [selected, setSelected] = useState<string[]>([]);
  const maxSelect = Math.min(3, hand.length);
  const mustShowAll = hand.length <= 3;

  function toggle(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= maxSelect) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="overlay">
      <div className="overlay-box">
        <h2 className="m-0" style={{ color: '#888' }}>Black Land Effect</h2>
        <p className="text-muted m-0">
          {mustShowAll
            ? 'Your entire hand will be revealed to your opponent.'
            : `Choose 3 cards from your hand to reveal to your opponent. (${selected.length}/3)`}
        </p>
        <div className="flex flex-wrap gap-2">
          {hand.map(c => {
            const orderIdx = selected.indexOf(c.id);
            const isSelected = mustShowAll || orderIdx !== -1;
            return (
              <Card
                key={c.id} card={c}
                customizations={customizations}
                selected={isSelected}
                selectionIndex={!mustShowAll && orderIdx !== -1 ? orderIdx + 1 : undefined}
                onClick={mustShowAll ? undefined : () => toggle(c.id)}
                disabled={!mustShowAll && orderIdx === -1 && selected.length >= maxSelect}
              />
            );
          })}
        </div>
        <button
          className="btn-primary"
          disabled={!mustShowAll && selected.length < maxSelect}
          onClick={() => onConfirm(mustShowAll ? hand.map(c => c.id) : selected)}
        >
          Reveal {mustShowAll ? 'All' : 'Selected'}
        </button>
      </div>
    </div>
  );
}
