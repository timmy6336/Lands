// Returns a scale factor for card sizing, derived from viewport height.
//
// The board layout (opponent field, status bar, your field, two hands, two info
// bars all stacked vertically) was designed for desktop-sized windows. On phones
// — especially in landscape, where height is the constrained dimension — the
// fixed-pixel card sizes don't leave enough room and everything overlaps/clips.
//
// A purely analytical "scale from viewport height" formula turned out to be too
// fragile: the board's non-card chrome (bars, labels, padding, gaps — set by the
// `index.css` `max-height` breakpoints) shifts in ways that are hard to predict
// exactly, and a slightly-too-large scale causes real overflow/overlap. Instead,
// we render with a naive estimate, measure the board's natural content height,
// and solve for the exact scale that makes it fit the viewport. Because that
// "chrome" height is independent of the card scale (it only depends on viewport
// height, via the CSS breakpoints), a single measurement yields an exact answer
// — regardless of which starting estimate was used to take it — so every
// component converges on the same corrected value.
import { useEffect, useLayoutEffect, useState } from 'react';

// Combined natural height (at scale 1, in px) of the four card rows whose size
// is driven by this scale: opponent hidden-hand cards (100) + your/opponent
// field stacks and your hand (112 each).
const CARD_ROWS_HEIGHT = 436;
const REFERENCE_HEIGHT = 760; // viewport height at/above which cards render at full size
const MIN_SCALE = 0.2;
const MAX_SCALE = 1;

function clamp(v: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, v));
}

function naiveScale(viewportHeight: number): number {
  return clamp(viewportHeight / REFERENCE_HEIGHT);
}

interface ScaleState {
  scale: number;
  correctedFor: number; // viewport height this scale was solved for, or -1
}

function initialState(): ScaleState {
  const h = typeof window === 'undefined' ? REFERENCE_HEIGHT : window.innerHeight;
  return { scale: naiveScale(h), correctedFor: -1 };
}

export function useCardScale(): number {
  const [state, setState] = useState<ScaleState>(initialState);

  // Solve for the exact scale that makes the board's natural content height
  // match the viewport, using one measurement of the currently-rendered board.
  useLayoutEffect(() => {
    const vh = window.innerHeight;
    if (state.correctedFor === vh) return;
    const root = document.querySelector('.game-root') as HTMLElement | null;
    if (!root) return;

    const prevInlineHeight = root.style.height;
    root.style.height = 'auto';
    const natural = root.scrollHeight;
    root.style.height = prevInlineHeight;

    const chrome = natural - CARD_ROWS_HEIGHT * state.scale;
    const corrected = clamp((vh - chrome) / CARD_ROWS_HEIGHT);
    setState({ scale: corrected, correctedFor: vh });
  });

  useEffect(() => {
    const update = () => setState({ scale: naiveScale(window.innerHeight), correctedFor: -1 });
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return state.scale;
}

/** Scales a base [width, height] pair (in px) by the current card scale. */
export function useScaledSize(baseW: number, baseH: number): { w: number; h: number; scale: number } {
  const scale = useCardScale();
  return { w: Math.round(baseW * scale), h: Math.round(baseH * scale), scale };
}
