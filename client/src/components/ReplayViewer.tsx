import { useEffect, useRef, useState } from 'react';
import { ReplayFile } from '@lands/shared';
import { Field } from './Field';
import { Hand } from './Hand';
import { Graveyard } from './Graveyard';

interface Props {
  replay: ReplayFile;
  onBack: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  playing_draw:      'Drawing…',
  playing_play:      'Play a land',
  counter_window:    'Counter window…',
  counter_response:  'Counter-counter…',
  effect_red_pick:   'Red effect: destroy',
  effect_green_pick: 'Green effect: retrieve',
  effect_blue_look:  'Blue effect: peek',
  effect_black_show: 'Black effect: discard',
  effect_black_pick: 'Black effect: choose',
  pre_target_red:    'Red: picking target',
  pre_target_green:  'Green: picking target',
  ended:             'Game over',
};

const SPEEDS = [0.5, 1, 2, 4] as const;
type Speed = typeof SPEEDS[number];

export function ReplayViewer({ replay, onBack }: Props) {
  const [step, setStep]       = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]     = useState<Speed>(1);
  const [myIndex, setMyIndex] = useState<0 | 1>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = replay.snapshots.length;
  const snap  = replay.snapshots[step];

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

  const me       = snap.players[myIndex];
  const opponent = snap.players[1 - myIndex as 0 | 1];
  const isMyTurn = snap.currentPlayerIndex === myIndex;
  const phaseLabel = PHASE_LABELS[snap.phase] ?? snap.phase;

  return (
    <div className="game-root flex flex-col" style={{ height: '100dvh' }}>

      {/* 1. Opponent strip — identical to in-game */}
      <div style={{
        height: 50, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px',
        background: !isMyTurn ? 'rgba(241,196,15,0.09)' : 'var(--surface)',
        border: !isMyTurn ? '1.5px solid rgba(241,196,15,0.4)' : '1.5px solid transparent',
        borderRadius: 10,
        transition: 'background 0.3s, border-color 0.3s',
        overflow: 'hidden',
      }}>
        {!isMyTurn && (
          <span style={{ color: '#f1c40f', fontSize: '0.85rem', fontWeight: 800, flexShrink: 0 }}>▶</span>
        )}
        <span style={{ fontWeight: 700, fontSize: '0.82rem', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)', flexShrink: 0 }}>
          {opponent.name}
        </span>
        {/* deck count */}
        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '1px 6px', fontWeight: 700, flexShrink: 0, color: 'var(--text)', whiteSpace: 'nowrap' }}>
          🃏 {opponent.deckCount}
        </span>
        {/* opponent graveyard */}
        <Graveyard cards={opponent.graveyard} customizations={opponent.customizations} label="Opp" />
        {/* opponent compact field */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Field
            cards={opponent.field}
            customizations={opponent.customizations}
            label={`${opponent.name}'s field`}
            size="compact"
          />
        </div>
      </div>

      {/* 2. Opponent hand — visible in replay (fixed height row) */}
      <Hand
        cards={opponent.hand}
        customizations={opponent.customizations}
        label={`${opponent.name}'s hand`}
        paneClass="hand-pane-fixed"
      />

      {/* 3. Status bar — identical to in-game + step counter */}
      <div style={{
        height: 34, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 8px',
        background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>
          Turn {snap.turnNumber}
        </span>
        <span style={{ color: 'var(--border)', fontSize: '0.8rem' }}>·</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {snap.phase === 'ended' && snap.winner !== undefined
            ? snap.winner === 'draw'
              ? 'Draw!'
              : `${snap.players[snap.winner as 0 | 1].name} wins!`
            : phaseLabel}
        </span>
        <span style={{ color: 'var(--border)', fontSize: '0.8rem' }}>·</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>
          {step + 1}/{total}
        </span>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
          background: isMyTurn ? '#27ae60' : '#f1c40f',
          boxShadow: isMyTurn ? '0 0 6px rgba(39,174,96,0.8)' : '0 0 6px rgba(241,196,15,0.8)',
        }} />
      </div>

      {/* 4. My field row — identical to in-game */}
      <div style={{
        height: 84, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 2, flexShrink: 0, minWidth: 36,
          background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '4px 6px',
        }}>
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🃏</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{me.deckCount}</span>
        </div>
        <div style={{
          flexShrink: 0,
          background: me.graveyard.length > 0 ? 'rgba(192,57,43,0.18)' : 'rgba(255,255,255,0.04)',
          border: me.graveyard.length > 0 ? '1.5px solid rgba(192,57,43,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          transition: 'background 0.2s, border-color 0.2s',
        }}>
          <Graveyard cards={me.graveyard} customizations={me.customizations} label="My" />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Field cards={me.field} customizations={me.customizations} label="Your field" size="normal" />
        </div>
      </div>

      {/* 5. My hand — identical to in-game (large cards) */}
      <Hand
        cards={me.hand}
        customizations={me.customizations}
        label="Your hand"
        cardSize="large"
      />

      {/* 6. Replay controls — replaces the bottom action bar */}
      <div style={{
        flexShrink: 0,
        background: isMyTurn ? 'rgba(39,174,96,0.1)' : 'var(--surface)',
        border: isMyTurn ? '1.5px solid rgba(39,174,96,0.4)' : '1.5px solid transparent',
        borderRadius: 10,
        transition: 'background 0.3s, border-color 0.3s',
        padding: '4px 6px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {/* Row 1: Back, Flip, nav buttons, step */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={onBack}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: '0.78rem', padding: '0.2rem 0.55rem', minHeight: 34, fontWeight: 600 }}
          >← Back</button>
          <button
            onClick={() => setMyIndex(i => i === 0 ? 1 : 0)}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: '0.78rem', padding: '0.2rem 0.55rem', minHeight: 34, fontWeight: 600 }}
            title="Flip perspective"
          >⇄ Flip</button>
          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
          <button onClick={() => { setPlaying(false); goTo(0); }}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)', fontSize: '0.82rem', padding: '0.15rem 0.45rem', minHeight: 34 }}>|◀</button>
          <button onClick={() => { setPlaying(false); goTo(step - 1); }}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)', fontSize: '0.82rem', padding: '0.15rem 0.45rem', minHeight: 34 }}>◀</button>
          <button
            onClick={() => setPlaying(p => !p)}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.82rem', padding: '0.15rem 0.7rem', minHeight: 34, minWidth: 52, fontWeight: 700 }}
          >{playing ? '⏸' : '▶'}</button>
          <button onClick={() => { setPlaying(false); goTo(step + 1); }}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)', fontSize: '0.82rem', padding: '0.15rem 0.45rem', minHeight: 34 }}>▶|</button>
          <button onClick={() => { setPlaying(false); goTo(total - 1); }}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)', fontSize: '0.82rem', padding: '0.15rem 0.45rem', minHeight: 34 }}>▶|</button>
          <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
            {step + 1} / {total}
          </span>
        </div>
        {/* Row 2: speed + scrubber */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
            {SPEEDS.map(s => (
              <button key={s} onClick={() => setSpeed(s)} style={{
                padding: '0.1rem 0.4rem', fontSize: '0.7rem', minHeight: 28,
                borderRadius: 5, border: '1px solid var(--border)',
                background: speed === s ? 'var(--accent)' : 'var(--surface2)',
                color: speed === s ? '#fff' : 'var(--muted)',
                fontWeight: speed === s ? 700 : 400,
              }}>{s}x</button>
            ))}
          </div>
          <input
            type="range" min={0} max={total - 1} value={step}
            onChange={e => { setPlaying(false); goTo(Number(e.target.value)); }}
            style={{ flex: 1, cursor: 'pointer', minWidth: 60 }}
          />
        </div>
      </div>

      {/* Pending play toast */}
      {snap.pendingPlay && (
        <div style={{
          position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '0.35rem 1rem',
          fontSize: '0.8rem', color: 'var(--muted)',
          pointerEvents: 'none', zIndex: 50, whiteSpace: 'nowrap',
        }}>
          {snap.players[snap.currentPlayerIndex].name} played a {snap.pendingPlay.color} land
        </div>
      )}
    </div>
  );
}
