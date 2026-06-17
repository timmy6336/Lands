import { useEffect, useState, useMemo } from 'react';
import { GameState } from '@lands/shared';

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
}

export function EffectAnimation({ gameState }: Props) {
  const [activeEffect, setActiveEffect] = useState<string | null>(null);

  useEffect(() => {
    const r = gameState.effectResult;
    if (!r) return;
    setActiveEffect(r.type);
    const t = setTimeout(() => setActiveEffect(null), 1500);
    return () => clearTimeout(t);
  }, [gameState.effectResult]);

  const fireParticles = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        left: 35 + Math.random() * 30,
        delay: Math.random() * 0.4,
        size: 20 + Math.random() * 16,
      })),
    [],
  );

  const greenSparkles = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        left: 40 + Math.random() * 20,
        bottom: 10 + Math.random() * 30,
        delay: Math.random() * 0.5,
        drift: -20 + Math.random() * 40,
      })),
    [],
  );

  if (!activeEffect) return null;

  if (activeEffect === 'blue' || activeEffect === 'black') return null;

  if (activeEffect === 'red') {
    return (
      <div className="effect-overlay">
        <div className="effect-fire-glow" />
        {fireParticles.map((p, i) => (
          <div
            key={i}
            className="effect-fire-particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </div>
    );
  }

  if (activeEffect === 'green') {
    return (
      <div className="effect-overlay">
        <div className="effect-green-card" />
        {greenSparkles.map((s, i) => (
          <div
            key={i}
            className="effect-green-sparkle"
            style={{
              left: `${s.left}%`,
              bottom: `${s.bottom}%`,
              animationDelay: `${s.delay}s`,
              '--drift': `${s.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }

  if (activeEffect === 'white') {
    return (
      <div className="effect-overlay">
        <div className="effect-white-shimmer" />
        <div className="effect-white-card" />
      </div>
    );
  }

  return null;
}
