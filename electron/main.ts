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

ipcMain.handle('get-card-image-urls', async () => {
  const userDir = userCardsDir();
  const resDir = resourceCardsDir();
  const urls: Record<string, string> = {};

  for (const color of COLORS) {
    let found = false;
    // Prefer user-customized image
    for (const ext of IMAGE_EXTS) {
      const p = path.join(userDir, `${color}${ext}`);
      if (fs.existsSync(p)) {
        urls[color] = 'file:///' + p.replace(/\\/g, '/');
        found = true;
        break;
      }
    }
    if (!found) {
      // Fall back to bundled resource
      const p = path.join(resDir, `${color}.svg`);
      urls[color] = 'file:///' + p.replace(/\\/g, '/');
    }
  }

  return urls;
});

ipcMain.handle('reset-card-image', async (_event, color: string) => {
  const dir = userCardsDir();
  for (const ext of IMAGE_EXTS) {
    const p = path.join(dir, `${color}${ext}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
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
