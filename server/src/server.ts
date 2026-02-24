import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ServerToClientEvents, ClientToServerEvents,
  InterServerEvents, SocketData,
} from '../../shared/types';
import { registerHandlers } from './socketHandlers';
import { createAuthRouter, createProfileRouter, verifyToken } from './auth';
import { createShopRouter, createEquipPackRouter } from './shop';
import { initDB } from './db';

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
  return new Promise(async (resolve, reject) => {
    // Initialise SQLite database (creates tables if not exist)
    await initDB().catch(err => {
      console.warn('[db] init warning (profiles unavailable):', err.message);
    });

    // Allow restricting CORS to a known origin via env var (e.g. deployed frontend URL).
    // Defaults to '*' so the Electron client and local dev work out of the box.
    const allowedOrigin: string | string[] = process.env.ALLOWED_ORIGIN
      ? process.env.ALLOWED_ORIGIN.split(',').map(s => s.trim())
      : '*';

    const app = express();
    app.use(cors({ origin: allowedOrigin }));
    app.use(express.json());

    // Health-check endpoint — used by hosting providers (e.g. Render) to keep the
    // server alive and confirm it's responding.
    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', ts: Date.now() });
    });

    // Auth & profile REST endpoints
    app.use('/auth',    createAuthRouter());
    app.use('/profile', createProfileRouter());
    app.use('/profile', createEquipPackRouter());
    // Shop webhook needs raw body for Stripe signature verification
    app.use('/shop/webhook', express.raw({ type: 'application/json' }));
    app.use('/shop', createShopRouter());

    const httpServer = createHttpServer(app);
    const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
      httpServer,
      { cors: { origin: allowedOrigin, methods: ['GET', 'POST'] } },
    );

    // Decode JWT from socket handshake and store userId in socket.data
    io.use((socket, next) => {
      const token = (socket.handshake.auth as { token?: string })?.token;
      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          socket.data.userId   = payload.userId;
          socket.data.userName = payload.username;
        }
      }
      next();
    });

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
