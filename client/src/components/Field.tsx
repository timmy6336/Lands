// Minimal dashboard variant: no card art — colored pill chips with ABBR xN format.
import { Card as CardType, Customizations, Color } from '@lands/shared';

const COLOR_BG: Record<Color, string> = {
  white: 'var(--white-land)',
  red:   'var(--red-land)',
  blue:  'var(--blue-land)',
  green: 'var(--green-land)',
  black: 'var(--black-land)',
};

const COLOR_TEXT: Record<Color, string> = {
  white: '#222',
  red:   '#fff',
  blue:  '#fff',
  green: '#fff',
  black: '#fff',
};

const COLOR_ABBR: Record<Color, string> = {
  white: 'W',
  red:   'R',
  blue:  'U',
  green: 'G',
  black: 'B',
};

interface Props {
  cards: CardType[];
  customizations?: Customizations;
  label: string;
  selectableIds?: Set<string>;
  onSelect?: (cardId: string) => void;
}

export function Field({ cards, customizations: _customizations, label, selectableIds, onSelect }: Props) {
  const groups = new Map<Color, CardType[]>();
  for (const card of cards) {
    if (!groups.has(card.color)) groups.set(card.color, []);
    groups.get(card.color)!.push(card);
  }

  return (
    <div className="field-pane-minimal">
      {groups.size === 0
        ? <span style={{ color: 'var(--muted)', fontSize: '0.72rem', padding: '0 4px', flexShrink: 0 }}>
            {label} — empty
          </span>
        : [...groups.entries()].map(([color, stackCards]) => {
            const isSelectable = !!selectableIds && stackCards.some(c => selectableIds.has(c.id));
            const topCard = stackCards[stackCards.length - 1];
            return (
              <FieldChip
                key={color}
                color={color}
                count={stackCards.length}
                isSelectable={isSelectable}
                onSelect={isSelectable ? () => onSelect?.(topCard.id) : undefined}
              />
            );
          })
      }
    </div>
  );
}

interface ChipProps {
  color: Color;
  count: number;
  isSelectable: boolean;
  onSelect?: () => void;
}

function FieldChip({ color, count, isSelectable, onSelect }: ChipProps) {
  return (
    <div
      onClick={isSelectable ? onSelect : undefined}
      className={isSelectable ? 'tile-interactive tile-selectable' : undefined}
      style={{
        minWidth: 56,
        height: 36,
        borderRadius: 18,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLOR_BG[color],
        color: COLOR_TEXT[color],
        fontWeight: 900,
        fontSize: '0.8rem',
        letterSpacing: '0.03em',
        border: isSelectable
          ? '2px solid rgba(255,255,255,0.85)'
          : '1.5px solid rgba(255,255,255,0.15)',
        boxShadow: isSelectable
          ? '0 0 10px rgba(255,255,255,0.35)'
          : '0 2px 6px rgba(0,0,0,0.4)',
        cursor: isSelectable ? 'pointer' : 'default',
        touchAction: 'manipulation',
        userSelect: 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        padding: '0 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {COLOR_ABBR[color]} ×{count}
    </div>
  );
}
