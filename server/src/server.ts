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

export interface LandsServer {
  close: () => Promise<void>;
  port: number;
}

export function startServer(port: number): Promise<LandsServer> {
  return new Promise(async (resolve, reject) => {
    await initDB().catch(err => {
      console.warn('[db] init warning (profiles unavailable):', err.message);
    });

    const allowedOrigin: string | string[] = process.env.ALLOWED_ORIGIN
      ? process.env.ALLOWED_ORIGIN.split(',').map(s => s.trim())
      : '*';

    const app = express();
    app.use(cors({ origin: allowedOrigin }));

    // Stripe webhook needs raw body for signature verification — must come before express.json()
    app.use('/shop/webhook', express.raw({ type: 'application/json' }));
    app.use(express.json());

    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', ts: Date.now() });
    });

    app.use('/auth',    createAuthRouter());
    app.use('/profile', createProfileRouter());
    app.use('/profile', createEquipPackRouter());
    app.use('/shop',    createShopRouter());

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
