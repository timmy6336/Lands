// Game log rendered as a bottom-sheet drawer.
// Toggle button lives in GameBoard's bottom action bar.
import { useEffect, useRef } from 'react';
import { LogEntry } from 'src/hooks/useGameLog';

interface Props {
  entries: LogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export function GameLog({ entries, isOpen, onClose }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries.length, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem 0.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Game Log
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.3rem', padding: '0.1rem 0.4rem', minHeight: 36 }}
          >
            ×
          </button>
        </div>

        {/* Entry list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.9rem' }}>
          {entries.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', textAlign: 'center', marginTop: '1.5rem' }}>No events yet…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map(entry => (
                <div key={entry.id} style={{ display: 'flex', gap: 8, fontSize: '0.85rem', lineHeight: 1.45 }}>
                  <span style={{ flexShrink: 0, fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--muted)', paddingTop: 2 }}>
                    {entry.timestamp}
                  </span>
                  <span style={{ color: 'var(--text)' }}>{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
