import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, GameSettings } from '@lands/shared';
import { useSocket } from './hooks/useSocket';
import { useLocalGame, LocalGameParams } from './hooks/useLocalGame';
import { CardImagesContext, useCardImagesProvider } from './hooks/useCardImages';
import { UISettingsContext, useUISettingsProvider } from './hooks/useUISettings';
import { HomeScreen } from './components/HomeScreen';
import { PlayMenu } from './components/PlayMenu';
import { SinglePlayerMenu } from './components/SinglePlayerMenu';
import { Settings } from './components/Settings';
import { Lobby } from './components/Lobby';
import { ReadyScreen } from './components/ReadyScreen';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { RpsScreen } from './components/RpsScreen';
import { RulesScreen } from './components/RulesScreen';

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

type Screen = 'home' | 'play-menu' | 'single-player-menu' | 'single-player' | 'settings' | 'rules' | 'host' | 'join';

// In browser dev mode (no Electron), connect directly to the Vite-proxied server.
const BROWSER_SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

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

  // Saved Electron settings (port, UPnP) — loaded once
  const [defaultPort, setDefaultPort] = useState(3001);
  const [upnpEnabled, setUpnpEnabled] = useState(false);

  const { gameState: socketGameState, roomCode, error, connected, send: socketSend, chatMessages: socketChatMessages } = useSocket(serverUrl);
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

  const [cardImageUrls, refreshCardImages] = useCardImagesProvider();

  // Track whether we've already emitted create_room / join_room for this connection
  const roomActionSent = useRef(false);

  // Load Electron settings on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then(s => {
        setDefaultPort(s.defaultPort);
        setUpnpEnabled(s.upnpEnabled);
      });
    }
  }, []);

  // Auto emit create_room / join_room once connected (multiplayer only)
  useEffect(() => {
    if (!connected || roomActionSent.current) return;

    if (screen === 'host') {
      roomActionSent.current = true;
      send('create_room', { playerName, settings: hostSettings });
    } else if (screen === 'join' && pendingJoin) {
      roomActionSent.current = true;
      send('join_room', { roomCode: pendingJoin.roomCode, playerName });
    }
  }, [connected, screen, pendingJoin]);

  // Reset roomActionSent when serverUrl changes (new connection)
  useEffect(() => {
    roomActionSent.current = false;
  }, [serverUrl]);

  function goHome() {
    setServerUrl(null);
    setPendingJoin(null);
    setLocalGameParams(null);
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
      return (
        <CardImagesContext.Provider value={cardImageUrls}>
          <GameOver
            gameState={gameState}
            myIndex={myIndex}
            onPlayAgain={goHome}
            onRematch={() => send('rematch_vote')}
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
          onHost={() => setScreen('host')}
          onJoin={() => setScreen('join')}
          onBack={() => setScreen('home')}
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
          defaultPort={defaultPort}
          upnpEnabled={upnpEnabled}
          onStartServer={async (port, settings) => {
            setHostSettings(settings);
            if (window.electronAPI) {
              await window.electronAPI.startServer(port);
            }
            setServerUrl(`http://localhost:${port}`);
          }}
          onBack={() => {
            window.electronAPI?.stopServer();
            setServerUrl(null);
            setScreen('play-menu');
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
          onConnect={(hostIp, port, code) => {
            setPendingJoin({ roomCode: code, settings: { counterTimeLimitSeconds: 15 } });
            setServerUrl(`http://${hostIp}:${port}`);
          }}
          onBack={() => {
            setServerUrl(null);
            setPendingJoin(null);
            setScreen('play-menu');
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

  // ── Home screen (default) ─────────────────────────────────────────────────

  // Non-Electron dev convenience: auto-connect to VITE_SERVER_URL if set
  if (!window.electronAPI && !serverUrl && import.meta.env.VITE_SERVER_URL) {
    if (serverUrl === null) setServerUrl(BROWSER_SERVER_URL);
  }

  return (
    <PageTransition keyProp="home">
      <HomeScreen
        onPlay={() => setScreen('play-menu')}
        onSettings={() => setScreen('settings')}
        onRules={() => setScreen('rules')}
      />
    </PageTransition>
  );
}
