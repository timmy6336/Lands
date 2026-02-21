import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents, ClientToServerEvents,
  InterServerEvents, SocketData, GameState, PlayerState,
  DEFAULT_CUSTOMIZATIONS, RpsChoice,
} from '../../shared/types';
import { RoomManager } from './RoomManager';
import { GameEngine } from './game/GameEngine';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const rooms = new RoomManager();

// Tracks rematch votes per room: roomCode → Set of playerIds who voted
const rematchVoteMap = new Map<string, Set<string>>();

// RPS state: picks waiting for resolution, and winner index for rps_choose phase
const rpsPickMap   = new Map<string, Map<string, RpsChoice>>(); // roomCode → Map<playerId, choice>
const rpsWinnerMap = new Map<string, 0 | 1>();                  // roomCode → player index (0|1) who won RPS

// ── Broadcast helpers ─────────────────────────────────────────────────────────

function broadcastState(io: IO, state: GameState, votes?: [boolean, boolean]) {
  const [p0, p1] = state.players;
  const base: GameState = votes ? { ...state, rematchVotes: votes } : state;

  io.to(p0.id).emit('game_state', { ...base, players: [p0,          hiddenHand(p1)], viewerIndex: 0 });
  io.to(p1.id).emit('game_state', { ...base, players: [hiddenHand(p0), p1        ], viewerIndex: 1 });
}

function hiddenHand(player: PlayerState): PlayerState {
  return { ...player, hand: [], deck: [] };
}

// ── RPS helpers ───────────────────────────────────────────────────────────────

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
    engine.onStateChange = (state) => broadcastState(io, state);
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

  socket.on('pre_target_response', ({ cardId }) => {
    const room = rooms.getRoomByPlayerId(id);
    room?.engine?.preTargetResponse(id, cardId);
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

    // Use engine.state.players order — this matches the viewerIndex each client received.
    // room.players order can differ if RPS swapped who goes first.
    const [ep0, ep1] = room.engine.state.players;
    const voteState: [boolean, boolean] = [votes.has(ep0.id), votes.has(ep1.id)];

    if (voteState[0] && voteState[1]) {
      // Both voted — start a new game (rematch skips RPS, keeps same order)
      rematchVoteMap.delete(code);
      const [p0, p1] = room.players;
      const newEngine = new GameEngine(code, p0, p1, room.settings);
      room.engine = newEngine;
      newEngine.onStateChange = (state) => broadcastState(io, state);
      broadcastState(io, newEngine.state);
    } else {
      // Partial vote — broadcast current state with vote info
      broadcastState(io, room.engine.state, voteState);
    }
  });

  socket.on('disconnect', () => {
    rooms.removePlayer(id);
  });
}

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
