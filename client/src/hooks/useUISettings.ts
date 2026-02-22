// ─────────────────────────────────────────────────────────────────────────────
// client/src/hooks/useUISettings.ts
//
// Persistent UI preferences stored in localStorage.
// Two-layer pattern:
//   UISettingsContext  — React Context so any component can read settings via useUISettings()
//   useUISettingsProvider  — used once at the root (App.tsx) to create and hold the state
//   useUISettings  — used in leaf components to read/set preferences
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState } from 'react';

interface UISettings {
  showCardTypeOnHover: boolean;
  setShowCardTypeOnHover: (v: boolean) => void;
  showCardEffectsOnHover: boolean;
  setShowCardEffectsOnHover: (v: boolean) => void;
  showEffectResultRed: boolean;
  setShowEffectResultRed: (v: boolean) => void;
  showEffectResultGreen: boolean;
  setShowEffectResultGreen: (v: boolean) => void;
  showEffectResultBlue: boolean;
  setShowEffectResultBlue: (v: boolean) => void;
  showEffectResultBlack: boolean;
  setShowEffectResultBlack: (v: boolean) => void;
}

export const UISettingsContext = createContext<UISettings>({
  showCardTypeOnHover: true,
  setShowCardTypeOnHover: () => {},
  showCardEffectsOnHover: true,
  setShowCardEffectsOnHover: () => {},
  showEffectResultRed: true,
  setShowEffectResultRed: () => {},
  showEffectResultGreen: true,
  setShowEffectResultGreen: () => {},
  showEffectResultBlue: true,
  setShowEffectResultBlue: () => {},
  showEffectResultBlack: true,
  setShowEffectResultBlack: () => {},
});

/** Read UI preferences from context. Use this in any component that needs a setting. */
export function useUISettings() {
  return useContext(UISettingsContext);
}

/**
 * Creates the settings state.  Call this ONCE at the top of the component tree (App.tsx)
 * and pass the result into UISettingsContext.Provider.
 * Reads/writes values from localStorage so preferences survive page refreshes.
 */
export function useUISettingsProvider(): UISettings {
  const [showCardTypeOnHover, setShowCardTypeOnHoverState] = useState(
    () => localStorage.getItem('showCardTypeOnHover') !== 'false'
  );
  const [showCardEffectsOnHover, setShowCardEffectsOnHoverState] = useState(
    () => localStorage.getItem('showCardEffectsOnHover') !== 'false'
  );
  const [showEffectResultRed, setShowEffectResultRedState] = useState(
    () => localStorage.getItem('showEffectResultRed') !== 'false'
  );
  const [showEffectResultGreen, setShowEffectResultGreenState] = useState(
    () => localStorage.getItem('showEffectResultGreen') !== 'false'
  );
  const [showEffectResultBlue, setShowEffectResultBlueState] = useState(
    () => localStorage.getItem('showEffectResultBlue') !== 'false'
  );
  const [showEffectResultBlack, setShowEffectResultBlackState] = useState(
    () => localStorage.getItem('showEffectResultBlack') !== 'false'
  );

  function setShowCardTypeOnHover(v: boolean) {
    localStorage.setItem('showCardTypeOnHover', String(v));
    setShowCardTypeOnHoverState(v);
  }
  function setShowCardEffectsOnHover(v: boolean) {
    localStorage.setItem('showCardEffectsOnHover', String(v));
    setShowCardEffectsOnHoverState(v);
  }
  function setShowEffectResultRed(v: boolean) {
    localStorage.setItem('showEffectResultRed', String(v));
    setShowEffectResultRedState(v);
  }
  function setShowEffectResultGreen(v: boolean) {
    localStorage.setItem('showEffectResultGreen', String(v));
    setShowEffectResultGreenState(v);
  }
  function setShowEffectResultBlue(v: boolean) {
    localStorage.setItem('showEffectResultBlue', String(v));
    setShowEffectResultBlueState(v);
  }
  function setShowEffectResultBlack(v: boolean) {
    localStorage.setItem('showEffectResultBlack', String(v));
    setShowEffectResultBlackState(v);
  }

  return {
    showCardTypeOnHover, setShowCardTypeOnHover,
    showCardEffectsOnHover, setShowCardEffectsOnHover,
    showEffectResultRed, setShowEffectResultRed,
    showEffectResultGreen, setShowEffectResultGreen,
    showEffectResultBlue, setShowEffectResultBlue,
    showEffectResultBlack, setShowEffectResultBlack,
  };
}
