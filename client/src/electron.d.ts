// electron.d.ts — TypeScript declarations for the contextBridge API exposed by
// preload.ts. When running inside Electron, `window.electronAPI` is set to an
// object implementing ElectronAPI; in a plain browser it is undefined, which the
// client uses to decide whether certain features (server start, replays, custom
// card images) are available.

export {};

/** Persisted application settings stored in Electron's userData directory. */
export interface AppSettings {
  defaultPort: number;
  upnpEnabled: boolean;
  playerName?: string;
}

interface ElectronAPI {
  /** Start the bundled Express/Socket.io server on the given port. Returns the actual port used. */
  startServer(port: number): Promise<{ port: number }>;

  /** Shut down the running server (called on app quit or when returning to the home screen). */
  stopServer(): Promise<void>;

  /** Return the machine's LAN IP and, if UPnP succeeded, the public WAN IP. */
  getIPs(): Promise<{ local: string; public: string | null }>;

  /** Attempt to open the given port via UPnP. Returns a human-readable result message. */
  attemptUPnP(port: number): Promise<{ success: boolean; message: string }>;

  /** Open a native file-picker dialog and return the selected image path (or null if cancelled). */
  openImageDialog(): Promise<string | null>;

  /** Copy an image from srcPath into the userData card-images directory under the given color key. */
  saveCardImage(color: string, srcPath: string): Promise<void>;

  /**
   * Return a map of color → file:// URL for the active skin pack images, with any
   * user-customized images taking priority.  Pass the active packId so skin-specific
   * paths are resolved correctly; omit (or pass 'default') for the classic art.
   */
  getCardImageUrls(packId?: string): Promise<Record<string, string>>;

  /**
   * Returns the base file:// URL pointing at client/dist in the packaged app,
   * so root-relative asset paths like /cards/skins/gilded/preview.svg can be
   * resolved correctly in the Electron file:// context.
   * Returns empty string in dev (localhost:5173 resolves these as-is).
   */
  getCardAssetsBase(): Promise<string>;

  /** Delete the custom image for a color, reverting it to the built-in default. */
  resetCardImage(color: string): Promise<void>;

  /** Load persisted AppSettings from userData (or sensible defaults on first run). */
  getSettings(): Promise<AppSettings>;

  /** Write AppSettings to userData so they survive app restarts. */
  saveSettings(s: AppSettings): Promise<void>;

  /** Append a completed replay object to the replays directory in userData. */
  saveReplay(replay: unknown): Promise<void>;

  /** Return metadata for all saved replay files, sorted newest-first. */
  listReplays(): Promise<unknown[]>;

  /** Load the full replay data for the given replay ID. */
  loadReplay(id: string): Promise<unknown>;

  /** Permanently delete a saved replay by ID. */
  deleteReplay(id: string): Promise<void>;

  /** Export a saved replay to a user-chosen file path via a native save dialog. */
  exportReplay(id: string): Promise<{ success: boolean; message?: string }>;

  /** Open a native file picker, import the chosen JSON as a replay, and return its metadata (no snapshots). Returns null if cancelled, or an object with `error` string on validation failure. */
  importReplay(): Promise<Record<string, unknown> | null>;
}

declare global {
  interface Window {
    /** Present only when running inside Electron (injected by preload.ts). */
    electronAPI?: ElectronAPI;
  }
}
