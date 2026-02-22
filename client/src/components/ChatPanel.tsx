// Expandable text chat panel displayed on the left edge of GameBoard.
// Messages are also injected into the game log so the chat history is preserved.
import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@lands/shared';

interface Props {
  messages: ChatMessage[];
  myName: string;
  isOpen: boolean;
  onToggle: () => void;
  onSend: (message: string) => void;
}

const PANEL_W = 268;

export function ChatPanel({ messages, myName, isOpen, onToggle, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages (only when open)
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function handleSend() {
    const msg = draft.trim();
    if (!msg) return;
    onSend(msg);
    setDraft('');
  }

  return (
    <>
      {/* Toggle tab — fixed to left edge, moves with panel */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          left: isOpen ? PANEL_W : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 41,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          padding: '14px 7px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          opacity: 0.85,
          transition: 'left 0.2s ease, opacity 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
      >
        <span style={{
          fontSize: '0.58rem',
          letterSpacing: '0.14em',
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          userSelect: 'none',
          fontWeight: 600,
        }}>
          CHAT
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1 }}>
          {isOpen ? '◀' : '▶'}
        </span>
      </button>

      {/* Overlay panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: PANEL_W,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(12,17,40,0.97)',
            borderRight: '1px solid var(--border)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-border">
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
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">
              Chat
            </span>
          </div>

          {/* Message list */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
            {messages.length === 0 ? (
              <p className="text-muted text-xs text-center m-0 mt-6">No messages yet…</p>
            ) : (
              <div className="flex flex-col gap-2">
                {messages.map((msg, i) => {
                  const isMe = msg.playerName === myName;
                  return (
                    <div key={i} className="flex flex-col gap-0.5">
                      <span
                        className="text-[0.68rem] font-semibold"
                        style={{ color: isMe ? 'var(--accent)' : 'var(--muted)' }}
                      >
                        {msg.playerName}
                      </span>
                      <span
                        className="text-xs leading-snug break-words"
                        style={{ color: 'var(--text)', lineHeight: 1.45 }}
                      >
                        {msg.message}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="shrink-0 border-t border-border"
            style={{ padding: '0.5rem 0.75rem', display: 'flex', gap: 6 }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, 300))}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Message…"
              style={{
                flex: 1,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text)',
                fontSize: '0.8rem',
                padding: '0.35rem 0.6rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', flexShrink: 0 }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
