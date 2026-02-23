// Multiplayer mode selector: Private Room (host/join) vs Matchmaking.
interface Props {
  onPrivate: () => void;
  onMatchmaking: () => void;
  onBack: () => void;
}

export function MultiplayerMenu({ onPrivate, onMatchmaking, onBack }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h2 className="text-accent mb-1 m-0">Multiplayer</h2>
        <p className="text-muted text-sm m-0">Play against a friend or a random opponent</p>
      </div>

      <div className="flex flex-col gap-3.5 min-w-[280px]">
        <button
          className="btn-primary text-left"
          onClick={onPrivate}
          style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
        >
          🔐 Private Room
          <span className="block text-[0.75rem] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Host or join a game with a room code
          </span>
        </button>

        <button
          className="btn-secondary text-left"
          onClick={onMatchmaking}
          style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
        >
          🔍 Matchmaking
          <span className="block text-[0.75rem] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Get matched with another player automatically
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
