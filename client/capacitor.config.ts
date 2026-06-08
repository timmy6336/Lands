import type { CapacitorConfig } from '@capacitor/cli';

// ─────────────────────────────────────────────────────────────────────────────
// capacitor.config.ts
//
// Wraps the built Vite client (client/dist) into a native Android shell.
//
// • appId / appName  — Android package identity & display name
// • webDir           — the static build Capacitor copies into the native project
// • server.androidScheme — 'https' avoids mixed-content issues with the
//   Socket.io connection to the dedicated multiplayer server
//
// Single-player vs AI runs entirely inside the WebView (the GameEngine + AI
// execute in JS, no network needed). Multiplayer connects out to whatever
// VITE_DEDICATED_SERVER_URL was baked in at build time (see client/.env.local).
// ─────────────────────────────────────────────────────────────────────────────
const config: CapacitorConfig = {
  appId: 'com.lands.game',
  appName: 'Lands',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
