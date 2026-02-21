interface Props {
  onPlay: () => void;
  onSettings: () => void;
  onRules: () => void;
}

export function HomeScreen({ onPlay, onSettings, onRules }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '2.5rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '4rem', fontWeight: 900, letterSpacing: '0.15em',
          color: 'var(--accent)', marginBottom: '0.3rem',
          textShadow: '0 0 40px rgba(99,102,241,0.5)',
        }}>
          LANDS
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
          A 2-player land card duel
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 200 }}>
        <button
          className="btn-primary"
          onClick={onPlay}
          style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}
        >
          ▶ Play
        </button>
        <button
          className="btn-secondary"
          onClick={onRules}
          style={{ fontSize: '1rem', padding: '0.7rem 2rem' }}
        >
          📖 Rules
        </button>
        <button
          className="btn-secondary"
          onClick={onSettings}
          style={{ fontSize: '1rem', padding: '0.7rem 2rem' }}
        >
          ⚙ Settings
        </button>
      </div>
    </div>
  );
}
