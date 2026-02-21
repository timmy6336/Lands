interface Props {
  onHost: () => void;
  onJoin: () => void;
  onBack: () => void;
}

export function PlayMenu({ onHost, onJoin, onBack }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '2rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent)', marginBottom: '0.3rem' }}>Play</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Host a game or join a friend's game
        </p>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 260,
      }}>
        <button
          className="btn-primary"
          onClick={onHost}
          style={{ fontSize: '1.05rem', padding: '0.8rem 2rem', textAlign: 'left' }}
        >
          🖥 Host Game
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Start a server and invite a friend
          </span>
        </button>

        <button
          className="btn-secondary"
          onClick={onJoin}
          style={{ fontSize: '1.05rem', padding: '0.8rem 2rem', textAlign: 'left' }}
        >
          🔗 Join Game
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            Connect to a friend's hosted game
          </span>
        </button>
      </div>

      <button
        className="btn-secondary"
        onClick={onBack}
        style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}
      >
        ← Back
      </button>
    </div>
  );
}
