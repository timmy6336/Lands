// ─────────────────────────────────────────────────────────────────────────────
// client/src/App.tsx — top-level screen router
//
// Manages which screen is displayed and owns all the top-level state that
// needs to be shared between screens (server URL, player name, game settings…).
//
// Screen routing:
//   home              — main menu
//   play-menu         — multiplayer / single-player selector
//   single-player-menu — AI difficulty + go-first choice
//   single-player     — active local game (routed to GameBoard/GameOver)
//   host / join       — multiplayer room creation/joining (connects socket)
//   replays           — saved replay browser
//   replay-viewer     — watching a replay
//   settings / rules  — info screens
//
// When `gameState` is non-null and not in 'waiting', in-game screens
// (RpsScreen, GameBoard, GameOver) take priority over nav screens.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, GameSettings, ReplayFile } from '@lands/shared';
import { useSocket } from './hooks/useSocket';
import { useLocalGame, LocalGameParams } from './hooks/useLocalGame';
import { CardImagesContext, useCardImagesProvider } from './hooks/useCardImages';
import { UISettingsContext, useUISettingsProvider } from './hooks/useUISettings';
import { HomeScreen } from './components/HomeScreen';
import { PlayMenu } from './components/PlayMenu';
import { MultiplayerMenu } from './components/MultiplayerMenu';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import { SinglePlayerMenu } from './components/SinglePlayerMenu';
import { Settings } from './components/Settings';
import { Lobby } from './components/Lobby';
import { ReadyScreen } from './components/ReadyScreen';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { RpsScreen } from './components/RpsScreen';
import { RulesScreen } from './components/RulesScreen';
import { ReplayBrowser } from './components/ReplayBrowser';
import { ReplayViewer } from './components/ReplayViewer';


function PageTransition({ children, keyProp }: { children: React.ReactNode; keyProp: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyProp}
        style={{ height: '100%' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type Screen =
  | 'home' | 'play-menu' | 'single-player-menu' | 'single-player'
  | 'settings' | 'rules'
  | 'multiplayer-menu' | 'private-menu' | 'host' | 'join' | 'matchmaking'
  | 'replays' | 'replay-viewer';

// URL of the shared dedicated server.  Set VITE_DEDICATED_SERVER_URL at build time.
// Falls back to localhost for development / LAN testing.
const DEDICATED_SERVER_URL = import.meta.env.VITE_DEDICATED_SERVER_URL ?? 'http://localhost:3001';

export default function App() {
  const uiSettings = useUISettingsProvider();
  return (
    <UISettingsContext.Provider value={uiSettings}>
      <AppInner />
    </UISettingsContext.Provider>
  );
}

function AppInner() {
  const [screen, setScreen] = useState<Screen>('home');
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') || 'Player');
  const [pendingJoin, setPendingJoin] = useState<{ roomCode: string; settings: GameSettings } | null>(null);
  const [hostSettings, setHostSettings] = useState<GameSettings>({ counterTimeLimitSeconds: 15 });
  const [localGameParams, setLocalGameParams] = useState<LocalGameParams | null>(null);
  const [pendingSPRematch, setPendingSPRematch] = useState(false);
  const [replayToView, setReplayToView] = useState<ReplayFile | null>(null);

  // Saved Electron settings — reserved for future use
  // (Port / UPnP removed; multiplayer now uses the hosted dedicated server)

  const [cardImageUrls, refreshCardImages] = useCardImagesProvider();

  const { gameState: socketGameState, roomCode, error, connected, send: socketSend,
    chatMessages: socketChatMessages,
    matchmakingStatus, matchmakingFound,
  } = useSocket(serverUrl);
  const { gameState: localGameState, send: localSend } = useLocalGame(localGameParams);

  // Route to local engine when in single-player mode, socket otherwise
  const isLocalGame = localGameParams !== null;
  const gameState   = isLocalGame ? localGameState  : socketGameState;
  const send        = isLocalGame ? localSend        : socketSend;

  // Chat: local state for single-player, socket messages for multiplayer
  const [localChatMessages, setLocalChatMessages] = useState<ChatMessage[]>([]);
  const chatMessages = isLocalGame ? localChatMessages : socketChatMessages;

  function handleSendChat(message: string) {
    if (isLocalGame) {
      setLocalChatMessages(prev => [...prev, { playerName, message }]);
    } else {
      send('chat_message', { message });
    }
  }

  // Track whether we've already emitted create_room / join_room for this connection
  const roomActionSent = useRef(false);

  // Auto emit create_room / join_room / join_matchmaking once connected (multiplayer only)
  useEffect(() => {
    if (!connected || roomActionSent.current) return;

    if (screen === 'host') {
      roomActionSent.current = true;
      send('create_room', { playerName, settings: hostSettings });
    } else if (screen === 'join' && pendingJoin) {
      roomActionSent.current = true;
      send('join_room', { roomCode: pendingJoin.roomCode, playerName });
    } else if (screen === 'matchmaking') {
      roomActionSent.current = true;
      send('join_matchmaking', { playerName });
    }
  }, [connected, screen, pendingJoin]);

  // Reset roomActionSent when serverUrl changes (new connection)
  useEffect(() => {
    roomActionSent.current = false;
  }, [serverUrl]);

  function goHome() {
    // Tell the server to pull us out of the matchmaking queue if needed
    if (screen === 'matchmaking' && connected) {
      socketSend('leave_matchmaking');
    }
    setServerUrl(null);
    setPendingJoin(null);
    setLocalGameParams(null);
    setPendingSPRematch(false);
    roomActionSent.current = false;
    setScreen('home');
  }

  // ── Which player are we? ──────────────────────────────────────────────────
  // viewerIndex is set per-player; fall back to hand detection for edge cases.
  const myIndex: 0 | 1 = (() => {
    if (!gameState) return 0;
    if (gameState.viewerIndex !== undefined) return gameState.viewerIndex;
    if (gameState.players[0].hand.length > 0) return 0;
    if (gameState.players[1].hand.length > 0) return 1;
    return 0;
  })();

  const phase = gameState?.phase ?? null;

  // ── In-game screens (take priority over nav screens) ─────────────────────

  if (gameState && phase !== 'waiting') {
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
                  setLocalGameParams(prev => prev ? { ...prev, goFirst: true, rematchCount: (prev.rematchCount ?? 0) + 1 } : null);
                }}
              >
                {playerName} goes first
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                onClick={() => {
                  setPendingSPRematch(false);
                  setLocalGameParams(prev => prev ? { ...prev, goFirst: false, rematchCount: (prev.rematchCount ?? 0) + 1 } : null);
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
          onSendChat={handleSendChat}
          playerName={playerName}
        />
      </CardImagesContext.Provider>
    );
  }

  // ── Pre-game navigation screens ───────────────────────────────────────────

  if (screen === 'settings') {
    return (
      <PageTransition keyProp="settings">
        <Settings
          onBack={() => setScreen('home')}
          onRefreshImages={refreshCardImages}
          playerName={playerName}
          setPlayerName={setPlayerName}
        />
      </PageTransition>
    );
  }

  if (screen === 'play-menu') {
    return (
      <PageTransition keyProp="play-menu">
        <PlayMenu
          onSinglePlayer={() => setScreen('single-player-menu')}
          onMultiplayer={() => setScreen('multiplayer-menu')}
          onBack={() => setScreen('home')}
        />
      </PageTransition>
    );
  }

  if (screen === 'multiplayer-menu') {
    return (
      <PageTransition keyProp="multiplayer-menu">
        <MultiplayerMenu
          onPrivate={() => setScreen('private-menu')}
          onMatchmaking={() => {
            setServerUrl(DEDICATED_SERVER_URL);
            setScreen('matchmaking');
          }}
          onBack={() => setScreen('play-menu')}
        />
      </PageTransition>
    );
  }

  if (screen === 'private-menu') {
    return (
      <PageTransition keyProp="private-menu">
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <div className="text-center">
            <h2 className="text-accent mb-1 m-0">Private Room</h2>
            <p className="text-muted text-sm m-0">Create a room or join one with a code</p>
          </div>
          <div className="flex flex-col gap-3.5 min-w-[280px]">
            <button
              className="btn-primary text-left"
              onClick={() => setScreen('host')}
              style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
            >
              🖥 Host a Game
              <span className="block text-[0.75rem] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Get a room code to share with your friend
              </span>
            </button>
            <button
              className="btn-secondary text-left"
              onClick={() => setScreen('join')}
              style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
            >
              🔗 Join a Game
              <span className="block text-[0.75rem] font-normal mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Enter the code your friend gave you
              </span>
            </button>
          </div>
          <button
            className="btn-secondary"
            onClick={() => setScreen('multiplayer-menu')}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}
          >
            ← Back
          </button>
        </div>
      </PageTransition>
    );
  }

  if (screen === 'matchmaking') {
    return (
      <PageTransition keyProp="matchmaking">
        <MatchmakingScreen
          playerName={playerName}
          queuePosition={matchmakingStatus?.position ?? null}
          found={matchmakingFound}
          connected={connected}
          onCancel={() => {
            if (connected) socketSend('leave_matchmaking');
            setServerUrl(null);
            roomActionSent.current = false;
            setScreen('multiplayer-menu');
          }}
        />
      </PageTransition>
    );
  }

  if (screen === 'single-player-menu') {
    return (
      <PageTransition keyProp="single-player-menu">
        <SinglePlayerMenu
          onStart={(difficulty, settings, goFirst) => {
            setLocalGameParams({ playerName, difficulty, settings, goFirst });
            setScreen('single-player');
          }}
          onBack={() => setScreen('play-menu')}
        />
      </PageTransition>
    );
  }

  if (screen === 'single-player') {
    // useLocalGame starts the engine immediately; game_state takes over rendering
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Starting game…</p>
      </div>
    );
  }

  if (screen === 'host') {
    return (
      <PageTransition keyProp="host">
        <Lobby
          mode="host"
          playerName={playerName}
          connected={connected}
          roomCode={roomCode}
          error={error}
          onCreateRoom={(settings) => {
            setHostSettings(settings);
            setServerUrl(DEDICATED_SERVER_URL);
          }}
          onBack={() => {
            setServerUrl(null);
            roomActionSent.current = false;
            setScreen('private-menu');
          }}
        />
      </PageTransition>
    );
  }

  if (screen === 'join') {
    return (
      <PageTransition keyProp="join">
        <Lobby
          mode="join"
          playerName={playerName}
          error={error}
          onConnect={(code) => {
            setPendingJoin({ roomCode: code, settings: { counterTimeLimitSeconds: 15 } });
            setServerUrl(DEDICATED_SERVER_URL);
          }}
          onBack={() => {
            setServerUrl(null);
            setPendingJoin(null);
            roomActionSent.current = false;
            setScreen('private-menu');
          }}
        />
      </PageTransition>
    );
  }

  if (screen === 'rules') {
    return (
      <PageTransition keyProp="rules">
        <RulesScreen onBack={() => setScreen('home')} />
      </PageTransition>
    );
  }

  if (screen === 'replays') {
    return (
      <PageTransition keyProp="replays">
        <ReplayBrowser
          onBack={() => setScreen('home')}
          onView={(replay) => {
            setReplayToView(replay);
            setScreen('replay-viewer');
          }}
        />
      </PageTransition>
    );
  }

  if (screen === 'replay-viewer' && replayToView) {
    return (
      <PageTransition keyProp="replay-viewer">
        <CardImagesContext.Provider value={cardImageUrls}>
          <ReplayViewer
            replay={replayToView}
            onBack={() => setScreen('replays')}
          />
        </CardImagesContext.Provider>
      </PageTransition>
    );
  }

  // ── Home screen (default) ─────────────────────────────────────────────────

  return (
    <PageTransition keyProp="home">
      <HomeScreen
        onPlay={() => setScreen('play-menu')}
        onSettings={() => setScreen('settings')}
        onRules={() => setScreen('rules')}
        onReplays={() => setScreen('replays')}
      />
    </PageTransition>
  );
}
