// Minimal dashboard variant: no card art — wide pill buttons per card.
import { Card as CardType, Customizations, DEFAULT_CUSTOMIZATIONS, Color } from '@lands/shared';

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

interface Props {
  cards: CardType[];
  hiddenCount?: number;
  customizations?: Customizations;
  label: string;
  selectableIds?: Set<string>;
  onSelect?: (cardId: string) => void;
  highlightIds?: Set<string>;
}

export function Hand({ cards, customizations, label, selectableIds, onSelect, highlightIds }: Props) {
  return (
    <div className="hand-pane-minimal">
      {cards.length === 0
        ? <span style={{ color: 'var(--muted)', fontSize: '0.8rem', padding: '0 4px', width: '100%', textAlign: 'center' }}>
            No cards — {label}
          </span>
        : cards.map(card => {
            const isPlayable = !!(selectableIds?.has(card.id));
            const isDisabled = selectableIds !== undefined && !isPlayable;
            const isHighlighted = !!(highlightIds?.has(card.id));
            return (
              <HandPill
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

interface PillProps {
  card: CardType;
  customizations?: Customizations;
  isPlayable: boolean;
  isDisabled: boolean;
  isHighlighted: boolean;
  onClick?: () => void;
}

function HandPill({ card, customizations, isPlayable, isDisabled, isHighlighted, onClick }: PillProps) {
  const custom = customizations?.[card.color] ?? DEFAULT_CUSTOMIZATIONS[card.color];
  const isLifted = isPlayable || isHighlighted;
  const maxNameLen = 7;
  const displayName = custom.displayName.length > maxNameLen
    ? custom.displayName.slice(0, maxNameLen - 1) + '…'
    : custom.displayName;

  return (
    <div
      onClick={onClick}
      className={isPlayable ? 'tile-interactive' : undefined}
      style={{
        width: 84,
        height: 52,
        borderRadius: 26,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: COLOR_BG[card.color],
        color: COLOR_TEXT[card.color],
        border: isLifted
          ? '2px solid rgba(255,255,255,0.9)'
          : '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: isLifted
          ? '0 0 14px rgba(255,255,255,0.3), 0 6px 16px rgba(0,0,0,0.6)'
          : '0 2px 8px rgba(0,0,0,0.45)',
        cursor: isPlayable ? 'pointer' : 'default',
        touchAction: 'manipulation',
        opacity: isDisabled ? 0.4 : 1,
        transform: isLifted ? 'translateY(-8px)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s',
        userSelect: 'none',
        padding: '4px 8px',
      }}
    >
      <span style={{
        fontWeight: 800,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: 1.2,
        textAlign: 'center',
      }}>
        {displayName}
      </span>
      {isPlayable && (
        <span style={{
          fontSize: '0.52rem',
          opacity: 0.75,
          letterSpacing: '0.03em',
          lineHeight: 1,
        }}>
          tap
        </span>
      )}
    </div>
  );
}
