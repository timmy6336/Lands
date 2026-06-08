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
// — regardless of which starting estimate was used to take it.
//
// That measurement must only happen ONCE per viewport height, though — a card
// that mounts later (drawn mid-game, or remounted for its entrance animation)
// would otherwise measure a "polluted" DOM where some cards already sit at the
// converged scale and it itself is still at the naive one, solving for a
// different (wrong) answer and ending up a visibly different size. A
// module-level cache makes every instance — including late-mounting ones —
// reuse the first instance's measurement and converge on the same value.
import { useEffect, useLayoutEffect, useState } from 'react';

// Combined natural height (at scale 1, in px) of the three scale-driven card
// rows: opponent field + my field + my hand (112px each).
// The opponent hand is now a CSS-only mini strip — not scale-dependent.
const CARD_ROWS_HEIGHT = 336;
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

// Module-level cache: the corrected scale already solved for a given viewport
// height, shared by every component instance so late-mounting cards don't
// re-derive (and potentially mismatch) it from a mid-transition DOM.
let cachedFor = -1;
let cachedScale = -1;

export function useCardScale(): number {
  const [state, setState] = useState<ScaleState>(initialState);

  // Solve for the exact scale that makes the board's natural content height
  // match the viewport, using one measurement of the currently-rendered board.
  // Only the first instance to run this for a given viewport height actually
  // measures; everyone else (including cards that mount afterwards) reuses
  // that cached answer so all cards stay the same size.
  useLayoutEffect(() => {
    const vh = window.innerHeight;
    if (state.correctedFor === vh) return;

    if (cachedFor === vh) {
      if (state.scale !== cachedScale) setState({ scale: cachedScale, correctedFor: vh });
      return;
    }

    const root = document.querySelector('.game-root') as HTMLElement | null;
    if (!root) return;

    const prevInlineHeight = root.style.height;
    root.style.height = 'auto';
    const natural = root.scrollHeight;
    root.style.height = prevInlineHeight;

    const chrome = natural - CARD_ROWS_HEIGHT * state.scale;
    const corrected = clamp((vh - chrome) / CARD_ROWS_HEIGHT);
    cachedFor = vh;
    cachedScale = corrected;
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
