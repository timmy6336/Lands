import { useEffect, useRef, useState } from 'react';
import { GameSettings } from '@lands/shared';
import { useSocket } from './hooks/useSocket';
import { CardImagesContext, useCardImagesProvider } from './hooks/useCardImages';
import { UISettingsContext, useUISettingsProvider } from './hooks/useUISettings';
import { HomeScreen } from './components/HomeScreen';
import { PlayMenu } from './components/PlayMenu';
import { Settings } from './components/Settings';
import { Lobby } from './components/Lobby';
import { ReadyScreen } from './components/ReadyScreen';
import { GameBoard } from './components/GameBoard';
import { GameOver } from './components/GameOver';
import { RpsScreen } from './components/RpsScreen';
import { RulesScreen } from './components/RulesScreen';

type Screen = 'home' | 'play-menu' | 'settings' | 'rules' | 'host' | 'join';

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
  const [playerName, setPlayerName] = useState('');
  const [pendingJoin, setPendingJoin] = useState<{ roomCode: string; settings: GameSettings } | null>(null);
  const [hostSettings, setHostSettings] = useState<GameSettings>({ counterTimeLimitSeconds: 15 });

  // Saved Electron settings (port, UPnP) — loaded once
  const [defaultPort, setDefaultPort] = useState(3001);
  const [upnpEnabled, setUpnpEnabled] = useState(false);

  const { gameState, roomCode, error, connected, send } = useSocket(serverUrl);
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

  // Auto emit create_room (host) or join_room (join) once connected
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
    roomActionSent.current = false;
    setScreen('home');
  }

  // ── Which player are we? ──────────────────────────────────────────────────
  // viewerIndex is set by the server per-player; fall back to hand detection for
  // states that predate the field (shouldn't normally be needed).
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
        />
      </CardImagesContext.Provider>
    );
  }

  // ── Pre-game navigation screens ───────────────────────────────────────────

  if (screen === 'settings') {
    return (
      <Settings
        onBack={() => setScreen('home')}
        onRefreshImages={refreshCardImages}
      />
    );
  }

  if (screen === 'play-menu') {
    return (
      <PlayMenu
        onHost={() => setScreen('host')}
        onJoin={() => setScreen('join')}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'host') {
    return (
      <Lobby
        mode="host"
        playerName={playerName}
        setPlayerName={setPlayerName}
        connected={connected}
        roomCode={roomCode}
        error={error}
        defaultPort={defaultPort}
        upnpEnabled={upnpEnabled}
        onStartServer={async (name, port, settings) => {
          setPlayerName(name);
          setHostSettings(settings);
          // In Electron: start the embedded server
          if (window.electronAPI) {
            await window.electronAPI.startServer(port);
          }
          setServerUrl(`http://localhost:${port}`);
        }}
        onBack={() => {
          // Stop server if we started one
          window.electronAPI?.stopServer();
          setServerUrl(null);
          setScreen('play-menu');
        }}
      />
    );
  }

  if (screen === 'join') {
    return (
      <Lobby
        mode="join"
        playerName={playerName}
        setPlayerName={setPlayerName}
        error={error}
        onConnect={(name, hostIp, port, code) => {
          setPlayerName(name);
          setPendingJoin({ roomCode: code, settings: { counterTimeLimitSeconds: 15 } });
          setServerUrl(`http://${hostIp}:${port}`);
        }}
        onBack={() => {
          setServerUrl(null);
          setPendingJoin(null);
          setScreen('play-menu');
        }}
      />
    );
  }

  if (screen === 'rules') {
    return <RulesScreen onBack={() => setScreen('home')} />;
  }

  // ── Home screen (default) ─────────────────────────────────────────────────

  // Non-Electron dev convenience: auto-connect to VITE_SERVER_URL if set
  if (!window.electronAPI && !serverUrl && import.meta.env.VITE_SERVER_URL) {
    if (serverUrl === null) setServerUrl(BROWSER_SERVER_URL);
  }

  return (
    <HomeScreen
      onPlay={() => setScreen('play-menu')}
      onSettings={() => setScreen('settings')}
      onRules={() => setScreen('rules')}
    />
  );
}
