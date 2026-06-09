// Single-player config screen — mobile-first layout.
import { useState } from 'react';
import { AIDifficulty, GameSettings } from '@lands/shared';

interface Props {
  onStart: (difficulty: AIDifficulty, settings: GameSettings, goFirst: boolean) => void;
  onBack: () => void;
}

const DIFFICULTIES: { id: AIDifficulty; label: string; desc: string; color: string }[] = [
  { id: 'easy',   label: 'Sapling',   desc: 'Mostly random play. Good for learning.',              color: '#27ae60' },
  { id: 'medium', label: 'Ironbark',  desc: 'Tracks win conditions and counters key threats.',      color: '#e67e22' },
  { id: 'hard',   label: 'Dreadroot', desc: 'Fully strategic. Saves blues, targets your win path.', color: '#e74c3c' },
];

export function SinglePlayerMenu({ onStart, onBack }: Props) {
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(15);
  const [goFirst, setGoFirst] = useState(true);

  const settings: GameSettings = { counterTimeLimitSeconds: timerSeconds, isSinglePlayer: true };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    background:   active ? 'var(--accent)' : 'var(--surface)',
    border:       active ? '2px solid var(--accent)' : '2px solid var(--border)',
    borderRadius: 10, padding: '0.55rem 0',
    color:        active ? '#fff' : 'var(--muted)',
    fontSize: '0.9rem', fontWeight: 600,
    minHeight: 44,
    transition: 'all 0.15s',
  });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
    }}>

      {/* Sticky header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        padding: '0.65rem 1.25rem',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0.65rem)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          className="btn-secondary"
          onClick={onBack}
          style={{ padding: '0.4rem 1rem', minHeight: 44, fontSize: '0.9rem' }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.2rem' }}>Single Player</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>Choose your opponent</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '1rem 1.25rem',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* Difficulty */}
        <section>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Difficulty
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                style={{
                  background:   difficulty === d.id ? `rgba(${hexToRgb(d.color)}, 0.15)` : 'var(--surface)',
                  border:       difficulty === d.id ? `2px solid ${d.color}` : '2px solid var(--border)',
                  borderRadius: 12, padding: '0.85rem 1rem',
                  textAlign: 'left', minHeight: 64,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 700, color: difficulty === d.id ? d.color : 'var(--text)', fontSize: '1rem' }}>
                  {d.label}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 2 }}>{d.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Turn order */}
        <section>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Turn Order
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setGoFirst(true)}  style={pillStyle(goFirst)}>I go first</button>
            <button onClick={() => setGoFirst(false)} style={pillStyle(!goFirst)}>I go second</button>
          </div>
        </section>

        {/* Counter timer */}
        <section>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Counter Timer
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([10, 15, 30, null] as (number | null)[]).map(v => (
              <button key={String(v)} onClick={() => setTimerSeconds(v)} style={pillStyle(timerSeconds === v)}>
                {v === null ? '∞' : `${v}s`}
              </button>
            ))}
          </div>
        </section>

      </div>

      {/* Sticky bottom action bar */}
      <div style={{
        flexShrink: 0, padding: '0.75rem 1.25rem',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button
          className="btn-primary"
          style={{ fontSize: '1.05rem', minHeight: 54, borderRadius: 12 }}
          onClick={() => onStart(difficulty, settings, goFirst)}
        >
          Start Game
        </button>
      </div>

    </div>
  );
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
