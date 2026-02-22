// Renders a player’s field (lands in play).
// Cards are visually grouped by color into stacks, each showing a count badge.
// When `selectableIds` is provided (Red/Green effect prompts), only those cards
// are clickable; the rest are dimmed.
import { useState } from 'react';
import { Card } from './Card';
import { Card as CardType, Customizations, DEFAULT_CUSTOMIZATIONS, Color } from '@lands/shared';

interface Props {
  cards: CardType[];
  customizations?: Customizations;
  label: string;
  selectableIds?: Set<string>;
  onSelect?: (cardId: string) => void;
}

const COLOR_CSS: Record<Color, string> = {
  white: 'var(--white-land)',
  red:   'var(--red-land)',
  blue:  'var(--blue-land)',
  green: 'var(--green-land)',
  black: 'var(--black-land)',
};

export function Field({ cards, customizations, label, selectableIds, onSelect }: Props) {
  // Group cards by color, preserving insertion order
  const groups = new Map<Color, CardType[]>();
  for (const card of cards) {
    if (!groups.has(card.color)) groups.set(card.color, []);
    groups.get(card.color)!.push(card);
  }

  return (
    <div className="border border-border rounded-[10px] px-4 py-3 min-h-[120px] flex-1"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-xs text-muted mb-2.5 uppercase tracking-wider">
        {label} — {cards.length} land{cards.length !== 1 ? 's' : ''} in play
      </div>

      <div className="flex flex-wrap gap-4 min-h-[80px] items-end pb-5">
        {groups.size === 0
          ? <p className="text-muted text-sm self-center m-0">No lands yet</p>
          : [...groups.entries()].map(([color, stackCards]) => {
              const isSelectable = stackCards.some(c => selectableIds?.has(c.id));
              // For selection, return the last card in the stack (top of pile)
              const topCard = stackCards[stackCards.length - 1];
              return (
                <ColorStack
                  key={color}
                  cards={stackCards}
                  topCard={topCard}
                  customizations={customizations}
                  isSelectable={isSelectable}
                  onSelect={isSelectable ? () => onSelect?.(topCard.id) : undefined}
                />
              );
            })
        }
      </div>
    </div>
  );
}

// ── ColorStack ────────────────────────────────────────────────────────────────

interface StackProps {
  cards: CardType[];
  topCard: CardType;
  customizations?: Customizations;
  isSelectable: boolean;
  onSelect?: () => void;
}

function ColorStack({ cards, topCard, customizations, isSelectable, onSelect }: StackProps) {
  const count = cards.length;
  const OFFSET = 4; // px offset per card in the shadow stack
  const shadowDepth = Math.min(count - 1, 3); // show up to 3 shadow layers
  const stackHeight = 112 + shadowDepth * OFFSET;
  const stackWidth = 80 + shadowDepth * OFFSET;
  const [hovered, setHovered] = useState(false);

  const custom = customizations?.[topCard.color] ?? DEFAULT_CUSTOMIZATIONS[topCard.color];
  const bg = COLOR_CSS[topCard.color];

  return (
    <div
      onClick={isSelectable ? onSelect : undefined}
      onMouseEnter={() => isSelectable && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: stackWidth,
        height: stackHeight,
        cursor: isSelectable ? 'pointer' : 'default',
        flexShrink: 0,
        transform: isSelectable && hovered ? 'translateY(-8px)' : 'none',
        filter: isSelectable && hovered ? 'brightness(1.25) drop-shadow(0 8px 16px rgba(255,255,255,0.15))' : 'none',
        transition: 'transform 0.15s ease, filter 0.15s ease',
        zIndex: hovered ? 10 : 0,
      }}
    >
      {/* Shadow cards underneath — CSS only, no extra DOM images */}
      {Array.from({ length: shadowDepth }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: (shadowDepth - i - 1) * OFFSET,
            left: (shadowDepth - i - 1) * OFFSET,
            width: 80,
            height: 112,
            borderRadius: 8,
            border: '2px solid rgba(255,255,255,0.12)',
            background: bg,
            opacity: 0.5 - i * 0.1,
          }}
        />
      ))}

      {/* Top card — key triggers remount (and entrance animation) when topCard changes */}
      <div key={topCard.id} className="absolute top-0 left-0" style={{ animation: 'card-enter 0.3s ease' }}>
        <Card
          card={topCard}
          customizations={customizations}
          selected={isSelectable}
          noAnimate
        />
      </div>

      {/* Count badge — only shown when stack has more than 1 */}
      {count > 1 && (
        <div className="absolute -top-2 -right-2 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-bg z-10 pointer-events-none">
          {count}
        </div>
      )}

    </div>
  );
}
