// ─────────────────────────────────────────────────────────────────────────────
// electron/main.ts — Electron main process
//
// Responsible for:
//   • Creating the BrowserWindow (the app shell)
//   • Running the game server in-process (start-server / stop-server IPC)
//   • Exposing OS utilities to the renderer via IPC handlers:
//       get-ips         — local + public IP for the Lobby copy-paste
//       attempt-upnp    — optional UPnP port mapping for online play
//       open-image-dialog / save-card-image / get-card-image-urls / reset-card-image
//                       — custom card art management
//       save-replay / list-replays / load-replay / delete-replay
//                       — replay file management in userData/replays/
//       get-settings / save-settings
//                       — persistent user preferences in userData/settings.json
//
// All IPC channels are invoked from the renderer via window.electronAPI.*
// (see electron/preload.ts for the definitions).
// ─────────────────────────────────────────────────────────────────────────────
import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { startServer, LandsServer } from '../server/src/server';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
let landsServer: LandsServer | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let upnpClient: any = null;
let currentUpnpPort: number | null = null;

// ── Window ───────────────────────────────────────────────────────────────────

/**
 * Create the main application window.
 * In development, loads from the Vite dev server (http://localhost:5173) and
 * opens DevTools.  In production, loads the built index.html from the bundled
 * resources directory.
 */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // allow file:// card images in renderer
    },
    backgroundColor: '#0e0e12',
    title: 'Lands',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(process.resourcesPath, 'client', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── IPC: server lifecycle ─────────────────────────────────────────────────────

ipcMain.handle('start-server', async (_event, port: number) => {
  if (landsServer) {
    await landsServer.close().catch(() => {});
    landsServer = null;
  }
  landsServer = await startServer(port);
  return { port: landsServer.port };
});

ipcMain.handle('stop-server', async () => {
  if (landsServer) {
    await landsServer.close().catch(() => {});
    landsServer = null;
  }
});

// ── IPC: IP lookup ────────────────────────────────────────────────────────────

/**
 * Find the first non-loopback IPv4 address on any network interface.
 * Used in the Lobby to show the local IP address that other LAN players can use.
 */
function getLocalIP(): string {
  const ifaces = os.networkInterfaces();
  for (const list of Object.values(ifaces)) {
    if (!list) continue;
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

ipcMain.handle('get-ips', async () => {
  const local = getLocalIP();
  let publicIp: string | null = null;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json() as { ip: string };
    publicIp = data.ip;
  } catch { /* ignore — no internet */ }
  return { local, public: publicIp };
});

// ── IPC: UPnP ─────────────────────────────────────────────────────────────────

ipcMain.handle('attempt-upnp', async (_event, port: number) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NatAPI = require('nat-api');
    if (upnpClient) {
      upnpClient.destroy();
      upnpClient = null;
    }
    upnpClient = new NatAPI();
    currentUpnpPort = port;
    await new Promise<void>((resolve, reject) => {
      upnpClient.map(
        { publicPort: port, privatePort: port, ttl: 7200, protocol: 'TCP' },
        (err: Error | null) => { if (err) reject(err); else resolve(); },
      );
    });
    return { success: true, message: `Port ${port} forwarded successfully via UPnP` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, message: `UPnP failed: ${msg}` };
  }
});

// ── IPC: card images ──────────────────────────────────────────────────────────

const COLORS = ['white', 'red', 'blue', 'green', 'black', 'back'] as const;
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

function userCardsDir(): string {
  return path.join(app.getPath('userData'), 'cards');
}

function resourceCardsDir(): string {
  if (isDev) {
    // __dirname = dist/electron → ../../resources/cards
    return path.join(__dirname, '..', '..', 'resources', 'cards');
  }
  return path.join(process.resourcesPath, 'resources', 'cards');
}

ipcMain.handle('open-image-dialog', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
  });
  return result.canceled ? null : result.filePaths[0] ?? null;
});

ipcMain.handle('save-card-image', async (_event, color: string, srcPath: string) => {
  const dir = userCardsDir();
  fs.mkdirSync(dir, { recursive: true });
  // Remove any existing custom images for this color
  for (const ext of IMAGE_EXTS) {
    const old = path.join(dir, `${color}${ext}`);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  const ext = path.extname(srcPath) || '.png';
  const dest = path.join(dir, `${color}${ext}`);
  fs.copyFileSync(srcPath, dest);
});

ipcMain.handle('get-card-image-urls', async (_event, packId?: string) => {
  const userDir = userCardsDir();
  const urls: Record<string, string> = {};

  for (const color of COLORS) {
    let found = false;

    // Priority 1: user-customized image
    for (const ext of IMAGE_EXTS) {
      const p = path.join(userDir, `${color}${ext}`);
      if (fs.existsSync(p)) {
        urls[color] = 'file:///' + p.replace(/\\/g, '/');
        found = true;
        break;
      }
    }

    // Priority 2: active skin pack image (if packId specified and not 'default')
    if (!found && packId && packId !== 'default') {
      const skinsDir = isDev
        ? path.join(__dirname, '..', '..', 'client', 'public', 'cards', 'skins', packId)
        : path.join(process.resourcesPath, 'client', 'dist', 'cards', 'skins', packId);
      const p = path.join(skinsDir, `${color}.svg`);
      if (fs.existsSync(p)) {
        urls[color] = 'file:///' + p.replace(/\\/g, '/');
        found = true;
      }
    }

    // Priority 3: bundled default card art
    if (!found) {
      const p = path.join(resourceCardsDir(), `${color}.svg`);
      urls[color] = 'file:///' + p.replace(/\\/g, '/');
    }
  }

  return urls;
});

// Returns the base file:// URL for client/dist so the renderer can resolve
// root-relative asset paths (e.g. /cards/skins/gilded/preview.svg) in Electron.
ipcMain.handle('get-card-assets-base', async () => {
  if (isDev) return ''; // dev uses localhost:5173 — root-relative paths work as-is
  const base = path.join(process.resourcesPath, 'client', 'dist');
  return 'file:///' + base.replace(/\\/g, '/');
});

ipcMain.handle('reset-card-image', async (_event, color: string) => {
  const dir = userCardsDir();
  for (const ext of IMAGE_EXTS) {
    const p = path.join(dir, `${color}${ext}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});

// ── IPC: replays ──────────────────────────────────────────────────────────────

function replaysDir(): string {
  return path.join(app.getPath('userData'), 'replays');
}

ipcMain.handle('save-replay', async (_event, replay: unknown) => {
  const dir = replaysDir();
  fs.mkdirSync(dir, { recursive: true });
  const r = replay as { id: string };
  fs.writeFileSync(path.join(dir, `${r.id}.json`), JSON.stringify(replay));
});

ipcMain.handle('list-replays', async () => {
  const dir = replaysDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const metas: unknown[] = [];
  for (const f of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as Record<string, unknown>;
      const { snapshots: _snap, ...meta } = raw;
      metas.push(meta);
    } catch { /* skip corrupt files */ }
  }
  return (metas as Array<{ date: string }>).sort((a, b) => b.date.localeCompare(a.date));
});

ipcMain.handle('load-replay', async (_event, id: string) => {
  const p = path.join(replaysDir(), `${id}.json`);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
});

ipcMain.handle('delete-replay', async (_event, id: string) => {
  const p = path.join(replaysDir(), `${id}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

ipcMain.handle('export-replay', async (_event, id: string) => {
  const src = path.join(replaysDir(), `${id}.json`);
  if (!fs.existsSync(src)) return { success: false, message: 'Replay not found' };

  // Build a human-readable default filename from the replay metadata
  let defaultName = `replay-${id}.json`;
  try {
    const raw = JSON.parse(fs.readFileSync(src, 'utf-8')) as { date?: string; playerNames?: [string, string] };
    if (raw.date && raw.playerNames) {
      const d = new Date(raw.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const names = raw.playerNames.join('-vs-').replace(/[^a-zA-Z0-9-]/g, '_');
      defaultName = `replay-${dateStr}-${names}.json`;
    }
  } catch { /* use default */ }

  if (!mainWindow) return { success: false, message: 'No window' };
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [{ name: 'Lands Replay', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return { success: false, message: 'Cancelled' };
  fs.copyFileSync(src, result.filePath);
  return { success: true };
});

ipcMain.handle('import-replay', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Lands Replay', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;

  let replay: Record<string, unknown>;
  try {
    replay = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8')) as Record<string, unknown>;
  } catch {
    return { error: 'Could not parse the selected file as JSON.' };
  }

  // Basic structure validation
  if (
    typeof replay.id !== 'string' ||
    !Array.isArray(replay.snapshots) ||
    !Array.isArray(replay.playerNames) ||
    typeof replay.date !== 'string'
  ) {
    return { error: 'File does not appear to be a valid Lands replay.' };
  }

  const dir = replaysDir();
  fs.mkdirSync(dir, { recursive: true });

  // Avoid ID collisions with existing replays
  let id = replay.id as string;
  if (fs.existsSync(path.join(dir, `${id}.json`))) {
    id = `${id}-${Date.now()}`;
    replay = { ...replay, id };
  }

  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(replay));

  // Return metadata only (strip snapshots for the list)
  const { snapshots: _snap, ...meta } = replay;
  return meta;
});

// ── IPC: settings ─────────────────────────────────────────────────────────────

function settingsFilePath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

const DEFAULT_SETTINGS = { defaultPort: 3001, upnpEnabled: false, playerName: 'Player' };

ipcMain.handle('get-settings', async () => {
  try {
    const raw = fs.readFileSync(settingsFilePath(), 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

ipcMain.handle('save-settings', async (_event, s: unknown) => {
  fs.writeFileSync(settingsFilePath(), JSON.stringify(s, null, 2));
});

// ── App lifecycle ─────────────────────────────────────────────────────────────

Menu.setApplicationMenu(null);
app.whenReady().then(createWindow);

async function shutdownServer() {
  if (landsServer) {
    const s = landsServer;
    landsServer = null;
    await s.close().catch(() => {});
  }
}

app.on('window-all-closed', async () => {
  // Clean up UPnP mapping
  if (upnpClient && currentUpnpPort !== null) {
    try {
      await new Promise<void>((res) => {
        upnpClient.unmap(
          { publicPort: currentUpnpPort, privatePort: currentUpnpPort, protocol: 'TCP' },
          () => res(),
        );
      });
    } catch { /* ignore */ }
    upnpClient.destroy();
  }
  await shutdownServer();
  if (process.platform !== 'darwin') app.quit();
});

// Belt-and-suspenders: close server before the process exits regardless of path
app.on('before-quit', (event) => {
  if (landsServer) {
    event.preventDefault();
    shutdownServer().finally(() => app.quit());
  }
});

process.on('SIGTERM', () => app.quit());
process.on('SIGINT',  () => app.quit());

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
