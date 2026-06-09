interface Props {
  onBack: () => void;
}

const CARD_COLORS = [
  { color: '#f0ead6', border: '#c8b97a', label: 'White — Plains',   effect: 'Draw 1 card from your deck.', counter: false },
  { color: '#c0392b', border: '#922b21', label: 'Red — Mountain',   effect: "Choose and destroy one of your opponent's lands in play.", counter: false },
  { color: '#2980b9', border: '#1a5276', label: 'Blue — Island',    effect: 'Look at the top card of your deck — keep it on top or send it to the bottom. Blue cards are also the only card that can counter plays (see Countering below).', counter: true },
  { color: '#27ae60', border: '#1e8449', label: 'Green — Forest',   effect: 'Retrieve any card from your graveyard back into your hand.', counter: false },
  { color: '#1a1a2a', border: '#5b2c8a', label: 'Black — Swamp',    effect: 'Your opponent reveals 3 cards from their hand. You choose 1 of those 3 for them to discard.', counter: false },
];

export function RulesScreen({ onBack }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
    }}>
      {/* Sticky header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        padding: '0.65rem 1rem',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0.65rem)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 1rem', minHeight: 44, fontSize: '0.9rem' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.3rem' }}>How to Play</h2>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <section>
          <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 8, fontSize: '1rem' }}>Overview</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.65 }}>
            Lands is a 2-player card duel. Each player has a deck of <strong>25 cards</strong> — 5 copies
            of each of the 5 land types. Both players start with <strong>5 cards in hand</strong>. Players
            take turns playing one land at a time. The first player to meet a win condition wins the game.
          </p>
        </section>

        <section>
          <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 8, fontSize: '1rem' }}>Win Conditions</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 8, lineHeight: 1.65 }}>
            You win if <strong>either</strong> of the following is true at the end of your play:
          </p>
          <ul style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, paddingLeft: '1.4rem', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>5 of a Kind</strong> — You have 5 or more lands of the same color in play.</li>
            <li><strong>Rainbow</strong> — You have at least 1 of each of the 5 land types in play.</li>
          </ul>
        </section>

        <section>
          <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 8, fontSize: '1rem' }}>Turn Structure</h3>
          <ol style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, paddingLeft: '1.4rem', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Draw</strong> — Draw 1 card from your deck. (If your deck is empty, your graveyard is shuffled back in.)</li>
            <li><strong>Play</strong> — Choose 1 card from your hand to play. This opens a counter window for your opponent.</li>
            <li><strong>Resolve</strong> — If not countered, the card lands on your field and its effect fires. The turn then passes.</li>
          </ol>
          <p style={{ color: 'var(--muted)', marginTop: 10, marginBottom: 0, fontSize: '0.85rem', lineHeight: 1.65 }}>
            Note: The first player skips the Draw step on turn 1.
          </p>
        </section>

        <section>
          <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 8, fontSize: '1rem' }}>Countering</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.65 }}>
            When a land is played, the <strong>opponent</strong> has a limited window to counter it.
            To counter, discard from your hand:
          </p>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, margin: '8px 0', padding: '0.75rem 1rem',
            fontSize: '0.88rem', color: 'var(--text)',
          }}>
            <strong style={{ color: '#2980b9' }}>1 Blue card</strong>
            <span style={{ color: 'var(--muted)' }}> + </span>
            <strong>1 card matching the color of the played land</strong>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.65 }}>
            If countered, the played card goes to the <strong>attacker's graveyard</strong> with no effect.
            The attacker can <strong>counter-counter</strong> by discarding <strong>2 Blue cards</strong>.
            This chain can continue — the last counter in the chain wins.
          </p>
          <p style={{ color: 'var(--muted)', marginTop: 8, marginBottom: 0, fontSize: '0.85rem', lineHeight: 1.65 }}>
            If a time limit is set, the counter window closes automatically when it expires (treated as passing).
          </p>
        </section>

        <section>
          <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 8, fontSize: '1rem' }}>Card Effects</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 12, lineHeight: 1.65 }}>
            Each land type has a unique effect that triggers when it resolves onto your field.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CARD_COLORS.map(({ color, border, label, effect, counter }) => (
              <div key={label} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '0.75rem 1rem',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  background: color, border: `2px solid ${border}`, marginTop: 2,
                }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                    {label}
                    {counter && (
                      <span style={{
                        marginLeft: 8, fontSize: '0.68rem', fontWeight: 600, borderRadius: 4,
                        color: '#2980b9', background: 'rgba(41,128,185,0.15)',
                        border: '1px solid rgba(41,128,185,0.3)', padding: '1px 5px',
                      }}>COUNTER</span>
                    )}
                  </p>
                  <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    {effect}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 8, fontSize: '1rem' }}>Graveyard</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.65 }}>
            Countered cards and cards discarded by Black's effect go to the graveyard. When a player's
            deck runs out, their graveyard is shuffled and becomes their new deck.
            Green's effect lets you retrieve a card from your <em>own</em> graveyard.
          </p>
        </section>

        <section style={{ paddingBottom: '0.5rem' }}>
          <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 8, fontSize: '1rem' }}>Going First</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.65 }}>
            Before each game, both players play <strong>Rock Paper Scissors</strong> simultaneously.
            The winner chooses who takes the first turn.
          </p>
        </section>

      </div>
    </div>
  );
}
