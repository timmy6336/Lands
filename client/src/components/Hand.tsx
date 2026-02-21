import { Card as CardType, Customizations } from '@lands/shared';
import { Card, HiddenCard } from './Card';

interface Props {
  cards: CardType[];
  hiddenCount?: number; // if hand is hidden, show this many face-down cards
  customizations?: Customizations;
  label: string;
  selectableIds?: Set<string>;
  onSelect?: (cardId: string) => void;
  highlightIds?: Set<string>;
}

export function Hand({ cards, hiddenCount, customizations, label, selectableIds, onSelect, highlightIds }: Props) {
  const isHidden = hiddenCount !== undefined && cards.length === 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '0.75rem 1rem',
    }}>
      <div style={{
        fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.6rem',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label} — {isHidden ? hiddenCount : cards.length} card{(isHidden ? hiddenCount! : cards.length) !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: 80 }}>
        {isHidden
          ? Array.from({ length: hiddenCount! }).map((_, i) => <HiddenCard key={i} />)
          : cards.map(card => (
            <Card
              key={card.id}
              card={card}
              customizations={customizations}
              selected={highlightIds?.has(card.id)}
              onClick={selectableIds?.has(card.id) ? () => onSelect?.(card.id) : undefined}
              disabled={selectableIds !== undefined && !selectableIds.has(card.id)}
            />
          ))
        }
      </div>
    </div>
  );
}
