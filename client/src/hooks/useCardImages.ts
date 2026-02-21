import { createContext, useContext, useEffect, useState } from 'react';
import { Color } from '@lands/shared';

export type CardImageUrls = Record<Color | 'back', string>;

const DEFAULT_URLS: CardImageUrls = {
  white: '/cards/white.svg',
  red:   '/cards/red.svg',
  blue:  '/cards/blue.svg',
  green: '/cards/green.svg',
  black: '/cards/black.svg',
  back:  '/cards/back.svg',
};

/** Context that provides card image URLs throughout the component tree */
export const CardImagesContext = createContext<CardImageUrls>(DEFAULT_URLS);

/** Read card image URLs from context — used in Card.tsx and anywhere that renders card art */
export function useCardImages(): CardImageUrls {
  return useContext(CardImagesContext);
}

/** Used once in App.tsx to load and refresh card image URLs (Electron or browser fallback) */
export function useCardImagesProvider(): [CardImageUrls, () => Promise<void>] {
  const [urls, setUrls] = useState<CardImageUrls>(DEFAULT_URLS);

  async function refresh() {
    if (window.electronAPI) {
      const fetched = await window.electronAPI.getCardImageUrls();
      setUrls(fetched as CardImageUrls);
    }
  }

  useEffect(() => { refresh(); }, []);

  return [urls, refresh];
}
