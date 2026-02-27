// ─────────────────────────────────────────────────────────────────────────────
// client/src/components/InGameRouter.tsx
//
// Renders the correct in-game screen based on the current GamePhase.
// Extracted from App.tsx to keep navigation routing focused on nav screens.
// ─────────────────────────────────────────────────────────────────────────────
import { GameState, GamePhase, SendFn, ChatMessage } from '@lands/shared';
import { CardImagesContext } from '../hooks/useCardImages';
import type { CardImageUrls } from '../hooks/useCardImages';
import type { LocalGameParams } from '../hooks/useLocalGame';
import { RpsScreen } from './RpsScreen';
import { ReadyScreen } from './ReadyScreen';
import { GameEndAnimation } from './GameEndAnimation';
import { GameOver } from './GameOver';
import { GameBoard } from './GameBoard';

interface Props {
  gameState: GameState;
  phase: GamePhase;
  myIndex: 0 | 1;
  send: SendFn;
  chatMessages: ChatMessage[];
  onSendChat: (message: string) => void;
  playerName: string;
  isLocalGame: boolean;
  localGameParams: LocalGameParams | null;
  error: string | null;
  pendingSPRematch: boolean;
  setPendingSPRematch: (v: boolean) => void;
  /** Called when the player picks who goes first in the SP rematch go-first screen. */
  onRematchGoFirst: (goFirst: boolean) => void;
  showEndAnim: boolean;
  setShowEndAnim: (v: boolean) => void;
  goHome: () => void;
  cardImageUrls: CardImageUrls;
}

export function InGameRouter({
  gameState, phase, myIndex, send, chatMessages, onSendChat, playerName,
  isLocalGame, localGameParams, error,
  pendingSPRematch, setPendingSPRematch, onRematchGoFirst,
  showEndAnim, setShowEndAnim,
  goHome, cardImageUrls,
}: Props) {
  // If the opponent disconnected during lobby or RPS (before the engine starts),
  // the server emits an error and deletes the room — show a prompt to go home.
  const isPreGame = phase === 'customizing' || phase === 'rps_pick' || phase === 'rps_choose';
  if (isPreGame && error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
        <p className="text-[3rem] m-0">⚠️</p>
        <h2 className="m-0" style={{ color: '#e74c3c' }}>Opponent Disconnected</h2>
        <p className="text-muted m-0">{error}</p>
        <button className="btn-primary" onClick={goHome} style={{ padding: '0.75rem 2rem' }}>
          Return to Menu
        </button>
      </div>
    );
  }

  if (phase === 'rps_pick' || phase === 'rps_choose') {
    return (
      <CardImagesContext.Provider value={cardImageUrls}>
        <RpsScreen
          gameState={gameState}
          myIndex={myIndex}
          onPick={(choice) => send('rps_pick', { choice })}
          onChoose={(firstPlayer) => send('rps_choose', { firstPlayer })}
        />
      </CardImagesContext.Provider>
    );
  }

  if (phase === 'customizing') {
    return (
      <CardImagesContext.Provider value={cardImageUrls}>
        <ReadyScreen
          gameState={gameState}
          myIndex={myIndex}
          onReady={(customizations) => {
            send('update_customization', { customizations });
            send('set_ready');
          }}
        />
      </CardImagesContext.Provider>
    );
  }

  if (phase === 'ended') {
    // Show victory/defeat animation before the GameOver screen
    if (showEndAnim) {
      return (
        <GameEndAnimation
          gameState={gameState}
          myIndex={myIndex}
          onDone={() => setShowEndAnim(false)}
        />
      );
    }

    // Single-player: show a go-first picker before restarting
    if (pendingSPRematch && isLocalGame && localGameParams) {
      const aiName = gameState.players[localGameParams.goFirst ? 1 : 0].name;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
          <h2 className="text-accent m-0">Rematch — Who goes first?</h2>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              className="btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              onClick={() => {
                setPendingSPRematch(false);
                onRematchGoFirst(true);
              }}
            >
              {playerName} goes first
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              onClick={() => {
                setPendingSPRematch(false);
                onRematchGoFirst(false);
              }}
            >
              {aiName} goes first
            </button>
          </div>
          <button className="btn-secondary" style={{ padding: '0.5rem 1.5rem' }} onClick={goHome}>
            Leave Game
          </button>
        </div>
      );
    }

    return (
      <CardImagesContext.Provider value={cardImageUrls}>
        <GameOver
          gameState={gameState}
          myIndex={myIndex}
          onPlayAgain={goHome}
          onRematch={() => {
            if (isLocalGame) {
              setPendingSPRematch(true);
            } else {
              send('rematch_vote');
            }
          }}
        />
      </CardImagesContext.Provider>
    );
  }

  return (
    <CardImagesContext.Provider value={cardImageUrls}>
      <GameBoard
        gameState={gameState}
        myIndex={myIndex}
        send={send}
        chatMessages={chatMessages}
        onSendChat={onSendChat}
        playerName={playerName}
      />
    </CardImagesContext.Provider>
  );
}
