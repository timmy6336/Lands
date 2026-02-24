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

/** Build the base skin URL set for a given pack id.
 *  Defaults to .svg (vector packs). Pass ext='webp' for photo-quality packs.
 *  The pack's ext is stored in BUILTIN_PACKS via the preview_url extension
 *  but for simplicity all generated test packs use .svg. */
function skinUrls(packId: string, ext = 'svg'): CardImageUrls {
  if (!packId || packId === 'default') return DEFAULT_URLS;
  const base = `/cards/skins/${packId}`;
  return {
    white: `${base}/white.${ext}`,
    red:   `${base}/red.${ext}`,
    blue:  `${base}/blue.${ext}`,
    green: `${base}/green.${ext}`,
    black: `${base}/black.${ext}`,
    back:  `${base}/back.${ext}`,
  };
}

/** Context that provides card image URLs throughout the component tree */
export const CardImagesContext = createContext<CardImageUrls>(DEFAULT_URLS);

/** Read card image URLs from context — used in Card.tsx and anywhere that renders card art */
export function useCardImages(): CardImageUrls {
  return useContext(CardImagesContext);
}

/**
 * Used once in App.tsx to load and refresh card image URLs.
 * Layer priority (highest wins):
 *   3. Electron custom images (per-color overrides the user uploaded)
 *   2. Active skin pack images  (selected in profile / shop)
 *   1. Default SVG cards
 */
export function useCardImagesProvider(activePack?: string | null): [CardImageUrls, () => Promise<void>] {
  const [urls, setUrls] = useState<CardImageUrls>(() => skinUrls(activePack ?? 'default'));

  async function refresh() {
    // Start from skin pack base
    const base = skinUrls(activePack ?? 'default');

    if (window.electronAPI) {
      // Electron: fetch per-color custom images and overlay on top of skin
      const fetched = (await window.electronAPI.getCardImageUrls()) as Partial<CardImageUrls>;
      const merged: CardImageUrls = { ...base };
      for (const key of COLORS) {
        if (fetched[key]) merged[key] = fetched[key]!;
      }
      setUrls(merged);
    } else {
      setUrls(base);
    }
  }

  // Re-run whenever the active pack changes
  useEffect(() => { refresh(); }, [activePack]);

  return [urls, refresh];
}
