export {};

export interface AppSettings {
  defaultPort: number;
  upnpEnabled: boolean;
  playerName?: string;
}

interface ElectronAPI {
  startServer(port: number): Promise<{ port: number }>;
  stopServer(): Promise<void>;
  getIPs(): Promise<{ local: string; public: string | null }>;
  attemptUPnP(port: number): Promise<{ success: boolean; message: string }>;
  openImageDialog(): Promise<string | null>;
  saveCardImage(color: string, srcPath: string): Promise<void>;
  getCardImageUrls(): Promise<Record<string, string>>;
  resetCardImage(color: string): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(s: AppSettings): Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
