import { useEffect, useState, useMemo, useRef } from 'react';
import { GameState, Color } from '@lands/shared';

const LAND_HEX: Record<Color, string> = {
  white: '#f0ead6',
  red:   '#e74c3c',
  blue:  '#3498db',
  green: '#2ecc71',
  black: '#887799',
};

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
}

export function EffectAnimation({ gameState }: Props) {
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const [effectColor, setEffectColor] = useState<Color | null>(null);
  const [playAnim, setPlayAnim] = useState<Color | null>(null);
  const [counterAnim, setCounterAnim] = useState<'counter' | 'counter_counter' | null>(null);

  const prevPendingRef = useRef<string | undefined>();
  const prevChainLenRef = useRef(0);

  useEffect(() => {
    const r = gameState.effectResult;
    if (!r) return;
    setActiveEffect(r.type);
    setEffectColor('cardColor' in r ? r.cardColor : null);
    const t = setTimeout(() => { setActiveEffect(null); setEffectColor(null); }, 1500);
    return () => clearTimeout(t);
  }, [gameState.effectResult]);

  useEffect(() => {
    const newId = gameState.pendingPlay?.id;
    if (newId && newId !== prevPendingRef.current) {
      setPlayAnim(gameState.pendingPlay!.color);
      const t = setTimeout(() => setPlayAnim(null), 900);
      prevPendingRef.current = newId;
      return () => clearTimeout(t);
    }
    prevPendingRef.current = newId;
  }, [gameState.pendingPlay?.id, gameState.pendingPlay?.color]);

  useEffect(() => {
    const len = gameState.counterChain.length;
    if (len > prevChainLenRef.current && len >= 2) {
      const last = gameState.counterChain[len - 1];
      setCounterAnim(last.type === 'counter_counter' ? 'counter_counter' : 'counter');
      const t = setTimeout(() => setCounterAnim(null), 1000);
      prevChainLenRef.current = len;
      return () => clearTimeout(t);
    }
    prevChainLenRef.current = len;
  }, [gameState.counterChain, gameState.counterChain.length]);

  const fireParticles = useMemo(
    () => Array.from({ length: 6 }, () => ({
      left: 38 + Math.random() * 24,
      delay: Math.random() * 0.3,
      size: 14 + Math.random() * 10,
    })),
    [],
  );

  const greenSparkles = useMemo(
    () => Array.from({ length: 5 }, () => ({
      left: 42 + Math.random() * 16,
      bottom: 15 + Math.random() * 25,
      delay: Math.random() * 0.4,
      drift: -15 + Math.random() * 30,
    })),
    [],
  );

  const playBursts = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({
      angle: (i * 60) + Math.random() * 20 - 10,
      distance: 40 + Math.random() * 40,
      delay: Math.random() * 0.1,
      size: 4 + Math.random() * 5,
    })),
    [],
  );

  const blueOrbs = useMemo(
    () => Array.from({ length: 4 }, (_, i) => ({
      angle: i * 90 + Math.random() * 30,
      delay: i * 0.1,
      radius: 30 + Math.random() * 20,
    })),
    [],
  );

  const blackWisps = useMemo(
    () => Array.from({ length: 4 }, () => ({
      left: 20 + Math.random() * 60,
      delay: Math.random() * 0.3,
      width: 50 + Math.random() * 100,
    })),
    [],
  );

  const hasAnything = activeEffect || playAnim || counterAnim;
  if (!hasAnything) return null;

  return (
    <>
      {/* Card play — subtle color pulse from center-bottom */}
      {playAnim && (
        <div className="effect-overlay">
          <div className="effect-play-glow" style={{
            background: `radial-gradient(ellipse at 50% 75%, ${LAND_HEX[playAnim]}44 0%, transparent 55%)`,
          }} />
          <div className="effect-play-ring" style={{
            borderColor: LAND_HEX[playAnim],
            boxShadow: `0 0 12px ${LAND_HEX[playAnim]}66`,
          }} />
          {playBursts.map((b, i) => {
            const rad = (b.angle * Math.PI) / 180;
            const dx = Math.cos(rad) * b.distance;
            const dy = Math.sin(rad) * b.distance;
            return (
              <div key={i} className="effect-play-particle" style={{
                left: '50%', bottom: '32%',
                width: b.size, height: b.size,
                background: LAND_HEX[playAnim],
                boxShadow: `0 0 4px ${LAND_HEX[playAnim]}`,
                animationDelay: `${b.delay}s`,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
              } as React.CSSProperties} />
            );
          })}
        </div>
      )}

      {/* Counter — blue shield flash */}
      {counterAnim === 'counter' && (
        <div className="effect-overlay">
          <div className="effect-counter-flash" />
          <div className="effect-counter-shield" />
        </div>
      )}

      {/* Counter-counter — dual blue lines */}
      {counterAnim === 'counter_counter' && (
        <div className="effect-overlay">
          <div className="effect-cc-flash" />
          <div className="effect-cc-bolt" style={{ left: '48%', transform: 'translate(-50%, -50%) rotate(-12deg)' }} />
          <div className="effect-cc-bolt" style={{ left: '52%', transform: 'translate(-50%, -50%) rotate(12deg)', animationDelay: '0.06s' }} />
        </div>
      )}

      {/* Red — warm glow with rising embers */}
      {activeEffect === 'red' && (
        <div className="effect-overlay">
          <div className="effect-fire-glow" />
          {fireParticles.map((p, i) => (
            <div key={i} className="effect-fire-particle" style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              width: p.size, height: p.size,
            }} />
          ))}
        </div>
      )}

      {/* Green — rising card silhouette in the retrieved color */}
      {activeEffect === 'green' && (() => {
        const c = effectColor ?? 'green';
        const hex = LAND_HEX[c];
        return (
          <div className="effect-overlay">
            <div className="effect-green-card" style={{
              borderColor: hex,
              background: `${hex}22`,
              boxShadow: `0 0 16px ${hex}66`,
            }} />
            {greenSparkles.map((s, i) => (
              <div key={i} className="effect-green-sparkle" style={{
                left: `${s.left}%`,
                bottom: `${s.bottom}%`,
                animationDelay: `${s.delay}s`,
                background: hex,
                boxShadow: `0 0 4px ${hex}`,
                '--drift': `${s.drift}px`,
              } as React.CSSProperties} />
            ))}
          </div>
        );
      })()}

      {/* White — deck draw slide */}
      {activeEffect === 'white' && (
        <div className="effect-overlay">
          <div className="effect-white-shimmer" />
          <div className="effect-white-card" />
        </div>
      )}

      {/* Blue — subtle orb pulse */}
      {activeEffect === 'blue' && (
        <div className="effect-overlay">
          <div className="effect-blue-glow" />
          <div className="effect-blue-orb" />
          {blueOrbs.map((o, i) => {
            const rad = (o.angle * Math.PI) / 180;
            return (
              <div key={i} className="effect-blue-particle" style={{
                left: `calc(50% + ${Math.cos(rad) * o.radius}px)`,
                top: `calc(45% + ${Math.sin(rad) * o.radius}px)`,
                animationDelay: `${o.delay}s`,
              }} />
            );
          })}
        </div>
      )}

      {/* Black — dark mist */}
      {activeEffect === 'black' && (
        <div className="effect-overlay">
          <div className="effect-black-mist" />
          {blackWisps.map((w, i) => (
            <div key={i} className="effect-black-wisp" style={{
              left: `${w.left}%`,
              width: w.width,
              animationDelay: `${w.delay}s`,
            }} />
          ))}
        </div>
      )}
    </>
  );
}
