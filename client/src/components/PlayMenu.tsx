// Mode selection: Single Player vs Multiplayer — mobile-first layout.
interface Props {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
  onBack: () => void;
}

export function PlayMenu({ onSinglePlayer, onMultiplayer, onBack }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 28, paddingTop: 'max(env(safe-area-inset-top,0px),1.5rem)', paddingBottom: 'max(env(safe-area-inset-bottom,0px),1.5rem)', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent)', margin: '0 0 6px', fontSize: '1.6rem' }}>Play</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>Play solo or challenge someone online</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
        <button
          className="btn-primary"
          onClick={onSinglePlayer}
          style={{ textAlign: 'left', fontSize: '1.05rem', padding: '0.9rem 1.25rem', minHeight: 64, borderRadius: 12 }}
        >
          <span style={{ display: 'block', fontWeight: 700 }}>Single Player</span>
          <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 400, opacity: 0.7, marginTop: 3 }}>
            Play against AI — Easy, Medium, or Hard
          </span>
        </button>

        <button
          className="btn-secondary"
          onClick={onMultiplayer}
          style={{ textAlign: 'left', fontSize: '1.05rem', padding: '0.9rem 1.25rem', minHeight: 64, borderRadius: 12 }}
        >
          <span style={{ display: 'block', fontWeight: 700 }}>Multiplayer</span>
          <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 400, opacity: 0.65, marginTop: 3 }}>
            Private room or matchmaking
          </span>
        </button>
      </div>

      <button className="btn-secondary" onClick={onBack} style={{ fontSize: '0.9rem', padding: '0.6rem 1.75rem' }}>
        ← Back
      </button>
    </div>
  );
}
