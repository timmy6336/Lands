import { useState } from 'react';
import { Card as CardType, Color, Customizations, DEFAULT_CUSTOMIZATIONS } from '@lands/shared';
import { useCardImages } from '../hooks/useCardImages';
import { useUISettings } from '../hooks/useUISettings';

const COLOR_CSS: Record<Color, string> = {
  white: 'var(--white-land)',
  red:   'var(--red-land)',
  blue:  'var(--blue-land)',
  green: 'var(--green-land)',
  black: 'var(--black-land)',
};

const CARD_EFFECTS: Record<Color, string> = {
  white: 'Draw 1 card from your deck.',
  red:   'Destroy one of your opponent\'s lands in play.',
  blue:  'Look at the top card of your deck — keep it on top or send it to the bottom. Blue cards can also counter any land play (costs 1 Blue + 1 matching color).',
  green: 'Retrieve any card from your graveyard back to your hand.',
  black: 'Opponent reveals 3 cards from their hand; you choose 1 for them to discard.',
};

interface Props {
  card: CardType;
  customizations?: Customizations;
  selected?: boolean;
  faceDown?: boolean;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** Skip entrance animation (e.g. cards already in hand at game start) */
  noAnimate?: boolean;
  /**
   * For ordered multi-select: shows this number in the corner badge (1-based).
   * When selected but no index is given, shows a ✓ checkmark instead.
   */
  selectionIndex?: number;
}

export function Card({ card, customizations, selected, faceDown, small, onClick, disabled, noAnimate, selectionIndex }: Props) {
  const cardImageUrls = useCardImages();
  const { showCardTypeOnHover, showCardEffectsOnHover } = useUISettings();
  const [hovered, setHovered] = useState(false);
  const custom = customizations?.[card.color] ?? DEFAULT_CUSTOMIZATIONS[card.color];
  const bgColor = COLOR_CSS[card.color];
  const w = small ? 56 : 80;
  const h = small ? 78 : 112;
  const isClickable = !!onClick && !disabled;

  if (faceDown) {
    return (
      <div className="rounded-lg overflow-hidden border-2 border-border shrink-0 select-none" style={{
        width: w, height: h,
        animation: noAnimate ? undefined : 'card-enter-hand 0.25s ease',
      }}>
        <img
          src={cardImageUrls['back']}
          alt="card back"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  // Compute transform/shadow based on selected + hover state
  const transform = selected
    ? `translateY(${small ? -6 : -10}px) scale(1.08)`
    : (isClickable && hovered ? 'translateY(-10px) scale(1.05)' : 'none');

  const boxShadow = selected
    ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 18px rgba(255,255,255,0.55), 0 8px 20px rgba(0,0,0,0.5)'
    : (isClickable && hovered ? '0 14px 30px rgba(255,255,255,0.2)' : '0 2px 6px rgba(0,0,0,0.4)');

  const showTypeOverlay  = showCardTypeOnHover   && hovered;
  const showEffectTooltip = showCardEffectsOnHover && hovered;

  // Badge size scales with card size
  const badgeSize = small ? 17 : 22;
  const badgeFontSize = small ? '0.55rem' : '0.68rem';

  return (
    // Outer wrapper: handles hover, transform, and is the positioning context for overlays.
    // overflow: visible so the badge and tooltip can escape the card bounds.
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative inline-block shrink-0"
      style={{
        zIndex: (selected || hovered) ? 10 : 0,
        transform,
        transition: 'transform 0.15s ease',
        animation: noAnimate ? undefined : 'card-enter-hand 0.25s ease',
      }}
    >
      {/* Inner card face — overflow: hidden clips the image to rounded corners */}
      <div
        onClick={disabled ? undefined : onClick}
        style={{
          width: w, height: h,
          border: selected
            ? '2px solid rgba(255,255,255,0.95)'
            : (isClickable && hovered ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.2)'),
          borderRadius: 8,
          overflow: 'hidden',
          cursor: isClickable ? 'pointer' : 'default',
          boxShadow,
          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
          opacity: disabled ? 0.45 : 1,
          background: bgColor,
          userSelect: 'none',
        }}
      >
        <img
          src={cardImageUrls[card.color]}
          alt={card.color}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Card type name overlay (semi-transparent, centred) */}
        {showTypeOverlay && (
          <div className="absolute inset-0 flex items-center justify-center font-bold text-white uppercase pointer-events-none text-center"
            style={{
              background: 'rgba(0,0,0,0.6)',
              fontSize: small ? '0.6rem' : '0.72rem',
              letterSpacing: '0.06em',
              padding: '0 4px',
            }}>
            {custom.displayName}
          </div>
        )}
      </div>

      {/* Selection badge — sits outside overflow:hidden in the outer wrapper */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: small ? -4 : -6,
          left: small ? -4 : -6,
          width: badgeSize,
          height: badgeSize,
          borderRadius: '50%',
          background: selectionIndex !== undefined ? 'var(--accent)' : '#27ae60',
          color: '#fff',
          fontSize: badgeFontSize,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          pointerEvents: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
          border: '2px solid rgba(255,255,255,0.95)',
          lineHeight: 1,
        }}>
          {selectionIndex !== undefined ? selectionIndex : '✓'}
        </div>
      )}

      {/* Effect tooltip — floats above the card, outside overflow:hidden */}
      {showEffectTooltip && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(8,8,18,0.97)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 7,
          padding: '0.45rem 0.65rem',
          fontSize: '0.72rem',
          color: 'var(--text)',
          lineHeight: 1.45,
          whiteSpace: 'normal',
          width: 160,
          textAlign: 'center',
          zIndex: 200,
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          <strong style={{ display: 'block', color: 'var(--accent)', marginBottom: 3, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {custom.displayName}
          </strong>
          {CARD_EFFECTS[card.color]}
        </div>
      )}
    </div>
  );
}

/** A placeholder card shown when hand is hidden (opponent's hand) */
export function HiddenCard({ small }: { small?: boolean }) {
  const cardImageUrls = useCardImages();
  const w = small ? 56 : 72;
  const h = small ? 78 : 100;
  return (
    <div className="rounded-lg overflow-hidden border-2 border-border shrink-0 select-none" style={{ width: w, height: h }}>
      <img
        src={cardImageUrls['back']}
        alt="card back"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}
