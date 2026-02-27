// ─────────────────────────────────────────────────────────────────────────────
// client/src/hooks/useLocalGame.ts
//
// Runs the game engine and AI in a Web Worker so AI think delays (up to 1.6 s
// for Hard difficulty) never block the React main thread.
//
// How it works:
//   1. Creates a long-lived Worker from gameWorker.ts (one per hook mount).
//   2. On game start / rematch: sends { type: 'init', params } to the worker.
//      The worker spins up a fresh GameEngine + AIPlayer and posts state updates.
//   3. onmessage 'state': sanitize (strip AI hand/deck, hide blue_look topCard)
//      then call setGameState to trigger a React re-render.
//   4. onmessage 'replay_snapshots': save via window.electronAPI.saveReplay()
//      (window APIs are not available inside the worker).
//   5. The `send` function serialises socket-style events as { type: 'action' }
//      messages to the worker, which calls the matching engine method.
//   6. On goHome (params → null): worker is terminated.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { GameState, AIDifficulty, GameSettings, ReplayFile, SendFn } from '@lands/shared';
import type { FromWorker, ToWorker, WorkerInitParams } from '../workers/gameWorker';

export interface LocalGameParams {
  playerName: string;
  difficulty: AIDifficulty;
  settings: GameSettings;
  goFirst: boolean;
  /** Incremented on each rematch so the engine always restarts even if goFirst is unchanged. */
  rematchCount?: number;
}

/**
 * Runs the game engine and AI in a Web Worker — no server/port needed.
 * Pass null to teardown (e.g., when going back to home).
 */
export function useLocalGame(params: LocalGameParams | null): {
  gameState: GameState | null;
  send: SendFn;
} {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const workerRef   = useRef<Worker | null>(null);
  const paramsRef   = useRef(params);
  paramsRef.current = params;
  const replaySaved = useRef(false);

  // Stable key — only changes when we actually need a new game
  const paramsKey = params
    ? `${params.playerName}|${params.difficulty}|${String(params.settings.counterTimeLimitSeconds)}|${params.goFirst}|${params.rematchCount ?? 0}`
    : null;

  // ── Worker lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    const p = paramsRef.current;

    if (!p) {
      // goHome — terminate the worker and clear state
      workerRef.current?.terminate();
      workerRef.current = null;
      setGameState(null);
      return;
    }

    replaySaved.current = false;

    // Create the worker once and reuse it across rematches
    if (!workerRef.current) {
      const worker = new Worker(
        new URL('../workers/gameWorker.ts', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = (e: MessageEvent<FromWorker>) => {
        const msg = e.data;

        if (msg.type === 'state') {
          const currentParams = paramsRef.current;
          if (!currentParams) return;

          const aiPlayerIndex    = currentParams.goFirst ? 1 : 0;
          const humanViewerIndex = (currentParams.goFirst ? 0 : 1) as 0 | 1;
          const state            = msg.state;

          // Mirror server sanitisation: strip AI hand/deck before giving to human
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
        }

        if (msg.type === 'replay_snapshots' && !replaySaved.current && window.electronAPI) {
          replaySaved.current = true;
          const snapshots = msg.snapshots;
          const last = snapshots[snapshots.length - 1];
          if (last) {
            const replay: ReplayFile = {
              id: last.gameId,
              date: new Date().toISOString(),
              playerNames: [last.players[0].name, last.players[1].name],
              winner: last.winner ?? null,
              winReason: last.winReason,
              turnCount: last.turnNumber,
              mode: 'single-player',
              snapshots,
            };
            window.electronAPI.saveReplay(replay).catch(() => {});
          }
        }
      };

      workerRef.current = worker;
    }

    // Send init to start (or restart for rematch)
    const initParams: WorkerInitParams = {
      playerName: p.playerName,
      difficulty: p.difficulty,
      settings:   p.settings,
      goFirst:    p.goFirst,
    };
    workerRef.current.postMessage({ type: 'init', params: initParams } satisfies ToWorker);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Terminate worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // ── send — translates socket-style events → worker action messages ─────────
  const send: SendFn = (event, ...args) => {
    workerRef.current?.postMessage({
      type: 'action',
      event: event as string,
      args,
    } satisfies ToWorker);
  };

  return { gameState, send };
}
