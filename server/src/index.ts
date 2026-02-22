// ─────────────────────────────────────────────────────────────────────────────
// server/src/index.ts — standalone Node.js entry point
//
// This file is only used when running the server outside of Electron
// (e.g. "npm start" in the server package).  When running inside the Electron
// desktop app, the server is started in-process by electron/main.ts via the
// 'start-server' IPC handler instead — this file is never loaded in that case.
// ─────────────────────────────────────────────────────────────────────────────
import { startServer } from './server';

const port = Number(process.env.PORT ?? 3001);
startServer(port).catch(console.error);
