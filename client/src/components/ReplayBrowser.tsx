// ReplayBrowser.tsx — Lists saved replay files from local storage (Capacitor
// filesystem or Electron — see lib/replayStorage.ts). Supports sharing replays
// via the Android/iOS share sheet (Capacitor Share plugin).

import { useEffect, useState } from 'react';
import { ReplayFile } from '@lands/shared';
import { isAvailable, listReplays, loadReplay, deleteReplay, shareReplay, ReplayMeta } from '../lib/replayStorage';

interface Props {
  onBack: () => void;
  onView: (replay: ReplayFile) => void;
}

export function ReplayBrowser({ onBack, onView }: Props) {
  const [metas, setMetas] = useState<ReplayMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const available = isAvailable();

  useEffect(() => {
    if (!available) { setLoading(false); return; }
    listReplays()
      .then(setMetas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [available]);

  async function handleView(id: string) {
    if (!available) return;
    setLoadingId(id);
    try {
      const replay = await loadReplay(id);
      if (replay) onView(replay);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!available) return;
    await deleteReplay(id).catch(() => {});
    setMetas(prev => prev.filter(m => m.id !== id));
  }

  async function handleShare(id: string) {
    if (!available) return;
    setSharingId(id);
    try {
      await shareReplay(id);
    } finally {
      setSharingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.5rem 1.2rem', minHeight: 44 }}>
          ← Back
        </button>
        <h2 className="text-accent m-0" style={{ fontSize: '1.4rem', fontWeight: 700 }}>Replays</h2>
      </div>

      {!available && (
        <p className="text-muted">Replays are only available in the desktop and mobile apps.</p>
      )}

      {available && loading && (
        <p className="text-muted">Loading…</p>
      )}

      {available && !loading && metas.length === 0 && (
        <p className="text-muted">No replays saved yet. Complete a game to record one.</p>
      )}

      {available && !loading && metas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto' }}>
          {metas.map(m => (
            <ReplayRow
              key={m.id}
              meta={m}
              isLoading={loadingId === m.id}
              isSharing={sharingId === m.id}
              onView={() => handleView(m.id)}
              onDelete={() => handleDelete(m.id)}
              onShare={() => handleShare(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReplayRow({
  meta, isLoading, isSharing, onView, onDelete, onShare,
}: {
  meta: ReplayMeta;
  isLoading: boolean;
  isSharing: boolean;
  onView: () => void;
  onDelete: () => void;
  onShare: () => void;
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
      display: 'flex', flexDirection: 'column', gap: '0.6rem',
      background: 'var(--surface)', borderRadius: '10px', padding: '0.85rem 1rem',
      border: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          {meta.playerNames[0]} vs {meta.playerNames[1]}
        </div>
        <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '3px' }}>
          {dateStr} {timeStr} · {modeTag} · Turn {meta.turnCount} · Winner: {winnerName}
        </div>
        {meta.winReason && (
          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px', fontStyle: 'italic' }}>
            {meta.winReason}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn-primary"
          onClick={onView}
          disabled={isLoading}
          style={{ flex: 1, padding: '0.55rem 1rem', fontSize: '0.88rem', minHeight: 44 }}
        >
          {isLoading ? '…' : '▶ Watch'}
        </button>
        <button
          className="btn-secondary"
          onClick={onShare}
          disabled={isSharing}
          style={{ padding: '0.55rem 0.9rem', fontSize: '0.88rem', minHeight: 44 }}
          title="Share replay"
        >
          {isSharing ? '…' : '⬆ Share'}
        </button>
        <button
          className="btn-secondary"
          onClick={onDelete}
          style={{ padding: '0.55rem 0.8rem', fontSize: '0.88rem', minHeight: 44, color: 'var(--red-land)' }}
          title="Delete replay"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
