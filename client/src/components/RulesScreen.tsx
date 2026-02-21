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
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '1.5rem 2rem', gap: '1.5rem', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 1rem' }}>
          ← Back
        </button>
        <h2 style={{ color: 'var(--accent)', margin: 0 }}>How to Play</h2>
      </div>

      {/* Overview */}
      <section>
        <h3 style={sectionHead}>Overview</h3>
        <p style={body}>
          Lands is a 2-player card duel. Each player has a deck of <strong>25 cards</strong> — 5 copies
          of each of the 5 land types. Both players start with <strong>5 cards in hand</strong>. Players
          take turns playing one land at a time. The first player to meet a win condition wins the game.
        </p>
      </section>

      {/* Win conditions */}
      <section>
        <h3 style={sectionHead}>Win Conditions</h3>
        <p style={{ ...body, marginBottom: '0.5rem' }}>You win if <strong>either</strong> of the following is true at the end of your play:</p>
        <ul style={{ ...body, paddingLeft: '1.4rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li><strong>5 of a Kind</strong> — You have 5 or more lands of the same color in play.</li>
          <li><strong>Rainbow</strong> — You have at least 1 of each of the 5 land types in play.</li>
        </ul>
      </section>

      {/* Turn structure */}
      <section>
        <h3 style={sectionHead}>Turn Structure</h3>
        <ol style={{ ...body, paddingLeft: '1.4rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li><strong>Draw</strong> — Draw 1 card from your deck. (If your deck is empty, your graveyard is shuffled back in.)</li>
          <li><strong>Play</strong> — Choose 1 card from your hand to play. This opens a counter window for your opponent.</li>
          <li><strong>Resolve</strong> — If not countered, the card lands on your field and its effect fires. The turn then passes.</li>
        </ol>
        <p style={{ ...body, marginTop: '0.6rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
          Note: The first player skips the Draw step on turn 1.
        </p>
      </section>

      {/* Countering */}
      <section>
        <h3 style={sectionHead}>Countering</h3>
        <p style={body}>
          When a land is played, the <strong>opponent</strong> has a limited window to counter it.
          To counter you must discard from your hand:
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.75rem 1rem', margin: '0.5rem 0',
          fontSize: '0.9rem', color: 'var(--text)',
        }}>
          <strong style={{ color: '#2980b9' }}>1 Blue card</strong>
          <span style={{ color: 'var(--muted)' }}> + </span>
          <strong>1 card matching the color of the played land</strong>
        </div>
        <p style={body}>
          If countered, the played card goes to the <strong>attacker's graveyard</strong> with no effect.
          The attacker can then <strong>counter-counter</strong> by discarding <strong>2 Blue cards</strong>.
          This chain can continue back and forth — the last counter in the chain wins.
        </p>
        <p style={{ ...body, color: 'var(--muted)', fontSize: '0.85rem' }}>
          If a time limit is set for the room, the counter window closes automatically when it expires
          (treated as passing).
        </p>
      </section>

      {/* Card effects */}
      <section>
        <h3 style={sectionHead}>Card Effects</h3>
        <p style={{ ...body, marginBottom: '0.75rem' }}>
          Each land type has a unique effect that triggers when it resolves onto your field.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {CARD_COLORS.map(({ color, border, label, effect, counter }) => (
            <div key={label} style={{
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.75rem 1rem',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                background: color, border: `2px solid ${border}`,
                marginTop: 2,
              }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                  {label}
                  {counter && (
                    <span style={{
                      marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 600,
                      color: '#2980b9', background: 'rgba(41,128,185,0.15)',
                      border: '1px solid rgba(41,128,185,0.3)',
                      borderRadius: 4, padding: '1px 5px',
                    }}>
                      COUNTER
                    </span>
                  )}
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {effect}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Graveyard */}
      <section>
        <h3 style={sectionHead}>Graveyard</h3>
        <p style={body}>
          Countered cards and cards discarded by Black's effect go to the graveyard. When a player's
          deck runs out, their graveyard is shuffled and becomes their new deck.
          Green's effect lets you retrieve a card from your <em>own</em> graveyard.
        </p>
      </section>

      {/* RPS */}
      <section>
        <h3 style={sectionHead}>Going First</h3>
        <p style={body}>
          Before each game, both players play <strong>Rock Paper Scissors</strong> simultaneously.
          The winner chooses who takes the first turn.
        </p>
      </section>
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  color: 'var(--text)', marginBottom: '0.6rem', fontSize: '1rem', marginTop: 0,
};

const body: React.CSSProperties = {
  color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0,
};
