import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ServerToClientEvents, ClientToServerEvents,
  InterServerEvents, SocketData,
} from '../../shared/types';
import { registerHandlers } from './socketHandlers';

// The handle returned by startServer — used by electron/main.ts to shut the server down
// cleanly when the app quits or the user clicks "Stop Server".
export interface LandsServer {
  close: () => Promise<void>;
  port: number;
}

/**
 * Creates an Express HTTP server and attaches a Socket.io server to it.
 *
 * Flow:
 *  1. Creates an Express app (CORS open — local network only, no auth).
 *  2. Wraps it in a raw Node http.Server.
 *  3. Attaches Socket.io so we get typed, bidirectional real-time events.
 *  4. Calls registerHandlers for every new socket connection (see socketHandlers.ts).
 *  5. Returns a { port, close() } handle so the caller can shut down cleanly.
 */
export function startServer(port: number): Promise<LandsServer> {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    const httpServer = createHttpServer(app);
    const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
      httpServer,
      { cors: { origin: '*', methods: ['GET', 'POST'] } },
    );

    io.on('connection', (socket) => {
      console.log(`[+] ${socket.id} connected`);
      registerHandlers(io, socket);
      socket.on('disconnect', () => console.log(`[-] ${socket.id} disconnected`));
    });

    httpServer.on('error', reject);

    httpServer.listen(port, () => {
      console.log(`Lands server running on port ${port}`);
      resolve({
        port,
        close: () => new Promise((res) => {
          io.close();
          httpServer.close(() => res());
        }),
      });
    });
  });
}
