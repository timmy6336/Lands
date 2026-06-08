// replayStorage.ts — cross-platform persistence for saved replays.
//
// Replays need to be written to and read from local disk, which the browser
// sandbox doesn't allow directly. Two native shells provide that access, each
// its own way:
//   • Electron — `window.electronAPI` (contextBridge → ipcMain → Node `fs`,
//     see electron/preload.ts and electron/main.ts)
//   • Capacitor (Android) — the `@capacitor/filesystem` plugin, sandboxed to
//     the app's private `Directory.Data`
// This module picks whichever is present at runtime and exposes one identical
// async API, so ReplayBrowser/useLocalGame/useSocket don't need to care which
// shell they're running in. In a plain browser tab neither is available and
// `isAvailable()` returns false.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { ReplayFile } from '@lands/shared';

export type ReplayMeta = Omit<ReplayFile, 'snapshots'>;

const REPLAYS_DIR = 'replays';

function useElectron(): boolean {
  return !!window.electronAPI;
}

function useCapacitor(): boolean {
  return Capacitor.isNativePlatform();
}

export function isAvailable(): boolean {
  return useElectron() || useCapacitor();
}

async function ensureCapacitorDir(): Promise<void> {
  try {
    await Filesystem.mkdir({ path: REPLAYS_DIR, directory: Directory.Data, recursive: true });
  } catch {
    // Already exists — fine.
  }
}

function replayPath(id: string): string {
  return `${REPLAYS_DIR}/${id}.json`;
}

export async function saveReplay(replay: ReplayFile): Promise<void> {
  if (useElectron()) {
    return window.electronAPI!.saveReplay(replay);
  }
  if (useCapacitor()) {
    await ensureCapacitorDir();
    await Filesystem.writeFile({
      path: replayPath(replay.id),
      data: JSON.stringify(replay),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return;
  }
}

export async function listReplays(): Promise<ReplayMeta[]> {
  if (useElectron()) {
    return window.electronAPI!.listReplays() as Promise<ReplayMeta[]>;
  }
  if (useCapacitor()) {
    let names: string[];
    try {
      const { files } = await Filesystem.readdir({ path: REPLAYS_DIR, directory: Directory.Data });
      names = files.map(f => f.name).filter(n => n.endsWith('.json'));
    } catch {
      return []; // directory doesn't exist yet — no replays saved
    }
    const metas: ReplayMeta[] = [];
    for (const name of names) {
      try {
        const { data } = await Filesystem.readFile({
          path: `${REPLAYS_DIR}/${name}`, directory: Directory.Data, encoding: Encoding.UTF8,
        });
        const { snapshots: _snapshots, ...meta } = JSON.parse(data as string) as ReplayFile;
        metas.push(meta);
      } catch {
        // skip corrupt files
      }
    }
    return metas.sort((a, b) => b.date.localeCompare(a.date));
  }
  return [];
}

export async function loadReplay(id: string): Promise<ReplayFile | null> {
  if (useElectron()) {
    return (await window.electronAPI!.loadReplay(id)) as ReplayFile | null;
  }
  if (useCapacitor()) {
    try {
      const { data } = await Filesystem.readFile({
        path: replayPath(id), directory: Directory.Data, encoding: Encoding.UTF8,
      });
      return JSON.parse(data as string) as ReplayFile;
    } catch {
      return null;
    }
  }
  return null;
}

export async function deleteReplay(id: string): Promise<void> {
  if (useElectron()) {
    return window.electronAPI!.deleteReplay(id);
  }
  if (useCapacitor()) {
    try {
      await Filesystem.deleteFile({ path: replayPath(id), directory: Directory.Data });
    } catch {
      // already gone — fine
    }
    return;
  }
}
