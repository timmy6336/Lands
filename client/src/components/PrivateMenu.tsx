interface Props {
  onHost: () => void;
  onJoin: () => void;
  onBack: () => void;
}

export function PrivateMenu({ onHost, onJoin, onBack }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h2 className="text-accent mb-1 m-0">Private Room</h2>
        <p className="text-muted text-sm m-0">Create a room or join one with a code</p>
      </div>
      <div className="flex flex-col gap-3.5 min-w-[280px]">
        <button
          className="btn-primary text-left"
          onClick={onHost}
          style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
        >
          🖥 Host a Game
          <span className="block text-[0.75rem] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Get a room code to share with your friend
          </span>
        </button>
        <button
          className="btn-secondary text-left"
          onClick={onJoin}
          style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
        >
          🔗 Join a Game
          <span className="block text-[0.75rem] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Enter the code your friend gave you
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
