// Renders a row of cards from a player’s hand.
// When `hiddenCount` is set and `cards` is empty, shows that many face-down
// HiddenCard placeholders (used for the opponent’s hand where content is secret).
// Supports click-to-select for the playing_play phase via `selectableIds` + `onSelect`.
import { Card as CardType, Customizations } from '@lands/shared';
import { Card, HiddenCard } from './Card';

interface Props {
  cards: CardType[];
  hiddenCount?: number;
  customizations?: Customizations;
  label: string;
  selectableIds?: Set<string>;
  onSelect?: (cardId: string) => void;
  highlightIds?: Set<string>;
}

export function Hand({ cards, hiddenCount, customizations, label, selectableIds, onSelect, highlightIds }: Props) {
  const isHidden = hiddenCount !== undefined && cards.length === 0;

  return (
    <div className="border border-border rounded-[10px] px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="text-xs text-muted mb-1.5 uppercase tracking-widest">
        {label} — {isHidden ? hiddenCount : cards.length} card{(isHidden ? hiddenCount! : cards.length) !== 1 ? 's' : ''}
      </div>
      <div className="flex flex-wrap gap-2 min-h-[80px]">
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
