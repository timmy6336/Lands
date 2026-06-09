// ui-opt-c-bighand: large card art hand (96x140px) as the dominant UI element.
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
  hiddenCount?: number;
  customizations?: Customizations;
  label: string;
  selectableIds?: Set<string>;
  onSelect?: (cardId: string) => void;
  highlightIds?: Set<string>;
  cardSize?: 'normal' | 'large';
  paneClass?: string;
}

export function Hand({ cards, customizations, label, selectableIds, onSelect, highlightIds, cardSize = 'normal', paneClass: paneClassProp }: Props) {
  const paneClass = paneClassProp ?? (cardSize === 'large' ? 'hand-pane-large' : 'hand-pane');
  return (
    <div className={paneClass}>
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
                cardSize={cardSize}
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
  cardSize?: 'normal' | 'large';
  onClick?: () => void;
}

function HandCard({ card, customizations, isPlayable, isDisabled, isHighlighted, cardSize = 'normal', onClick }: HandCardProps) {
  const cardImageUrls = useCardImages();
  const custom = customizations?.[card.color] ?? DEFAULT_CUSTOMIZATIONS[card.color];
  const isSelected = isPlayable || isHighlighted;
  const isLarge = cardSize === 'large';

  const cardW = isLarge ? 96 : 72;
  const cardH = isLarge ? 140 : 108;
  const artHeight = isLarge ? '65%' : '62%';
  const nameFontSize = isLarge ? '0.75rem' : '0.66rem';
  const tapFontSize = isLarge ? '0.6rem' : '0.52rem';
  const liftY = isLarge ? -14 : -10;

  return (
    <div
      onClick={onClick}
      className={isPlayable ? 'tile-interactive' : undefined}
      style={{
        width: cardW, height: cardH,
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
        transform: isSelected ? `translateY(${liftY}px)` : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s',
        animation: 'card-enter-hand 0.25s ease',
        userSelect: 'none',
      }}
    >
      <img
        src={cardImageUrls[card.color]}
        alt={card.color}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        style={{ width: '100%', height: artHeight, objectFit: 'cover', display: 'block' }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.72)',
        height: isLarge ? '35%' : '40%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 3, padding: '3px 5px',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: '#fff', fontWeight: 700, fontSize: nameFontSize,
          textTransform: 'uppercase', letterSpacing: '0.04em',
          textAlign: 'center', lineHeight: 1.2,
        }}>
          {custom.displayName}
        </span>
        {isPlayable && (
          <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: tapFontSize, letterSpacing: '0.02em' }}>
            tap to play
          </span>
        )}
      </div>
    </div>
  );
}
