// ReplayBrowser.tsx — Lists saved replay files from the user's data directory (loaded via
// the electron IPC 'list-replays' channel). Clicking a replay calls onSelect to launch
// ReplayViewer. Files are sorted newest-first by their embedded timestamp.

import { useEffect, useState } from 'react';
import { ReplayFile } from '@lands/shared';

// Metadata-only shape returned by listReplays (no snapshots)
type ReplayMeta = Omit<ReplayFile, 'snapshots'>;

interface Props {
  onBack: () => void;
  onView: (replay: ReplayFile) => void;
}

export function ReplayBrowser({ onBack, onView }: Props) {
  const [metas, setMetas] = useState<ReplayMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electronAPI) { setLoading(false); return; }
    window.electronAPI.listReplays()
      .then(raw => setMetas(raw as ReplayMeta[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleView(id: string) {
    if (!window.electronAPI) return;
    setLoadingId(id);
    try {
      const replay = await window.electronAPI.loadReplay(id) as ReplayFile;
      if (replay) onView(replay);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.electronAPI) return;
    await window.electronAPI.deleteReplay(id).catch(() => {});
    setMetas(prev => prev.filter(m => m.id !== id));
  }

  async function handleExport(id: string) {
    if (!window.electronAPI) return;
    setExportingId(id);
    try {
      await window.electronAPI.exportReplay(id);
    } finally {
      setExportingId(null);
    }
  }

  async function handleImport() {
    if (!window.electronAPI) return;
    setImportStatus('Importing…');
    try {
      const result = await window.electronAPI.importReplay();
      if (result === null) {
        setImportStatus(null); // cancelled
        return;
      }
      if ('error' in result && typeof result.error === 'string') {
        setImportStatus('⚠ ' + result.error);
        setTimeout(() => setImportStatus(null), 4000);
        return;
      }
      // Prepend the new meta to the list
      setMetas(prev => [result as ReplayMeta, ...prev]);
      setImportStatus('✓ Imported');
      setTimeout(() => setImportStatus(null), 2500);
    } catch {
      setImportStatus('⚠ Import failed');
      setTimeout(() => setImportStatus(null), 3000);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.5rem 1.2rem' }}>
          ← Back
        </button>
        <h2 className="text-accent m-0" style={{ fontSize: '1.6rem', fontWeight: 700, flex: 1 }}>Replays</h2>
        {window.electronAPI && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {importStatus && (
              <span className="text-muted" style={{ fontSize: '0.82rem' }}>{importStatus}</span>
            )}
            <button
              className="btn-secondary"
              onClick={handleImport}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              ↑ Import
            </button>
          </div>
        )}
      </div>

      {!window.electronAPI && (
        <p className="text-muted">Replays are only available in the desktop app.</p>
      )}

      {window.electronAPI && loading && (
        <p className="text-muted">Loading…</p>
      )}

      {window.electronAPI && !loading && metas.length === 0 && (
        <p className="text-muted">No replays saved yet. Complete a game to record one.</p>
      )}

      {window.electronAPI && !loading && metas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto' }}>
          {metas.map(m => (
            <ReplayRow
              key={m.id}
              meta={m}
              isLoading={loadingId === m.id}
              isExporting={exportingId === m.id}
              onView={() => handleView(m.id)}
              onDelete={() => handleDelete(m.id)}
              onExport={() => handleExport(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReplayRow({
  meta, isLoading, isExporting, onView, onDelete, onExport,
}: {
  meta: ReplayMeta;
  isLoading: boolean;
  isExporting: boolean;
  onView: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const date = new Date(meta.date);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const winnerName = meta.winner === null
    ? 'Unknown'
    : meta.winner === 'draw'
    ? 'Draw'
    : meta.playerNames[meta.winner];

  const modeTag = meta.mode === 'single-player' ? 'vs AI' : 'Multiplayer';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      background: 'var(--surface)', borderRadius: '8px', padding: '0.8rem 1rem',
      border: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          {meta.playerNames[0]} vs {meta.playerNames[1]}
        </div>
        <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
          {dateStr} {timeStr} · {modeTag} · Turn {meta.turnCount} · Winner: {winnerName}
        </div>
        {meta.winReason && (
          <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '1px', fontStyle: 'italic' }}>
            {meta.winReason}
          </div>
        )}
      </div>
      <button
        className="btn-primary"
        onClick={onView}
        disabled={isLoading}
        style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
      >
        {isLoading ? '…' : 'Watch'}
      </button>
      <button
        className="btn-secondary"
        onClick={onExport}
        disabled={isExporting}
        style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
        title="Export replay to file"
      >
        {isExporting ? '…' : '↓ Export'}
      </button>
      <button
        className="btn-secondary"
        onClick={onDelete}
        style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', color: 'var(--red-land)' }}
        title="Delete replay"
      >
        ✕
      </button>
    </div>
  );
}
