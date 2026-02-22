import { writeFileSync } from 'fs';

const content = `import { useEffect, useRef, useState } from 'react';
import { ReplayFile } from '@lands/shared';
import { Field } from './Field';
import { Hand } from './Hand';
import { Graveyard } from './Graveyard';
import { DeckDisplay } from './DeckDisplay';

interface Props {
  replay: ReplayFile;
  onBack: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  playing_draw:      'Drawing...',
  playing_play:      'Play a land',
  counter_window:    'Counter window open...',
  counter_response:  'Counter-counter window open...',
  effect_red_pick:   'Red land effect',
  effect_green_pick: 'Green land effect',
  effect_blue_look:  'Blue land effect',
  effect_black_show: 'Black land effect',
  effect_black_pick: 'Black land effect',
  pre_target_red:    'Red - choosing target',
  pre_target_green:  'Green - choosing target',
  ended:             'Game over',
};

const SPEEDS = [0.5, 1, 2, 4] as const;
type Speed = typeof SPEEDS[number];

export function ReplayViewer({ replay, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [myIndex, setMyIndex] = useState<0 | 1>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = replay.snapshots.length;
  const snap = replay.snapshots[step];

  useEffect(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setStep(prev => {
        if (prev >= total - 1) { setPlaying(false); return prev; }
        return prev + 1;
      });
    }, 1000 / speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, total]);

  function goTo(n: number) { setStep(Math.max(0, Math.min(total - 1, n))); }

  const me = snap.players[myIndex];
  const opponent = snap.players[1 - myIndex as 0 | 1];
  const isMyTurn = snap.currentPlayerIndex === myIndex;
  const phaseLabel = PHASE_LABELS[snap.phase] ?? snap.phase;

  const activeBarStyle = (active: boolean, color: string): React.CSSProperties => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 8, padding: '0.4rem 1rem',
    fontSize: '0.85rem', flexShrink: 0,
    background: active ? \`rgba(\${color}, 0.1)\` : 'var(--surface)',
    border: active ? \`2px solid rgba(\${color}, 0.55)\` : '2px solid transparent',
    boxShadow: active ? \`0 0 12px rgba(\${color}, 0.2)\` : 'none',
    transition: 'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
  });

  return (
    <div className="flex flex-col h-screen p-3 gap-1.5">

      {/* Opponent info bar */}
      <div style={activeBarStyle(!isMyTurn, '241,196,15')}>
        <span className="font-semibold flex items-center gap-1.5">
          {!isMyTurn && (
            <span className="font-bold text-[0.8rem]" style={{ color: '#f1c40f', letterSpacing: '0.04em' }}>
              &gt; TURN
            </span>
          )}
          {opponent.name}
        </span>
        <span className="text-muted">Hand: {opponent.handCount}</span>
      </div>

      {/* Opponent hand */}
      <Hand
        cards={opponent.hand}
        hiddenCount={opponent.hand.length === 0 ? opponent.handCount : undefined}
        customizations={opponent.customizations}
        label={\`\${opponent.name}'s Hand\`}
      />

      {/* Opponent field + graveyard + deck */}
      <div className="flex gap-2 flex-1 min-h-0">
        <Field
          cards={opponent.field}
          customizations={opponent.customizations}
          label={\`\${opponent.name}'s Field\`}
        />
        <Graveyard
          cards={opponent.graveyard}
          customizations={opponent.customizations}
          label="Grave"
        />
        <div className="border border-border rounded-[10px] px-1.5 py-2 flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <DeckDisplay count={opponent.deckCount} />
          <span className="text-[0.6rem] text-muted uppercase" style={{ letterSpacing: '0.06em' }}>Deck</span>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-surface-2 rounded-lg px-4 py-1.5 flex justify-between items-center text-sm shrink-0">
        <span className="text-muted text-[0.8rem]">Turn {snap.turnNumber}</span>
        <span className="text-muted">{phaseLabel}</span>
        <span className="text-muted text-[0.8rem]">{step + 1} / {total}</span>
      </div>

      {/* My field + graveyard + deck */}
      <div className="flex gap-2 flex-1 min-h-0">
        <Field
          cards={me.field}
          customizations={me.customizations}
          label="Your Field"
        />
        <Graveyard
          cards={me.graveyard}
          customizations={me.customizations}
          label="Grave"
        />
        <div className="border border-border rounded-[10px] px-1.5 py-2 flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <DeckDisplay count={me.deckCount} />
          <span className="text-[0.6rem] text-muted uppercase" style={{ letterSpacing: '0.06em' }}>Deck</span>
        </div>
      </div>

      {/* My hand */}
      <Hand
        cards={me.hand}
        hiddenCount={me.hand.length === 0 ? me.handCount : undefined}
        customizations={me.customizations}
        label="Your Hand"
      />

      {/* My info bar */}
      <div style={activeBarStyle(isMyTurn, '39,174,96')}>
        <span className="font-semibold flex items-center gap-1.5">
          {isMyTurn && (
            <span className="font-bold text-[0.8rem]" style={{ color: '#27ae60', letterSpacing: '0.04em' }}>
              &gt; TURN
            </span>
          )}
          {me.name}
        </span>
        {snap.phase === 'ended' && snap.winner !== undefined && (
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
            {snap.winner === 'draw' ? 'Draw' : snap.players[snap.winner].name} wins!
          </span>
        )}
      </div>

      {/* Replay controls bar */}
      <div className="bg-surface rounded-[10px] px-3 py-2 flex items-center gap-2 shrink-0 flex-wrap"
        style={{ border: '1px solid var(--border)' }}>

        <button className="btn-secondary" onClick={onBack}
          style={{ fontSize: '0.78rem', padding: '0.25rem 0.7rem' }}>
          Back
        </button>

        <button className="btn-secondary" onClick={() => setMyIndex(i => (i === 0 ? 1 : 0))}
          style={{ fontSize: '0.78rem', padding: '0.25rem 0.7rem' }} title="Flip perspective">
          Flip
        </button>

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />

        <button className="btn-secondary" onClick={() => { setPlaying(false); goTo(0); }}
          style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }} title="Go to start">|&lt;</button>
        <button className="btn-secondary" onClick={() => { setPlaying(false); goTo(step - 1); }}
          style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }} title="Previous">&lt;</button>
        <button className="btn-primary" onClick={() => setPlaying(p => !p)}
          style={{ fontSize: '0.85rem', padding: '0.2rem 0.7rem', minWidth: '2.5rem' }}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="btn-secondary" onClick={() => { setPlaying(false); goTo(step + 1); }}
          style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }} title="Next">&gt;</button>
        <button className="btn-secondary" onClick={() => { setPlaying(false); goTo(total - 1); }}
          style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }} title="Go to end">&gt;|</button>

        <input type="range" min={0} max={total - 1} value={step}
          onChange={e => { setPlaying(false); goTo(Number(e.target.value)); }}
          style={{ flex: 1, minWidth: '60px', cursor: 'pointer' }}
        />

        <div className="flex gap-1">
          {SPEEDS.map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: '0.15rem 0.45rem', fontSize: '0.72rem', cursor: 'pointer',
              borderRadius: 4, border: '1px solid var(--border)',
              background: speed === s ? 'var(--accent)' : 'var(--surface)',
              color: speed === s ? '#fff' : 'var(--text-muted)',
            }}>
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Pending play indicator */}
      {snap.pendingPlay && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 bg-surface-2 border border-border rounded-lg px-4 py-1.5 text-sm text-muted pointer-events-none z-50">
          {snap.players[snap.currentPlayerIndex].name} played a {snap.pendingPlay.color} land
        </div>
      )}
    </div>
  );
}
`;

writeFileSync(
  'c:/randomApps/Lands/client/src/components/ReplayViewer.tsx',
  content,
  'utf8'
);
console.log('Written successfully');
