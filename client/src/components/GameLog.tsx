// Scrolling log panel showing timestamped game events.
// Receives `entries` from useGameLog() and auto-scrolls to the bottom on new entries.
import { useEffect, useRef } from 'react';
import { LogEntry } from 'src/hooks/useGameLog';


interface Props {
  entries: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

const PANEL_W = 268;

export function GameLog({ entries, isOpen, onToggle }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever new entries arrive (only when panel is open)
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries.length, isOpen]);

  return (
    <>
      {/* Toggle tab — fixed to right edge, moves with panel */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? PANEL_W : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 41,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '14px 7px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          opacity: 0.85,
          transition: 'right 0.2s ease, opacity 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
      >
        <span style={{
          fontSize: '0.58rem',
          letterSpacing: '0.14em',
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          userSelect: 'none',
          fontWeight: 600,
        }}>
          LOG
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1 }}>
          {isOpen ? '▶' : '◀'}
        </span>
      </button>

      {/* Overlay panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: PANEL_W,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(12,17,40,0.97)',
            borderLeft: '1px solid var(--border)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-border">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">
              Game Log
            </span>
            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '1.1rem',
                padding: '2px 4px',
                cursor: 'pointer',
                lineHeight: 1,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
            >
              ×
            </button>
          </div>

          {/* Entry list */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
            {entries.length === 0 ? (
              <p className="text-muted text-xs text-center m-0 mt-6">No events yet…</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {entries.map(entry => (
                  <div key={entry.id} className="flex gap-2 text-xs leading-snug">
                    <span
                      className="shrink-0 font-mono tabular-nums text-muted"
                      style={{ fontSize: '0.68rem', paddingTop: 1 }}
                    >
                      {entry.timestamp}
                    </span>
                    <span style={{ color: 'var(--text)', lineHeight: 1.45 }}>
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
