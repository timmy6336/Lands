// ─────────────────────────────────────────────────────────────────────────────
// server/src/game/DeckBuilder.ts
//
// Generates shuffled decks for new games.
// A standard Lands deck: 5 copies × 5 land colors = 25 cards total.
// Each card gets a unique UUID so every instance can be tracked individually.
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import { Card, Color, ALL_COLORS } from '../../../shared/types';

const COPIES_PER_COLOR = 5; // 5 copies × 5 colors = 25-card deck

/** Build a complete 25-card deck (5 of each color) then shuffle it. */
export function buildDeck(): Card[] {
  const cards: Card[] = [];
  for (const color of ALL_COLORS) {
    for (let i = 0; i < COPIES_PER_COLOR; i++) {
      cards.push({ id: uuidv4(), color: color as Color });
    }
  }
  return shuffle(cards);
}

/**
 * Fisher-Yates in-place shuffle on a copy of the array.
 * Returns the shuffled copy; the original is not modified.
 */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
