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
import { useAuth } from './hooks/useAuth';
import { CardImagesContext, useCardImagesProvider } from './hooks/useCardImages';
import { UISettingsContext, useUISettings, useUISettingsProvider } from './hooks/useUISettings';
import { HomeScreen } from './components/HomeScreen';
import { AuthScreen } from './components/AuthScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ShopScreen } from './components/ShopScreen';
import { SkinsScreen } from './components/SkinsScreen';
import { PlayMenu } from './components/PlayMenu';
import { MultiplayerMenu } from './components/MultiplayerMenu';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import { SinglePlayerMenu } from './components/SinglePlayerMenu';
import { Settings } from './components/Settings';
import { Lobby } from './components/Lobby';
import { useBGMusic } from './hooks/useBGMusic';
import { RulesScreen } from './components/RulesScreen';
import { ReplayBrowser } from './components/ReplayBrowser';
import { ReplayViewer } from './components/ReplayViewer';
import { PrivateMenu } from './components/PrivateMenu';
import { InGameRouter } from './components/InGameRouter';


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
  | 'home' | 'auth' | 'profile' | 'shop' | 'skins'
  | 'play-menu' | 'single-player-menu' | 'single-player'
  | 'settings' | 'rules'
  | 'multiplayer-menu' | 'private-menu' | 'host' | 'join' | 'matchmaking'
  | 'replays' | 'replay-viewer';

// URL of the shared dedicated server.  Set VITE_DEDICATED_SERVER_URL at build time.
// Falls back to localhost for development / LAN testing.
const DEDICATED_SERVER_URL = import.meta.env.VITE_DEDICATED_SERVER_URL ?? 'http://localhost:3001';

export default function App() {
  const uiSettings = useUISettingsProvider();
  // Keep data-theme attribute on <html> in sync so CSS overrides apply
  const { theme } = uiSettings;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
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
  const [showEndAnim, setShowEndAnim] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);

  const auth = useAuth();
  const { playBGM, stopBGM } = useBGMusic();

  // Refresh profile on mount if we have a stored token
  useEffect(() => {
    auth.refreshProfile(DEDICATED_SERVER_URL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the user logs in, sync their username as the default player name
  useEffect(() => {
    if (auth.profile) setPlayerName(auth.profile.username);
  }, [auth.profile?.username]);

  const [cardImageUrls, refreshCardImages] = useCardImagesProvider(auth.profile?.active_pack_id);

  const { gameState: socketGameState, roomCode, error, connected, send: socketSend,
    chatMessages: socketChatMessages,
    matchmakingStatus, matchmakingFound,
  } = useSocket(serverUrl, auth.token);
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

  // Reset roomActionSent on server error so the user can retry (e.g. bad room code)
  useEffect(() => {
    if (error) roomActionSent.current = false;
  }, [error]);

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
  const { showEndAnimation } = useUISettings();
  useEffect(() => {
    // Detect transition into 'ended' phase to trigger the end animation
    if (phase === 'ended' && prevPhaseRef.current !== null && prevPhaseRef.current !== 'ended') {
      setShowEndAnim(showEndAnimation);
      stopBGM();
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const gamePhasePrefixes = ['playing_', 'counter_', 'effect_'];
    const isActiveGame = phase !== null && phase !== 'ended' &&
      gamePhasePrefixes.some(p => phase.startsWith(p));
    const isMenuOrPregame = !gameState || phase === 'waiting' ||
      phase === null || phase === 'rps_pick' || phase === 'rps_choose' || phase === 'customizing';
    if (isActiveGame) {
      playBGM('game');
    } else if (isMenuOrPregame) {
      playBGM('menu');
    }
    // 'ended': BGM already stopped by the transition effect above
  }, [phase, !!gameState]);

  // ── In-game screens (take priority over nav screens) ─────────────────────

  if (gameState && phase !== 'waiting') {
    return (
      <InGameRouter
        gameState={gameState}
        phase={phase!}
        myIndex={myIndex}
        send={send}
        chatMessages={chatMessages}
        onSendChat={handleSendChat}
        playerName={playerName}
        isLocalGame={isLocalGame}
        localGameParams={localGameParams}
        error={error}
        pendingSPRematch={pendingSPRematch}
        setPendingSPRematch={setPendingSPRematch}
        onRematchGoFirst={(goFirst) => {
          setLocalGameParams(prev => prev
            ? { ...prev, goFirst, rematchCount: (prev.rematchCount ?? 0) + 1 }
            : null
          );
        }}
        showEndAnim={showEndAnim}
        setShowEndAnim={setShowEndAnim}
        goHome={goHome}
        cardImageUrls={cardImageUrls}
      />
    );
  }

  // ── Pre-game navigation screens ───────────────────────────────────────────

  if (screen === 'settings') {
    return (
      <PageTransition keyProp="settings">
        <Settings
          onBack={() => setScreen('home')}
          onRefreshImages={refreshCardImages}
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
          playerName={playerName}
          setPlayerName={name => { setPlayerName(name); }}
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
        <PrivateMenu
          onHost={() => setScreen('host')}
          onJoin={() => setScreen('join')}
          onBack={() => setScreen('multiplayer-menu')}
        />
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

  // ── Home screen (default) ─────────────────────────────────────────────

  if (screen === 'auth') {
    return (
      <PageTransition keyProp="auth">
        <AuthScreen
          auth={auth}
          serverUrl={DEDICATED_SERVER_URL}
          onBack={() => setScreen('home')}
        />
      </PageTransition>
    );
  }

  if (screen === 'profile') {
    return (
      <PageTransition keyProp="profile">
        <ProfileScreen
          auth={auth}
          serverUrl={DEDICATED_SERVER_URL}
          onBack={() => setScreen('home')}
          onLogout={() => {
            auth.logout();
            setScreen('home');
          }}
          onSkins={() => setScreen('skins')}
          onShop={() => setScreen('shop')}
          onProfileUpdated={(profile) => {
            // Properly update React state so active_pack_id triggers a re-render and
            // useCardImagesProvider's useEffect fires with the new pack.
            auth.updateProfile(profile);
          }}
        />
      </PageTransition>
    );
  }

  if (screen === 'skins') {
    return (
      <PageTransition keyProp="skins">
        <SkinsScreen
          auth={auth}
          serverUrl={DEDICATED_SERVER_URL}
          onBack={() => setScreen('profile')}
          onShop={() => setScreen('shop')}
          onProfileUpdated={(profile) => {
            auth.updateProfile(profile);
          }}
        />
      </PageTransition>
    );
  }

  if (screen === 'shop') {
    return (
      <PageTransition keyProp="shop">
        <ShopScreen
          auth={auth}
          serverUrl={DEDICATED_SERVER_URL}
          onBack={() => setScreen(auth.profile ? 'profile' : 'home')}
          onProfileUpdated={(profile) => {
            auth.updateProfile(profile);
          }}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition keyProp="home">
      <HomeScreen
        onPlay={() => setScreen('play-menu')}
        onSettings={() => setScreen('settings')}
        onRules={() => setScreen('rules')}
        onReplays={() => setScreen('replays')}
        onProfile={() => setScreen(auth.profile ? 'profile' : 'auth')}
        onShop={() => setScreen('shop')}
        username={auth.profile?.username ?? null}
      />
    </PageTransition>
  );
}
