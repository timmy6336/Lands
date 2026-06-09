// ─────────────────────────────────────────────────────────────────────────────
// server/src/ai/MasterAI.ts
//
// Perfect-information minimax with alpha-beta pruning for the Master difficulty.
// The AI has complete knowledge of both players' decks (exact order), hands,
// fields, and graveyards. It builds a game tree from the current state, finds
// all paths to victory/defeat, and picks the move that maximises its own win
// probability — accounting for the possibility that the opponent plays sub-
// optimally (standard minimax guarantees the minimax value against any opponent).
//
// Deck shuffles are non-deterministic: when a draw would trigger a graveyard
// reshuffle, the branch is stopped and evaluated heuristically. The real game
// rebuilds the tree after every shuffle automatically (re-entry via decideMaster).
//
// Entry point: decideMaster(gameState, aiIndex, timeLimitMs) → SimMove
// ─────────────────────────────────────────────────────────────────────────────
import { Card, Color, GameState, ALL_COLORS } from '../../../shared/types';

// ── Simulation types ──────────────────────────────────────────────────────────

interface SimPlayer {
  hand:      Card[];
  deck:      Card[];
  field:     Card[];
  graveyard: Card[];
}

type SimPhase =
  | 'playing_play'
  | 'counter_window'
  | 'counter_response'
  | 'effect_red_pick'
  | 'effect_green_pick'
  | 'effect_blue_look'
  | 'effect_black_show'
  | 'effect_black_pick'
  | 'ended';

interface SimChainEntry { type: 'play' | 'counter' | 'counter_counter'; }

interface SimEffect {
  type: 'red_pick' | 'green_pick' | 'blue_look' | 'black_show' | 'black_pick';
  shownCards?: Card[];
  topCard?:    Card;
}

interface SimState {
  players:            [SimPlayer, SimPlayer];
  currentPlayerIndex: 0 | 1;
  phase:              SimPhase;
  pendingPlay?:       Card;
  counterChain:       SimChainEntry[];
  pendingEffect?:     SimEffect;
  winner?:            0 | 1 | 'draw';
  shuffleNeeded?:     boolean;
}

export type SimMove =
  | { type: 'play_card';            cardId:   string }
  | { type: 'counter';              blueId:   string; matchId:  string }
  | { type: 'pass_counter' }
  | { type: 'counter_counter';      blue1Id:  string; blue2Id:  string }
  | { type: 'pass_counter_counter' }
  | { type: 'red_pick';             targetId: string }
  | { type: 'green_pick';           targetId: string }
  | { type: 'blue_look';            keepOnTop: boolean }
  | { type: 'black_show';           cardIds:  string[] }
  | { type: 'black_pick';           targetId: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const WIN_SCORE       = 1_000_000;
const MAX_DEPTH       = 20;

// ── State conversion ──────────────────────────────────────────────────────────

export function fromGameState(gs: GameState): SimState {
  const sp = (i: 0 | 1): SimPlayer => ({
    hand:      [...gs.players[i].hand],
    deck:      [...gs.players[i].deck],
    field:     [...gs.players[i].field],
    graveyard: [...gs.players[i].graveyard],
  });
  return {
    players:            [sp(0), sp(1)],
    currentPlayerIndex: gs.currentPlayerIndex,
    phase:              gs.phase as SimPhase,
    pendingPlay:        gs.pendingPlay,
    counterChain:       gs.counterChain.map(e => ({ type: e.type })),
    pendingEffect:      gs.pendingEffect
      ? { type: gs.pendingEffect.type as SimEffect['type'],
          shownCards: gs.pendingEffect.shownCards,
          topCard:    gs.pendingEffect.topCard }
      : undefined,
    winner: gs.winner,
  };
}

// ── Cloning ───────────────────────────────────────────────────────────────────

function clonePlayer(p: SimPlayer): SimPlayer {
  return { hand: [...p.hand], deck: [...p.deck], field: [...p.field], graveyard: [...p.graveyard] };
}

function cloneState(s: SimState): SimState {
  return {
    players:            [clonePlayer(s.players[0]), clonePlayer(s.players[1])],
    currentPlayerIndex: s.currentPlayerIndex,
    phase:              s.phase,
    pendingPlay:        s.pendingPlay,
    counterChain:       [...s.counterChain],
    pendingEffect:      s.pendingEffect
      ? { ...s.pendingEffect, shownCards: s.pendingEffect.shownCards ? [...s.pendingEffect.shownCards] : undefined }
      : undefined,
    winner:       s.winner,
    shuffleNeeded: s.shuffleNeeded,
  };
}

// ── Win check (mirrors WinChecker.ts) ─────────────────────────────────────────

function checkSimWin(field: Card[]): boolean {
  if (field.length < 5) return false;
  const counts = new Map<Color, number>();
  for (const c of field) counts.set(c.color, (counts.get(c.color) ?? 0) + 1);
  for (const v of counts.values()) if (v >= 5) return true;
  return counts.size >= 5;
}

function isWinningCard(card: Card, field: Card[]): boolean {
  const f = [...field, card];
  const m = new Map<Color, number>();
  for (const c of f) m.set(c.color, (m.get(c.color) ?? 0) + 1);
  for (const v of m.values()) if (v >= 5) return true;
  return m.size >= 5;
}

// ── Move application (clones before mutating) ─────────────────────────────────

export function applyMove(state: SimState, move: SimMove): SimState {
  return applyMut(cloneState(state), move);
}

function applyMut(s: SimState, move: SimMove): SimState {
  const cur = s.currentPlayerIndex;
  const di  = (1 - cur) as 0 | 1;

  switch (move.type) {

    case 'play_card': {
      const p = s.players[cur];
      const i = p.hand.findIndex(c => c.id === move.cardId);
      if (i === -1) return s;
      const [card] = p.hand.splice(i, 1);
      s.pendingPlay   = card;
      s.counterChain  = [{ type: 'play' }];
      s.phase         = 'counter_window';
      return s;
    }

    case 'pass_counter':
    case 'pass_counter_counter':
      return resolveChainMut(s);

    case 'counter': {
      moveCard(s.players[di].hand, move.blueId,  s.players[di].graveyard);
      moveCard(s.players[di].hand, move.matchId, s.players[di].graveyard);
      s.counterChain.push({ type: 'counter' });
      s.phase = 'counter_response';
      return s;
    }

    case 'counter_counter': {
      moveCard(s.players[cur].hand, move.blue1Id, s.players[cur].graveyard);
      moveCard(s.players[cur].hand, move.blue2Id, s.players[cur].graveyard);
      s.counterChain.push({ type: 'counter_counter' });
      s.phase = 'counter_window';
      return s;
    }

    case 'red_pick':
      moveCard(s.players[di].field, move.targetId, s.players[di].graveyard);
      s.pendingEffect = undefined;
      return endTurnMut(s);

    case 'green_pick': {
      const gi = s.players[cur].graveyard.findIndex(c => c.id === move.targetId);
      if (gi !== -1) {
        const [card] = s.players[cur].graveyard.splice(gi, 1);
        s.players[cur].hand.push(card);
      }
      s.pendingEffect = undefined;
      return endTurnMut(s);
    }

    case 'blue_look': {
      const att = s.players[cur];
      if (!move.keepOnTop && att.deck.length > 0) {
        att.deck.push(att.deck.shift()!);
      }
      s.pendingEffect = undefined;
      return endTurnMut(s);
    }

    case 'black_show': {
      const shown = move.cardIds
        .map(id => s.players[di].hand.find(c => c.id === id))
        .filter((c): c is Card => !!c);
      s.pendingEffect = { type: 'black_pick', shownCards: shown };
      s.phase         = 'effect_black_pick';
      return s;
    }

    case 'black_pick':
      moveCard(s.players[di].hand, move.targetId, s.players[di].graveyard);
      s.pendingEffect = undefined;
      return endTurnMut(s);
  }
}

function moveCard(from: Card[], id: string, to: Card[]): void {
  const i = from.findIndex(c => c.id === id);
  if (i !== -1) to.push(...from.splice(i, 1));
}

function resolveChainMut(s: SimState): SimState {
  const len  = s.counterChain.length;
  const top  = s.counterChain[len - 1];
  const card = s.pendingPlay!;
  // Even chain length after a counter/cc entry = negated; odd = resolves
  const negated = (top.type === 'counter' || top.type === 'counter_counter') && len % 2 === 0;

  s.pendingPlay  = undefined;
  s.counterChain = [];

  if (negated) {
    s.players[s.currentPlayerIndex].graveyard.push(card);
    return endTurnMut(s);
  }

  s.players[s.currentPlayerIndex].field.push(card);
  if (checkSimWin(s.players[s.currentPlayerIndex].field)) {
    s.winner = s.currentPlayerIndex;
    s.phase  = 'ended';
    return s;
  }
  return fireEffectMut(s, card);
}

function fireEffectMut(s: SimState, card: Card): SimState {
  const cur = s.currentPlayerIndex;
  const di  = (1 - cur) as 0 | 1;
  const att = s.players[cur];
  const def = s.players[di];

  switch (card.color as Color) {
    case 'white': {
      // Draw 1 for attacker — stop if shuffle required
      if (att.deck.length === 0 && att.graveyard.length > 0) { s.shuffleNeeded = true; return s; }
      if (att.deck.length > 0) att.hand.push(att.deck.shift()!);
      return endTurnMut(s);
    }
    case 'red': {
      if (def.field.length === 0) return endTurnMut(s);
      s.pendingEffect = { type: 'red_pick' };
      s.phase         = 'effect_red_pick';
      return s;
    }
    case 'green': {
      if (att.graveyard.length === 0) return endTurnMut(s);
      s.pendingEffect = { type: 'green_pick' };
      s.phase         = 'effect_green_pick';
      return s;
    }
    case 'blue': {
      if (att.deck.length === 0 && att.graveyard.length > 0) { s.shuffleNeeded = true; return s; }
      if (att.deck.length === 0) return endTurnMut(s);
      s.pendingEffect = { type: 'blue_look', topCard: att.deck[0] };
      s.phase         = 'effect_blue_look';
      return s;
    }
    case 'black': {
      if (def.hand.length === 0) return endTurnMut(s);
      s.pendingEffect = { type: 'black_show' };
      s.phase         = 'effect_black_show';
      return s;
    }
  }
}

function endTurnMut(s: SimState): SimState {
  s.currentPlayerIndex = s.currentPlayerIndex === 0 ? 1 : 0;
  s.pendingEffect      = undefined;
  const dp = s.players[s.currentPlayerIndex];

  // Shuffle required: graveyard must be randomised → can't model deterministically
  if (dp.deck.length === 0 && dp.graveyard.length > 0) {
    s.shuffleNeeded = true;
    return s;
  }
  if (dp.deck.length > 0) dp.hand.push(dp.deck.shift()!);
  s.phase = 'playing_play';
  return s;
}

// ── Move generation ───────────────────────────────────────────────────────────

export function getLegalMoves(state: SimState): SimMove[] {
  if (state.winner !== undefined || state.shuffleNeeded) return [];

  const cur = state.currentPlayerIndex;
  const di  = (1 - cur) as 0 | 1;

  switch (state.phase) {

    case 'playing_play':
      return state.players[cur].hand.map(c => ({ type: 'play_card' as const, cardId: c.id }));

    case 'counter_window': {
      const def     = state.players[di];
      const pending = state.pendingPlay!;
      const blues   = def.hand.filter(c => c.color === 'blue');
      const moves: SimMove[] = [{ type: 'pass_counter' }];

      if (pending.color === 'blue') {
        if (blues.length >= 2)
          moves.push({ type: 'counter', blueId: blues[0].id, matchId: blues[1].id });
      } else {
        const matchCard = def.hand.find(c => c.color === pending.color);
        if (blues.length >= 1 && matchCard) {
          const blue = blues[0];
          const safe = matchCard.id !== blue.id
            ? matchCard
            : def.hand.find(c => c.color === pending.color && c.id !== blue.id);
          if (safe) moves.push({ type: 'counter', blueId: blue.id, matchId: safe.id });
        }
      }
      return moves;
    }

    case 'counter_response': {
      const blues  = state.players[cur].hand.filter(c => c.color === 'blue');
      const moves: SimMove[] = [{ type: 'pass_counter_counter' }];
      if (blues.length >= 2)
        moves.push({ type: 'counter_counter', blue1Id: blues[0].id, blue2Id: blues[1].id });
      return moves;
    }

    case 'effect_red_pick':
      return state.players[di].field.map(c => ({ type: 'red_pick' as const, targetId: c.id }));

    case 'effect_green_pick':
      return state.players[cur].graveyard.map(c => ({ type: 'green_pick' as const, targetId: c.id }));

    case 'effect_blue_look':
      return [{ type: 'blue_look', keepOnTop: true }, { type: 'blue_look', keepOnTop: false }];

    case 'effect_black_show':
      return blackShowMoves(state.players[di].hand);

    case 'effect_black_pick': {
      const shown = state.pendingEffect?.shownCards ?? [];
      return shown.map(c => ({ type: 'black_pick' as const, targetId: c.id }));
    }

    default:
      return [];
  }
}

/**
 * Generate up to 8 strategic subsets of 3 cards for the defender to reveal.
 * Defender wants to hide blues and win-path cards; we generate the "cheapest"
 * options plus a few alternatives so the tree explores meaningful variation.
 */
function blackShowMoves(hand: Card[]): SimMove[] {
  if (hand.length <= 3)
    return [{ type: 'black_show', cardIds: hand.map(c => c.id) }];

  // Score each card from defender's viewpoint: higher = more protective to hide
  const scored = hand.map(card => {
    let s = 0;
    if (card.color === 'blue') s += 100;           // never reveal blues
    const copies = hand.filter(c => c.color === card.color).length;
    s -= copies * 8;                               // duplicates are cheaper to reveal
    return { card, s };
  }).sort((a, b) => a.s - b.s);                   // lowest first = most willing to show

  const seen = new Set<string>();
  const results: string[][] = [];

  const add = (cards: Card[]) => {
    if (cards.length !== 3) return;
    const key = cards.map(c => c.id).sort().join(',');
    if (seen.has(key)) return;
    seen.add(key);
    results.push(cards.map(c => c.id));
  };

  // Best for defender: show the 3 cheapest
  add(scored.slice(0, 3).map(x => x.card));
  // Worst for defender (tests attacker's best-case pick)
  add(scored.slice(-3).map(x => x.card));
  // Mix variants to give the tree meaningful exploration
  for (let i = 0; i < scored.length - 2 && results.length < 8; i++) {
    for (let j = i + 1; j < scored.length - 1 && results.length < 8; j++) {
      for (let k = j + 1; k < scored.length && results.length < 8; k++) {
        add([scored[i].card, scored[j].card, scored[k].card]);
      }
    }
  }

  return results.slice(0, 8).map(ids => ({ type: 'black_show' as const, cardIds: ids }));
}

// ── Win-path analysis (for evaluation) ───────────────────────────────────────

interface WinPath { type: '5kind' | 'rainbow'; color?: Color; cardsNeeded: number; }

function getWinPaths(player: SimPlayer): WinPath[] {
  const fieldCounts = new Map<Color, number>();
  for (const c of player.field) fieldCounts.set(c.color, (fieldCounts.get(c.color) ?? 0) + 1);

  const paths: WinPath[] = [];

  for (const color of ALL_COLORS) {
    const onField = fieldCounts.get(color) ?? 0;
    if (onField === 0) continue;
    paths.push({ type: '5kind', color, cardsNeeded: Math.max(0, 5 - onField) });
  }

  if (fieldCounts.size > 0)
    paths.push({ type: 'rainbow', cardsNeeded: Math.max(0, 5 - fieldCounts.size) });

  return paths.sort((a, b) => a.cardsNeeded - b.cardsNeeded);
}

function proximityValue(n: number): number {
  // Exponential scale so "1 away" >> "2 away"
  return n <= 0 ? WIN_SCORE
       : n === 1 ? 600
       : n === 2 ? 200
       : n === 3 ? 65
       : n === 4 ? 18
       : 4;
}

// ── Heuristic evaluation ──────────────────────────────────────────────────────

function evaluate(state: SimState, aiIdx: 0 | 1): number {
  if (state.winner === aiIdx)                                  return  WIN_SCORE;
  if (state.winner !== undefined && state.winner !== 'draw')   return -WIN_SCORE;
  if (state.winner === 'draw')                                 return  0;

  const ai  = state.players[aiIdx];
  const opp = state.players[1 - aiIdx as 0 | 1];

  const aiPaths  = getWinPaths(ai);
  const oppPaths = getWinPaths(opp);

  let score = 0;

  // ── Win proximity (dominant factor) ────────────────────────────────────────
  const aiBest  = aiPaths[0]?.cardsNeeded  ?? 5;
  const oppBest = oppPaths[0]?.cardsNeeded ?? 5;
  score += proximityValue(aiBest) - proximityValue(oppBest);

  // ── Multiple near-win paths (resilience) ───────────────────────────────────
  const aiNear  = aiPaths.filter(p => p.cardsNeeded <= 2).length;
  const oppNear = oppPaths.filter(p => p.cardsNeeded <= 2).length;
  score += (aiNear - oppNear) * 28;

  // ── Winning cards in hand right now ────────────────────────────────────────
  const aiWin  = ai.hand.filter(c => isWinningCard(c, ai.field)).length;
  const oppWin = opp.hand.filter(c => isWinningCard(c, opp.field)).length;
  score += (aiWin - oppWin) * 90;

  // ── Blue count (counter capability) ───────────────────────────────────────
  const aiBlues  = ai.hand.filter(c => c.color === 'blue').length;
  const oppBlues = opp.hand.filter(c => c.color === 'blue').length;
  score += (aiBlues - oppBlues) * 20;
  // CC capability bonus (2+ blues = can defend a winning play)
  if (aiBlues  >= 2) score += 38;
  if (oppBlues >= 2) score -= 38;

  // ── Cards in hand that advance best win path ───────────────────────────────
  for (const p of aiPaths.slice(0, 2)) {
    if (p.type === '5kind' && p.color) {
      score += ai.hand.filter(c => c.color === p.color).length * 14;
    }
  }
  for (const p of oppPaths.slice(0, 2)) {
    if (p.type === '5kind' && p.color) {
      score -= opp.hand.filter(c => c.color === p.color).length * 14;
    }
  }

  // ── Field size and hand size ──────────────────────────────────────────────
  score += (ai.field.length  - opp.field.length)  * 8;
  score += (ai.hand.length   - opp.hand.length)   * 5;

  return score;
}

// ── Move ordering (for alpha-beta efficiency) ─────────────────────────────────

function quickScore(move: SimMove, state: SimState, aiIdx: 0 | 1): number {
  const cur = state.currentPlayerIndex;
  const di  = (1 - cur) as 0 | 1;
  const me  = state.players[aiIdx];
  const opp = state.players[1 - aiIdx as 0 | 1];

  switch (move.type) {
    case 'play_card': {
      const card = me.hand.find(c => c.id === move.cardId);
      if (!card) return 0;
      if (isWinningCard(card, me.field)) return 1000;
      const oppThreat = getWinPaths(opp)[0]?.cardsNeeded ?? 5;
      if (oppThreat <= 1 && card.color === 'red') return 900;
      if (card.color === 'black' && opp.hand.length > 0) return 420;
      if (card.color === 'red'   && opp.field.length > 0) return 370;
      if (card.color === 'green' && me.graveyard.length > 0) return 340;
      if (card.color === 'white') return 200;
      return 150;
    }
    case 'counter':              return 500;
    case 'pass_counter':         return 100;
    case 'counter_counter':      return 500;
    case 'pass_counter_counter': return 100;
    case 'red_pick': {
      const t = state.players[di].field.find(c => c.id === move.targetId);
      if (!t) return 0;
      const copies = state.players[di].field.filter(c => c.color === t.color).length;
      return copies === 1 ? 500 : 200;
    }
    case 'green_pick': {
      const t = state.players[cur].graveyard.find(c => c.id === move.targetId);
      if (!t) return 0;
      if (isWinningCard(t, state.players[cur].field)) return 1000;
      return t.color === 'blue' ? 400 : 250;
    }
    case 'blue_look': {
      const top = state.pendingEffect?.topCard;
      if (!top) return 200;
      const useful = isWinningCard(top, state.players[cur].field) || top.color === 'blue';
      return move.keepOnTop ? (useful ? 800 : 300) : (useful ? 0 : 400);
    }
    case 'black_show': return 300;
    case 'black_pick': {
      const shown = state.pendingEffect?.shownCards ?? [];
      const t = shown.find(c => c.id === move.targetId);
      if (!t) return 0;
      if (isWinningCard(t, state.players[di].field)) return 1000;
      return t.color === 'blue' ? 600 : 300;
    }
  }
}

function orderMoves(moves: SimMove[], state: SimState, aiIdx: 0 | 1, isMax: boolean): SimMove[] {
  if (moves.length <= 1) return moves;
  const scored = moves.map(m => ({ m, s: quickScore(m, state, aiIdx) }));
  scored.sort((a, b) => isMax ? b.s - a.s : a.s - b.s);
  return scored.map(x => x.m);
}

// ── Who is the decision-maker in the current phase? ───────────────────────────

function isAIMove(state: SimState, aiIdx: 0 | 1): boolean {
  switch (state.phase) {
    // Current player acts
    case 'playing_play':
    case 'counter_response':
    case 'effect_blue_look':
    case 'effect_red_pick':
    case 'effect_green_pick':
    case 'effect_black_pick':
      return state.currentPlayerIndex === aiIdx;
    // Defender (non-current player) acts
    case 'counter_window':
    case 'effect_black_show':
      return state.currentPlayerIndex !== aiIdx;
    default:
      return state.currentPlayerIndex === aiIdx;
  }
}

// ── Alpha-beta minimax ────────────────────────────────────────────────────────

function alphaBeta(
  state: SimState,
  depth: number,
  alpha: number,
  beta: number,
  aiIdx: 0 | 1,
): number {
  // Terminal: game over
  if (state.winner === aiIdx)                                return  WIN_SCORE;
  if (state.winner !== undefined && state.winner !== 'draw') return -WIN_SCORE;
  if (state.winner === 'draw')                               return  0;

  // Leaf: depth exhausted or shuffle boundary
  if (state.shuffleNeeded || depth <= 0) return evaluate(state, aiIdx);

  const moves = getLegalMoves(state);
  if (moves.length === 0) return evaluate(state, aiIdx);

  const isMax  = isAIMove(state, aiIdx);
  const ordered = orderMoves(moves, state, aiIdx, isMax);

  if (isMax) {
    let v = -Infinity;
    for (const move of ordered) {
      v = Math.max(v, alphaBeta(applyMove(state, move), depth - 1, alpha, beta, aiIdx));
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break; // β-cutoff
    }
    return v;
  } else {
    let v = Infinity;
    for (const move of ordered) {
      v = Math.min(v, alphaBeta(applyMove(state, move), depth - 1, alpha, beta, aiIdx));
      beta = Math.min(beta, v);
      if (beta <= alpha) break; // α-cutoff
    }
    return v;
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Decide the best move from the current game state using iterative-deepening
 * alpha-beta minimax with a hard time limit.  Always returns a valid move;
 * returns immediately for single-move situations (no search needed).
 */
export function decideMaster(
  gameState: GameState,
  aiIdx:     0 | 1,
  timeLimitMs = 1500,
): SimMove {
  const root  = fromGameState(gameState);
  const moves = getLegalMoves(root);

  if (moves.length === 0) throw new Error('Master AI: no legal moves in state ' + root.phase);
  if (moves.length === 1) return moves[0];

  const start = Date.now();
  let bestMove  = orderMoves(moves, root, aiIdx, true)[0]; // start with quick heuristic pick
  let bestValue = -Infinity;

  for (let depth = 2; depth <= MAX_DEPTH; depth++) {
    if (Date.now() - start >= timeLimitMs * 0.72) break; // leave time margin for final answer

    let depthBest  = bestMove;
    let depthBestV = -Infinity;
    const ordered  = orderMoves(moves, root, aiIdx, true);

    for (const move of ordered) {
      if (Date.now() - start >= timeLimitMs) { bestMove = depthBest; return bestMove; }

      const child = applyMove(root, move);
      const val   = alphaBeta(child, depth - 1, -Infinity, Infinity, aiIdx);

      if (val > depthBestV) {
        depthBestV = val;
        depthBest  = move;
      }
      if (val >= WIN_SCORE) break; // forced win found — no need to explore siblings
    }

    // Only accept a complete depth's result
    if (Date.now() - start < timeLimitMs) {
      if (depthBestV > bestValue || depth === 2) {
        bestValue = depthBestV;
        bestMove  = depthBest;
      }
    }

    if (bestValue >= WIN_SCORE) break; // guaranteed win — stop searching
  }

  return bestMove;
}
