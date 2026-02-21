import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ServerToClientEvents, ClientToServerEvents,
  InterServerEvents, SocketData,
} from '../../shared/types';
import { registerHandlers } from './socketHandlers';

export interface LandsServer {
  close: () => Promise<void>;
  port: number;
}

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
