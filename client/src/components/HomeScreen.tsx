interface Props {
  onPlay: () => void;
  onSettings: () => void;
  onRules: () => void;
  onReplays: () => void;
}

export function HomeScreen({ onPlay, onSettings, onRules, onReplays }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <div className="text-center">
        <h1 className="text-accent m-0" style={{
          fontSize: '4rem', fontWeight: 900, letterSpacing: '0.15em',
          textShadow: '0 0 40px rgba(99,102,241,0.5)',
        }}>
          LANDS
        </h1>
        <p className="text-muted text-base mt-1.5 m-0">A 2-player land card duel</p>
      </div>

      <div className="flex flex-col gap-3.5 min-w-[200px]">
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
          onClick={onReplays}
          style={{ fontSize: '1rem', padding: '0.7rem 2rem' }}
        >
          ▷ Replays
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
