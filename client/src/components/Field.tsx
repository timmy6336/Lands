// Renders a player's field as horizontal color-tile strip.
// Each color becomes one 66×96px tile: card art background + count overlay.
import { useCardImages } from '../hooks/useCardImages';
import { Card as CardType, Customizations, DEFAULT_CUSTOMIZATIONS, Color } from '@lands/shared';

const COLOR_BG: Record<Color, string> = {
  white: 'var(--white-land)',
  red:   'var(--red-land)',
  blue:  'var(--blue-land)',
  green: 'var(--green-land)',
  black: 'var(--black-land)',
};

interface Props {
  cards: CardType[];
  customizations?: Customizations;
  label: string;
  selectableIds?: Set<string>;
  onSelect?: (cardId: string) => void;
}

export function Field({ cards, customizations, label, selectableIds, onSelect }: Props) {
  const groups = new Map<Color, CardType[]>();
  for (const card of cards) {
    if (!groups.has(card.color)) groups.set(card.color, []);
    groups.get(card.color)!.push(card);
  }

  return (
    <div className="field-pane">
      {groups.size === 0
        ? <span style={{ color: 'var(--muted)', fontSize: '0.75rem', padding: '0 4px', flexShrink: 0 }}>
            {label} — empty
          </span>
        : [...groups.entries()].map(([color, stackCards]) => {
            const isSelectable = !!selectableIds && stackCards.some(c => selectableIds.has(c.id));
            const topCard = stackCards[stackCards.length - 1];
            return (
              <FieldTile
                key={color}
                color={color}
                count={stackCards.length}
                customizations={customizations}
                isSelectable={isSelectable}
                onSelect={isSelectable ? () => onSelect?.(topCard.id) : undefined}
              />
            );
          })
      }
    </div>
  );
}

interface TileProps {
  color: Color;
  count: number;
  customizations?: Customizations;
  isSelectable: boolean;
  onSelect?: () => void;
}

function FieldTile({ color, count, customizations, isSelectable, onSelect }: TileProps) {
  const cardImageUrls = useCardImages();
  const custom = customizations?.[color] ?? DEFAULT_CUSTOMIZATIONS[color];

  return (
    <div
      onClick={isSelectable ? onSelect : undefined}
      className={isSelectable ? 'tile-interactive tile-selectable' : undefined}
      style={{
        width: 66, height: 96,
        borderRadius: 10, flexShrink: 0,
        position: 'relative', overflow: 'hidden',
        background: COLOR_BG[color],
        border: isSelectable ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.12)',
        boxShadow: isSelectable
          ? '0 0 18px rgba(255,255,255,0.3), 0 4px 14px rgba(0,0,0,0.6)'
          : '0 3px 10px rgba(0,0,0,0.5)',
        cursor: isSelectable ? 'pointer' : 'default',
        touchAction: 'manipulation',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        animation: 'card-enter 0.3s ease',
        userSelect: 'none',
      }}
    >
      <img
        src={cardImageUrls[color]}
        alt={color}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.78 }}
      />
      {/* gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.52) 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 3px 7px',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: '0.58rem',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)', textAlign: 'center',
        }}>
          {custom.displayName}
        </span>
        <span style={{
          color: '#fff', fontWeight: 900, fontSize: '2rem', lineHeight: 1,
          textShadow: '0 2px 6px rgba(0,0,0,0.9)',
        }}>
          {count}
        </span>
      </div>
    </div>
  );
}
