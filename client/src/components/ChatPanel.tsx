// Chat panel rendered as a bottom-sheet drawer.
// Toggle buttons live in GameBoard's bottom action bar.
import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@lands/shared';

interface Props {
  messages: ChatMessage[];
  myName: string;
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function ChatPanel({ messages, myName, isOpen, onClose, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  function handleSend() {
    const msg = draft.trim();
    if (!msg) return;
    onSend(msg);
    setDraft('');
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem 0.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            💬 Chat
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.3rem', padding: '0.1rem 0.4rem', minHeight: 36 }}
          >
            ×
          </button>
        </div>

        {/* Message list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.9rem' }}>
          {messages.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', textAlign: 'center', marginTop: '1.5rem' }}>No messages yet…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((msg, i) => {
                const isMe = msg.playerName === myName;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isMe ? 'var(--accent)' : 'var(--muted)' }}>
                      {msg.playerName}
                    </span>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {msg.message}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 8, padding: '0.5rem 0.9rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value.slice(0, 300))}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Message…"
            style={{ flex: 1, fontSize: '0.95rem' }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="btn-primary"
            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', minHeight: 44, flexShrink: 0 }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
