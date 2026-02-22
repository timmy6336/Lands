// RulesScreen.tsx — Static rules reference screen explaining card colors, effects, the
// counter system, and win conditions. Rendered as scrollable content with a Back button.

interface Props {
  onBack: () => void;
}

const CARD_COLORS = [
  {
    color: '#f0ead6',
    border: '#c8b97a',
    label: 'White — Plains',
    effect: 'Draw 1 card from your deck.',
    counter: false,
  },
  {
    color: '#c0392b',
    border: '#922b21',
    label: 'Red — Mountain',
    effect: 'Choose and destroy one of your opponent\'s lands in play.',
    counter: false,
  },
  {
    color: '#2980b9',
    border: '#1a5276',
    label: 'Blue — Island',
    effect: 'Look at the top card of your deck — keep it on top or send it to the bottom. Blue cards are also the only card that can counter plays (see Countering below).',
    counter: true,
  },
  {
    color: '#27ae60',
    border: '#1e8449',
    label: 'Green — Forest',
    effect: 'Retrieve any card from your graveyard back into your hand.',
    counter: false,
  },
  {
    color: '#1a1a2a',
    border: '#5b2c8a',
    label: 'Black — Swamp',
    effect: 'Your opponent reveals 3 cards from their hand. You choose 1 of those 3 for them to discard.',
    counter: false,
  },
];

export function RulesScreen({ onBack }: Props) {
  return (
    <div className="flex flex-col h-full px-8 py-6 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 1rem' }}>
          ← Back
        </button>
        <h2 className="text-accent m-0">How to Play</h2>
      </div>

      {/* Overview */}
      <section>
        <h3 className="text-foreground mb-2.5 text-base mt-0">Overview</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.6 }}>
          Lands is a 2-player card duel. Each player has a deck of <strong>25 cards</strong> — 5 copies
          of each of the 5 land types. Both players start with <strong>5 cards in hand</strong>. Players
          take turns playing one land at a time. The first player to meet a win condition wins the game.
        </p>
      </section>

      {/* Win conditions */}
      <section>
        <h3 className="text-foreground mb-2.5 text-base mt-0">Win Conditions</h3>
        <p className="text-muted text-sm mb-2 m-0" style={{ lineHeight: 1.6 }}>
          You win if <strong>either</strong> of the following is true at the end of your play:
        </p>
        <ul className="text-muted text-sm m-0 flex flex-col gap-1.5" style={{ paddingLeft: '1.4rem', lineHeight: 1.6 }}>
          <li><strong>5 of a Kind</strong> — You have 5 or more lands of the same color in play.</li>
          <li><strong>Rainbow</strong> — You have at least 1 of each of the 5 land types in play.</li>
        </ul>
      </section>

      {/* Turn structure */}
      <section>
        <h3 className="text-foreground mb-2.5 text-base mt-0">Turn Structure</h3>
        <ol className="text-muted text-sm m-0 flex flex-col gap-1.5" style={{ paddingLeft: '1.4rem', lineHeight: 1.6 }}>
          <li><strong>Draw</strong> — Draw 1 card from your deck. (If your deck is empty, your graveyard is shuffled back in.)</li>
          <li><strong>Play</strong> — Choose 1 card from your hand to play. This opens a counter window for your opponent.</li>
          <li><strong>Resolve</strong> — If not countered, the card lands on your field and its effect fires. The turn then passes.</li>
        </ol>
        <p className="text-muted mt-2.5 m-0" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
          Note: The first player skips the Draw step on turn 1.
        </p>
      </section>

      {/* Countering */}
      <section>
        <h3 className="text-foreground mb-2.5 text-base mt-0">Countering</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.6 }}>
          When a land is played, the <strong>opponent</strong> has a limited window to counter it.
          To counter you must discard from your hand:
        </p>
        <div className="bg-surface border border-border rounded-lg my-2 text-sm text-foreground" style={{ padding: '0.75rem 1rem' }}>
          <strong style={{ color: '#2980b9' }}>1 Blue card</strong>
          <span className="text-muted"> + </span>
          <strong>1 card matching the color of the played land</strong>
        </div>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.6 }}>
          If countered, the played card goes to the <strong>attacker's graveyard</strong> with no effect.
          The attacker can then <strong>counter-counter</strong> by discarding <strong>2 Blue cards</strong>.
          This chain can continue back and forth — the last counter in the chain wins.
        </p>
        <p className="text-muted mt-2 m-0" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
          If a time limit is set for the room, the counter window closes automatically when it expires
          (treated as passing).
        </p>
      </section>

      {/* Card effects */}
      <section>
        <h3 className="text-foreground mb-2.5 text-base mt-0">Card Effects</h3>
        <p className="text-muted text-sm mb-3 m-0" style={{ lineHeight: 1.6 }}>
          Each land type has a unique effect that triggers when it resolves onto your field.
        </p>
        <div className="flex flex-col gap-2.5">
          {CARD_COLORS.map(({ color, border, label, effect, counter }) => (
            <div key={label} className="flex gap-4 items-start bg-surface border border-border rounded-[10px]"
              style={{ padding: '0.75rem 1rem' }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                background: color, border: `2px solid ${border}`,
                marginTop: 2,
              }} />
              <div>
                <p className="m-0 font-bold text-sm text-foreground">
                  {label}
                  {counter && (
                    <span className="ml-2 text-[0.7rem] font-semibold rounded" style={{
                      color: '#2980b9', background: 'rgba(41,128,185,0.15)',
                      border: '1px solid rgba(41,128,185,0.3)',
                      padding: '1px 5px',
                    }}>
                      COUNTER
                    </span>
                  )}
                </p>
                <p className="text-muted m-0 mt-1" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {effect}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Graveyard */}
      <section>
        <h3 className="text-foreground mb-2.5 text-base mt-0">Graveyard</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.6 }}>
          Countered cards and cards discarded by Black's effect go to the graveyard. When a player's
          deck runs out, their graveyard is shuffled and becomes their new deck.
          Green's effect lets you retrieve a card from your <em>own</em> graveyard.
        </p>
      </section>

      {/* RPS */}
      <section>
        <h3 className="text-foreground mb-2.5 text-base mt-0">Going First</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.6 }}>
          Before each game, both players play <strong>Rock Paper Scissors</strong> simultaneously.
          The winner chooses who takes the first turn.
        </p>
      </section>
    </div>
  );
}
