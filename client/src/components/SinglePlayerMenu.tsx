// Single-player configuration screen: choose AI difficulty, counter time limit, and who goes first.
import { useState } from 'react';
import { AIDifficulty, GameSettings } from '@lands/shared';

interface Props {
  onStart: (difficulty: AIDifficulty, settings: GameSettings, goFirst: boolean) => void;
  onBack: () => void;
}

const DIFFICULTIES: { id: AIDifficulty; label: string; desc: string; color: string }[] = [
  { id: 'easy',   label: 'Sapling',   desc: 'Mostly random play. Good for learning the game.',                                                    color: '#27ae60' },
  { id: 'medium', label: 'Ironbark',  desc: 'Tracks win conditions, plays strategically, counters meaningful threats.',                           color: '#e67e22' },
  { id: 'hard',   label: 'Dreadroot', desc: 'Fully strategic. Saves blues for counter wars, targets your win path, and remembers revealed cards.', color: '#e74c3c' },
];

export function SinglePlayerMenu({ onStart, onBack }: Props) {
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(15);
  const [goFirst, setGoFirst] = useState(true);

  const settings: GameSettings = { counterTimeLimitSeconds: timerSeconds, isSinglePlayer: true };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    background:   active ? 'var(--accent)' : 'var(--surface)',
    border:       active ? '2px solid var(--accent)' : '2px solid var(--border)',
    borderRadius: 8, padding: '0.45rem 0',
    color:        active ? '#fff' : 'var(--muted)',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    transition: 'all 0.15s ease',
  });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center">
        <h2 className="text-accent mb-1">Single Player</h2>
        <p className="text-muted text-sm">Choose your opponent</p>
      </div>

      {/* Difficulty */}
      <div className="flex flex-col gap-2 min-w-[280px]">
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            onClick={() => setDifficulty(d.id)}
            style={{
              background:   difficulty === d.id ? `rgba(${hexToRgb(d.color)}, 0.15)` : 'var(--surface)',
              border:       difficulty === d.id ? `2px solid ${d.color}` : '2px solid var(--border)',
              borderRadius: 10, padding: '0.75rem 1rem',
              textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            <div style={{ fontWeight: 700, color: difficulty === d.id ? d.color : 'var(--text)', fontSize: '1rem' }}>
              {d.label}
            </div>
            <div className="text-muted text-xs mt-0.5">{d.desc}</div>
          </button>
        ))}
      </div>

      {/* Turn order */}
      <div className="flex flex-col gap-1.5 min-w-[280px]">
        <label className="text-muted text-xs uppercase tracking-wider">Turn Order</label>
        <div className="flex gap-2">
          <button onClick={() => setGoFirst(true)}  style={toggleStyle(goFirst)}>I go first</button>
          <button onClick={() => setGoFirst(false)} style={toggleStyle(!goFirst)}>I go second</button>
        </div>
      </div>

      {/* Counter timer */}
      <div className="flex flex-col gap-1.5 min-w-[280px]">
        <label className="text-muted text-xs uppercase tracking-wider">Counter Timer</label>
        <div className="flex gap-2">
          {([10, 15, 30, null] as (number | null)[]).map(v => (
            <button key={String(v)} onClick={() => setTimerSeconds(v)} style={toggleStyle(timerSeconds === v)}>
              {v === null ? '∞' : `${v}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 min-w-[280px]">
        <button className="btn-primary text-lg py-3 px-8" onClick={() => onStart(difficulty, settings, goFirst)}>
          Start Game
        </button>
        <button className="btn-secondary" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
