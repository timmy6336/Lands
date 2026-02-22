// ─────────────────────────────────────────────────────────────────────────────
// server/src/game/WinChecker.ts
//
// Pure win-condition check called by GameEngine after every land resolves.
// No side effects — just inspects the field array and returns a boolean.
// ─────────────────────────────────────────────────────────────────────────────
import { Card, ALL_COLORS } from '../../../shared/types';

/**
 * Returns true if the given field satisfies either win condition:
 *   • 5-of-a-kind  — 5 or more cards of the same color on the field
 *   • Rainbow      — at least 1 card of each of the 5 land colors
 *
 * Note: a field can never legally have fewer than 5 cards and still win,
 * so the early-return below is purely a fast path.
 */
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
