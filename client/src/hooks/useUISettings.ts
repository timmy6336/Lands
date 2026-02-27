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
  theme: 'dark' | 'light';
  setTheme: (v: 'dark' | 'light') => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  musicMuted: boolean;
  setMusicMuted: (v: boolean) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  sfxMuted: boolean;
  setSfxMuted: (v: boolean) => void;
  showEndAnimation: boolean;
  setShowEndAnimation: (v: boolean) => void;
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
  theme: 'dark',
  setTheme: () => {},
  musicVolume: 0.5,
  setMusicVolume: () => {},
  musicMuted: false,
  setMusicMuted: () => {},
  sfxVolume: 0.7,
  setSfxVolume: () => {},
  sfxMuted: false,
  setSfxMuted: () => {},
  showEndAnimation: true,
  setShowEndAnimation: () => {},
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
  const [theme, setThemeState] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark'
  );
  const [musicVolume, setMusicVolumeState] = useState(
    () => parseFloat(localStorage.getItem('musicVolume') ?? '0.5')
  );
  const [musicMuted, setMusicMutedState] = useState(
    () => localStorage.getItem('musicMuted') === 'true'
  );
  const [sfxVolume, setSfxVolumeState] = useState(
    () => parseFloat(localStorage.getItem('sfxVolume') ?? '0.7')
  );
  const [sfxMuted, setSfxMutedState] = useState(
    () => localStorage.getItem('sfxMuted') === 'true'
  );
  const [showEndAnimation, setShowEndAnimationState] = useState(
    () => localStorage.getItem('showEndAnimation') !== 'false'
  );

  function setTheme(v: 'dark' | 'light') {
    localStorage.setItem('theme', v);
    setThemeState(v);
  }

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
  function setMusicVolume(v: number) {
    localStorage.setItem('musicVolume', String(v));
    setMusicVolumeState(v);
  }
  function setMusicMuted(v: boolean) {
    localStorage.setItem('musicMuted', String(v));
    setMusicMutedState(v);
  }
  function setSfxVolume(v: number) {
    localStorage.setItem('sfxVolume', String(v));
    setSfxVolumeState(v);
  }
  function setSfxMuted(v: boolean) {
    localStorage.setItem('sfxMuted', String(v));
    setSfxMutedState(v);
  }
  function setShowEndAnimation(v: boolean) {
    localStorage.setItem('showEndAnimation', String(v));
    setShowEndAnimationState(v);
  }

  return {
    showCardTypeOnHover, setShowCardTypeOnHover,
    showCardEffectsOnHover, setShowCardEffectsOnHover,
    showEffectResultRed, setShowEffectResultRed,
    showEffectResultGreen, setShowEffectResultGreen,
    showEffectResultBlue, setShowEffectResultBlue,
    showEffectResultBlack, setShowEffectResultBlack,
    theme, setTheme,
    musicVolume, setMusicVolume,
    musicMuted, setMusicMuted,
    sfxVolume, setSfxVolume,
    sfxMuted, setSfxMuted,
    showEndAnimation, setShowEndAnimation,
  };
}
