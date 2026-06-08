// ─────────────────────────────────────────────────────────────────────────────
// client/src/components/Card.tsx — renders a single land card.
//
// Mobile-first: hover states replaced with CSS :active touch feedback.
// Selected cards show a glow/lift; tappable cards get active scale-down.
// ─────────────────────────────────────────────────────────────────────────────
import { useCardImages } from '../hooks/useCardImages';
import { useScaledSize } from '../hooks/useCardScale';
import { Card as CardType, Customizations, DEFAULT_CUSTOMIZATIONS, Color } from '@lands/shared';

const COLOR_CSS: Record<Color, string> = {
  white: 'var(--white-land)',
  red:   'var(--red-land)',
  blue:  'var(--blue-land)',
  green: 'var(--green-land)',
  black: 'var(--black-land)',
};

interface Props {
  card: CardType;
  customizations?: Customizations;
  selected?: boolean;
  faceDown?: boolean;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  noAnimate?: boolean;
  selectionIndex?: number;
}

export function Card({ card, customizations, selected, faceDown, small, onClick, disabled, noAnimate, selectionIndex }: Props) {
  const cardImageUrls = useCardImages();
  const custom = customizations?.[card.color] ?? DEFAULT_CUSTOMIZATIONS[card.color];
  const bgColor = COLOR_CSS[card.color];
  const { w, h, scale } = useScaledSize(small ? 56 : 80, small ? 78 : 112);
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

  const transform = selected ? `translateY(${small ? -5 : -8}px) scale(1.06)` : 'none';
  const boxShadow = selected
    ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.5), 0 6px 18px rgba(0,0,0,0.5)'
    : '0 2px 6px rgba(0,0,0,0.4)';

  const badgeSize = Math.round((small ? 17 : 22) * scale);
  const badgeFontSize = `${(small ? 0.55 : 0.68) * Math.max(scale, 0.8)}rem`;

  return (
    <div
      className={isClickable ? 'card-interactive relative inline-block shrink-0' : 'relative inline-block shrink-0'}
      style={{
        zIndex: selected ? 10 : 0,
        transform,
        transition: 'transform 0.15s ease',
        animation: noAnimate ? undefined : 'card-enter-hand 0.25s ease',
        touchAction: 'manipulation',
      }}
    >
      <div
        onClick={disabled ? undefined : onClick}
        style={{
          width: w, height: h,
          border: selected
            ? '2px solid rgba(255,255,255,0.95)'
            : '2px solid rgba(255,255,255,0.18)',
          borderRadius: 8,
          overflow: 'hidden',
          cursor: isClickable ? 'pointer' : 'default',
          boxShadow,
          transition: 'box-shadow 0.15s ease',
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

        {/* Show card name as overlay when selected (replaces hover tooltip on mobile) */}
        {selected && !small && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.65)',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            padding: '3px 2px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {custom.displayName}
          </div>
        )}
      </div>

      {/* Selection badge */}
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
    </div>
  );
}

export function HiddenCard({ small }: { small?: boolean }) {
  const cardImageUrls = useCardImages();
  const { w, h } = useScaledSize(small ? 56 : 72, small ? 78 : 100);
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
