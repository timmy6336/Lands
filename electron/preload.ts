import { contextBridge, ipcRenderer } from 'electron';

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
});
