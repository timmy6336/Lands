import { useState } from 'react';
import { Card as CardType, Customizations } from '@lands/shared';
import { Card } from './Card';

interface Props {
  cards: CardType[];
  customizations?: Customizations;
  label: string;
}

export function Graveyard({ cards, customizations, label }: Props) {
  const [expanded, setExpanded] = useState(false);
  const count = cards.length;
  const topCard = cards[cards.length - 1];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '0.6rem 0.75rem',
      minWidth: 110,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
    }}>
      <div
        style={{
          fontSize: '0.7rem', color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          cursor: count > 0 ? 'pointer' : 'default',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
        onClick={() => count > 0 && setExpanded(e => !e)}
      >
        <span>{label}</span>
        {count > 0 && (
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {count} {expanded ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Collapsed: show top card of the pile */}
      {!expanded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {topCard
            ? <Card card={topCard} customizations={customizations} small />
            : <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Empty</p>
          }
          {count > 1 && (
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>+{count - 1} more</span>
          )}
        </div>
      )}

      {/* Expanded: show all cards in a scrollable row */}
      {expanded && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
          maxHeight: 200, overflowY: 'auto',
        }}>
          {cards.map(card => (
            <Card key={card.id} card={card} customizations={customizations} small />
          ))}
        </div>
      )}
    </div>
  );
}
