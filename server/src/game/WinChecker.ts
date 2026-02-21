import { Card, ALL_COLORS } from '../../../shared/types';

export function checkWin(field: Card[]): boolean {
  if (field.length < 5) return false;

  // Win condition 1: 5 of the same color
  const colorCounts = new Map<string, number>();
  for (const card of field) {
    colorCounts.set(card.color, (colorCounts.get(card.color) ?? 0) + 1);
  }
  for (const count of colorCounts.values()) {
    if (count >= 5) return true;
  }

  // Win condition 2: at least 1 of each color
  const colorsPresent = new Set(field.map(c => c.color));
  if (ALL_COLORS.every(c => colorsPresent.has(c))) return true;

  return false;
}
