/// <reference lib="webworker" />
// ─────────────────────────────────────────────────────────────────────────────
// client/src/workers/gameWorker.ts
//
// Runs GameEngine + AIPlayer off the React main thread so AI think delays
// (up to 1.6 s for Hard difficulty) never block the UI.
//
// Message protocol — main thread → worker:
//   { type: 'init',   params: WorkerInitParams }   start or restart a game
//   { type: 'action', event: string, args: unknown[] }  player move
//
// Message protocol — worker → main thread:
//   { type: 'state',            state: GameState }           every state change
//   { type: 'replay_snapshots', snapshots: GameState[] }     once on game end
// ─────────────────────────────────────────────────────────────────────────────
import { GameEngine } from '@lands/game/GameEngine';
import { AIPlayer, AI_NAMES } from '@lands/ai/AIPlayer';
import { AIDifficulty, GameSettings, GameState } from '@lands/shared';

export interface WorkerInitParams {
  playerName: string;
  difficulty: AIDifficulty;
  settings: GameSettings;
  goFirst: boolean;
}

export type ToWorker =
  | { type: 'init';   params: WorkerInitParams }
  | { type: 'action'; event: string; args: unknown[] };

export type FromWorker =
  | { type: 'state';            state: GameState }
  | { type: 'replay_snapshots'; snapshots: GameState[] };

const HUMAN_ID = 'human';

let engineRef: GameEngine | null = null;
let engineInstance: GameEngine | null = null; // guard against stale callbacks after restart

function startGame(params: WorkerInitParams) {
  const { playerName, difficulty, settings, goFirst } = params;

  const ai = new AIPlayer(difficulty);

  const humanIsP0 = goFirst;
  const p0 = humanIsP0
    ? { id: HUMAN_ID,     name: playerName }
    : { id: ai.playerId,  name: AI_NAMES[difficulty] };
  const p1 = humanIsP0
    ? { id: ai.playerId,  name: AI_NAMES[difficulty] }
    : { id: HUMAN_ID,     name: playerName };

  const engine = new GameEngine('local', p0, p1, settings);
  engineRef     = engine;
  engineInstance = engine;

  let replaySent = false;

  engine.onStateChange = (state: GameState) => {
    if (engineInstance !== engine) return; // superseded by a restart

    self.postMessage({ type: 'state', state } satisfies FromWorker);

    if (state.phase === 'ended' && !replaySent) {
      replaySent = true;
      self.postMessage({ type: 'replay_snapshots', snapshots: engine.replaySnapshots } satisfies FromWorker);
    }
  };

  ai.activate(engine);

  // The GameEngine constructor emits before onStateChange is wired — broadcast
  // the initial state now that everything is connected.
  engine.onStateChange(engine.state);
}

self.onmessage = (e: MessageEvent<ToWorker>) => {
  const msg = e.data;

  if (msg.type === 'init') {
    startGame(msg.params);
    return;
  }

  if (msg.type === 'action') {
    const engine = engineRef;
    if (!engine) return;

    const { event, args } = msg;

    switch (event) {
      case 'draw_card':
        engine.drawCard(HUMAN_ID);
        break;

      case 'play_card': {
        const { cardId } = (args as [{ cardId: string }])[0];
        engine.playCard(HUMAN_ID, cardId);
        break;
      }

      case 'counter_response': {
        const { countering, blueCardId, matchingCardId } = (
          args as [{ countering: boolean; blueCardId?: string; matchingCardId?: string }]
        )[0];
        engine.counterResponse(HUMAN_ID, countering, blueCardId, matchingCardId);
        break;
      }

      case 'counter_counter_response': {
        const { countering, blueCard1Id, blueCard2Id } = (
          args as [{ countering: boolean; blueCard1Id?: string; blueCard2Id?: string }]
        )[0];
        engine.counterCounterResponse(HUMAN_ID, countering, blueCard1Id, blueCard2Id);
        break;
      }

      case 'effect_response': {
        const data = (args as [{ type: string; [key: string]: unknown }])[0];
        engine.effectResponse(HUMAN_ID, data);
        break;
      }

      case 'surrender':
        engine.surrender(HUMAN_ID);
        break;

      default:
        break;
    }
  }
};
