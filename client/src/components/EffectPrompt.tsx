// Effect resolution prompts — bottom sheet so game board stays visible above.
// Collapsible: tap the down-arrow to hide the sheet and see your hand;
// tap the floating tab at the bottom to bring it back.
import { useEffect, useRef, useState } from 'react';
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
  const [collapsed, setCollapsed] = useState(false);

  const prevType = useRef(effect?.type);
  useEffect(() => {
    if (effect?.type !== prevType.current) {
      setCollapsed(false);
      prevType.current = effect?.type;
    }
  }, [effect?.type]);

  if (!effect) return null;

  const collapse = () => setCollapsed(true);
  const expand = () => setCollapsed(false);

  if (effect.type === 'red_pick' && isMyTurn) {
    const seen = new Set<string>();
    const dedupedField = opponent.field.filter(c => {
      if (seen.has(c.color)) return false;
      seen.add(c.color);
      return true;
    });
    return (
      <CollapsibleSheet collapsed={collapsed} onExpand={expand} label="Red Effect">
        <PickPrompt
          title="Red Land Effect"
          subtitle="Choose a land type to destroy."
          cards={dedupedField}
          customizations={opponent.customizations}
          allowFizzle={opponent.field.length === 0}
          onConfirm={(id) => onRespond({ type: 'red_pick', targetCardId: id })}
          onCollapse={collapse}
        />
      </CollapsibleSheet>
    );
  }

  if (effect.type === 'green_pick' && isMyTurn) {
    const seen = new Set<string>();
    const dedupedGraveyard = me.graveyard.filter(c => {
      if (seen.has(c.color)) return false;
      seen.add(c.color);
      return true;
    });
    return (
      <CollapsibleSheet collapsed={collapsed} onExpand={expand} label="Green Effect">
        <PickPrompt
          title="Green Land Effect"
          subtitle="Choose a land type to retrieve from your graveyard."
          cards={dedupedGraveyard}
          customizations={me.customizations}
          allowFizzle={me.graveyard.length === 0}
          onConfirm={(id) => onRespond({ type: 'green_pick', targetCardId: id })}
          onCollapse={collapse}
        />
      </CollapsibleSheet>
    );
  }

  if (effect.type === 'blue_look' && isMyTurn) {
    const topCard = effect.topCard;
    return (
      <CollapsibleSheet collapsed={collapsed} onExpand={expand} label="Blue Effect">
        <div className="decision-overlay">
          <div className="decision-box">
            <CollapseHandle onCollapse={collapse} />
            <h2 style={{ margin: 0, color: 'var(--blue-land)', fontSize: '1.1rem' }}>Blue Land Effect</h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.88rem' }}>Top card of your deck:</p>
            {topCard
              ? <Card card={topCard} customizations={me.customizations} />
              : <p style={{ color: 'var(--muted)', margin: 0 }}>Deck is empty.</p>
            }
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={() => onRespond({ type: 'blue_look', keepOnTop: true })} style={{ flex: 1, minHeight: 50 }}>
                Keep on Top
              </button>
              <button className="btn-secondary" disabled={!topCard} onClick={() => onRespond({ type: 'blue_look', keepOnTop: false })} style={{ flex: 1, minHeight: 50 }}>
                Move to Bottom
              </button>
            </div>
          </div>
        </div>
      </CollapsibleSheet>
    );
  }

  if (effect.type === 'black_show' && !isMyTurn) {
    return (
      <CollapsibleSheet collapsed={collapsed} onExpand={expand} label="Black Effect">
        <BlackShowPrompt
          hand={me.hand}
          customizations={me.customizations}
          onConfirm={(ids) => onRespond({ type: 'black_show', cardIds: ids })}
          onCollapse={collapse}
        />
      </CollapsibleSheet>
    );
  }

  if (effect.type === 'black_pick' && isMyTurn) {
    const shown = effect.shownCards ?? [];
    return (
      <CollapsibleSheet collapsed={collapsed} onExpand={expand} label="Black Effect">
        <div className="decision-overlay">
          <div className="decision-box">
            <CollapseHandle onCollapse={collapse} />
            <h2 style={{ margin: 0, color: '#888', fontSize: '1.1rem' }}>Black Land Effect</h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.88rem' }}>
              Your opponent revealed these cards. Choose one to discard.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
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
      </CollapsibleSheet>
    );
  }

  // Waiting/spectator messages — not collapsible (no action needed, just info)
  const waitingMessages: Partial<Record<typeof effect.type, string>> = {
    red_pick:    'Waiting for opponent to choose which land to destroy…',
    green_pick:  'Waiting for opponent to retrieve a land…',
    blue_look:   'Opponent is looking at the top of their deck…',
    black_show:  'Waiting for you to reveal 3 cards…',
    black_pick:  'Opponent is choosing which card to discard…',
  };

  const msg = waitingMessages[effect.type];
  if (msg) {
    return (
      <div className="decision-overlay">
        <div className="decision-box" style={{ paddingTop: '1rem' }}>
          <div className="decision-box-handle" />
          <p style={{ color: 'var(--muted)', textAlign: 'center', margin: 0, padding: '0.5rem 0' }}>{msg}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Collapsible wrapper ─────────────────────────────────────────────────────

function CollapsibleSheet({
  children, collapsed, onExpand, label,
}: {
  children: React.ReactNode;
  collapsed: boolean;
  onExpand: () => void;
  label: string;
}) {
  return (
    <>
      <div style={{ display: collapsed ? 'none' : undefined }}>
        {children}
      </div>
      {collapsed && (
        <button
          onClick={onExpand}
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
          <span style={{ fontSize: '0.75rem' }}>▲</span> {label}
        </button>
      )}
    </>
  );
}

// ── Collapse handle (replaces decision-box-handle in interactive prompts) ───

function CollapseHandle({ onCollapse }: { onCollapse: () => void }) {
  return (
    <button
      onClick={onCollapse}
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
  );
}

// ── Sub-prompts ─────────────────────────────────────────────────────────────

function PickPrompt({
  title, subtitle, cards, customizations, allowFizzle, onConfirm, onCollapse,
}: {
  title: string;
  subtitle: string;
  cards: CardType[];
  customizations: any;
  allowFizzle: boolean;
  onConfirm: (id: string | undefined) => void;
  onCollapse: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="decision-overlay">
      <div className="decision-box">
        <CollapseHandle onCollapse={onCollapse} />
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h2>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.88rem' }}>{subtitle}</p>
        {cards.length === 0
          ? <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>No valid targets — effect fizzles.</p>
          : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
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
        <button
          className="btn-primary"
          disabled={!selected && !allowFizzle}
          onClick={() => onConfirm(selected ?? undefined)}
          style={{ minHeight: 52, fontSize: '1rem' }}
        >
          {cards.length === 0 ? 'OK' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}

function BlackShowPrompt({
  hand, customizations, onConfirm, onCollapse,
}: {
  hand: CardType[];
  customizations: any;
  onConfirm: (ids: string[]) => void;
  onCollapse: () => void;
}) {
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
    <div className="decision-overlay">
      <div className="decision-box">
        <CollapseHandle onCollapse={onCollapse} />
        <h2 style={{ margin: 0, color: '#888', fontSize: '1.1rem' }}>Black Land Effect</h2>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.88rem' }}>
          {mustShowAll
            ? 'Your entire hand will be revealed to your opponent.'
            : `Choose 3 cards from your hand to reveal. (${selected.length}/3)`}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
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
          style={{ minHeight: 52, fontSize: '1rem' }}
        >
          Reveal {mustShowAll ? 'All' : 'Selected'}
        </button>
      </div>
    </div>
  );
}
