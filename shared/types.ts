export type Color = 'white' | 'red' | 'blue' | 'green' | 'black';

export const ALL_COLORS: Color[] = ['white', 'red', 'blue', 'green', 'black'];

export interface Card {
  id: string;
  color: Color;
}

export interface CardCustomization {
  displayName: string;
}

export type Customizations = Record<Color, CardCustomization>;

export const DEFAULT_CUSTOMIZATIONS: Customizations = {
  white: { displayName: 'Plains' },
  red:   { displayName: 'Mountain' },
  blue:  { displayName: 'Island' },
  green: { displayName: 'Forest' },
  black: { displayName: 'Swamp' },
};

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

export interface CounterChainEntry {
  playerId: string;
  type: 'play' | 'counter' | 'counter_counter';
  card: Card;
  extraCard?: Card;      // counter: the matching-color card discarded with the Blue
}

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

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  room_created: (data: { roomCode: string }) => void;
  error: (msg: string) => void;
  chat_message: (data: ChatMessage) => void;
  replay_complete: (replay: ReplayFile) => void;
}

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
  chat_message: (data: { message: string }) => void;
}

export interface InterServerEvents { /* reserved */ }
export interface SocketData {
  playerId: string;
  roomCode: string;
  playerName: string;
}
