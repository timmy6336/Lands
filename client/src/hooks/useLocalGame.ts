import { useEffect, useRef, useState } from 'react';
import { GameState, AIDifficulty, GameSettings, ClientToServerEvents, ReplayFile } from '@lands/shared';
import { GameEngine } from '@lands/game/GameEngine';
import { AIPlayer, AI_NAMES } from '@lands/ai/AIPlayer';

export interface LocalGameParams {
  playerName: string;
  difficulty: AIDifficulty;
  settings: GameSettings;
  goFirst: boolean;
}

type SendFn = <K extends keyof ClientToServerEvents>(
  event: K,
  ...args: Parameters<ClientToServerEvents[K]>
) => void;

/** Human player always has this stable ID in local games. */
const HUMAN_ID = 'human';

/**
 * Runs the game engine and AI entirely in the renderer process — no server/port needed.
 * Pass null to teardown (e.g., when going back to home).
 */
export function useLocalGame(params: LocalGameParams | null): {
  gameState: GameState | null;
  send: SendFn;
} {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const engineRef    = useRef<GameEngine | null>(null);
  const aiRef        = useRef<AIPlayer    | null>(null);
  const paramsRef    = useRef(params);
  paramsRef.current  = params;
  const replaySaved  = useRef(false);

  /**
   * Spin up a fresh engine + AI.
   * Called on first start and on rematch.
   * The `engineInstance` guard prevents a replaced engine's callbacks from
   * writing stale state after a rematch.
   */
  function startGame(p: LocalGameParams) {
    replaySaved.current = false;
    const ai = new AIPlayer(p.difficulty);

    // If the human wants to go second, AI is player 0 (goes first), human is player 1
    const humanIsP0 = p.goFirst;
    const p0 = humanIsP0
      ? { id: HUMAN_ID,      name: p.playerName }
      : { id: ai.playerId,   name: AI_NAMES[p.difficulty] };
    const p1 = humanIsP0
      ? { id: ai.playerId,   name: AI_NAMES[p.difficulty] }
      : { id: HUMAN_ID,      name: p.playerName };
    const humanViewerIndex = humanIsP0 ? 0 : 1;
    const aiPlayerIndex    = humanIsP0 ? 1 : 0;

    const engine = new GameEngine('local', p0, p1, p.settings);

    // Capture ref so stale callbacks self-cancel after rematch
    const engineInstance = engine;

    engine.onStateChange = (state) => {
      if (engineRef.current !== engineInstance) return; // superseded by rematch

      // Mirror server's hiddenHand: strip AI hand/deck before giving to human
      const players = state.players.slice() as [typeof state.players[0], typeof state.players[1]];
      players[aiPlayerIndex] = { ...players[aiPlayerIndex], hand: [], deck: [] };

      let sanitized: GameState = { ...state, players, viewerIndex: humanViewerIndex };

      // Hide blue_look topCard when it's the AI's turn
      if (
        state.phase === 'effect_blue_look' &&
        state.currentPlayerIndex === aiPlayerIndex &&
        state.pendingEffect
      ) {
        sanitized = { ...sanitized, pendingEffect: { type: 'blue_look' } };
      }

      setGameState(sanitized);

      // Save replay once when the game ends
      if (state.phase === 'ended' && !replaySaved.current && window.electronAPI) {
        replaySaved.current = true;
        const replay: ReplayFile = {
          id: state.gameId,
          date: new Date().toISOString(),
          playerNames: [state.players[0].name, state.players[1].name],
          winner: state.winner ?? null,
          winReason: state.winReason,
          turnCount: state.turnNumber,
          mode: 'single-player',
          snapshots: engineInstance.replaySnapshots,
        };
        window.electronAPI.saveReplay(replay).catch(() => {});
      }
    };

    ai.activate(engine);
    engineRef.current = engine;
    aiRef.current     = ai;

    // The GameEngine constructor calls emit() before onStateChange is wired up,
    // so that initial state is lost. Broadcast it now that everything is connected.
    engine.onStateChange(engine.state);
  }

  // Stable key so we don't recreate the engine on unrelated re-renders
  const paramsKey = params
    ? `${params.playerName}|${params.difficulty}|${String(params.settings.counterTimeLimitSeconds)}|${params.goFirst}`
    : null;

  useEffect(() => {
    const p = paramsRef.current;
    if (!p) {
      engineRef.current = null;
      aiRef.current     = null;
      setGameState(null);
      return;
    }
    startGame(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  function send<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) {
    const engine = engineRef.current;
    if (!engine) return;

    switch (event as string) {
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

      case 'rematch_vote': {
        // AI auto-agrees — start a new game immediately
        const p = paramsRef.current;
        if (p) startGame(p);
        break;
      }

      default:
        break; // no-op for room-creation / RPS events
    }
  }

  return { gameState, send };
}
