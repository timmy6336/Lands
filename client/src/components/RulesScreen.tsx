// RulesScreen.tsx — Game rules reference. Scrollable, no MTG references.

interface Props {
  onBack: () => void;
}

const CARD_COLORS = [
  {
    bg: '#f0ead6', border: '#c8b97a',
    label: 'White',
    effect: 'Draw 1 card from the top of your deck.',
  },
  {
    bg: '#c0392b', border: '#922b21',
    label: 'Red',
    effect: 'Choose and destroy one land your opponent has in play. That land goes to their graveyard.',
  },
  {
    bg: '#2980b9', border: '#1a5276',
    label: 'Blue',
    effect: 'Look at the top card of your deck — choose to keep it on top or send it to the bottom. Blue cards are also used to counter plays (see the Countering section above).',
  },
  {
    bg: '#27ae60', border: '#1e8449',
    label: 'Green',
    effect: 'Retrieve any card from your own graveyard and return it to your hand.',
  },
  {
    bg: '#1a1a2a', border: '#5b2c8a',
    label: 'Black',
    effect: 'Your opponent reveals 3 random cards from their hand. You choose 1 of those 3 for them to discard to the graveyard.',
  },
];

const SECTION_STYLE: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
};

const RULE_BOX: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '0.8rem 1rem',
};

export function RulesScreen({ onBack }: Props) {
  return (
    <div className="flex flex-col h-full px-8 py-6 gap-6 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 1rem' }}>← Back</button>
        <h2 className="text-accent m-0">How to Play</h2>
      </div>

      {/* ── Overview ─────────────────────────────────── */}
      <section style={SECTION_STYLE}>
        <h3 className="text-foreground text-base m-0">Overview</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.65 }}>
          Lands is a 2-player card duel. Each player has a deck of <strong>25 cards</strong> —
          5 copies of each of the 5 land types. Both players start with <strong>5 cards in hand</strong>.
          Players take turns playing one land at a time. The first to meet a win condition wins.
        </p>
      </section>

      {/* ── Win Conditions ──────────────────────────── */}
      <section style={SECTION_STYLE}>
        <h3 className="text-foreground text-base m-0">Win Conditions</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.65 }}>You win if <strong>either</strong> of the following is true after your land resolves:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={RULE_BOX}>
            <p className="text-foreground text-sm font-bold m-0">5 of a Kind</p>
            <p className="text-muted text-sm m-0 mt-1" style={{ lineHeight: 1.55 }}>
              Have 5 or more lands of the <strong>same color</strong> on your field.
            </p>
          </div>
          <div style={RULE_BOX}>
            <p className="text-foreground text-sm font-bold m-0">Rainbow</p>
            <p className="text-muted text-sm m-0 mt-1" style={{ lineHeight: 1.55 }}>
              Have at least <strong>1 of each of the 5 land types</strong> on your field simultaneously.
            </p>
          </div>
        </div>
      </section>

      {/* ── Turn Structure ──────────────────────────── */}
      <section style={SECTION_STYLE}>
        <h3 className="text-foreground text-base m-0">Turn Structure</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { n: 1, title: 'Draw',    body: 'Draw 1 card from the top of your deck. If your deck is empty, your graveyard is shuffled and becomes your new deck.' },
            { n: 2, title: 'Play',    body: 'Choose 1 card from your hand to play onto your field. This triggers a counter window for your opponent.' },
            { n: 3, title: 'Resolve', body: "If the land isn't countered it lands on your field and its effect triggers. The turn then passes to your opponent." },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ ...RULE_BOX, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
                background: 'var(--accent-bright)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800,
              }}>{n}</span>
              <div>
                <p className="text-foreground text-sm font-bold m-0">{title}</p>
                <p className="text-muted text-sm m-0 mt-1" style={{ lineHeight: 1.55 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted m-0" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
          ℹ️ The first player skips the Draw step on turn 1.
        </p>
      </section>

      {/* ── Countering ─────────────────────────────── */}
      <section style={SECTION_STYLE}>
        <h3 className="text-foreground text-base m-0">Countering</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.65 }}>
          After a land is played, the <strong>opponent</strong> has a brief window to counter it.
          Countering removes the played land with no effect (it goes to the attacker’s graveyard).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={RULE_BOX}>
            <p className="text-foreground text-sm font-bold m-0">First Counter</p>
            <p className="text-muted text-sm m-0 mt-1" style={{ lineHeight: 1.55 }}>
              Discard <strong style={{ color: '#2980b9' }}>1 Blue card</strong> +{' '}
              <strong>1 card matching the color of the played land</strong> from your hand.
            </p>
          </div>
          <div style={RULE_BOX}>
            <p className="text-foreground text-sm font-bold m-0">Counter-Counter (and any further counters)</p>
            <p className="text-muted text-sm m-0 mt-1" style={{ lineHeight: 1.55 }}>
              Discard <strong style={{ color: '#2980b9' }}>2 Blue cards</strong> from your hand.
              Once the first counter is placed, every response in the chain costs 2 Blues.
            </p>
          </div>
        </div>

        <p className="text-muted m-0" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
          The chain can go back and forth indefinitely. The <strong>last counter in the chain wins</strong> —
          the land is either countered or resolves based on the final action.
          If a time limit is set, an expired window is treated as passing.
        </p>
      </section>

      {/* ── Card Effects ──────────────────────────── */}
      <section style={SECTION_STYLE}>
        <h3 className="text-foreground text-base m-0">Card Effects</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.65 }}>
          Each land type has a unique effect that triggers when it resolves onto your field.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CARD_COLORS.map(({ bg, border, label, effect }) => (
            <div key={label} style={{ ...RULE_BOX, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                background: bg, border: `2px solid ${border}`, marginTop: 2,
              }} />
              <div>
                <p className="text-foreground text-sm font-bold m-0">{label}</p>
                <p className="text-muted m-0 mt-1" style={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
                  {effect}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Graveyard ─────────────────────────────── */}
      <section style={SECTION_STYLE}>
        <h3 className="text-foreground text-base m-0">Graveyard</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.65 }}>
          Cards go to the graveyard when they are countered, when they are destroyed by Red’s effect,
          or when they are discarded by Black’s effect. When your deck runs out,
          your graveyard is automatically shuffled and becomes your new deck.
          Green’s effect lets you retrieve any card from your <em>own</em> graveyard.
        </p>
      </section>

      {/* ── Going First ───────────────────────────── */}
      <section style={SECTION_STYLE}>
        <h3 className="text-foreground text-base m-0">Going First</h3>
        <p className="text-muted text-sm m-0" style={{ lineHeight: 1.65 }}>
          Before each game both players simultaneously play <strong>Rock Paper Scissors</strong>.
          The winner chooses who takes the first turn.
        </p>
      </section>

    </div>
  );
}
