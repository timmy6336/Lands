// Compact grave indicator: emoji + count badge. Tap to open a bottom-sheet list.
import { useState } from 'react';
import { Card } from './Card';
import { Card as CardType, Customizations, Color } from '@lands/shared';

const COLOR_DOT: Record<Color, string> = {
  white: '#f0ead6', red: '#e74c3c', blue: '#3498db', green: '#2ecc71', black: '#887799',
};

interface Props {
  cards: CardType[];
  customizations?: Customizations;
  label?: string;
}

export function Graveyard({ cards, customizations, label }: Props) {
  const [open, setOpen] = useState(false);
  const count = cards.length;

  return (
    <>
      <button
        onClick={() => count > 0 && setOpen(true)}
        disabled={count === 0}
        style={{
          background: 'none', border: 'none', padding: '2px 6px',
          borderRadius: 8, minHeight: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 1, color: count > 0 ? 'var(--text)' : 'var(--muted)',
          cursor: count > 0 ? 'pointer' : 'default',
          touchAction: 'manipulation', flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>💀</span>
        <span style={{ fontSize: '0.73rem', fontWeight: 700, lineHeight: 1 }}>{count}</span>
      </button>

      {open && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="bottom-sheet">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem 1rem 0.5rem',
              borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  💀 {label ? `${label} ` : ''}Graveyard · {count}
                </span>
                {count > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {(['white', 'red', 'blue', 'green', 'black'] as Color[]).map(c => {
                      const n = cards.filter(cd => cd.color === c).length;
                      if (n === 0) return null;
                      return (
                        <span key={c} style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          fontSize: '0.7rem', color: COLOR_DOT[c], fontWeight: 600,
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_DOT[c], display: 'inline-block', flexShrink: 0 }} />
                          {n}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.3rem', padding: '0.1rem 0.4rem', minHeight: 36 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {cards.map(card => (
                  <Card key={card.id} card={card} customizations={customizations} small />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
