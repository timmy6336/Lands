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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.5rem 1.2rem' }}>
          ← Back
        </button>
        <h2 className="text-accent m-0" style={{ fontSize: '1.6rem', fontWeight: 700 }}>Replays</h2>
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
              onView={() => handleView(m.id)}
              onDelete={() => handleDelete(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReplayRow({
  meta, isLoading, onView, onDelete,
}: {
  meta: ReplayMeta;
  isLoading: boolean;
  onView: () => void;
  onDelete: () => void;
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
        onClick={onDelete}
        style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem', color: 'var(--red-land)' }}
        title="Delete replay"
      >
        ✕
      </button>
    </div>
  );
}
