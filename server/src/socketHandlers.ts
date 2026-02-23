// ─────────────────────────────────────────────────────────────────────────────
// server/src/socketHandlers.ts
//
// Wires Socket.io events to game logic.  Called once per socket connection
// from server.ts:  `io.on('connection', socket => registerHandlers(io, socket))`
//
// Architecture note: each socket automatically joins two Socket.io rooms:
//   • socket.id   — so we can emit directly to one player with io.to(playerId)
//   • roomCode    — so we can broadcast to both players with io.to(roomCode)
//
// Multiplayer flow:
//   create_room → join_room → [customization] → set_ready →
//   RPS (rps_pick / rps_choose) → game starts → gameplay events →
//   rematch_vote or disconnect
//
// Single-player flow:
//   create_singleplayer → game starts immediately (no customization/RPS)
// ─────────────────────────────────────────────────────────────────────────────
import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents, ClientToServerEvents,
  InterServerEvents, SocketData, GameState, PlayerState,
  DEFAULT_CUSTOMIZATIONS, RpsChoice, ReplayFile,
} from '../../shared/types';
import { RoomManager } from './RoomManager';
import { GameEngine } from './game/GameEngine';
import { AIPlayer } from './ai/AIPlayer';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const rooms = new RoomManager();

// Tracks rematch votes per room: roomCode → Set of playerIds who voted
const rematchVoteMap = new Map<string, Set<string>>();

// RPS state: picks waiting for resolution, and winner index for rps_choose phase
const rpsPickMap   = new Map<string, Map<string, RpsChoice>>(); // roomCode → Map<playerId, choice>
const rpsWinnerMap = new Map<string, 0 | 1>();                  // roomCode → player index (0|1) who won RPS

// Single-player AI instances: roomCode → AIPlayer
const singlePlayerAIs = new Map<string, AIPlayer>();

// ── Matchmaking queue ─────────────────────────────────────────────────────────
/** Entry in the global matchmaking queue. */
interface MatchmakingEntry { id: string; name: string; }
const matchmakingQueue: MatchmakingEntry[] = [];

/** Remove a player from the matchmaking queue by socket ID. */
function removeFromMatchmaking(socketId: string) {
  const idx = matchmakingQueue.findIndex(e => e.id === socketId);
  if (idx >= 0) matchmakingQueue.splice(idx, 1);
}

/**
 * Attempt to pair the first two players in the queue.
 * If successful: creates a room, wires both sockets into it, emits matchmaking_found
 * and game_state (customizing) to both.
 */
function tryPairMatchmaking(io: IO) {
  if (matchmakingQueue.length < 2) return;

  const p1entry = matchmakingQueue.shift()!;
  const p2entry = matchmakingQueue.shift()!;

  const sock1 = io.sockets.sockets.get(p1entry.id);
  const sock2 = io.sockets.sockets.get(p2entry.id);

  // If either disconnected while in queue, put the surviving one back and retry
  if (!sock1 || !sock2) {
    if (sock1) matchmakingQueue.unshift(p1entry);
    if (sock2) matchmakingQueue.unshift(p2entry);
    if (matchmakingQueue.length >= 2) tryPairMatchmaking(io);
    return;
  }

  const settings = { counterTimeLimitSeconds: 15 };
  const code = rooms.createRoom(p1entry.id, p1entry.name, settings);
  const room = rooms.joinRoom(code, p2entry.id, p2entry.name)!;

  // Register socket data and join Socket.io rooms for both sockets
  for (const [sock, entry] of [[sock1, p1entry], [sock2, p2entry]] as const) {
    sock.data.playerId      = entry.id;
    sock.data.roomCode      = code;
    sock.data.playerName    = entry.name;
    sock.data.inMatchmaking = false;
    if (!sock.rooms.has(entry.id)) sock.join(entry.id);
    sock.join(code);
  }

  // Notify both players
  io.to(p1entry.id).emit('matchmaking_found', { roomCode: code });
  io.to(p2entry.id).emit('matchmaking_found', { roomCode: code });

  // Emit customizing state so the game flow starts (same as join_room does)
  const mp0 = room.players[0];
  const mp1 = room.players[1]!; // safe: we just joined exactly 2 players above
  const customizingState = {
    gameId:             'pending',
    roomCode:           code,
    players:            [makePendingPlayer(mp0.id, mp0.name), makePendingPlayer(mp1.id, mp1.name)] as [PlayerState, PlayerState],
    currentPlayerIndex: 0 as const,
    phase:              'customizing' as const,
    turnNumber:         0,
    counterChain:       [],
    settings,
  };
  io.to(p1entry.id).emit('game_state', { ...customizingState, viewerIndex: 0 });
  io.to(p2entry.id).emit('game_state', { ...customizingState, viewerIndex: 1 });
}

// ── Replay helper ─────────────────────────────────────────────────────────────

/** Assemble a ReplayFile from the engine’s snapshot history.  Called when phase === 'ended'. */
function buildReplay(engine: GameEngine, mode: ReplayFile['mode']): ReplayFile {
  const state = engine.state;
  return {
    id: state.gameId,
    date: new Date().toISOString(),
    playerNames: [state.players[0].name, state.players[1].name],
    winner: state.winner ?? null,
    winReason: state.winReason,
    turnCount: state.turnNumber,
    mode,
    snapshots: engine.replaySnapshots,
  };
}

/**
 * Attach an onStateChange handler to an engine that:
 *  1. Broadcasts sanitized state to both players after every mutation.
 *  2. Emits replay_complete to both players when the game ends.
 *
 * Must be called AFTER creating the engine and BEFORE the first emit
 * so the initial state reaches clients.
 */
function wireEngine(io: IO, engine: GameEngine, p0id: string, p1id: string, mode: ReplayFile['mode']) {
  engine.onStateChange = (state) => {
    broadcastState(io, state);
    if (state.phase === 'ended') {
      const replay = buildReplay(engine, mode);
      io.to(p0id).emit('replay_complete', replay);
      io.to(p1id).emit('replay_complete', replay);
    }
  };
}

// ── Broadcast helpers ─────────────────────────────────────────────────────────

/**
 * Send a tailored GameState snapshot to each player.
 *
 * Sanitization applied:
 *  • Opponent’s hand and deck are cleared (hidden information).
 *  • During effect_blue_look: the topCard in pendingEffect is hidden from the
 *    non-active player (they shouldn’t see what the attacker is looking at).
 *  • viewerIndex is set so each player’s client knows which side of the board
 *    is “theirs”.
 *  • rematchVotes can be injected externally (used when building vote-progress UI).
 */
function broadcastState(io: IO, state: GameState, votes?: [boolean, boolean]) {
  const [p0, p1] = state.players;
  const base: GameState = votes ? { ...state, rematchVotes: votes } : state;

  // Sanitize: hide blue_look topCard from the non-active player
  function sanitize(s: GameState, viewerIndex: 0 | 1): GameState {
    if (s.phase === 'effect_blue_look' && s.currentPlayerIndex !== viewerIndex && s.pendingEffect) {
      return { ...s, pendingEffect: { type: 'blue_look' } };
    }
    return s;
  }

  const for0 = sanitize({ ...base, players: [p0,           hiddenHand(p1)], viewerIndex: 0 }, 0);
  const for1 = sanitize({ ...base, players: [hiddenHand(p0), p1          ], viewerIndex: 1 }, 1);

  io.to(p0.id).emit('game_state', for0);
  io.to(p1.id).emit('game_state', for1);
}

function hiddenHand(player: PlayerState): PlayerState {
  return { ...player, hand: [], deck: [] };
}

// ── RPS helpers ───────────────────────────────────────────────────────────────

/** Returns a Rock-Paper-Scissors outcome from the two choices: 0 if player 0 wins, 1 if player 1 wins, 'draw'. */
function resolveRps(a: RpsChoice, b: RpsChoice): 0 | 1 | 'draw' {
  if (a === b) return 'draw';
  if (
    (a === 'rock'     && b === 'scissors') ||
    (a === 'scissors' && b === 'paper')    ||
    (a === 'paper'    && b === 'rock')
  ) return 0;
  return 1;
}

function emitRpsState(
  io: IO,
  room: { code: string; players: { id: string; name: string }[]; settings: GameState['settings'] },
  phase: 'rps_pick' | 'rps_choose',
  rpsResult?: GameState['rpsResult'],
) {
  const [p0, p1] = room.players;
  const base: GameState = {
    gameId: 'rps', roomCode: room.code,
    players: [makePendingPlayer(p0.id, p0.name), makePendingPlayer(p1.id, p1.name)],
    currentPlayerIndex: 0, phase, turnNumber: 0,
    counterChain: [], settings: room.settings,
    rpsResult,
  };
  io.to(p0.id).emit('game_state', { ...base, viewerIndex: 0 });
  io.to(p1.id).emit('game_state', { ...base, viewerIndex: 1 });
}

// ── Handler registration ──────────────────────────────────────────────────────

/**
 * Register all Socket.io event listeners for a single connected socket.
 * Called once per connection from server.ts.
 * `id` is the socket’s unique ID, which doubles as the player’s ID throughout the game.
 */
export function registerHandlers(io: IO, socket: Sock) {
  const { id } = socket;

  // Each socket joins its own room keyed by socket ID so we can emit to them by playerId
  socket.join(id);

  socket.on('create_room', ({ playerName, settings }) => {
    const code = rooms.createRoom(id, playerName, settings);
    socket.data.playerId = id;
    socket.data.roomCode = code;
    socket.data.playerName = playerName;
    socket.join(code);
    socket.emit('room_created', { roomCode: code });
  });

  socket.on('create_singleplayer', ({ playerName, difficulty, settings }) => {
    const { roomCode, engine, aiPlayer } = rooms.createSinglePlayerRoom(id, playerName, difficulty, settings);

    socket.data.playerId  = id;
    socket.data.roomCode  = roomCode;
    socket.data.playerName = playerName;
    socket.join(id);
    socket.join(roomCode);

    socket.emit('room_created', { roomCode });

    // Wire broadcast first, then activate AI (it chains on top)
    engine.onStateChange = (state) => broadcastState(io, state);
    singlePlayerAIs.set(roomCode, aiPlayer);
    aiPlayer.activate(engine);

    // Send initial state to human
    broadcastState(io, engine.state);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const room = rooms.joinRoom(roomCode, id, playerName);
    if (!room) {
      socket.emit('error', 'Room not found or already full.');
      return;
    }
    socket.data.playerId = id;
    socket.data.roomCode = roomCode;
    socket.data.playerName = playerName;
    socket.join(roomCode);

    const host = room.players[0];
    const waitingState: GameState = {
      gameId: 'pending', roomCode,
      players: [makePendingPlayer(host.id, host.name), makePendingPlayer(id, playerName)],
      currentPlayerIndex: 0, phase: 'customizing', turnNumber: 0,
      counterChain: [], settings: room.settings,
    };
    io.to(roomCode).emit('game_state', waitingState);
  });

  socket.on('update_customization', ({ customizations }) => {
    rooms.setCustomization(id, customizations);
    const room = rooms.getRoomByPlayerId(id);
    if (room?.engine) broadcastState(io, room.engine.state);
  });

  socket.on('set_ready', () => {
    const allReady = rooms.setReady(id);
    if (allReady) {
      // Both ready — begin RPS to decide who goes first
      const room = rooms.getRoomByPlayerId(id)!;
      emitRpsState(io, room, 'rps_pick');
    } else {
      // Still waiting — re-emit customizing state so both clients are in sync
      const room = rooms.getRoomByPlayerId(id);
      if (room && room.players.length === 2 && !room.engine) {
        const [p0, p1] = room.players;
        const waitingState: GameState = {
          gameId: 'pending', roomCode: room.code,
          players: [makePendingPlayer(p0.id, p0.name), makePendingPlayer(p1.id, p1.name)],
          currentPlayerIndex: 0, phase: 'customizing', turnNumber: 0,
          counterChain: [], settings: room.settings,
        };
        io.to(room.code).emit('game_state', waitingState);
      }
    }
  });

  // ── RPS ──────────────────────────────────────────────────────────────────────

  socket.on('rps_pick', ({ choice }) => {
    const room = rooms.getRoomByPlayerId(id);
    if (!room || room.players.length !== 2 || room.engine) return;

    const code = room.code;
    if (!rpsPickMap.has(code)) rpsPickMap.set(code, new Map());
    const picks = rpsPickMap.get(code)!;
    picks.set(id, choice);

    if (picks.size < 2) return; // waiting for the other player

    const [p0, p1] = room.players as { id: string; name: string }[];
    const pick0 = picks.get(p0.id)!;
    const pick1 = picks.get(p1.id)!;
    rpsPickMap.delete(code);

    const winner = resolveRps(pick0, pick1);
    const rpsResult: GameState['rpsResult'] = { picks: [pick0, pick1], winner };

    if (winner === 'draw') {
      // Tie — show result then let them pick again
      emitRpsState(io, room, 'rps_pick', rpsResult);
    } else {
      // Winner picks who goes first
      rpsWinnerMap.set(code, winner);
      emitRpsState(io, room, 'rps_choose', rpsResult);
    }
  });

  socket.on('rps_choose', ({ firstPlayer }) => {
    const room = rooms.getRoomByPlayerId(id);
    if (!room || room.players.length !== 2 || room.engine) return;

    const code = room.code;
    const winnerIndex = rpsWinnerMap.get(code);
    if (winnerIndex === undefined) return;

    // Only the RPS winner may choose
    const senderIndex = room.players[0].id === id ? 0 : 1;
    if (senderIndex !== winnerIndex) return;

    rpsWinnerMap.delete(code);

    const engine = rooms.startGame(code, firstPlayer);
    if (!engine) return;
    const [ep0, ep1] = room.players;
    wireEngine(io, engine, ep0.id, ep1.id, 'multiplayer');
    broadcastState(io, engine.state);
  });

  // ── Gameplay ─────────────────────────────────────────────────────────────────

  socket.on('draw_card', () => {
    const room = rooms.getRoomByPlayerId(id);
    room?.engine?.drawCard(id);
  });

  socket.on('play_card', ({ cardId }) => {
    const room = rooms.getRoomByPlayerId(id);
    room?.engine?.playCard(id, cardId);
  });

  socket.on('counter_response', ({ countering, blueCardId, matchingCardId }) => {
    const room = rooms.getRoomByPlayerId(id);
    room?.engine?.counterResponse(id, countering, blueCardId, matchingCardId);
  });

  socket.on('counter_counter_response', ({ countering, blueCard1Id, blueCard2Id }) => {
    const room = rooms.getRoomByPlayerId(id);
    room?.engine?.counterCounterResponse(id, countering, blueCard1Id, blueCard2Id);
  });

  socket.on('effect_response', (data) => {
    const room = rooms.getRoomByPlayerId(id);
    room?.engine?.effectResponse(id, data);
  });

  // ── Surrender ────────────────────────────────────────────────────────────────

  socket.on('surrender', () => {
    const room = rooms.getRoomByPlayerId(id);
    if (!room?.engine) return;
    room.engine.surrender(id);
  });

  // ── Rematch ─────────────────────────────────────────────────────────────────

  socket.on('rematch_vote', () => {
    const room = rooms.getRoomByPlayerId(id);
    if (!room || room.players.length !== 2 || !room.engine) return;
    if (room.engine.state.phase !== 'ended') return;

    const code = room.code;
    if (!rematchVoteMap.has(code)) rematchVoteMap.set(code, new Set());
    const votes = rematchVoteMap.get(code)!;
    votes.add(id);

    // In single-player rooms, the AI auto-votes for rematch immediately
    const ai = singlePlayerAIs.get(code);
    if (ai) votes.add(ai.playerId);

    // Use engine.state.players order — this matches the viewerIndex each client received.
    const [ep0, ep1] = room.engine.state.players;
    const voteState: [boolean, boolean] = [votes.has(ep0.id), votes.has(ep1.id)];

    if (voteState[0] && voteState[1]) {
      rematchVoteMap.delete(code);

      if (ai) {
        // Server-based single-player: AI doesn't do RPS, restart immediately
        const [p0, p1] = room.players;
        const newEngine = new GameEngine(code, p0, p1, room.settings);
        room.engine = newEngine;
        wireEngine(io, newEngine, ep0.id, ep1.id, 'single-player');
        ai.activate(newEngine);
        broadcastState(io, newEngine.state);
      } else {
        // Multiplayer: go back to RPS so players choose who goes first again
        room.engine = null;
        emitRpsState(io, room, 'rps_pick');
      }
    } else {
      broadcastState(io, room.engine.state, voteState);
    }
  });

  // ── Chat ─────────────────────────────────────────────────────────────────────

  socket.on('chat_message', ({ message }) => {
    const room = rooms.getRoomByPlayerId(id);
    if (!room) return;
    const trimmed = message.trim().slice(0, 300);
    if (!trimmed) return;
    // Broadcast to all players in the room, including the sender (for confirmation)
    io.to(room.code).emit('chat_message', { playerName: socket.data.playerName, message: trimmed });
  });

  // ── Matchmaking ──────────────────────────────────────────────────────────────

  socket.on('join_matchmaking', ({ playerName }) => {
    // Defensive: remove if already in queue (e.g. double-tap)
    removeFromMatchmaking(id);

    socket.data.playerId      = id;
    socket.data.playerName    = playerName;
    socket.data.inMatchmaking = true;
    // Ensure the socket is joined to its own ID room for direct emits
    if (!socket.rooms.has(id)) socket.join(id);

    matchmakingQueue.push({ id, name: playerName });

    // Tell the player their position
    const pos = matchmakingQueue.findIndex(e => e.id === id);
    socket.emit('matchmaking_status', { position: pos + 1 });

    tryPairMatchmaking(io);
  });

  socket.on('leave_matchmaking', () => {
    removeFromMatchmaking(id);
    socket.data.inMatchmaking = false;
  });

  socket.on('disconnect', () => {
    removeFromMatchmaking(id);
    rooms.removePlayer(id);
  });
}

/** Build a placeholder PlayerState for the lobby/RPS phases before the GameEngine creates real ones. */
function makePendingPlayer(id: string, name: string): PlayerState {
  return {
    id, name,
    deck: [], deckCount: 25,
    hand: [], handCount: 5,
    field: [], graveyard: [], graveyardCount: 0,
    customizations: { ...DEFAULT_CUSTOMIZATIONS },
    isConnected: true,
  };
}
