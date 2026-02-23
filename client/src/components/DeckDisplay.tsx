// Compact deck display showing a fan of face-down cards with a count badge.
// Used inside the Field row in both GameBoard and ReplayViewer.
import { useCardImages } from '../hooks/useCardImages';

interface Props {
  count: number;
  small?: boolean;
}

export function DeckDisplay({ count, small }: Props) {
  const cardImageUrls = useCardImages();
  const w = small ? 40 : 56;
  const h = small ? 56 : 78;
  const OFFSET = 3;
  const shadowDepth = Math.min(Math.max(count - 1, 0), 3);

  return (
    <div style={{
      position: 'relative',
      width: w + shadowDepth * OFFSET,
      height: h + shadowDepth * OFFSET,
      flexShrink: 0,
    }}>
      {/* Shadow layers */}
      {Array.from({ length: shadowDepth }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: (shadowDepth - i - 1) * OFFSET,
          left: (shadowDepth - i - 1) * OFFSET,
          width: w,
          height: h,
          borderRadius: 6,
          border: '2px solid rgba(255,255,255,0.1)',
          background: '#12122a',
        }} />
      ))}

      {/* Top card */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: w,
        height: h,
        borderRadius: 6,
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.2)',
      }}>
        {count > 0 ? (
          <>
            <img
              src={cardImageUrls['back']}
              alt="deck"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
              fontSize: small ? '0.8rem' : '1.1rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.02em',
            }}>
              {count}
            </div>
          </>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6rem',
            color: 'var(--muted)',
          }}>
            Empty
          </div>
        )}
      </div>
    </div>
  );
}
