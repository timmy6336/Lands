// Mode selection screen: choose between Single Player (vs AI) or Multiplayer.
// Includes an inline name field that persists to localStorage.
import { useRef } from 'react';

interface Props {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
  onBack: () => void;
  playerName: string;
  setPlayerName: (name: string) => void;
}

export function PlayMenu({ onSinglePlayer, onMultiplayer, onBack, playerName, setPlayerName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleNameBlur(value: string) {
    const trimmed = value.trim() || 'Player';
    setPlayerName(trimmed);
    localStorage.setItem('playerName', trimmed);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h2 className="text-accent mb-1 m-0">Play</h2>
        <p className="text-muted text-sm m-0">Play solo or challenge someone online</p>
      </div>

      {/* Name input */}
      <div style={{ width: '100%', maxWidth: 280 }}>
        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted2)', marginBottom: 6 }}>
          Your Name
        </label>
        <input
          ref={inputRef}
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          onBlur={e => handleNameBlur(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); }}
          placeholder="Player"
          maxLength={20}
          style={{
            width: '100%', fontSize: '1rem', padding: '0.55rem 0.85rem',
            borderRadius: 9, background: 'var(--surface2)',
            border: '1px solid var(--border2)', color: 'var(--foreground)',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        />
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

