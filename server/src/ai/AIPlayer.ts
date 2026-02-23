// ─────────────────────────────────────────────────────────────────────────────
// server/src/ai/AIPlayer.ts
//
// AI opponent that hooks into a running GameEngine by chaining onto
// its onStateChange callback.  Every time state changes, onStateChange fires,
// the AI checks whether it needs to act, schedules a think delay, then calls
// the engine’s public API exactly as if it were a human socket handler.
//
// Three difficulty levels control:
//   • Think delay (how long before the AI acts)
//   • Random move chance (probability of ignoring strategy entirely)
//   • Knowledge tracking (hard AI remembers cards revealed by Black effect)
//
// Strategic decision pipeline (hard/medium):
//   doPlayCard   → pickBestCard → scoreCard  (evaluate every card; play highest)
//   doCounter    → evaluateCounter            (threat scoring 0–100 vs threshold)
//   doCounterCounter                          (play when card is critical or blues surplus)
//   doBlackPick  → pickCardToDiscard          (targets counter cards first when holding win)
//   doBlackShow  → pickCardsToReveal          (protects blues and win-path cards)
//   doBlueLook                                (keep-on-top if useful, else send to bottom)
//   doRedPick    → chooseBestRedTarget        (destroy what hurts them most)
//   doGreenPick  → chooseBestGreenTarget      (retrieve what advances own win path)
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import { GameState, Card, Color, PlayerState, ALL_COLORS, AIDifficulty } from '../../../shared/types';
import { GameEngine } from '../game/GameEngine';

// ── Difficulty tuning ─────────────────────────────────────────────────────────

/** Min/max think delay in ms per difficulty */
const THINK_RANGE: Record<AIDifficulty, [number, number]> = {
  easy:   [200,  600],
  medium: [400, 1000],
  hard:   [700, 1600],
};

/** Probability of making a random move instead of a strategic one */
const RANDOM_CHANCE: Record<AIDifficulty, number> = {
  easy:   0.80,
  medium: 0.30,
  hard:   0.05,
};

/** Display names by difficulty */
export const AI_NAMES: Record<AIDifficulty, string> = {
  easy:   'Sapling',
  medium: 'Ironbark',
  hard:   'Dreadroot',
};

// ── Win path analysis ─────────────────────────────────────────────────────────

interface WinPath {
  type: '5kind' | 'rainbow';
  color?: Color;       // for 5kind: which color
  cardsNeeded: number; // how many more cards on field to win
}

/**
 * All win paths the player could realistically pursue, sorted by fewest cards needed.
 * Used to score which card to play and which targets to pick in effect phases.
 */
function getWinPaths(player: PlayerState): WinPath[] {
  const fieldCounts = new Map<Color, number>();
  for (const c of player.field) {
    fieldCounts.set(c.color, (fieldCounts.get(c.color) ?? 0) + 1);
  }

  const paths: WinPath[] = [];

  // 5-of-a-kind paths (only track colors the player has started accumulating)
  for (const color of ALL_COLORS) {
    const onField = fieldCounts.get(color) ?? 0;
    const inHand  = player.hand.filter(c => c.color === color).length;
    if (onField > 0 || inHand > 0) {
      paths.push({ type: '5kind', color, cardsNeeded: Math.max(0, 5 - onField) });
    }
  }

  // Rainbow path (tracked whenever any card is on field)
  const colorsOnField = new Set(player.field.map(c => c.color));
  if (colorsOnField.size > 0) {
    paths.push({ type: 'rainbow', cardsNeeded: Math.max(0, 5 - colorsOnField.size) });
  }

  // Sort by fewest cards needed first (nearest win = first)
  return paths.sort((a, b) => a.cardsNeeded - b.cardsNeeded);
}

/** Would playing this card onto the given field immediately win? */
function isWinningCard(card: Card, field: Card[]): boolean {
  const newField = [...field, card];
  const counts = new Map<Color, number>();
  for (const c of newField) counts.set(c.color, (counts.get(c.color) ?? 0) + 1);
  for (const v of counts.values()) if (v >= 5) return true;  // 5-of-a-kind
  if (counts.size >= 5) return true;                          // rainbow
  return false;
}

/**
 * Rough probability that a hand of N cards (balanced 5-color deck, 5 of each)
 * contains the cards needed to counter a card of `cardColor`.
 */
function handCountRisk(handCount: number, cardColor: Color): number {
  if (handCount === 0) return 0;
  // P(at least 1 blue in N draws) using binomial with p=0.2
  const pBlue = 1 - Math.pow(0.8, handCount);
  if (cardColor === 'blue') {
    // Countering blue requires 2 blues — harder
    const p0 = Math.pow(0.8, handCount);
    const p1 = handCount * 0.2 * Math.pow(0.8, handCount - 1);
    return Math.max(0, Math.min((1 - p0 - p1) * 0.90, 0.75));
  }
  const pMatch = 1 - Math.pow(0.8, handCount);
  // Approximate: need blue AND matching (treat as roughly independent)
  return Math.min(pBlue * pMatch * 0.85, 0.78);
}

// ── Target selection helpers ──────────────────────────────────────────────────

function chooseBestRedTarget(opponentField: Card[], opponentPaths: WinPath[]): Card | null {
  if (opponentField.length === 0) return null;

  // Priority 1: destroy a card that directly blocks their nearest win
  const best = opponentPaths[0];
  if (best && best.cardsNeeded <= 1) {
    if (best.type === '5kind' && best.color) {
      const t = opponentField.find(c => c.color === best.color);
      if (t) return t;
    }
    if (best.type === 'rainbow') {
      // Destroy a singleton color to break their rainbow
      const counts = new Map<Color, number>();
      for (const c of opponentField) counts.set(c.color, (counts.get(c.color) ?? 0) + 1);
      const singleton = opponentField.find(c => (counts.get(c.color) ?? 0) === 1);
      if (singleton) return singleton;
    }
  }

  // Priority 2: if they're near a 5-kind, destroy that color
  if (best?.type === '5kind' && best.color) {
    const t = opponentField.find(c => c.color === best.color);
    if (t) return t;
  }

  // Priority 3: destroy the color they have most of on field (maximum setback)
  const counts = new Map<Color, number>();
  for (const c of opponentField) counts.set(c.color, (counts.get(c.color) ?? 0) + 1);
  return [...opponentField].sort((a, b) =>
    (counts.get(b.color) ?? 0) - (counts.get(a.color) ?? 0)
  )[0];
}

function chooseBestGreenTarget(graveyard: Card[], field: Card[], paths: WinPath[]): Card | null {
  if (graveyard.length === 0) return null;
  const fieldColors = new Set(field.map(c => c.color));
  const best = paths[0];

  // Priority 1: retrieve a card that directly advances best win path
  if (best?.type === '5kind' && best.color) {
    const t = graveyard.find(c => c.color === best.color);
    if (t) return t;
  }
  if (best?.type === 'rainbow') {
    const t = graveyard.find(c => !fieldColors.has(c.color));
    if (t) return t;
  }

  // Priority 2: retrieve a blue (counter capability)
  const blue = graveyard.find(c => c.color === 'blue');
  if (blue) return blue;

  return graveyard[0];
}

// ── Main AI class ─────────────────────────────────────────────────────────────

export class AIPlayer {
  readonly playerId: string;
  readonly difficulty: AIDifficulty;
  private engine!: GameEngine;

  /** Incremented every time we schedule an action; stale callbacks self-cancel. */
  private actionVersion = 0;

  /**
   * Cards we know are in the human's hand (from black effect reveals).
   * cardId → Card. Hard difficulty only.
   */
  private knownHumanCards = new Map<string, Card>();

  constructor(difficulty: AIDifficulty) {
    this.playerId = 'ai-' + uuidv4().slice(0, 8);
    this.difficulty = difficulty;
  }

  /**
   * Wire the AI into a (new) engine.
   * Must be called AFTER engine.onStateChange is already set to broadcastState,
   * so we can chain onto it.
   */
  activate(engine: GameEngine) {
    this.engine = engine;
    this.actionVersion = 0;
    this.knownHumanCards.clear();

    const prev = engine.onStateChange;
    engine.onStateChange = (state) => {
      prev(state);
      this.onStateChange(state);
    };

    // Kick off if game already needs AI action (e.g. AI goes first)
    this.onStateChange(engine.state);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private get myIndex(): 0 | 1 {
    return this.engine.state.players[0].id === this.playerId ? 0 : 1;
  }

  private onStateChange(state: GameState) {
    if (state.phase === 'ended') return;

    const myIndex  = this.myIndex;
    const isMyTurn = state.currentPlayerIndex === myIndex;

    // Update knowledge base from visible information
    this.updateKnowledge(state, myIndex);

    const needsAct =
      (isMyTurn && (
        state.phase === 'playing_play'    ||
        state.phase === 'counter_response'||
        state.phase === 'effect_blue_look'||
        state.phase === 'effect_black_pick'||
        state.phase === 'effect_red_pick' ||
        state.phase === 'effect_green_pick'
      )) ||
      (!isMyTurn && (
        state.phase === 'counter_window'  ||
        state.phase === 'effect_black_show'
      ));

    if (!needsAct) return;

    // Schedule action — increment version so any older pending action is cancelled
    const version = ++this.actionVersion;
    const [min, max] = THINK_RANGE[this.difficulty];
    const delay = min + Math.random() * (max - min);

    setTimeout(() => {
      if (this.actionVersion !== version) return; // superseded
      if (this.engine.state.phase === 'ended') return;
      this.act(this.engine.state);
    }, delay);
  }

  private updateKnowledge(state: GameState, myIndex: 0 | 1) {
    if (this.difficulty === 'easy') return; // easy AI ignores revealed info

    // When we've just picked a card from black_pick, remember the remaining shown cards
    // (they're still in the human's hand)
    // We detect this by checking the shown cards in effect_black_pick phase
    if (state.phase === 'effect_black_pick' && state.pendingEffect?.shownCards) {
      // Store them so we can record the non-discarded ones after picking
      // (actual recording happens in doBlackPick)
    }
  }

  private act(state: GameState) {
    const myIndex  = this.myIndex;
    const me       = state.players[myIndex];
    const opponent = state.players[(1 - myIndex) as 0 | 1];
    const random   = Math.random() < RANDOM_CHANCE[this.difficulty];

    switch (state.phase) {
      case 'playing_play':     this.doPlayCard(me, opponent, state.turnNumber, random); break;
      case 'counter_window':   this.doCounter(state, me, opponent, random); break;
      case 'counter_response': this.doCounterCounter(state, me, random); break;
      case 'effect_blue_look': this.doBlueLook(state, me, random); break;
      case 'effect_black_show':this.doBlackShow(me, opponent, random); break;
      case 'effect_black_pick':this.doBlackPick(state, me, opponent, random); break;
      case 'effect_red_pick':  this.doRedPick(opponent, random); break;
      case 'effect_green_pick':this.doGreenPick(me, random); break;
    }
  }

  // ── Counter risk estimation ────────────────────────────────────────────────

  /**
   * Estimates the probability (0–1) that the opponent can counter a card of `cardColor`.
   * Hard difficulty uses knowledge from previous black reveals.
   * Other difficulties fall back to a purely probabilistic model based on hand size.
   */
  private estimateCounterRisk(opponent: PlayerState, cardColor: Color): number {
    if (this.difficulty === 'hard' && this.knownHumanCards.size > 0) {
      const known = [...this.knownHumanCards.values()];
      const knownBlues = known.filter(c => c.color === 'blue').length;
      const knownMatch = cardColor === 'blue'
        ? knownBlues
        : known.filter(c => c.color === cardColor).length;

      const canCounterFromKnown = cardColor === 'blue'
        ? knownBlues >= 2
        : knownBlues >= 1 && knownMatch >= 1;

      if (canCounterFromKnown) return 0.90; // confirmed — they have the cards

      const unknownCount = opponent.handCount - this.knownHumanCards.size;
      if (unknownCount <= 0) return 0.06;  // full hand knowledge, no counter found

      // Unknown cards remain (were hidden from black reveal) — suspect the worst
      // If opponent had 2+ unknown cards, they were likely protecting something
      const unknownRisk = handCountRisk(unknownCount, cardColor);
      return knownBlues === 0
        ? Math.max(unknownRisk, 0.22)  // no evidence of blues, but unknowns could hide them
        : unknownRisk * 0.70;           // partial knowledge, scale down somewhat
    }

    return handCountRisk(opponent.handCount, cardColor);
  }

  // ── Card selection ────────────────────────────────────────────────────────

  private doPlayCard(me: PlayerState, opponent: PlayerState, turn: number, random: boolean) {
    if (me.hand.length === 0) return;

    let chosen: Card;
    if (random) {
      chosen = me.hand[Math.floor(Math.random() * me.hand.length)];
    } else {
      chosen = this.pickBestCard(me, opponent, turn);
    }
    this.engine.playCard(this.playerId, chosen.id);
  }

  private pickBestCard(me: PlayerState, opponent: PlayerState, turn: number): Card {
    const myPaths  = getWinPaths(me);
    const oppPaths = getWinPaths(opponent);
    const blueCount = me.hand.filter(c => c.color === 'blue').length;

    // Determine if we should defer a winning card we're holding this turn
    const winCards   = me.hand.filter(c => isWinningCard(c, me.field));
    const oppUrgency = oppPaths[0]?.cardsNeeded ?? 999;
    let deferWin = false;
    let winCardColor: Color | null = null;

    if (winCards.length >= 1 && this.difficulty !== 'easy') {
      const winCard     = winCards[0];
      const canDefend   = blueCount >= 2;
      const counterRisk = this.estimateCounterRisk(opponent, winCard.color);
      // Defer only when: can't CC-defend, risk is meaningful, opponent isn't about to win,
      // and we don't have a backup copy to play as bait
      deferWin = !canDefend && counterRisk >= 0.35 && oppUrgency >= 2 && winCards.length < 2;
      winCardColor = winCard.color;
    }

    let best = me.hand[0];
    let bestScore = -Infinity;

    for (const card of me.hand) {
      const score = this.scoreCard(card, me, opponent, myPaths, oppPaths, turn, deferWin, winCardColor);
      if (score > bestScore) { bestScore = score; best = card; }
    }
    return best;
  }

  /**
   * Score a single card for the “play this turn” decision.
   * Returns a numeric score — higher = more desirable to play.
   *
   * Key scoring logic:
   *   • Winning card: normally 1000 (play immediately), but reduced if the AI
   *     should defer (no CC defense, counter risk is high, opponent isn’t urgent).
   *   • In deferral mode: Black (900) > Green-retrieves-Blue (850) > Red (820) > Blue (5–40)
   *     so the AI actively sets up before committing the win card.
   *   • Non-deferral: scores based on opponent threat, own win path progress, and
   *     blue preservation.
   */
  private scoreCard(
    card: Card,
    me: PlayerState,
    opponent: PlayerState,
    myPaths: WinPath[],
    oppPaths: WinPath[],
    turn: number,
    deferWin = false,
    winCardColor: Color | null = null,
  ): number {
    const myBest    = myPaths[0];
    const oppThreat = oppPaths[0]?.cardsNeeded ?? 999;
    const isEarly   = turn < 8;
    const blueCount = me.hand.filter(c => c.color === 'blue').length;

    // ── Winning card: risk-weighted timing ──────────────────────────────────
    if (isWinningCard(card, me.field)) {
      if (this.difficulty === 'easy') return 1000;

      const counterRisk  = this.estimateCounterRisk(opponent, card.color);
      const canDefend    = blueCount >= 2;
      // Count all winning cards in hand — duplicates enable the "burn their counter" strategy
      const winCardCount = me.hand.filter(c => isWinningCard(c, me.field)).length;
      // How many of this win-color remain in deck — high ratio means topdeck follow-up is likely
      const deckCopies = me.deck.filter(c => c.color === card.color).length;
      const deckRatio  = me.deck.length > 0 ? deckCopies / me.deck.length : 0;

      // Must play immediately: opponent is one card away from winning
      if (oppThreat <= 1) return 1000;

      // Can counter-counter if they respond: safe to commit
      if (canDefend) return 1000;

      // Duplicate win cards in hand: deliberately get countered to burn their resources,
      // then play the backup next turn uncountered
      if (winCardCount >= 2) return 1000;

      // High deck replenishment: good odds of topdeck follow-up after a forced counter
      // (opponent wastes 2 counter cards, we draw another win card)
      if (deckRatio >= 0.22 && counterRisk >= 0.40) return 1000;

      // Low counter risk: just play it
      if (counterRisk < 0.35) return 1000;

      // Risky, can't defend, no backup — reduce score to allow setup plays to compete.
      // Score 750–840: higher risk → lower score → setup plays (black=900, red=820) win out
      return 750 + (1 - counterRisk) * 130;
    }

    // ── Standard card scoring ────────────────────────────────────────────────
    switch (card.color) {
      case 'white':
        return isEarly ? 65 : (me.hand.length <= 3 ? 55 : 30);

      case 'red': {
        if (opponent.field.length === 0) return 5; // fizzles
        let score: number;
        if (oppThreat <= 1) score = 95;
        else if (oppThreat <= 2) score = 78;
        else if (opponent.field.length >= 3) score = 62;
        else score = 42;

        // Setup play: in deferral mode, red is high-value —
        // heavy disruption to opponent + may bait a counter, depleting their resources
        if (deferWin && oppThreat <= 3) score = Math.max(score, 820);
        return score;
      }

      case 'blue': {
        // In deferral mode: protect blues for counter-counter when we eventually play the win card.
        // Only spend one if we have clear surplus (3+ blues keeps 2 in reserve after playing)
        if (deferWin) return blueCount >= 3 ? 40 : 5;

        if (blueCount >= 3) return 52;
        if (blueCount === 2 && me.hand.length >= 5 && isEarly) return 38;
        return 14; // save it
      }

      case 'green': {
        if (me.graveyard.length === 0) return 5; // fizzles
        const target = chooseBestGreenTarget(me.graveyard, me.field, myPaths);
        if (!target) return 8;
        // In deferral mode: retrieving a blue directly solves the CC defense gap —
        // score it above red/black setup plays so we grab counter capability first
        if (deferWin && target.color === 'blue') return 850;
        if (myBest?.type === '5kind' && target.color === myBest.color) return 88;
        if (myBest?.type === 'rainbow') {
          const fieldColors = new Set(me.field.map(c => c.color));
          if (!fieldColors.has(target.color)) return 82;
        }
        if (target.color === 'blue') return 52;
        return 48;
      }

      case 'black': {
        if (opponent.handCount === 0) return 5; // fizzles
        let score: number;
        if (oppThreat <= 1) score = 92;
        else if (oppThreat <= 2) score = 74;
        else if (isEarly) score = 60;
        else score = 48;

        // Primary setup play: when deferring the win card, black is the highest-value move —
        // it can directly expose and discard their counter card before we commit to the win play
        if (deferWin && winCardColor !== null) {
          const winRisk = this.estimateCounterRisk(opponent, winCardColor);
          if (winRisk >= 0.35 && opponent.handCount >= 1) score = Math.max(score, 900);
        }
        return score;
      }
    }
  }

  // ── Counter logic ─────────────────────────────────────────────────────────

  private doCounter(state: GameState, me: PlayerState, opponent: PlayerState, random: boolean) {
    const pending = state.pendingPlay;
    if (!pending) { this.engine.counterResponse(this.playerId, false); return; }

    const blues    = me.hand.filter(c => c.color === 'blue');
    const matching = pending.color === 'blue'
      ? blues
      : me.hand.filter(c => c.color === pending.color);

    const canCounter = pending.color === 'blue'
      ? blues.length >= 2
      : blues.length >= 1 && matching.length >= 1;

    if (!canCounter) { this.engine.counterResponse(this.playerId, false); return; }

    if (random) {
      // Easy AI counters ~20% of the time when it can
      if (Math.random() < 0.20) {
        const { blueId, matchingId } = this.pickCounterCards(pending, blues, matching)!;
        if (blueId && matchingId) {
          this.engine.counterResponse(this.playerId, true, blueId, matchingId);
          return;
        }
      }
      this.engine.counterResponse(this.playerId, false);
      return;
    }

    // Strategic decision
    const dec = this.evaluateCounter(me, opponent, pending, blues, matching);
    if (dec.counter && dec.blueId && dec.matchingId) {
      this.engine.counterResponse(this.playerId, true, dec.blueId, dec.matchingId);
    } else {
      this.engine.counterResponse(this.playerId, false);
    }
  }

  private doCounterCounter(state: GameState, me: PlayerState, random: boolean) {
    const pending = state.pendingPlay;
    if (!pending) { this.engine.counterCounterResponse(this.playerId, false); return; }

    const blues = me.hand.filter(c => c.color === 'blue');
    if (blues.length < 2) { this.engine.counterCounterResponse(this.playerId, false); return; }

    if (random) {
      if (Math.random() < 0.12) {
        this.engine.counterCounterResponse(this.playerId, true, blues[0].id, blues[1].id);
        return;
      }
      this.engine.counterCounterResponse(this.playerId, false);
      return;
    }

    // Counter-counter when our card is critical
    const myPaths = getWinPaths(this.engine.state.players[this.myIndex]);
    const myField = this.engine.state.players[this.myIndex].field;
    const best    = myPaths[0];
    const isImportant =
      isWinningCard(pending, myField) ||
      (best?.type === '5kind' && pending.color === best.color && best.cardsNeeded <= 2);

    // With blue surplus (3+), also CC moderately important plays — the extra blue
    // means we stay above the 2-blue CC threshold even after spending two
    const hasBlueSurplus = blues.length >= 3;
    const isModeratelyImportant = hasBlueSurplus && (
      (best?.type === '5kind' && pending.color === best.color && best.cardsNeeded <= 3) ||
      (best?.type === 'rainbow' && best.cardsNeeded <= 2)
    );

    if (isImportant || isModeratelyImportant) {
      this.engine.counterCounterResponse(this.playerId, true, blues[0].id, blues[1].id);
    } else {
      this.engine.counterCounterResponse(this.playerId, false);
    }
  }

  /**
   * Evaluate whether to counter the pending play.
   *
   * The decision is based on a "threat score" (0–100):
   *   • Each card color has a base threat estimate.
   *   • Score is adjusted for: opponent win proximity, blues remaining after counter,
   *     own win proximity, and whether we’re holding a winning card.
   *   • Threshold 45: counter if threat >= 45.
   *
   * Always counters winning plays regardless of score.
   */
  private evaluateCounter(
    me: PlayerState,
    opponent: PlayerState,
    pending: Card,
    blues: Card[],
    matching: Card[],
  ): { counter: boolean; blueId?: string; matchingId?: string } {
    const myPaths  = getWinPaths(me);
    const oppPaths = getWinPaths(opponent);

    // Always counter winning plays
    if (isWinningCard(pending, opponent.field)) {
      return this.pickCounterCards(pending, blues, matching) ?? { counter: false };
    }

    // ── Threat scoring (0–100) ────────────────────────────────────────────────
    let threat = 0;

    switch (pending.color) {
      case 'white':
        threat = 10; // just a draw — rarely worth countering
        break;

      case 'red': {
        // Target unknown until after counter resolves — use field state to estimate threat
        const myBest = myPaths[0];
        if (myBest?.type === '5kind') {
          const copies = me.field.filter(c => c.color === myBest.color).length;
          if (copies > 0) {
            threat = myBest.cardsNeeded <= 1 ? 80 : copies === 1 ? 62 : 45;
          } else {
            threat = 40;
          }
        } else {
          threat = 45;
        }
        break;
      }

      case 'green': {
        // Target card unknown — estimate based on opponent's graveyard depth
        const oppBest = oppPaths[0];
        if (oppBest?.type === '5kind' && oppBest.color) {
          const inGrave = opponent.graveyard.filter(c => c.color === oppBest.color).length;
          if (inGrave > 0) {
            threat = oppBest.cardsNeeded <= 2 ? 68 : 45;
          } else {
            threat = 38;
          }
        } else {
          threat = 42;
        }
        break;
      }

      case 'blue':
        threat = 18; // deck peek — low threat
        break;

      case 'black': {
        // They're ripping a card from my hand
        const h = me.hand.length;
        if (h <= 2)      threat = 80;
        else if (h <= 3) threat = 58;
        else if (h <= 5) threat = 40;
        else             threat = 24;
        break;
      }
    }

    // If opponent is close to winning, be more aggressive about countering anything
    const oppNeeded = oppPaths[0]?.cardsNeeded ?? 999;
    if (oppNeeded <= 2) threat += 18;

    // Penalty for depleting our blue reserves (blues are precious for later)
    const bluesAfter = blues.length - 1;
    if (bluesAfter === 0) threat -= 32; // going blue-less is very costly
    if (bluesAfter === 1) threat -= 12;

    // Also penalise if I'm close to winning and need to save cards for that play
    const myNeeded = myPaths[0]?.cardsNeeded ?? 999;
    if (myNeeded <= 1) threat -= 15; // conserve cards to secure the win

    // If holding a winning card: spending blues here means no counter-counter defense.
    // Only apply this penalty for low-to-medium threat plays — if the threat is already
    // high (protecting a critical field card) we should counter regardless (Scenario B).
    const holdsWinCard = me.hand.some(c => isWinningCard(c, me.field));
    if (holdsWinCard && bluesAfter < 2 && threat < 70) {
      const winCard = me.hand.find(c => isWinningCard(c, me.field))!;
      const winRisk = this.estimateCounterRisk(opponent, winCard.color);
      if (winRisk >= 0.30) threat -= 18; // prefer saving blues for win card defense
    }

    const THRESHOLD = 45;
    if (threat >= THRESHOLD) {
      return this.pickCounterCards(pending, blues, matching) ?? { counter: false };
    }
    return { counter: false };
  }

  private pickCounterCards(
    pending: Card,
    blues: Card[],
    matching: Card[],
  ): { counter: boolean; blueId: string; matchingId: string } | null {
    const blue = blues[0];
    if (!blue) return null;

    const isBlueCard = pending.color === 'blue';
    const matchCard  = isBlueCard
      ? blues.find(c => c.id !== blue.id)
      : (matching.find(c => c.id !== blue.id) ?? matching[0]);

    if (!matchCard) return null;
    return { counter: true, blueId: blue.id, matchingId: matchCard.id };
  }

  // ── Effects ───────────────────────────────────────────────────────────────

  private doBlueLook(state: GameState, me: PlayerState, random: boolean) {
    const topCard = state.pendingEffect?.topCard;
    if (!topCard) {
      this.engine.effectResponse(this.playerId, { type: 'blue_look', keepOnTop: true });
      return;
    }

    let keepOnTop: boolean;
    if (random) {
      keepOnTop = Math.random() < 0.5;
    } else {
      const myPaths   = getWinPaths(me);
      const best      = myPaths[0];
      const fieldColors = new Set(me.field.map(c => c.color));

      if (best?.type === '5kind' && topCard.color === best.color) {
        keepOnTop = true;  // exactly what we need
      } else if (best?.type === 'rainbow' && !fieldColors.has(topCard.color)) {
        keepOnTop = true;  // new color for rainbow
      } else if (topCard.color === 'blue') {
        keepOnTop = true;  // always good to draw a blue
      } else {
        keepOnTop = false; // not useful, send to bottom
      }
    }
    this.engine.effectResponse(this.playerId, { type: 'blue_look', keepOnTop });
  }

  /** AI is the DEFENDER — must reveal 3 of its own cards (human played black). */
  private doBlackShow(me: PlayerState, opponent: PlayerState, random: boolean) {
    if (me.hand.length <= 3) {
      this.engine.effectResponse(this.playerId, {
        type: 'black_show',
        cardIds: me.hand.map(c => c.id),
      });
      return;
    }

    const toReveal = random
      ? shuffled(me.hand).slice(0, 3)
      : this.pickCardsToReveal(me);

    this.engine.effectResponse(this.playerId, {
      type: 'black_show',
      cardIds: toReveal.map(c => c.id),
    });
  }

  private pickCardsToReveal(me: PlayerState): Card[] {
    const myPaths = getWinPaths(me);
    const best    = myPaths[0];
    const fieldColors = new Set(me.field.map(c => c.color));

    const scored = me.hand.map(card => {
      let score = 50; // base — lower score = more willing to reveal
      // Never reveal blues willingly
      if (card.color === 'blue') score += 100;
      // Never reveal win-path cards
      if (best?.type === '5kind' && card.color === best.color) score += 80;
      if (best?.type === 'rainbow' && !fieldColors.has(card.color)) score += 65;
      // Cheaper to reveal colours we have many copies of
      const copies = me.hand.filter(c => c.color === card.color).length;
      score -= copies * 12;
      return { card, score };
    });

    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, 3).map(s => s.card);
  }

  /** AI is the ATTACKER — pick which revealed card to discard from opponent. */
  private doBlackPick(state: GameState, me: PlayerState, opponent: PlayerState, random: boolean) {
    const shown = state.pendingEffect?.shownCards ?? [];
    if (shown.length === 0) return;

    let target: Card;
    if (random) {
      target = shown[Math.floor(Math.random() * shown.length)];
    } else {
      target = this.pickCardToDiscard(shown, me, opponent);
    }

    // Hard difficulty: remember the other shown cards (still in opponent's hand)
    if (this.difficulty === 'hard') {
      for (const c of shown) {
        if (c.id !== target.id) this.knownHumanCards.set(c.id, c);
      }
    }

    this.engine.effectResponse(this.playerId, { type: 'black_pick', targetCardId: target.id });
  }

  private pickCardToDiscard(shown: Card[], me: PlayerState, opponent: PlayerState): Card {
    const oppPaths = getWinPaths(opponent);
    const best     = oppPaths[0];
    const fieldColors = new Set(opponent.field.map(c => c.color));

    // When we're holding the winning card, eliminating their counter capability
    // is the top priority — score their blues above their win-path cards
    const holdingWinCard = me.hand.some(c => isWinningCard(c, me.field));

    const scored = shown.map(card => {
      let score = 0;
      // Discard what hurts them most:
      // Win-path color for 5-kind
      if (best?.type === '5kind' && card.color === best.color) score += 90;
      // Blue = counter capability; prioritize above win-path when we hold the win card
      if (card.color === 'blue') score += holdingWinCard ? 95 : 65;
      // Missing color for rainbow
      if (best?.type === 'rainbow' && !fieldColors.has(card.color)) score += 75;
      return { card, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].card;
  }

  private doRedPick(opponent: PlayerState, random: boolean) {
    if (opponent.field.length === 0) {
      this.engine.effectResponse(this.playerId, { type: 'red_pick', targetCardId: undefined });
      return;
    }
    const target = random
      ? opponent.field[Math.floor(Math.random() * opponent.field.length)]
      : (chooseBestRedTarget(opponent.field, getWinPaths(opponent)) ?? opponent.field[0]);
    this.engine.effectResponse(this.playerId, { type: 'red_pick', targetCardId: target.id });
  }

  private doGreenPick(me: PlayerState, random: boolean) {
    if (me.graveyard.length === 0) {
      this.engine.effectResponse(this.playerId, { type: 'green_pick', targetCardId: undefined });
      return;
    }
    const target = random
      ? me.graveyard[Math.floor(Math.random() * me.graveyard.length)]
      : (chooseBestGreenTarget(me.graveyard, me.field, getWinPaths(me)) ?? me.graveyard[0]);
    this.engine.effectResponse(this.playerId, { type: 'green_pick', targetCardId: target.id });
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
