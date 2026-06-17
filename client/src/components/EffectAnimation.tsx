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
    () => Array.from({ length: 12 }, () => ({
      left: 35 + Math.random() * 30,
      delay: Math.random() * 0.4,
      size: 20 + Math.random() * 16,
    })),
    [],
  );

  const greenSparkles = useMemo(
    () => Array.from({ length: 8 }, () => ({
      left: 40 + Math.random() * 20,
      bottom: 10 + Math.random() * 30,
      delay: Math.random() * 0.5,
      drift: -20 + Math.random() * 40,
    })),
    [],
  );

  const playBursts = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({
      angle: (i * 36) + Math.random() * 18 - 9,
      distance: 50 + Math.random() * 50,
      delay: Math.random() * 0.12,
      size: 6 + Math.random() * 8,
    })),
    [],
  );

  const blueOrbs = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({
      angle: i * 60 + Math.random() * 20,
      delay: i * 0.08,
      radius: 35 + Math.random() * 25,
    })),
    [],
  );

  const blackWisps = useMemo(
    () => Array.from({ length: 6 }, () => ({
      left: 15 + Math.random() * 70,
      delay: Math.random() * 0.4,
      width: 60 + Math.random() * 140,
    })),
    [],
  );

  const hasAnything = activeEffect || playAnim || counterAnim;
  if (!hasAnything) return null;

  return (
    <>
      {/* Card play — color burst from center-bottom */}
      {playAnim && (
        <div className="effect-overlay">
          <div className="effect-play-glow" style={{
            background: `radial-gradient(ellipse at 50% 75%, ${LAND_HEX[playAnim]}55 0%, transparent 60%)`,
          }} />
          <div className="effect-play-ring" style={{
            borderColor: LAND_HEX[playAnim],
            boxShadow: `0 0 18px ${LAND_HEX[playAnim]}88, 0 0 36px ${LAND_HEX[playAnim]}44`,
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
                boxShadow: `0 0 6px ${LAND_HEX[playAnim]}`,
                animationDelay: `${b.delay}s`,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
              } as React.CSSProperties} />
            );
          })}
        </div>
      )}

      {/* Counter — blue shield */}
      {counterAnim === 'counter' && (
        <div className="effect-overlay">
          <div className="effect-counter-flash" />
          <div className="effect-counter-shield" />
          <div className="effect-counter-text">COUNTERED</div>
        </div>
      )}

      {/* Counter-counter — dual blue bolts */}
      {counterAnim === 'counter_counter' && (
        <div className="effect-overlay">
          <div className="effect-cc-flash" />
          <div className="effect-cc-bolt" style={{ left: '48%', transform: 'translate(-50%, -50%) rotate(-12deg)' }} />
          <div className="effect-cc-bolt" style={{ left: '52%', transform: 'translate(-50%, -50%) rotate(12deg)', animationDelay: '0.06s' }} />
          <div className="effect-counter-text">OVERRULED</div>
        </div>
      )}

      {/* Red — fire */}
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

      {/* Green — rising card in the actual retrieved color */}
      {activeEffect === 'green' && (() => {
        const c = effectColor ?? 'green';
        const hex = LAND_HEX[c];
        return (
          <div className="effect-overlay">
            <div className="effect-green-card" style={{
              borderColor: hex,
              background: `${hex}33`,
              boxShadow: `0 0 20px ${hex}99, 0 0 40px ${hex}4D`,
            }} />
            {greenSparkles.map((s, i) => (
              <div key={i} className="effect-green-sparkle" style={{
                left: `${s.left}%`,
                bottom: `${s.bottom}%`,
                animationDelay: `${s.delay}s`,
                background: hex,
                boxShadow: `0 0 6px ${hex}`,
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

      {/* Blue — scrying orb */}
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

      {/* Black — dark mist + skull */}
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
          <div className="effect-black-skull">&#128128;</div>
        </div>
      )}
    </>
  );
}
