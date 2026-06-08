// Renders the player's hand as a horizontal row of 72×108px cards.
// Each card shows: art image (top 62%) + info strip (bottom 38%) with name + "tap to play".
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
  hiddenCount?: number; // unused — opponent hand is now shown as a count badge only
  customizations?: Customizations;
  label: string;
  selectableIds?: Set<string>;
  onSelect?: (cardId: string) => void;
  highlightIds?: Set<string>;
}

export function Hand({ cards, customizations, label, selectableIds, onSelect, highlightIds }: Props) {
  return (
    <div className="hand-pane">
      {cards.length === 0
        ? <span style={{ color: 'var(--muted)', fontSize: '0.8rem', padding: '0 4px', width: '100%', textAlign: 'center' }}>
            No cards — {label}
          </span>
        : cards.map(card => {
            const isPlayable = !!(selectableIds?.has(card.id));
            const isDisabled = selectableIds !== undefined && !isPlayable;
            const isHighlighted = !!(highlightIds?.has(card.id));
            return (
              <HandCard
                key={card.id}
                card={card}
                customizations={customizations}
                isPlayable={isPlayable}
                isDisabled={isDisabled}
                isHighlighted={isHighlighted}
                onClick={isPlayable ? () => onSelect?.(card.id) : undefined}
              />
            );
          })
      }
    </div>
  );
}

interface HandCardProps {
  card: CardType;
  customizations?: Customizations;
  isPlayable: boolean;
  isDisabled: boolean;
  isHighlighted: boolean;
  onClick?: () => void;
}

function HandCard({ card, customizations, isPlayable, isDisabled, isHighlighted, onClick }: HandCardProps) {
  const cardImageUrls = useCardImages();
  const custom = customizations?.[card.color] ?? DEFAULT_CUSTOMIZATIONS[card.color];
  const isSelected = isPlayable || isHighlighted;

  return (
    <div
      onClick={onClick}
      className={isPlayable ? 'tile-interactive' : undefined}
      style={{
        width: 72, height: 108,
        borderRadius: 10, flexShrink: 0,
        position: 'relative', overflow: 'hidden',
        background: COLOR_BG[card.color],
        border: isSelected ? '2px solid rgba(255,255,255,0.88)' : '1.5px solid rgba(255,255,255,0.13)',
        boxShadow: isSelected
          ? '0 0 18px rgba(255,255,255,0.38), 0 6px 18px rgba(0,0,0,0.6)'
          : '0 3px 10px rgba(0,0,0,0.45)',
        cursor: isPlayable ? 'pointer' : 'default',
        touchAction: 'manipulation',
        opacity: isDisabled ? 0.35 : 1,
        transform: isSelected ? 'translateY(-10px)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s',
        animation: 'card-enter-hand 0.25s ease',
        userSelect: 'none',
      }}
    >
      {/* Card art — top 62% */}
      <img
        src={cardImageUrls[card.color]}
        alt={card.color}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        style={{ width: '100%', height: '62%', objectFit: 'cover', display: 'block' }}
      />
      {/* Info strip — bottom 38% */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.72)',
        height: '40%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 3, padding: '3px 5px',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: '#fff', fontWeight: 700, fontSize: '0.66rem',
          textTransform: 'uppercase', letterSpacing: '0.04em',
          textAlign: 'center', lineHeight: 1.2,
        }}>
          {custom.displayName}
        </span>
        {isPlayable && (
          <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.52rem', letterSpacing: '0.02em' }}>
            tap to play
          </span>
        )}
      </div>
    </div>
  );
}
