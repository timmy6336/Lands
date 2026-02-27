// ─────────────────────────────────────────────────────────────────────────────
// GameEndAnimation.tsx
//
// Full-screen animated overlay that plays for ~2800ms on game end,
// then calls onDone to reveal the GameOver screen.
// All animation is driven by CSS keyframes — no extra deps needed.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo } from 'react';
import { GameState } from '@lands/shared';

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onDone: () => void;
}

const ANIM_DURATION = 2800;

interface Particle {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  isCircle: boolean;
}

export function GameEndAnimation({ gameState, myIndex, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, ANIM_DURATION);
    return () => clearTimeout(t);
  }, [onDone]);

  const isDraw = gameState.winner === 'draw';
  const iWon = !isDraw && gameState.winner === myIndex;

  const particles = useMemo<Particle[]>(() => {
    const colors = iWon
      ? ['#f1c40f', '#f39c12', '#ffeaa7', '#fdcb6e', '#e17055', '#ffffff', '#f8d030']
      : isDraw
      ? ['#a29bfe', '#6c5ce7', '#fd79a8', '#fdcb6e', '#74b9ff', '#dfe6e9']
      : ['#c0392b', '#e74c3c', '#922b21', '#b03a2e', '#7f8c8d', '#636e72'];
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 7 + Math.random() * 12,
      delay: Math.random() * 1.4,
      duration: 1.4 + Math.random() * 1.0,
      color: colors[Math.floor(Math.random() * colors.length)],
      isCircle: Math.random() > 0.5,
    }));
  }, [iWon, isDraw]);

  const bgColor = iWon
    ? 'rgba(20, 14, 0, 0.93)'
    : isDraw
    ? 'rgba(10, 5, 22, 0.93)'
    : 'rgba(5, 0, 0, 0.95)';

  const textColor = iWon ? '#f1c40f' : isDraw ? '#a29bfe' : '#e74c3c';
  const glowColor = iWon ? '#f1c40f80' : isDraw ? '#a29bfe80' : '#e74c3c80';
  const emoji = iWon ? '🏆' : isDraw ? '🤝' : '💀';
  const headline = iWon ? 'VICTORY!' : isDraw ? 'DRAW!' : 'DEFEAT';
  const subtitle = iWon
    ? `You defeated ${gameState.players[1 - myIndex].name}`
    : isDraw
    ? 'Neither side claims victory'
    : `${(gameState.winner !== 'draw' && gameState.winner !== undefined ? gameState.players[gameState.winner].name : 'Opponent')} wins`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        overflow: 'hidden',
        animation: `geOverlay ${ANIM_DURATION}ms ease forwards`,
      }}
    >
      <style>{`
        @keyframes geOverlay {
          0%   { opacity: 0; }
          8%   { opacity: 1; }
          78%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes geHeadline {
          0%   { transform: translateY(-140px) scale(0.55); opacity: 0; }
          42%  { transform: translateY(10px) scale(1.10); opacity: 1; }
          56%  { transform: translateY(-5px) scale(0.97); }
          68%  { transform: translateY(3px) scale(1.02); }
          78%  { transform: translateY(0) scale(1); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes geEmoji {
          0%   { transform: scale(0) rotate(-25deg); opacity: 0; }
          52%  { transform: scale(1.35) rotate(10deg); opacity: 1; }
          70%  { transform: scale(0.88) rotate(-4deg); }
          84%  { transform: scale(1.06) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes geSubtitle {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes geParticle {
          0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(108vh) rotate(700deg); opacity: 0; }
        }
        @keyframes geGlow {
          0%, 100% { filter: drop-shadow(0 0 16px var(--ge-glow)); }
          50%       { filter: drop-shadow(0 0 42px var(--ge-glow)) drop-shadow(0 0 80px var(--ge-glow)); }
        }
        @keyframes geShockwave {
          0%   { transform: scale(0); opacity: 0.7; }
          100% { transform: scale(6); opacity: 0; }
        }
      `}</style>

      {/* Shockwave ring */}
      <div style={{
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: '50%',
        border: `3px solid ${textColor}`,
        animation: 'geShockwave 0.7s 0.18s ease-out both',
        pointerEvents: 'none',
      }} />

      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.isCircle ? p.size : p.size * 0.65,
            borderRadius: p.isCircle ? '50%' : '2px',
            background: p.color,
            opacity: 0,
            animation: `geParticle ${p.duration}s ${p.delay}s ease-in both`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Emoji */}
      <div style={{
        fontSize: '5.5rem',
        lineHeight: 1,
        animation: 'geEmoji 0.75s 0.12s cubic-bezier(0.34,1.56,0.64,1) both',
        marginBottom: '1rem',
      }}>
        {emoji}
      </div>

      {/* Headline */}
      <h1 style={{
        margin: 0,
        fontSize: 'clamp(2.8rem, 9vw, 5.5rem)',
        fontWeight: 900,
        letterSpacing: '0.14em',
        color: textColor,
        ['--ge-glow' as string]: glowColor,
        animation: `geHeadline 0.9s 0.18s cubic-bezier(0.22,1,0.36,1) both, geGlow 1.4s 1s ease-in-out infinite`,
      }}>
        {headline}
      </h1>

      {/* Subtitle */}
      <p style={{
        margin: '1rem 0 0',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '1rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        animation: 'geSubtitle 0.5s 0.9s ease both',
        opacity: 0,
      }}>
        {subtitle}
      </p>
    </div>
  );
}
