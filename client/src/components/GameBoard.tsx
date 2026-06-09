import { useEffect, useRef, useState } from 'react';
import { ChatMessage, GameState, ClientToServerEvents, Color } from '@lands/shared';
import { Field } from './Field';
import { Hand } from './Hand';
import { Graveyard } from './Graveyard';
import { CounterPrompt } from './CounterPrompt';
import { EffectPrompt } from './EffectPrompt';
import { GameLog } from './GameLog';
import { ChatPanel } from './ChatPanel';
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

const PHASE_LABELS: Record<string, string> = {
  playing_play:      'Play a land',
  counter_window:    'Counter window\u2026',
  counter_response:  'Counter-counter\u2026',
  effect_red_pick:   'Red effect: destroy',
  effect_green_pick: 'Green effect: retrieve',
  effect_blue_look:  'Blue effect: peek',
  effect_black_show: 'Black effect: discard',
  effect_black_pick: 'Black effect: choose',
};

const EFFECT_COLORS: Record<string, string> = {
  white: '#d6ceb0',
  red:   '#c0392b',
  blue:  '#1a6fa8',
  green: '#2d7a47',
  black: '#887799',
};

export function GameBoard({ gameState, myIndex, send, chatMessages, onSendChat, playerName }: Props) {
  const [surrenderOpen, setSurrenderOpen] = useState(false);
  const [logOpen, setLogOpen]   = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { playDraw, playPlay, playCounter } = useSound();
  const { entries: logEntries, addEntry: addLogEntry } = useGameLog(gameState);
  const {
    showEffectResultRed, showEffectResultGreen,
    showEffectResultBlue, showEffectResultBlack,
  } = useUISettings();

  type EffectPopup =
    | { type: 'red';   cardColor: Color; ownerName: string }
    | { type: 'green'; cardColor: Color; ownerName: string }
    | { type: 'blue';  keptOnTop: boolean }
    | { type: 'black'; cardColor: Color; ownerName: string };
  const [effectPopup, setEffectPopup] = useState<EffectPopup | null>(null);

  useEffect(() => {
    const r = gameState.effectResult;
    if (!r) return;
    if (gameState.viewerIndex === r.attackerIndex) return;
    const settingOn =
      (r.type === 'red'   && showEffectResultRed)   ||
      (r.type === 'green' && showEffectResultGreen) ||
      (r.type === 'blue'  && showEffectResultBlue)  ||
      (r.type === 'black' && showEffectResultBlack);
    if (!settingOn) return;
    setEffectPopup(r);
  }, [gameState.effectResult]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!effectPopup) return;
    const id = setTimeout(() => setEffectPopup(null), 3000);
    return () => clearTimeout(id);
  }, [effectPopup]);

  const prevChatLenRef = useRef(0);
  useEffect(() => {
    if (chatMessages.length > prevChatLenRef.current) {
      chatMessages.slice(prevChatLenRef.current).forEach(m => {
        addLogEntry(`${m.playerName}: ${m.message}`);
      });
      prevChatLenRef.current = chatMessages.length;
    }
  }, [chatMessages]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  const me       = gameState.players[myIndex];
  const opponent = gameState.players[1 - myIndex];
  const isMyTurn = gameState.currentPlayerIndex === myIndex;
  const phase    = gameState.phase;

  const playableIds: Set<string> | undefined =
    isMyTurn && phase === 'playing_play'
      ? new Set(me.hand.map(c => c.id))
      : undefined;

  const phaseLabel = PHASE_LABELS[phase] ?? phase;

  const showCounterWindow      = phase === 'counter_window'   && !isMyTurn;
  const showCounterCounterWindow = phase === 'counter_response' && isMyTurn;
  const showEffect = ['effect_red_pick','effect_green_pick','effect_blue_look','effect_black_show','effect_black_pick'].includes(phase);

  return (
    <div className="game-root flex flex-col" style={{ height: '100dvh' }}>

      {/* \u2500\u2500 1. Combined opponent strip (44px) */}
      <div style={{
        height: 44, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 6px',
        background: !isMyTurn ? 'rgba(241,196,15,0.09)' : 'var(--surface)',
        border: !isMyTurn ? '1.5px solid rgba(241,196,15,0.4)' : '1.5px solid transparent',
        borderRadius: 10,
        transition: 'background 0.3s, border-color 0.3s',
        overflow: 'hidden',
      }}>
        {!isMyTurn && (
          <span style={{ color: '#f1c40f', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, lineHeight: 1 }}>\u25b6</span>
        )}
        <span style={{ fontWeight: 700, fontSize: '0.82rem', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)', flexShrink: 0 }}>
          {opponent.name}
        </span>
        {!opponent.isConnected && (
          <span style={{ color: '#e74c3c', fontSize: '0.7rem', flexShrink: 0 }}>\u26a0</span>
        )}
        <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '1px 5px', fontWeight: 700, flexShrink: 0, color: 'var(--text)', whiteSpace: 'nowrap' }}>
          \u270b{opponent.handCount}
        </span>
        <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '1px 5px', fontWeight: 700, flexShrink: 0, color: 'var(--text)', whiteSpace: 'nowrap' }}>
          \U0001f480{opponent.graveyard.length}
        </span>
        <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '1px 5px', fontWeight: 700, flexShrink: 0, color: 'var(--text)', whiteSpace: 'nowrap' }}>
          \U0001f0a0{opponent.deckCount}
        </span>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Field
            cards={opponent.field}
            customizations={opponent.customizations}
            label={`${opponent.name}'s field`}
            size="compact"
          />
        </div>
      </div>

      {/* \u2500\u2500 2. Status bar (34px) */}
      <div style={{
        height: 34, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 8px',
        background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>
          Turn {gameState.turnNumber}
        </span>
        <span style={{ color: 'var(--border)', fontSize: '0.8rem' }}>\u00b7</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {gameState.pendingPlay && !showCounterWindow && !showCounterCounterWindow
            ? (isMyTurn
                ? `Waiting for ${opponent.name}\u2026`
                : `${opponent.name} played ${gameState.pendingPlay.color}`)
            : phaseLabel}
        </span>
        <span style={{ color: 'var(--border)', fontSize: '0.8rem' }}>\u00b7</span>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
          background: isMyTurn ? '#27ae60' : '#f1c40f',
          boxShadow: isMyTurn ? '0 0 6px rgba(39,174,96,0.8)' : '0 0 6px rgba(241,196,15,0.8)',
        }} />
      </div>

      {/* \u2500\u2500 3. My field row (76px) */}
      <div style={{
        height: 76, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>\U0001f0a0</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{me.deckCount}</span>
        </div>
        <Graveyard cards={me.graveyard} customizations={me.customizations} label="My" />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Field cards={me.field} customizations={me.customizations} label="Your field" size="normal" />
        </div>
      </div>

      {/* \u2500\u2500 4. My hand (flex 1, min 160px) \u2014 massive 96\xd7140px cards */}
      <Hand
        cards={me.hand}
        customizations={me.customizations}
        label="Your hand"
        selectableIds={playableIds}
        onSelect={(cardId) => send('play_card', { cardId })}
        cardSize="large"
      />

      {/* \u2500\u2500 5. Bottom bar (52px) */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px',
        background: isMyTurn ? 'rgba(39,174,96,0.1)' : 'var(--surface)',
        border: isMyTurn ? '1.5px solid rgba(39,174,96,0.4)' : '1.5px solid transparent',
        borderRadius: 10,
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
          background: isMyTurn ? '#27ae60' : 'rgba(255,255,255,0.15)',
          boxShadow: isMyTurn ? '0 0 6px rgba(39,174,96,0.8)' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }} />
        <span style={{ fontWeight: 700, fontSize: '0.88rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
          {playerName}
        </span>
        <button
          onClick={() => { setChatOpen(v => !v); setLogOpen(false); }}
          style={{
            background: chatOpen ? 'var(--surface2)' : 'transparent',
            border: chatOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
            borderRadius: 8, color: chatOpen ? 'var(--accent)' : 'var(--muted)',
            fontSize: '0.85rem', padding: '0.2rem 0.5rem', minHeight: 38, fontWeight: 600,
          }}
        >\U0001f4ac</button>
        <button
          onClick={() => { setLogOpen(v => !v); setChatOpen(false); }}
          style={{
            background: logOpen ? 'var(--surface2)' : 'transparent',
            border: logOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
            borderRadius: 8, color: logOpen ? 'var(--accent)' : 'var(--muted)',
            fontSize: '0.85rem', padding: '0.2rem 0.5rem', minHeight: 38, fontWeight: 600,
          }}
        >\U0001f4dc</button>
        {isMyTurn && (
          <span style={{ fontSize: '0.7rem', color: '#27ae60', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0 }}>
            \u25b6 YOUR TURN
          </span>
        )}
        <button
          onClick={() => setSurrenderOpen(true)}
          style={{
            background: 'transparent', border: '1px solid rgba(231,76,60,0.35)',
            borderRadius: 8, color: '#e74c3c',
            fontSize: '0.78rem', padding: '0.2rem 0.6rem', minHeight: 38, fontWeight: 600,
          }}
        >\u2691</button>
      </div>

      {surrenderOpen && (
        <div className="overlay">
          <div className="overlay-box" style={{ maxWidth: 320, alignItems: 'center', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', margin: 0 }}>\U0001f3f3</p>
            <h3 style={{ margin: 0, color: 'var(--accent)' }}>Surrender?</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>You&apos;ll forfeit the game.</p>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button className="btn-secondary" onClick={() => setSurrenderOpen(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                style={{ flex: 1, background: '#c0392b', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 10, minHeight: 48 }}
                onClick={() => { send('surrender'); setSurrenderOpen(false); }}
              >
                Yes, Surrender
              </button>
            </div>
          </div>
        </div>
      )}

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

      {effectPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className="pointer-events-auto rounded-xl border border-border flex flex-col items-center gap-3 text-center cursor-pointer"
            style={{
              background: 'var(--surface)',
              boxShadow: `0 0 28px rgba(0,0,0,0.55), 0 0 0 2px ${'cardColor' in effectPopup ? EFFECT_COLORS[effectPopup.cardColor] : EFFECT_COLORS.blue}55`,
              padding: '1.25rem 1.5rem', maxWidth: 300, margin: '0 1rem',
            }}
            onClick={() => setEffectPopup(null)}
          >
            {effectPopup.type === 'red' ? (
              <>
                <span style={{ fontSize: '2rem' }}>\U0001f4a5</span>
                <p style={{ margin: 0, fontWeight: 600, color: EFFECT_COLORS.red }}>Land Destroyed</p>
                <div style={{ borderRadius: 8, padding: '0.4rem 0.9rem', fontWeight: 700, fontSize: '0.85rem', background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}>
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                  Removed from <strong style={{ color: 'var(--text)' }}>{effectPopup.ownerName}</strong>&apos;s field
                </p>
              </>
            ) : effectPopup.type === 'green' ? (
              <>
                <span style={{ fontSize: '2rem' }}>\u267b\ufe0f</span>
                <p style={{ margin: 0, fontWeight: 600, color: EFFECT_COLORS.green }}>Land Retrieved</p>
                <div style={{ borderRadius: 8, padding: '0.4rem 0.9rem', fontWeight: 700, fontSize: '0.85rem', background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}>
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                  Returned to <strong style={{ color: 'var(--text)' }}>{effectPopup.ownerName}</strong>&apos;s hand
                </p>
              </>
            ) : effectPopup.type === 'blue' ? (
              <>
                <span style={{ fontSize: '2rem' }}>\U0001f52e</span>
                <p style={{ margin: 0, fontWeight: 600, color: EFFECT_COLORS.blue }}>Blue Land Effect</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                  Top card <strong style={{ color: 'var(--text)' }}>{effectPopup.keptOnTop ? 'kept on top' : 'sent to bottom'}</strong>
                </p>
              </>
            ) : (
              <>
                <span style={{ fontSize: '2rem' }}>\U0001f480</span>
                <p style={{ margin: 0, fontWeight: 600, color: EFFECT_COLORS.black }}>Card Discarded</p>
                <div style={{ borderRadius: 8, padding: '0.4rem 0.9rem', fontWeight: 700, fontSize: '0.85rem', background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}>
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                  Discarded from <strong style={{ color: 'var(--text)' }}>{effectPopup.ownerName}</strong>&apos;s hand
                </p>
              </>
            )}
            <p style={{ color: 'var(--muted)', fontSize: '0.68rem', margin: 0 }}>tap to dismiss</p>
          </div>
        </div>
      )}

      <ChatPanel
        messages={chatMessages}
        myName={playerName}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onSend={onSendChat}
      />

      <GameLog
        entries={logEntries}
        isOpen={logOpen}
        onClose={() => setLogOpen(false)}
      />
    </div>
  );
}
