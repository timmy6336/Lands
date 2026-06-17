import { Card as CardType, ALL_COLORS, Color } from '@lands/shared';

const DOT_COLORS: Record<Color, string> = {
  white: '#f0ead6', red: '#e74c3c', blue: '#3498db', green: '#2ecc71', black: '#887799',
};

interface Props {
  field: CardType[];
  compact?: boolean;
}

export function WinProgress({ field, compact }: Props) {
  const colorCounts = new Map<Color, number>();
  for (const card of field) {
    colorCounts.set(card.color, (colorCounts.get(card.color) ?? 0) + 1);
  }

  const colorsPresent = new Set(colorCounts.keys());
  const rainbowCount = colorsPresent.size;

  let bestColor: Color = 'white';
  let bestCount = 0;
  for (const [color, count] of colorCounts) {
    if (count > bestCount) { bestCount = count; bestColor = color; }
  }

  const dotSize = compact ? 6 : 8;
  const gap = compact ? 2 : 3;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: compact ? 2 : 4, flexShrink: 0,
      background: 'rgba(255,255,255,0.06)', borderRadius: 8,
      padding: compact ? '3px 5px' : '4px 6px',
    }}>
      {/* Rainbow progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap }}>
        {ALL_COLORS.map(color => (
          <div key={color} style={{
            width: dotSize, height: dotSize, borderRadius: '50%',
            background: colorsPresent.has(color) ? DOT_COLORS[color] : 'rgba(255,255,255,0.12)',
            border: colorsPresent.has(color) ? 'none' : '1px solid rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{
        fontSize: compact ? '0.5rem' : '0.55rem', color: 'var(--muted)',
        fontWeight: 600, lineHeight: 1, letterSpacing: '0.03em',
      }}>
        {rainbowCount}/5
      </span>

      {/* 5-of-a-kind progress */}
      {bestCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <div style={{
            width: dotSize - 2, height: dotSize - 2, borderRadius: '50%',
            background: DOT_COLORS[bestColor], flexShrink: 0,
          }} />
          <span style={{
            fontSize: compact ? '0.5rem' : '0.55rem', color: DOT_COLORS[bestColor],
            fontWeight: 700, lineHeight: 1,
          }}>
            {bestCount}/5
          </span>
        </div>
      )}
    </div>
  );
}
