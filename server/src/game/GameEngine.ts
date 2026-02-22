import { v4 as uuidv4 } from 'uuid';
import {
  GameState, GamePhase, PlayerState, Card, Color,
  Customizations, DEFAULT_CUSTOMIZATIONS, GameSettings,
  CounterChainEntry, PendingEffect,
} from '../../../shared/types';
import { buildDeck, shuffle } from './DeckBuilder';
import { checkWin } from './WinChecker';

const STARTING_HAND = 5;

// ── helpers ─────────────────────────────────────────────────────────────────

function makePlayer(id: string, name: string): PlayerState {
  const deck = buildDeck();
  const hand = deck.splice(0, STARTING_HAND);
  return {
    id, name,
    deck, hand, handCount: hand.length,
    deckCount: deck.length,
    field: [], graveyard: [], graveyardCount: 0,
    customizations: { ...DEFAULT_CUSTOMIZATIONS },
    isConnected: true,
  };
}

function ensureDeckHasCards(player: PlayerState): void {
  if (player.deck.length === 0 && player.graveyard.length > 0) {
    player.deck = shuffle([...player.graveyard]);
    player.graveyard = [];
    player.graveyardCount = 0;
    player.deckCount = player.deck.length;
  }
}

function drawOne(player: PlayerState): Card | null {
  ensureDeckHasCards(player);
  const card = player.deck.shift();
  if (!card) return null;
  player.hand.push(card);
  player.handCount = player.hand.length;
  player.deckCount = player.deck.length;
  return card;
}

function removeFromHand(player: PlayerState, cardId: string): Card | undefined {
  const idx = player.hand.findIndex(c => c.id === cardId);
  if (idx === -1) return undefined;
  const [card] = player.hand.splice(idx, 1);
  player.handCount = player.hand.length;
  return card;
}

function discardToGraveyard(player: PlayerState, card: Card): void {
  player.graveyard.push(card);
  player.graveyardCount = player.graveyard.length;
}

// ── GameEngine class ─────────────────────────────────────────────────────────

export class GameEngine {
  state: GameState;

  /** Full unsanitized snapshots captured at every state change — used for replays */
  replaySnapshots: GameState[] = [];

  /** Timers stored outside state (they don't need to be serialised to clients) */
  private counterTimer: ReturnType<typeof setTimeout> | null = null;

  /** Called whenever state changes — wired up by the socket handler */
  onStateChange: (state: GameState) => void = () => {};

  constructor(
    roomCode: string,
    p0: { id: string; name: string },
    p1: { id: string; name: string },
    settings: GameSettings,
  ) {
    const players: [PlayerState, PlayerState] = [
      makePlayer(p0.id, p0.name),
      makePlayer(p1.id, p1.name),
    ];

    this.state = {
      gameId: uuidv4(),
      roomCode,
      players,
      currentPlayerIndex: 0,
      phase: 'playing_draw',
      turnNumber: 1,
      counterChain: [],
      settings,
    };

    // Player 0 doesn't draw on turn 1 — skip straight to play phase
    this.state.phase = 'playing_play';
    this.emit();
  }

  // ── public API (called by socket handlers) ─────────────────────────────────

  surrender(playerId: string) {
    const s = this.state;
    if (s.phase === 'ended') return;
    const pi = this.getPlayerIndex(playerId);
    if (pi === -1) return;
    s.phase = 'ended';
    s.winner = (1 - pi) as 0 | 1;
    s.winReason = `${s.players[pi].name} surrendered.`;
    this.emit();
  }

  applyCustomization(playerId: string, customizations: Customizations) {
    const player = this.getPlayerById(playerId);
    if (!player) return;
    player.customizations = customizations;
    this.emit();
  }

  setReady(playerId: string) {
    // "ready" is handled by RoomManager before the engine starts; ignore here
  }

  drawCard(playerId: string) {
    const s = this.state;
    const pi = this.getPlayerIndex(playerId);
    if (pi !== s.currentPlayerIndex) return;
    if (s.phase !== 'playing_draw') return;

    drawOne(s.players[pi]);
    s.phase = 'playing_play';
    this.emit();
  }

  playCard(playerId: string, cardId: string) {
    const s = this.state;
    const pi = this.getPlayerIndex(playerId);
    if (pi !== s.currentPlayerIndex) return;
    if (s.phase !== 'playing_play') return;

    const player = s.players[pi];
    const card = removeFromHand(player, cardId);
    if (!card) return;

    s.pendingPlay = card;
    s.counterChain = [{ playerId, type: 'play', card }];

    s.phase = 'counter_window';
    this.startCounterTimer(() => this.resolveCounterWindow());
    this.emit();
  }

  counterResponse(playerId: string, countering: boolean, blueCardId?: string, matchingCardId?: string) {
    const s = this.state;
    if (s.phase !== 'counter_window') return;
    const defenderIndex = (1 - s.currentPlayerIndex) as 0 | 1;
    if (this.getPlayerIndex(playerId) !== defenderIndex) return;

    this.clearCounterTimer();

    if (countering && blueCardId && matchingCardId) {
      const defender = s.players[defenderIndex];
      const blueCard = removeFromHand(defender, blueCardId);
      const matchCard = removeFromHand(defender, matchingCardId);
      if (!blueCard || !matchCard || blueCard.color !== 'blue') {
        // Invalid — treat as pass
        if (blueCard) defender.hand.push(blueCard);
        if (matchCard) defender.hand.push(matchCard);
        this.resolveCounterWindow();
        return;
      }
      discardToGraveyard(defender, blueCard);
      discardToGraveyard(defender, matchCard);
      s.counterChain.push({ playerId, type: 'counter', card: blueCard, extraCard: matchCard });
      // Now attacker can counter-counter
      s.phase = 'counter_response';
      this.startCounterTimer(() => this.resolveCounterWindow());
      this.emit();
    } else {
      this.resolveCounterWindow();
    }
  }

  counterCounterResponse(playerId: string, countering: boolean, blueCard1Id?: string, blueCard2Id?: string) {
    const s = this.state;
    if (s.phase !== 'counter_response') return;
    if (this.getPlayerIndex(playerId) !== s.currentPlayerIndex) return;

    this.clearCounterTimer();

    if (countering && blueCard1Id && blueCard2Id) {
      const attacker = s.players[s.currentPlayerIndex];
      const b1 = removeFromHand(attacker, blueCard1Id);
      const b2 = removeFromHand(attacker, blueCard2Id);
      if (!b1 || !b2 || b1.color !== 'blue' || b2.color !== 'blue') {
        if (b1) attacker.hand.push(b1);
        if (b2) attacker.hand.push(b2);
        this.resolveCounterWindow();
        return;
      }
      discardToGraveyard(attacker, b1);
      discardToGraveyard(attacker, b2);
      s.counterChain.push({ playerId, type: 'counter_counter', card: b1, extraCard: b2 });
      // Now defender can counter again
      s.phase = 'counter_window';
      this.startCounterTimer(() => this.resolveCounterWindow());
      this.emit();
    } else {
      this.resolveCounterWindow();
    }
  }

  effectResponse(playerId: string, data: { type: string; [key: string]: unknown }) {
    const s = this.state;
    const pi = this.getPlayerIndex(playerId);

    switch (s.phase) {
      case 'effect_red_pick':
        if (pi !== s.currentPlayerIndex) return;
        this.resolveRedPick(data.targetCardId as string | undefined);
        break;

      case 'effect_green_pick':
        if (pi !== s.currentPlayerIndex) return;
        this.resolveGreenPick(data.targetCardId as string | undefined);
        break;

      case 'effect_blue_look':
        if (pi !== s.currentPlayerIndex) return;
        this.resolveBlueLook(data.keepOnTop as boolean);
        break;

      case 'effect_black_show': {
        // Opponent (defender) is selecting which 3 cards to show
        const defenderIndex = 1 - s.currentPlayerIndex;
        if (pi !== defenderIndex) return;
        const cardIds = data.cardIds as string[];
        this.resolveBlackShow(cardIds);
        break;
      }

      case 'effect_black_pick':
        if (pi !== s.currentPlayerIndex) return;
        this.resolveBlackPick(data.targetCardId as string);
        break;

      default:
        break;
    }
  }

  playerDisconnected(playerId: string) {
    const player = this.getPlayerById(playerId);
    if (player) player.isConnected = false;
    this.emit();
  }

  playerReconnected(playerId: string) {
    const player = this.getPlayerById(playerId);
    if (player) player.isConnected = true;
    this.emit();
  }

  // ── Counter chain resolution ───────────────────────────────────────────────

  private resolveCounterWindow() {
    const s = this.state;
    // Top of chain determines fate of pendingPlay
    const top = s.counterChain[s.counterChain.length - 1];
    const pendingCard = s.pendingPlay!;

    if (top.type === 'counter' || top.type === 'counter_counter') {
      // The last action in the chain was a counter (odd length after play means countered)
      // Chain length: 1=play, 2=counter, 3=counter-counter, 4=counter, ...
      // If chain length is even the top is a counter → card is negated
      const chainLen = s.counterChain.length;
      const isNegated = chainLen % 2 === 0; // play=1(odd), counter=2(even), cc=3(odd)...

      if (isNegated) {
        // Card is countered — goes to attacker's graveyard
        const attacker = s.players[s.currentPlayerIndex];
        discardToGraveyard(attacker, pendingCard);
        s.pendingPlay = undefined;
        s.counterChain = [];
        this.endTurn();
        return;
      }
    }

    // Card resolves normally — move to field
    s.players[s.currentPlayerIndex].field.push(pendingCard);
    s.pendingPlay = undefined;
    s.counterChain = [];

    // Check win before firing effect (effect could modify state further)
    if (checkWin(s.players[s.currentPlayerIndex].field)) {
      this.declareWinner(s.currentPlayerIndex);
      return;
    }

    // Fire card effect
    this.fireEffect(pendingCard);
  }

  // ── Card effects ──────────────────────────────────────────────────────────

  private fireEffect(card: Card) {
    const s = this.state;
    const attacker = s.players[s.currentPlayerIndex];
    const defender = s.players[(1 - s.currentPlayerIndex) as 0 | 1];

    switch (card.color as Color) {
      case 'white': {
        // Draw 1 card
        drawOne(attacker);
        this.endTurn();
        break;
      }

      case 'red': {
        if (defender.field.length === 0) {
          // Fizzle — no targets
          this.endTurn();
        } else {
          s.pendingEffect = { type: 'red_pick' };
          s.phase = 'effect_red_pick';
          this.emit();
        }
        break;
      }

      case 'green': {
        if (attacker.graveyard.length === 0) {
          // Fizzle — nothing to retrieve
          this.endTurn();
        } else {
          s.pendingEffect = { type: 'green_pick' };
          s.phase = 'effect_green_pick';
          this.emit();
        }
        break;
      }

      case 'black': {
        if (defender.hand.length === 0) {
          // Fizzle
          this.endTurn();
        } else {
          s.pendingEffect = { type: 'black_show' };
          s.phase = 'effect_black_show';
          this.emit();
        }
        break;
      }

      case 'blue': {
        ensureDeckHasCards(attacker);
        if (attacker.deck.length === 0) {
          // Nothing to look at
          this.endTurn();
        } else {
          const topCard = attacker.deck[0];
          s.pendingEffect = { type: 'blue_look', topCard };
          s.phase = 'effect_blue_look';
          this.emit();
        }
        break;
      }
    }
  }

  private resolveRedPick(targetCardId: string | undefined) {
    const s = this.state;
    const defender = s.players[(1 - s.currentPlayerIndex) as 0 | 1];
    s.pendingEffect = undefined;

    if (targetCardId) {
      const idx = defender.field.findIndex(c => c.id === targetCardId);
      if (idx !== -1) {
        const [destroyed] = defender.field.splice(idx, 1);
        discardToGraveyard(defender, destroyed);
      }
    }
    this.endTurn();
  }

  private resolveGreenPick(targetCardId: string | undefined) {
    const s = this.state;
    const attacker = s.players[s.currentPlayerIndex];
    s.pendingEffect = undefined;

    if (targetCardId) {
      const idx = attacker.graveyard.findIndex(c => c.id === targetCardId);
      if (idx !== -1) {
        const [card] = attacker.graveyard.splice(idx, 1);
        attacker.graveyardCount = attacker.graveyard.length;
        attacker.hand.push(card);
        attacker.handCount = attacker.hand.length;
      }
    }
    this.endTurn();
  }

  private resolveBlueLook(keepOnTop: boolean) {
    const s = this.state;
    const attacker = s.players[s.currentPlayerIndex];
    s.pendingEffect = undefined;

    if (!keepOnTop && attacker.deck.length > 0) {
      const top = attacker.deck.shift()!;
      attacker.deck.push(top);
    }
    // deckCount doesn't change
    this.endTurn();
  }

  private resolveBlackShow(cardIds: string[]) {
    const s = this.state;
    const defender = s.players[(1 - s.currentPlayerIndex) as 0 | 1];

    // Validate — card must be in hand; cap at 3
    const valid: Card[] = [];
    for (const id of cardIds.slice(0, 3)) {
      const card = defender.hand.find(c => c.id === id);
      if (card) valid.push(card);
    }

    // If defender has ≤3 cards, they must show all
    const toShow = defender.hand.length <= 3 ? [...defender.hand] : valid;

    s.pendingEffect = { type: 'black_pick', shownCards: toShow };
    s.phase = 'effect_black_pick';
    this.emit();
  }

  private resolveBlackPick(targetCardId: string) {
    const s = this.state;
    const defender = s.players[(1 - s.currentPlayerIndex) as 0 | 1];
    s.pendingEffect = undefined;

    const card = removeFromHand(defender, targetCardId);
    if (card) discardToGraveyard(defender, card);

    this.endTurn();
  }

  // ── Turn management ────────────────────────────────────────────────────────

  private endTurn() {
    const s = this.state;
    s.currentPlayerIndex = s.currentPlayerIndex === 0 ? 1 : 0;
    s.turnNumber++;
    s.pendingEffect = undefined;
    // Auto-draw for the new active player
    drawOne(s.players[s.currentPlayerIndex]);
    s.phase = 'playing_play';
    this.emit();
  }

  // ── Win / end ──────────────────────────────────────────────────────────────

  private declareWinner(index: 0 | 1) {
    const s = this.state;
    const field = s.players[index].field;
    const colorCounts = new Map<string, number>();
    for (const c of field) colorCounts.set(c.color, (colorCounts.get(c.color) ?? 0) + 1);
    const fiveKind = [...colorCounts.entries()].find(([, v]) => v >= 5);

    s.winner = index;
    s.winReason = fiveKind
      ? `Five ${fiveKind[0]} lands on the field!`
      : 'One of each land on the field!';
    s.phase = 'ended';
    this.clearCounterTimer();
    this.emit();
  }

  // ── Timer helpers ──────────────────────────────────────────────────────────

  private startCounterTimer(cb: () => void) {
    this.clearCounterTimer();
    const limit = this.state.settings.counterTimeLimitSeconds;
    if (limit === null) {
      // Infinite — just set a far-future deadline so client can show "∞"
      this.state.counterDeadline = undefined;
      return;
    }
    this.state.counterDeadline = Date.now() + limit * 1000;
    this.counterTimer = setTimeout(() => {
      this.state.counterDeadline = undefined;
      cb();
    }, limit * 1000);
  }

  private clearCounterTimer() {
    if (this.counterTimer) {
      clearTimeout(this.counterTimer);
      this.counterTimer = null;
    }
    this.state.counterDeadline = undefined;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private emit() {
    // Deep-clone for the replay — captures full state including both hands
    this.replaySnapshots.push(JSON.parse(JSON.stringify(this.state)) as GameState);
    this.onStateChange(this.state);
  }

  private getPlayerById(id: string): PlayerState | undefined {
    return this.state.players.find(p => p.id === id);
  }

  private getPlayerIndex(id: string): 0 | 1 | -1 {
    const idx = this.state.players.findIndex(p => p.id === id);
    return idx as 0 | 1 | -1;
  }
}
