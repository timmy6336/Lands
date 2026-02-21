import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents, ClientToServerEvents, GameState,
} from '@lands/shared';

type LandsSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Manages the Socket.io connection to the game server.
 * Pass a non-null serverUrl to connect; null to disconnect and reset all state.
 */
export function useSocket(serverUrl: string | null) {
  const socketRef = useRef<LandsSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!serverUrl) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setGameState(null);
      setRoomCode(null);
      setError(null);
      setConnected(false);
      return;
    }

    const socket: LandsSocket = io(serverUrl, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('game_state', (state) => setGameState(state));
    socket.on('room_created', ({ roomCode: code }) => setRoomCode(code));
    socket.on('error', (msg) => setError(msg));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [serverUrl]);

  function send<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) {
    socketRef.current?.emit(event, ...args);
  }

  return { gameState, roomCode, error, connected, send };
}
