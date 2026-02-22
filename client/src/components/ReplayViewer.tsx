import { useEffect, useRef, useState } from 'react';
import { GameState, ReplayFile } from '@lands/shared';
import { Card } from './Card';

interface Props {
  replay: ReplayFile;
  onBack: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  playing_draw:      'Draw',
  playing_play:      'Play',
  counter_window:    'Counter Opportunity',
  counter_response:  'Counter-Counter',
  effect_red_pick:   'Red Effect',
  effect_green_pick: 'Green Effect',
  effect_black_show: 'Black Effect (show)',
  effect_black_pick: 'Black Effect (discard)',
  effect_blue_look:  'Blue Effect',
  pre_target_red:    'Red — Choose Target',
  pre_target_green:  'Green — Choose Target',
  ended:             'Game Over',
};

const SPEEDS = [0.5, 1, 2, 4] as const;
type Speed = typeof SPEEDS[number];

export function ReplayViewer({ replay, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = replay.snapshots.length;
  const snap: GameState = replay.snapshots[step];

  // Auto-play interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      setStep(prev => {
        if (prev >= total - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / speed);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, total]);

  function goTo(n: number) {
    setStep(Math.max(0, Math.min(total - 1, n)));
  }

  const [p0, p1] = snap.players;
  const activeIndex = snap.currentPlayerIndex;

  const winnerLabel = replay.winner === 'draw'
    ? 'Draw'
    : replay.winner !== null
    ? replay.playerNames[replay.winner]
    : '—';

  const modeTag = replay.mode === 'single-player' ? 'vs AI' : 'Multiplayer';
  const dateStr = new Date(replay.date).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const phaseLabel = PHASE_LABELS[snap.phase] ?? snap.phase;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.75rem 1.2rem', borderBottom: '1px solid var(--border)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
          ← Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>
            {replay.playerNames[0]} <span style={{ color: 'var(--text-muted)' }}>vs</span> {replay.playerNames[1]}
          </span>
          <span className="text-muted" style={{ fontSize: '0.78rem', marginLeft: '0.75rem' }}>
            {dateStr} · {modeTag}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Winner: <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{winnerLabel}</span>
          {replay.winReason && (
            <span style={{ marginLeft: '0.5rem', fontStyle: 'italic', fontSize: '0.78rem' }}>
              ({replay.winReason})
            </span>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.6rem 1.2rem', borderBottom: '1px solid var(--border)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Prev/Next buttons */}
        <button className="btn-secondary" onClick={() => { setPlaying(false); goTo(0); }}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} title="Go to start">⏮</button>
        <button className="btn-secondary" onClick={() => { setPlaying(false); goTo(step - 1); }}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} title="Previous step">◀</button>
        <button
          className="btn-primary"
          onClick={() => setPlaying(p => !p)}
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', minWidth: '3rem' }}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button className="btn-secondary" onClick={() => { setPlaying(false); goTo(step + 1); }}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} title="Next step">▶</button>
        <button className="btn-secondary" onClick={() => { setPlaying(false); goTo(total - 1); }}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} title="Go to end">⏭</button>

        {/* Slider */}
        <input
          type="range" min={0} max={total - 1} value={step}
          onChange={e => { setPlaying(false); goTo(Number(e.target.value)); }}
          style={{ flex: 1, minWidth: '80px', maxWidth: '260px', cursor: 'pointer' }}
        />
        <span className="text-muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          {step + 1} / {total}
        </span>

        {/* Speed */}
        <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.5rem' }}>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer',
                borderRadius: '4px', border: '1px solid var(--border)',
                background: speed === s ? 'var(--accent)' : 'var(--surface)',
                color: speed === s ? '#fff' : 'var(--text-muted)',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* ── Phase / Turn bar ── */}
      <div style={{
        display: 'flex', gap: '1.5rem', alignItems: 'center',
        padding: '0.4rem 1.2rem', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', fontSize: '0.82rem', flexShrink: 0,
      }}>
        <span>
          <span className="text-muted">Turn </span>
          <span style={{ fontWeight: 600 }}>{snap.turnNumber}</span>
        </span>
        <span>
          <span className="text-muted">Phase: </span>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{phaseLabel}</span>
        </span>
        <span>
          <span className="text-muted">Active: </span>
          <span style={{ fontWeight: 600 }}>{snap.players[activeIndex].name}</span>
        </span>
        {snap.pendingPlay && (
          <span>
            <span className="text-muted">Pending: </span>
            <span style={{ fontWeight: 600, color: `var(--${snap.pendingPlay.color}-land)` }}>
              {snap.pendingPlay.color}
            </span>
          </span>
        )}
        {snap.phase === 'ended' && snap.winner !== undefined && (
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
            🏆 {snap.winner === 'draw' ? 'Draw' : snap.players[snap.winner].name} wins!
          </span>
        )}
      </div>

      {/* ── Board ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Player 1 (top) */}
        <PlayerPane
          player={p1}
          label={p1.name}
          isActive={activeIndex === 1}
          flipped
        />

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '0 0' }} />

        {/* Player 0 (bottom) */}
        <PlayerPane
          player={p0}
          label={p0.name}
          isActive={activeIndex === 0}
        />
      </div>
    </div>
  );
}

// ── PlayerPane ────────────────────────────────────────────────────────────────

interface PaneProps {
  player: GameState['players'][0];
  label: string;
  isActive: boolean;
  flipped?: boolean;
}

function PlayerPane({ player, label, isActive, flipped }: PaneProps) {
  const sections = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {/* Hand */}
      <CardRow
        label={`Hand (${player.hand.length})`}
        cards={player.hand}
        customizations={player.customizations}
        emptyText="Empty hand"
      />
      {/* Field */}
      <CardRow
        label={`Field (${player.field.length})`}
        cards={player.field}
        customizations={player.customizations}
        emptyText="No cards on field"
        highlight
      />
      {/* Graveyard */}
      <CardRow
        label={`Graveyard (${player.graveyard.length})`}
        cards={player.graveyard}
        customizations={player.customizations}
        emptyText="Empty"
      />
    </div>
  );

  return (
    <div style={{
      borderRadius: '8px', padding: '0.6rem 0.8rem',
      background: isActive ? 'rgba(99,102,241,0.07)' : 'transparent',
      border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
        {isActive && <span style={{ fontSize: '0.72rem', background: 'var(--accent)', color: '#fff', borderRadius: '4px', padding: '1px 6px' }}>Active</span>}
        <span className="text-muted" style={{ fontSize: '0.78rem', marginLeft: 'auto' }}>Deck: {player.deckCount}</span>
      </div>
      {flipped ? (
        <div style={{ transform: 'scaleY(-1)' }}>
          <div style={{ transform: 'scaleY(-1)' }}>{sections}</div>
        </div>
      ) : sections}
    </div>
  );
}

// ── CardRow ───────────────────────────────────────────────────────────────────

interface CardRowProps {
  label: string;
  cards: GameState['players'][0]['hand'];
  customizations: GameState['players'][0]['customizations'];
  emptyText: string;
  highlight?: boolean;
}

function CardRow({ label, cards, customizations, emptyText, highlight }: CardRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
      <span style={{
        fontSize: '0.72rem', whiteSpace: 'nowrap',
        minWidth: '90px', paddingTop: '2px',
        fontWeight: highlight ? 600 : undefined,
        color: highlight ? 'var(--text)' : 'var(--text-muted)',
      }}>
        {label}
      </span>
      {cards.length === 0 ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: '2px' }}>
          {emptyText}
        </span>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {cards.map(c => (
            <Card key={c.id} card={c} customizations={customizations} small noAnimate />
          ))}
        </div>
      )}
    </div>
  );
}
