// ─────────────────────────────────────────────────────────────────────────────
// client/src/components/GameBoard.tsx
//
// The main game screen rendered during an active game.
// Composed of five visible layers (top to bottom):
//   1. Opponent info bar    — name, turn indicator, hand count
//   2. Opponent Hand        — face-down if opponent (hidden cards shown as backs)
//   3. Opponent Field       — lands in play, grouped by color; + Graveyard + Deck
//   4. Status bar           — turn number, current phase label, countdown timer
//   5. My Field             — same structure as opponent
//   6. My Hand              — face-up, selectable during playing_play
//   7. My info bar          — name, surrender button, Log/Chat toggles
//
// Floating overlays (conditional):
//   CounterPrompt     — defender’s counter window
//   EffectPrompt      — target selection for Red/Green/Blue/Black effects
//   GameLog panel     — side drawer
//   ChatPanel         — side drawer
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { ChatMessage, GameState, ClientToServerEvents, Color, GameSettings } from '@lands/shared';
import { Field } from './Field';
import { Hand } from './Hand';
import { Graveyard } from './Graveyard';
import { DeckDisplay } from './DeckDisplay';
import { CounterPrompt } from './CounterPrompt';
import { EffectPrompt } from './EffectPrompt';
import { useUISettings } from '../hooks/useUISettings';
import { useSound } from '../hooks/useSound';
import { useGameLog } from '../hooks/useGameLog';

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  send: <K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => void;
  chatMessages: ChatMessage[];
  onSendChat: (message: string) => void;
  playerName: string;
}

// ── Status context ─────────────────────────────────────────────────────────
interface StatusCtx {
  label: string;
  sub:   string;
  glowClass: string;
  rgb: string;
}
function getStatusContext(
  phase: string, isMyTurn: boolean, oppName: string, pendingColor?: string,
): StatusCtx {
  if (phase === 'playing_play' || phase === 'playing_draw') {
    if (isMyTurn) return {
      label: 'YOUR TURN',
      sub:   'Select a land from your hand to play',
      glowClass: 'status-mine', rgb: '52,211,153',
    };
    return {
      label: `${oppName}'s Turn`,
      sub:   'Waiting for opponent…',
      glowClass: 'status-opp', rgb: '251,191,36',
    };
  }
  if (phase === 'counter_window') return {
    label: 'COUNTER OPPORTUNITY',
    sub:   `Opponent played a ${pendingColor ?? ''} land — counter or pass?`,
    glowClass: 'status-counter', rgb: '248,113,113',
  };
  if (phase === 'counter_response') return {
    label: 'CARD WAS COUNTERED',
    sub:   'Spend 2 Blue cards to counter the counter',
    glowClass: 'status-counter', rgb: '248,113,113',
  };
  const EFF: Record<string, StatusCtx> = {
    effect_red_pick:    { label: 'RED LAND EFFECT',   sub: 'Choose an opponent land to destroy',          glowClass: '', rgb: '220,38,38'  },
    effect_green_pick:  { label: 'GREEN LAND EFFECT',  sub: 'Choose a card to retrieve from your graveyard', glowClass: '', rgb: '22,163,74'  },
    effect_blue_look:   { label: 'BLUE LAND EFFECT',   sub: 'Keep the top card on top or send it to the bottom', glowClass: '', rgb: '37,99,235' },
    effect_black_show:  { label: 'BLACK LAND EFFECT',  sub: 'Reveal 3 cards from your hand',               glowClass: '', rgb: '124,58,237' },
    effect_black_pick:  { label: 'BLACK LAND EFFECT',  sub: 'Choose a card to discard from their hand',   glowClass: '', rgb: '124,58,237' },
  };
  return EFF[phase] ?? {
    label: phase.replace(/_/g,' ').toUpperCase(), sub: '', glowClass: '', rgb: '100,116,139',
  };
}

// ── Inline counter-window timer ─────────────────────────────────────────────
function CounterTimer({ deadline, settings }: { deadline?: number; settings: GameSettings }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  useEffect(() => {
    if (settings.counterTimeLimitSeconds === null || !deadline) { setTimeLeft(null); return; }
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline, settings.counterTimeLimitSeconds]);
  if (timeLeft === null) return null;
  return (
    <span style={{
      fontSize: '1.05rem', fontWeight: 800, fontFamily: 'monospace',
      color: timeLeft <= 5 ? 'var(--counter-clr)' : 'var(--muted2)',
      minWidth: 44, textAlign: 'right', display: 'inline-block',
    }}>
      {timeLeft}s
    </span>
  );
}

const EFFECT_COLORS: Record<string, string> = {
  white: '#d6ceb0',
  red:   '#c0392b',
  blue:  '#1a6fa8',
  green: '#2d7a47',
  black: '#887799',
};

export function GameBoard({ gameState, myIndex, send, chatMessages, onSendChat, playerName }: Props) {
  const [surrenderConfirm, setSurrenderConfirm] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'log' | 'chat'>('log');
  const [chatDraft, setChatDraft] = useState('');
  const logListRef  = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { playDraw, playPlay, playCounter } = useSound();
  const { entries: logEntries, addEntry: addLogEntry } = useGameLog(gameState);
  const {
    showEffectResultRed, showEffectResultGreen,
    showEffectResultBlue, showEffectResultBlack,
  } = useUISettings();

  // Effect result popup — only shown to the non-attacker, and only if the setting is enabled.
  type EffectPopup =
    | { type: 'red';   cardColor: Color; ownerName: string }
    | { type: 'green'; cardColor: Color; ownerName: string }
    | { type: 'blue';  keptOnTop: boolean }
    | { type: 'black'; cardColor: Color; ownerName: string };
  const [effectPopup, setEffectPopup] = useState<EffectPopup | null>(null);
  useEffect(() => {
    const r = gameState.effectResult;
    if (!r) return;
    // Only show to the opponent — not the player who played the effect
    if (gameState.viewerIndex === r.attackerIndex) return;
    const settingOn =
      (r.type === 'red'   && showEffectResultRed)   ||
      (r.type === 'green' && showEffectResultGreen) ||
      (r.type === 'blue'  && showEffectResultBlue)  ||
      (r.type === 'black' && showEffectResultBlack);
    if (!settingOn) return;
    setEffectPopup(r);
  }, [gameState.effectResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss the effect popup after 3 seconds
  useEffect(() => {
    if (!effectPopup) return;
    const id = setTimeout(() => setEffectPopup(null), 3000);
    return () => clearTimeout(id);
  }, [effectPopup]);

  // Mirror incoming chat messages into the game log
  const prevChatLenRef = useRef(0);
  useEffect(() => {
    if (chatMessages.length > prevChatLenRef.current) {
      chatMessages.slice(prevChatLenRef.current).forEach(m => {
        addLogEntry(`${m.playerName}: ${m.message}`);
      });
      prevChatLenRef.current = chatMessages.length;
    }
  }, [chatMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sound triggers — detect state transitions
  const prevRef = useRef({
    turnNumber: gameState.turnNumber,
    pendingPlayId: gameState.pendingPlay?.id,
    chainLength: gameState.counterChain.length,
  });
  useEffect(() => {
    const prev = prevRef.current;
    const { turnNumber, pendingPlay, counterChain } = gameState;
    if (pendingPlay?.id && pendingPlay.id !== prev.pendingPlayId) playPlay();
    if (counterChain.length > 1 && counterChain.length > prev.chainLength) playCounter();
    if (turnNumber > prev.turnNumber) playDraw();
    prevRef.current = { turnNumber, pendingPlayId: pendingPlay?.id, chainLength: counterChain.length };
  }, [gameState]);  // eslint-disable-line react-hooks/exhaustive-deps

  const me = gameState.players[myIndex];
  const opponent = gameState.players[1 - myIndex];
  const isMyTurn = gameState.currentPlayerIndex === myIndex;
  const phase = gameState.phase;
  const statusCtx = getStatusContext(phase, isMyTurn, opponent.name, gameState.pendingPlay?.color);

  // ── Which hand cards are playable? ────────────────────────────────────────
  const playableIds: Set<string> | undefined =
    isMyTurn && phase === 'playing_play'
      ? new Set(me.hand.map(c => c.id))
      : undefined;

  // ── Auto-scroll sidebars ─────────────────────────────────────────────────
  useEffect(() => {
    logListRef.current?.scrollTo({ top: logListRef.current.scrollHeight, behavior: 'smooth' });
  }, [logEntries]);
  useEffect(() => {
    chatListRef.current?.scrollTo({ top: chatListRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  // ── Send chat helper ─────────────────────────────────────────────────────
  function handleSendChat() {
    const msg = chatDraft.trim();
    if (!msg) return;
    onSendChat(msg);
    setChatDraft('');
    chatInputRef.current?.focus();
  }

  const showCounterWindow =
    phase === 'counter_window' && !isMyTurn;
  const showCounterCounterWindow =
    phase === 'counter_response' && isMyTurn;
  const showEffect = [
    'effect_red_pick', 'effect_green_pick', 'effect_blue_look',
    'effect_black_show', 'effect_black_pick',
  ].includes(phase);

  // ── Style helpers ─────────────────────────────────────────────────────────
  const playerBarStyle = (active: boolean, rgb: string): React.CSSProperties => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 10, padding: '0.45rem 1rem', flexShrink: 0, height: 44,
    fontSize: '0.85rem',
    background: active ? `rgba(${rgb}, 0.08)` : 'var(--surface)',
    border: active ? `1px solid rgba(${rgb}, 0.35)` : '1px solid var(--border)',
    boxShadow: active ? `0 0 14px rgba(${rgb}, 0.18)` : 'none',
    transition: 'background 0.35s, border-color 0.35s, box-shadow 0.35s',
  });

  const deckBoxStyle: React.CSSProperties = {
    border: '1px solid var(--border)', borderRadius: 10, padding: '6px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 4, background: 'rgba(255,255,255,0.02)', flexShrink: 0,
  };

  // ── The famous return ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ════════ LEFT: game column ════════════════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '10px 0 10px 10px', gap: 6 }}>

        {/* ── Opponent header bar ─────────────────────────────────────────── */}
        <div style={playerBarStyle(!isMyTurn, '251,191,36')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span
              className={!isMyTurn ? 'dot-blink' : ''}
              style={{
                width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                background: !isMyTurn ? 'var(--turn-opp)' : 'var(--border)',
                boxShadow: !isMyTurn ? '0 0 6px var(--turn-opp)' : 'none',
              }}
            />
            {opponent.name}
            {!opponent.isConnected && (
              <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>⚠ disconnected</span>
            )}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted2)', fontSize: '0.78rem' }}>
            <span style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '1px 8px', fontFamily: 'monospace', fontWeight: 700,
            }}>
              ✋ {opponent.handCount}
            </span>
            <span style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '1px 8px', fontFamily: 'monospace', fontWeight: 700,
            }}>
              🃏 {opponent.deckCount}
            </span>
          </span>
        </div>

        {/* ── Opponent hand (face-down) ───────────────────────────────────── */}
        <Hand
          cards={[]}
          hiddenCount={opponent.handCount}
          customizations={opponent.customizations}
          label={`${opponent.name}'s Hand`}
        />

        {/* ── Opponent field + graveyard + deck ───────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, flex: 1, minHeight: 0 }}>
          <Field cards={opponent.field} customizations={opponent.customizations} label={`${opponent.name}'s Field`} />
          <Graveyard cards={opponent.graveyard} customizations={opponent.customizations} label="Grave" />
          <div style={deckBoxStyle}>
            <DeckDisplay count={opponent.deckCount} />
            <span style={{ fontSize: '0.58rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deck</span>
          </div>
        </div>

        {/* ─── STATUS BAR ──────────────────────────────────────────────────── */}
        {(() => {
          const hasGlow = !!statusCtx.glowClass;
          return (
            <div
              className={statusCtx.glowClass || ''}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: 10, padding: '0 1.2rem', flexShrink: 0, height: 52,
                background: hasGlow ? `rgba(${statusCtx.rgb}, 0.07)` : 'var(--surface2)',
                border: `1px solid rgba(${statusCtx.rgb || '100,116,139'}, ${hasGlow ? '0.4' : '0.2'})`,
                boxShadow: hasGlow ? `0 0 18px rgba(${statusCtx.rgb}, 0.22), inset 0 0 30px rgba(${statusCtx.rgb}, 0.04)` : 'none',
                transition: 'background 0.4s, box-shadow 0.4s, border-color 0.4s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: hasGlow ? `rgb(${statusCtx.rgb})` : 'var(--muted2)',
                }}>
                  {statusCtx.label}
                </span>
                {statusCtx.sub && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted3)', letterSpacing: '0.02em' }}>
                    {statusCtx.sub}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted2)', fontFamily: 'monospace' }}>
                Turn {gameState.turnNumber}
              </span>
            </div>
          );
        })()}

        {/* ── My field + graveyard + deck ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, flex: 1, minHeight: 0 }}>
          <Field cards={me.field} customizations={me.customizations} label="Your Field" />
          <Graveyard cards={me.graveyard} customizations={me.customizations} label="Grave" />
          <div style={deckBoxStyle}>
            <DeckDisplay count={me.deckCount} />
            <span style={{ fontSize: '0.58rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deck</span>
          </div>
        </div>

        {/* ── My hand ─────────────────────────────────────────────────────── */}
        <Hand
          cards={me.hand}
          customizations={me.customizations}
          label="Your Hand"
          selectableIds={playableIds}
          onSelect={(cardId) => send('play_card', { cardId })}
        />

        {/* ── My header bar ───────────────────────────────────────────────── */}
        <div style={playerBarStyle(isMyTurn, '52,211,153')}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span
              className={isMyTurn ? 'dot-blink' : ''}
              style={{
                width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                background: isMyTurn ? 'var(--turn-mine)' : 'var(--border)',
                boxShadow: isMyTurn ? '0 0 6px var(--turn-mine)' : 'none',
              }}
            />
            {me.name}
          </span>

          {surrenderConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted2)' }}>Surrender?</span>
              <button className="btn-primary"
                onClick={() => { send('surrender'); setSurrenderConfirm(false); }}
                style={{ fontSize: '0.72rem', padding: '0.18rem 0.65rem', background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                Yes
              </button>
              <button className="btn-secondary"
                onClick={() => setSurrenderConfirm(false)}
                style={{ fontSize: '0.72rem', padding: '0.18rem 0.65rem' }}>
                No
              </button>
            </div>
          ) : (
            <button className="btn-secondary"
              onClick={() => setSurrenderConfirm(true)}
              style={{ fontSize: '0.72rem', padding: '0.18rem 0.75rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.35)' }}>
              Surrender
            </button>
          )}
        </div>
      </div>

      {/* ════════ RIGHT: sidebar ══════════════════════════════════════════════ */}
      <div style={{
        width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column',
        padding: '10px 10px 10px 6px',
      }}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 12,
          border: '1px solid var(--border)', background: 'var(--surface)',
          overflow: 'hidden',
        }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {(['log', 'chat'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                style={{
                  flex: 1, padding: '0.55rem 0', fontSize: '0.75rem', fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase', border: 'none', cursor: 'pointer',
                  background: sidebarTab === tab ? 'var(--surface2)' : 'transparent',
                  color: sidebarTab === tab ? 'var(--accent)' : 'var(--muted2)',
                  borderBottom: sidebarTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'color 0.2s, background 0.2s',
                }}
              >
                {tab === 'log' ? '📋 Log' : '💬 Chat'}
              </button>
            ))}
          </div>

          {/* Log panel */}
          {sidebarTab === 'log' && (
            <div
              ref={logListRef}
              style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              {logEntries.length === 0 && (
                <span style={{ color: 'var(--muted3)', fontSize: '0.72rem', textAlign: 'center', marginTop: '1rem' }}>
                  No events yet
                </span>
              )}
              {logEntries.map((entry, i) => (
                <div key={entry.id ?? i} style={{
                  fontSize: '0.72rem', color: 'var(--muted2)', lineHeight: 1.5,
                  borderLeft: '2px solid var(--surface3)', paddingLeft: 6,
                }}>
                  <span style={{ color: 'var(--muted3)', marginRight: 4 }}>{entry.timestamp}</span>
                  {entry.message}
                </div>
              ))}
            </div>
          )}

          {/* Chat panel */}
          {sidebarTab === 'chat' && (
            <>
              <div
                ref={chatListRef}
                style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                {chatMessages.length === 0 && (
                  <span style={{ color: 'var(--muted3)', fontSize: '0.72rem', textAlign: 'center', marginTop: '1rem' }}>
                    No messages yet
                  </span>
                )}
                {chatMessages.map((msg, i) => {
                  const isMe = msg.playerName === playerName;
                  return (
                    <div key={i} style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '90%', fontSize: '0.72rem', lineHeight: 1.45,
                    }}>
                      {!isMe && (
                        <div style={{ fontSize: '0.62rem', color: 'var(--muted3)', marginBottom: 1 }}>
                          {msg.playerName}
                        </div>
                      )}
                      <div style={{
                        borderRadius: isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                        padding: '5px 9px',
                        background: isMe ? 'rgba(99,102,241,0.22)' : 'var(--surface2)',
                        border: `1px solid ${isMe ? 'rgba(99,102,241,0.35)' : 'var(--border)'}`,
                        color: isMe ? '#c7d2fe' : 'var(--muted)',
                        wordBreak: 'break-word',
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Chat input */}
              <div style={{
                borderTop: '1px solid var(--border)', padding: '0.5rem 0.6rem',
                display: 'flex', gap: 5, flexShrink: 0,
              }}>
                <input
                  ref={chatInputRef}
                  value={chatDraft}
                  onChange={e => setChatDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
                  placeholder="Message…"
                  style={{
                    flex: 1, padding: '0.35rem 0.6rem', borderRadius: 7, fontSize: '0.75rem',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--foreground)', outline: 'none',
                  }}
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatDraft.trim()}
                  style={{
                    borderRadius: 7, padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 700,
                    background: chatDraft.trim() ? 'var(--accent-bright)' : 'var(--surface2)',
                    border: '1px solid var(--border)', color: chatDraft.trim() ? '#fff' : 'var(--muted2)',
                    cursor: chatDraft.trim() ? 'pointer' : 'default', transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  ↑
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ════════ OVERLAYS ════════════════════════════════════════════════════ */}
      {showCounterWindow && gameState.pendingPlay && (
        <CounterPrompt
          gameState={gameState}
          myIndex={myIndex}
          onCounter={(blueCardId, matchingCardId) =>
            send('counter_response', { countering: true, blueCardId, matchingCardId })
          }
          onPass={() => send('counter_response', { countering: false })}
        />
      )}

      {showCounterCounterWindow && gameState.pendingPlay && (
        <CounterPrompt
          gameState={gameState}
          myIndex={myIndex}
          isCounterCounter
          onCounter={(b1, b2) =>
            send('counter_counter_response', { countering: true, blueCard1Id: b1, blueCard2Id: b2 })
          }
          onPass={() => send('counter_counter_response', { countering: false })}
        />
      )}

      {showEffect && (
        <EffectPrompt
          gameState={gameState}
          myIndex={myIndex}
          onRespond={(data) => send('effect_response', data as any)}
        />
      )}

      {/* Pending play indicator */}
      {gameState.pendingPlay && !showCounterWindow && !showCounterCounterWindow && (
        <div style={{
          position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '0.4rem 1.1rem', fontSize: '0.78rem',
          color: 'var(--muted)', pointerEvents: 'none', zIndex: 50,
          backdropFilter: 'blur(4px)',
        }}>
          {isMyTurn
            ? `Waiting for ${opponent.name} to respond…`
            : `${opponent.name} played a ${gameState.pendingPlay.color} land`}
        </div>
      )}

      {/* Effect result popup */}
      {effectPopup && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
          <div
            style={{
              pointerEvents: 'auto', borderRadius: 14,
              border: `1px solid ${'cardColor' in effectPopup ? EFFECT_COLORS[effectPopup.cardColor] : EFFECT_COLORS.blue}55`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              textAlign: 'center', cursor: 'pointer',
              background: 'var(--surface)',
              boxShadow: `0 0 28px rgba(0,0,0,0.6), 0 0 0 1px ${'cardColor' in effectPopup ? EFFECT_COLORS[effectPopup.cardColor] : EFFECT_COLORS.blue}44`,
              padding: '1.5rem 2rem', maxWidth: 310,
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => setEffectPopup(null)}
          >
            {effectPopup.type === 'red' && (
              <>
                <span style={{ fontSize: '2.5rem' }}>💥</span>
                <p style={{ margin: 0, fontWeight: 600, color: EFFECT_COLORS.red }}>Land Destroyed</p>
                <div style={{ borderRadius: 8, padding: '5px 14px', fontWeight: 700, fontSize: '0.88rem', background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}>
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p style={{ color: 'var(--muted2)', fontSize: '0.82rem', margin: 0 }}>
                  Removed from <strong style={{ color: 'var(--foreground)' }}>{effectPopup.ownerName}</strong>'s field
                </p>
              </>
            )}
            {effectPopup.type === 'green' && (
              <>
                <span style={{ fontSize: '2.5rem' }}>♻️</span>
                <p style={{ margin: 0, fontWeight: 600, color: EFFECT_COLORS.green }}>Land Retrieved</p>
                <div style={{ borderRadius: 8, padding: '5px 14px', fontWeight: 700, fontSize: '0.88rem', background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}>
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p style={{ color: 'var(--muted2)', fontSize: '0.82rem', margin: 0 }}>
                  Returned to <strong style={{ color: 'var(--foreground)' }}>{effectPopup.ownerName}</strong>'s hand
                </p>
              </>
            )}
            {effectPopup.type === 'blue' && (
              <>
                <span style={{ fontSize: '2.5rem' }}>🔮</span>
                <p style={{ margin: 0, fontWeight: 600, color: EFFECT_COLORS.blue }}>Blue Land Effect</p>
                <p style={{ color: 'var(--muted2)', fontSize: '0.82rem', margin: 0 }}>
                  Opponent's top card was{' '}
                  <strong style={{ color: 'var(--foreground)' }}>
                    {effectPopup.keptOnTop ? 'kept on top' : 'sent to the bottom'}
                  </strong>
                </p>
              </>
            )}
            {effectPopup.type === 'black' && (
              <>
                <span style={{ fontSize: '2.5rem' }}>💀</span>
                <p style={{ margin: 0, fontWeight: 600, color: EFFECT_COLORS.black }}>Card Discarded</p>
                <div style={{ borderRadius: 8, padding: '5px 14px', fontWeight: 700, fontSize: '0.88rem', background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}>
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p style={{ color: 'var(--muted2)', fontSize: '0.82rem', margin: 0 }}>
                  Discarded from <strong style={{ color: 'var(--foreground)' }}>{effectPopup.ownerName}</strong>'s hand
                </p>
              </>
            )}
            <p style={{ color: 'var(--muted3)', fontSize: '0.68rem', margin: 0 }}>click to dismiss</p>
          </div>
        </div>
      )}
    </div>
  );
}
