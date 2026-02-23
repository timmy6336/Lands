// ─────────────────────────────────────────────────────────────────────────────
// electron/preload.ts — security bridge between main process and renderer
//
// Electron runs the renderer (React UI) in a sandboxed context that has NO
// direct access to Node.js or OS APIs.  This preload script runs with elevated
// privileges and acts as a typed gateway: it exposes exactly the functions the
// renderer needs (server control, IP lookup, file I/O for card images and replays,
// and settings persistence) and nothing more.
//
// Every function here simply forwards the call to ipcMain via ipcRenderer.invoke(),
// which is answered by the handlers in electron/main.ts.
// ─────────────────────────────────────────────────────────────────────────────
import { contextBridge, ipcRenderer } from 'electron';

// All exposed methods are available to the renderer as `window.electronAPI.*`.
contextBridge.exposeInMainWorld('electronAPI', {
  startServer: (port: number) =>
    ipcRenderer.invoke('start-server', port),

  stopServer: () =>
    ipcRenderer.invoke('stop-server'),

  getIPs: () =>
    ipcRenderer.invoke('get-ips'),

  attemptUPnP: (port: number) =>
    ipcRenderer.invoke('attempt-upnp', port),

  openImageDialog: () =>
    ipcRenderer.invoke('open-image-dialog'),

  saveCardImage: (color: string, srcPath: string) =>
    ipcRenderer.invoke('save-card-image', color, srcPath),

  getCardImageUrls: () =>
    ipcRenderer.invoke('get-card-image-urls'),

  resetCardImage: (color: string) =>
    ipcRenderer.invoke('reset-card-image', color),

  getSettings: () =>
    ipcRenderer.invoke('get-settings'),

  saveSettings: (s: unknown) =>
    ipcRenderer.invoke('save-settings', s),

  saveReplay: (replay: unknown) =>
    ipcRenderer.invoke('save-replay', replay),

  listReplays: () =>
    ipcRenderer.invoke('list-replays'),

  loadReplay: (id: string) =>
    ipcRenderer.invoke('load-replay', id),

  deleteReplay: (id: string) =>
    ipcRenderer.invoke('delete-replay', id),

  exportReplay: (id: string) =>
    ipcRenderer.invoke('export-replay', id),

  importReplay: () =>
    ipcRenderer.invoke('import-replay'),
});
