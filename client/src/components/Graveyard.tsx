// Renders a player’s graveyard as a compact button that opens a modal card list.
// All cards are visible (graveyard is public information — needed for Green effect targeting).
import { useState } from 'react';
import { Card } from './Card';
import { Card as CardType, Customizations, DEFAULT_CUSTOMIZATIONS, Color } from '@lands/shared';

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
        style={{ cursor: count > 0 ? 'pointer' : 'default', fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center', touchAction: 'manipulation', minHeight: 24, userSelect: 'none' }}
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
