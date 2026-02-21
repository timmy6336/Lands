import { v4 as uuidv4 } from 'uuid';
import { Card, Color, ALL_COLORS } from '../../../shared/types';

const COPIES_PER_COLOR = 5;

export function buildDeck(): Card[] {
  const cards: Card[] = [];
  for (const color of ALL_COLORS) {
    for (let i = 0; i < COPIES_PER_COLOR; i++) {
      cards.push({ id: uuidv4(), color: color as Color });
    }
  }
  return shuffle(cards);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
