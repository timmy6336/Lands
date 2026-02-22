import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@lands/shared': path.resolve(__dirname, '../shared/types.ts'),
      '@lands/game':   path.resolve(__dirname, '../server/src/game'),
      '@lands/ai':     path.resolve(__dirname, '../server/src/ai'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
