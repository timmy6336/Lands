// ─────────────────────────────────────────────────────────────────────────────
// shared/types.ts — the single source of truth for every type in the app
//
// This file is imported by ALL three packages: the React client, the Node server,
// and the Electron main process.  It has zero runtime dependencies (no imports
// from any package) and must stay that way so each package can import it without
// pulling in unintended code.
//
// Reading order if you want to understand the data model:
//   1. Color / Card          — the atomic game pieces
//   2. PlayerState           — one player’s full snapshot
//   3. GamePhase             — the state-machine diagram for a single game
//   4. GameState             — the whole game at one point in time
//   5. ReplayFile            — a saved sequence of GameState snapshots
//   6. ServerToClientEvents  — what the server can push to clients
//   7. ClientToServerEvents  — what clients can send to the server
// ─────────────────────────────────────────────────────────────────────────────

/** The five land colors available in the game. */
export type Color = 'white' | 'red' | 'blue' | 'green' | 'black';

export const ALL_COLORS: Color[] = ['white', 'red', 'blue', 'green', 'black'];

/** A card in a player's hand, deck, field, or graveyard. */
export interface Card {
  id: string;   // UUID, unique across the entire game
  color: Color;
}

export interface CardCustomization {
  displayName: string;
}

export type Customizations = Record<Color, CardCustomization>;

export const DEFAULT_CUSTOMIZATIONS: Customizations = {
  white: { displayName: 'White' },
  red:   { displayName: 'Red' },
  blue:  { displayName: 'Blue' },
  green: { displayName: 'Green' },
  black: { displayName: 'Black' },
};

/**
 * One player’s complete game state.
 * The server sanitizes this before sending to each client:
 *   - `hand` and `deck` are replaced with [] for the *opponent* (hidden information).
 *   - `handCount` and `deckCount` are always accurate so the UI can show counts.
*/
export interface PlayerState {
  id: string;
  name: string;
  deck: Card[];          // hidden from opponent (server sends [] for opponent)
  deckCount: number;
  hand: Card[];          // hidden from opponent (server sends [] for opponent)
  handCount: number;
  field: Card[];
  graveyard: Card[];     // visible (needed for Green effect targeting)
  graveyardCount: number;
  customizations: Customizations;
  isConnected: boolean;
}

/**
 * The full turn/phase state machine.  A game flows through these phases in order:
 *
 *   waiting → customizing → rps_pick → rps_choose
 *     → (game starts) → playing_play
 *         → [counter_window → [counter_response]] (repeating until chain resolves)
 *         → effect_* phases (zero or one per turn, depending on land color)
 *         → back to playing_play (next player’s turn)
 *     → ended
 *
 * Phases with the `pre_target_*` prefix are special: they occur BEFORE the counter
 * window for Red/Green cards so the attacker commits to a target, but that target
 * isn't revealed to the defender until the counter window resolves.  This prevents
 * the defender from using the target info to decide whether to counter.
 */
export type GamePhase =
  | 'waiting'            // 1 player in room, waiting for second
  | 'customizing'        // both players connected, customizing before ready
  | 'rps_pick'           // both players pick rock/paper/scissors simultaneously
  | 'rps_choose'         // RPS winner picks who goes first
  | 'playing_draw'       // active player must draw (auto, brief)
  | 'playing_play'       // active player selects a card to play
  | 'counter_window'     // defender's counter prompt is open
  | 'counter_response'   // attacker's counter-counter prompt is open
  | 'effect_black_show'  // opponent picks 3 cards to reveal (Black effect)
  | 'effect_black_pick'  // active player picks which card to discard
  | 'effect_blue_look'   // active player sees top card, decides top/bottom
  | 'pre_target_red'     // active player pre-selects red target before counter window
  | 'pre_target_green'   // active player pre-selects green target before counter window
  | 'effect_red_pick'    // active player picks opponent land to destroy
  | 'effect_green_pick'  // active player picks graveyard land to retrieve
  | 'ended';

export type RpsChoice = 'rock' | 'paper' | 'scissors';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Represents one step in the counter-chain for the current pending play.
 * Chain structure:
 *   [0] play          — the attacker’s land card
 *   [1] counter       — defender spends Blue + matching to negate it
 *   [2] counter_counter — attacker spends 2 Blue to negate the counter
 *   [3] counter (again) — and so on…
 * Chain length is odd → the play resolves; even → countered.
 */
export interface CounterChainEntry {
  playerId: string;
  type: 'play' | 'counter' | 'counter_counter';
  card: Card;
  extraCard?: Card;      // counter: the matching-color card discarded with the Blue
}

/**
 * Carries extra data needed by effect-resolution phases.
 * Only one PendingEffect exists at a time, matching the current GamePhase:
 *   black_show  — waiting for defender to reveal 3 cards
 *   black_pick  — attacker picks which revealed card to discard (shownCards filled in)
 *   blue_look   — attacker sees their deck’s top card (topCard filled in)
 *   red_pick    — attacker picks an opponent field card to destroy
 *   green_pick  — attacker picks a graveyard card to retrieve
 */
export interface PendingEffect {
  type: 'black_show' | 'black_pick' | 'blue_look' | 'red_pick' | 'green_pick';
  shownCards?: Card[];   // Black pick phase: cards opponent revealed
  topCard?: Card;        // Blue look phase: the top card
}

export interface ChatMessage {
  playerName: string;
  message: string;
}

export interface GameSettings {
  counterTimeLimitSeconds: number | null; // null = infinite (must click Pass)
  isSinglePlayer?: boolean;             // true when playing against AI
}

/**
 * The complete game snapshot at a single point in time.
 * This is what gets serialized and sent over the network,
 * stored in replay files, and held in React state on the client.
 */
export interface GameState {
  gameId: string;
  roomCode: string;
  players: [PlayerState, PlayerState];
  currentPlayerIndex: 0 | 1;
  phase: GamePhase;
  turnNumber: number;
  pendingPlay?: Card;           // card in-flight, awaiting counter resolution
  counterChain: CounterChainEntry[];
  counterDeadline?: number;     // unix ms, when counter window auto-closes
  pendingEffect?: PendingEffect;
  preTargetCardId?: string;     // card pre-selected before counter window (red/green)
  winner?: 0 | 1 | 'draw';
  winReason?: string;
  settings: GameSettings;
  rematchVotes?: [boolean, boolean]; // which players have voted for rematch
  /** Populated for one turn after an effect resolves, so the UI can show a result popup to the non-attacker. */
  effectResult?:
    | { type: 'red';   cardColor: Color; ownerName: string; attackerIndex: 0 | 1 }
    | { type: 'green'; cardColor: Color; ownerName: string; attackerIndex: 0 | 1 }
    | { type: 'blue';  keptOnTop: boolean;                  attackerIndex: 0 | 1 }
    | { type: 'black'; cardColor: Color; ownerName: string; attackerIndex: 0 | 1 };
  /** Set by server per-player so clients always know their own index */
  viewerIndex?: 0 | 1;
  /** Result of the most recent RPS round */
  rpsResult?: {
    picks: [RpsChoice, RpsChoice]; // [player0choice, player1choice]
    winner: 0 | 1 | 'draw';
  };
}

// ── Replay typings ───────────────────────────────────────────────────────────

export interface ReplayFile {
  id: string;
  date: string;                        // ISO date string
  playerNames: [string, string];
  winner: 0 | 1 | 'draw' | null;
  winReason?: string;
  turnCount: number;
  mode: 'single-player' | 'multiplayer';
  snapshots: GameState[];              // full unsanitized states (both hands visible)
}

// ── Socket event typings ────────────────────────────────────────────────────

/** Typed Socket.io events the server can push to connected clients. */
export interface ServerToClientEvents {
  game_state:          (state: GameState) => void;
  room_created:        (data: { roomCode: string }) => void;
  error:               (msg: string) => void;
  chat_message:        (data: ChatMessage) => void;
  replay_complete:     (replay: ReplayFile) => void;
  /** Sent while the player is waiting in the matchmaking queue. */
  matchmaking_status:  (data: { position: number; estimatedWait?: number }) => void;
  /** Sent to both players the moment a match is found. */
  matchmaking_found:   (data: { roomCode: string }) => void;
}

/** Typed Socket.io events clients can send to the server. */
export interface ClientToServerEvents {
  create_room:        (data: { playerName: string; settings: GameSettings }) => void;
  create_singleplayer:(data: { playerName: string; difficulty: AIDifficulty; settings: GameSettings }) => void;
  join_room:    (data: { roomCode: string; playerName: string }) => void;
  set_ready:    () => void;
  draw_card:    () => void;
  play_card:    (data: { cardId: string }) => void;
  rematch_vote: () => void;
  surrender:    () => void;
  rps_pick:     (data: { choice: RpsChoice }) => void;
  rps_choose:   (data: { firstPlayer: 0 | 1 }) => void;
  // defender responds to counter window (always required, even if passing)
  counter_response: (data: {
    countering: boolean;
    blueCardId?: string;
    matchingCardId?: string;
  }) => void;
  // attacker responds to counter-counter window
  counter_counter_response: (data: {
    countering: boolean;
    blueCard1Id?: string;
    blueCard2Id?: string;
  }) => void;
  // generic effect response
  effect_response: (data: {
    type: PendingEffect['type'];
    [key: string]: unknown;
  }) => void;
  update_customization: (data: { customizations: Customizations }) => void;
  chat_message:         (data: { message: string }) => void;
  /** Join the matchmaking queue. */
  join_matchmaking:     (data: { playerName: string }) => void;
  /** Leave the matchmaking queue (e.g. user cancelled). */
  leave_matchmaking:    () => void;
}

export interface InterServerEvents { /* reserved */ }
export interface SocketData {
  playerId:   string;
  roomCode:   string;
  playerName: string;
}
