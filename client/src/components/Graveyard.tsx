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
    <div className="border border-border rounded-[10px] px-3 py-2.5 flex flex-col gap-1.5 min-w-[110px]"
      style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div
        className="text-[0.7rem] text-muted uppercase tracking-widest flex justify-between items-center"
        style={{ cursor: count > 0 ? 'pointer' : 'default' }}
        onClick={() => count > 0 && setExpanded(e => !e)}
      >
        <span>{label}</span>
        {count > 0 && (
          <span className="text-foreground font-semibold">{count} {expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {!expanded && (
        <div className="flex items-center gap-2">
          {topCard
            ? <Card card={topCard} customizations={customizations} small />
            : <p className="text-muted text-xs">Empty</p>
          }
          {count > 1 && <span className="text-muted text-xs">+{count - 1} more</span>}
        </div>
      )}

      {expanded && (
        <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
          {cards.map(card => (
            <Card key={card.id} card={card} customizations={customizations} small />
          ))}
        </div>
      )}
    </div>
  );
}
