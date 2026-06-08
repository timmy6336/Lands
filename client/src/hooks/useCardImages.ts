import { createContext, useContext, useEffect, useState } from 'react';
import { Color } from '@lands/shared';

export type CardImageUrls = Record<Color | 'back', string>;

const COLORS: (Color | 'back')[] = ['white', 'red', 'blue', 'green', 'black', 'back'];

const DEFAULT_URLS: CardImageUrls = {
  white: '/cards/white.svg',
  red:   '/cards/red.svg',
  blue:  '/cards/blue.svg',
  green: '/cards/green.svg',
  black: '/cards/black.svg',
  back:  '/cards/back.svg',
};

function skinUrls(packId: string): CardImageUrls {
  if (!packId || packId === 'default') return DEFAULT_URLS;
  const base = `/cards/skins/${packId}`;
  return {
    white: `${base}/white.svg`,
    red:   `${base}/red.svg`,
    blue:  `${base}/blue.svg`,
    green: `${base}/green.svg`,
    black: `${base}/black.svg`,
    back:  `${base}/back.svg`,
  };
}

/** Context that provides card image URLs throughout the component tree */
export const CardImagesContext = createContext<CardImageUrls>(DEFAULT_URLS);

/** Read card image URLs from context — used in Card.tsx and anywhere that renders card art */
export function useCardImages(): CardImageUrls {
  return useContext(CardImagesContext);
}

/** Used once in App.tsx. Re-runs when the active skin pack changes. */
export function useCardImagesProvider(activePack?: string | null): [CardImageUrls, () => Promise<void>] {
  const [urls, setUrls] = useState<CardImageUrls>(() => skinUrls(activePack ?? 'default'));

  async function refresh() {
    setUrls(skinUrls(activePack ?? 'default'));
  }

  useEffect(() => { refresh(); }, [activePack]);

  return [urls, refresh];
}
