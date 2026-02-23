// Mode selection screen: choose between Single Player (vs AI) or Multiplayer.
interface Props {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
  onBack: () => void;
}

export function PlayMenu({ onSinglePlayer, onMultiplayer, onBack }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h2 className="text-accent mb-1 m-0">Play</h2>
        <p className="text-muted text-sm m-0">Play solo or challenge someone online</p>
      </div>

      <div className="flex flex-col gap-3.5 min-w-[280px]">
        <button
          className="btn-primary text-left"
          onClick={onSinglePlayer}
          style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
        >
          🌱 Single Player
          <span className="block text-[0.75rem] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Play against AI — Easy, Medium, or Hard
          </span>
        </button>

        <button
          className="btn-secondary text-left"
          onClick={onMultiplayer}
          style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
        >
          🌐 Multiplayer
          <span className="block text-[0.75rem] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Private room or matchmaking — play against anyone
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
