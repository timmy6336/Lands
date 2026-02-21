import { createContext, useContext, useState } from 'react';

interface UISettings {
  showCardTypeOnHover: boolean;
  setShowCardTypeOnHover: (v: boolean) => void;
  showCardEffectsOnHover: boolean;
  setShowCardEffectsOnHover: (v: boolean) => void;
}

export const UISettingsContext = createContext<UISettings>({
  showCardTypeOnHover: true,
  setShowCardTypeOnHover: () => {},
  showCardEffectsOnHover: true,
  setShowCardEffectsOnHover: () => {},
});

export function useUISettings() {
  return useContext(UISettingsContext);
}

export function useUISettingsProvider(): UISettings {
  const [showCardTypeOnHover, setShowCardTypeOnHoverState] = useState(
    () => localStorage.getItem('showCardTypeOnHover') !== 'false'
  );
  const [showCardEffectsOnHover, setShowCardEffectsOnHoverState] = useState(
    () => localStorage.getItem('showCardEffectsOnHover') !== 'false'
  );

  function setShowCardTypeOnHover(v: boolean) {
    localStorage.setItem('showCardTypeOnHover', String(v));
    setShowCardTypeOnHoverState(v);
  }

  function setShowCardEffectsOnHover(v: boolean) {
    localStorage.setItem('showCardEffectsOnHover', String(v));
    setShowCardEffectsOnHoverState(v);
  }

  return {
    showCardTypeOnHover, setShowCardTypeOnHover,
    showCardEffectsOnHover, setShowCardEffectsOnHover,
  };
}
