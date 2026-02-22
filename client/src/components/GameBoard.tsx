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
import { ChatMessage, GameState, ClientToServerEvents, Color } from '@lands/shared';
import { Field } from './Field';
import { Hand } from './Hand';
import { Graveyard } from './Graveyard';
import { DeckDisplay } from './DeckDisplay';
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
  counter_window:    'Counter window open…',
  counter_response:  'Counter-counter window open…',
  effect_red_pick:   'Red land effect',
  effect_green_pick: 'Green land effect',
  effect_blue_look:  'Blue land effect',
  effect_black_show: 'Black land effect',
  effect_black_pick: 'Black land effect',
};

const EFFECT_COLORS: Record<string, string> = {
  white: '#d6ceb0',
  red:   '#c0392b',
  blue:  '#1a6fa8',
  green: '#2d7a47',
  black: '#887799',
};

export function GameBoard({ gameState, myIndex, send, chatMessages, onSendChat, playerName }: Props) {
  const [surrenderConfirm, setSurrenderConfirm] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
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

  // ── Which hand cards are playable? ────────────────────────────────────────
  const playableIds: Set<string> | undefined =
    isMyTurn && phase === 'playing_play'
      ? new Set(me.hand.map(c => c.id))
      : undefined;

  const phaseLabel = PHASE_LABELS[phase] ?? phase;

  const showCounterWindow =
    phase === 'counter_window' && !isMyTurn;
  const showCounterCounterWindow =
    phase === 'counter_response' && isMyTurn;
  const showEffect = [
    'effect_red_pick', 'effect_green_pick', 'effect_blue_look',
    'effect_black_show', 'effect_black_pick',
  ].includes(phase);

  // ── Shared info bar style factory ─────────────────────────────────────────
  const activeBarStyle = (active: boolean, color: string): React.CSSProperties => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 8, padding: '0.4rem 1rem',
    fontSize: '0.85rem', flexShrink: 0,
    background: active ? `rgba(${color}, 0.1)` : 'var(--surface)',
    border: active ? `2px solid rgba(${color}, 0.55)` : '2px solid transparent',
    boxShadow: active ? `0 0 12px rgba(${color}, 0.2)` : 'none',
    transition: 'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
  });

  return (
    <div className="flex flex-col h-screen p-3 gap-1.5">

      {/* ── Opponent info bar ───────────────────────────────────────────────── */}
      <div style={activeBarStyle(!isMyTurn, '241,196,15')}>
        <span className="font-semibold flex items-center gap-1.5">
          {!isMyTurn && (
            <span className="font-bold text-[0.8rem]" style={{ color: '#f1c40f', letterSpacing: '0.04em' }}>
              ▶ TURN
            </span>
          )}
          {opponent.name}
        </span>
        <span className="text-muted">Hand: {opponent.handCount}</span>
        {!opponent.isConnected && (
          <span className="text-[0.8rem]" style={{ color: '#e74c3c' }}>⚠ Disconnected</span>
        )}
      </div>

      {/* ── Opponent hand (hidden face-down cards) ───────────────────────────── */}
      <Hand
        cards={[]}
        hiddenCount={opponent.handCount}
        customizations={opponent.customizations}
        label={`${opponent.name}'s Hand`}
      />

      {/* ── Opponent field + graveyard + deck ────────────────────────────────── */}
      <div className="flex gap-2 flex-1 min-h-0">
        <Field
          cards={opponent.field}
          customizations={opponent.customizations}
          label={`${opponent.name}'s Field`}
        />
        <Graveyard
          cards={opponent.graveyard}
          customizations={opponent.customizations}
          label="Grave"
        />
        <div className="border border-border rounded-[10px] px-1.5 py-2 flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <DeckDisplay count={opponent.deckCount} />
          <span className="text-[0.6rem] text-muted uppercase" style={{ letterSpacing: '0.06em' }}>Deck</span>
        </div>
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className="bg-surface-2 rounded-lg px-4 py-1.5 flex justify-between items-center text-sm shrink-0">
        <span className="text-muted text-[0.8rem]">Turn {gameState.turnNumber}</span>
        <span className="text-muted">{phaseLabel}</span>
        <span className="text-muted text-[0.8rem]">&nbsp;</span>
      </div>

      {/* ── My field + graveyard + deck ───────────────────────────────────────── */}
      <div className="flex gap-2 flex-1 min-h-0">
        <Field
          cards={me.field}
          customizations={me.customizations}
          label="Your Field"
        />
        <Graveyard
          cards={me.graveyard}
          customizations={me.customizations}
          label="Grave"
        />
        <div className="border border-border rounded-[10px] px-1.5 py-2 flex flex-col items-center justify-center gap-1"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <DeckDisplay count={me.deckCount} />
          <span className="text-[0.6rem] text-muted uppercase" style={{ letterSpacing: '0.06em' }}>Deck</span>
        </div>
      </div>

      {/* ── My hand ─────────────────────────────────────────────────────────── */}
      <Hand
        cards={me.hand}
        customizations={me.customizations}
        label="Your Hand"
        selectableIds={playableIds}
        onSelect={(cardId) => send('play_card', { cardId })}
      />

      {/* ── My info bar ──────────────────────────────────────────────────────── */}
      <div style={activeBarStyle(isMyTurn, '39,174,96')}>
        <span className="font-semibold flex items-center gap-1.5">
          {isMyTurn && (
            <span className="font-bold text-[0.8rem]" style={{ color: '#27ae60', letterSpacing: '0.04em' }}>
              ▶ YOUR TURN
            </span>
          )}
          {me.name}
        </span>

        {/* Surrender */}
        {surrenderConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-muted text-[0.8rem]">Surrender?</span>
            <button
              className="btn-primary"
              onClick={() => { send('surrender'); setSurrenderConfirm(false); }}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.7rem', background: '#c0392b', borderColor: '#c0392b' }}
            >
              Yes
            </button>
            <button
              className="btn-secondary"
              onClick={() => setSurrenderConfirm(false)}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.7rem' }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            className="btn-secondary"
            onClick={() => setSurrenderConfirm(true)}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.8rem', color: '#e74c3c', borderColor: 'rgba(231,76,60,0.4)' }}
          >
            Surrender
          </button>
        )}
      </div>

      {/* ── Overlays ────────────────────────────────────────────────────────── */}
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
        <div className="fixed top-3 left-1/2 -translate-x-1/2 bg-surface-2 border border-border rounded-lg px-4 py-1.5 text-sm text-muted pointer-events-none z-50">
          {isMyTurn
            ? `Waiting for ${opponent.name} to respond…`
            : `${opponent.name} played a ${gameState.pendingPlay.color} land`}
        </div>
      )}

      {/* Effect result popup */}
      {effectPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div
            className="pointer-events-auto rounded-xl border border-border flex flex-col items-center gap-3 text-center cursor-pointer"
            style={{
              background: 'var(--surface)',
              boxShadow: `0 0 28px rgba(0,0,0,0.55), 0 0 0 2px ${'cardColor' in effectPopup ? EFFECT_COLORS[effectPopup.cardColor] : EFFECT_COLORS.blue}55`,
              padding: '1.5rem 2rem',
              maxWidth: 320,
            }}
            onClick={() => setEffectPopup(null)}
          >
            {effectPopup.type === 'red' ? (
              <>
                <span style={{ fontSize: '2.5rem' }}>💥</span>
                <p className="m-0 font-semibold" style={{ color: EFFECT_COLORS.red, fontSize: '1rem' }}>
                  Land Destroyed
                </p>
                <div
                  className="rounded-lg px-4 py-2 font-bold text-sm"
                  style={{ background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}
                >
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p className="text-muted text-sm m-0">
                  Removed from <strong className="text-foreground">{effectPopup.ownerName}</strong>'s field
                </p>
              </>
            ) : effectPopup.type === 'green' ? (
              <>
                <span style={{ fontSize: '2.5rem' }}>♻️</span>
                <p className="m-0 font-semibold" style={{ color: EFFECT_COLORS.green, fontSize: '1rem' }}>
                  Land Retrieved
                </p>
                <div
                  className="rounded-lg px-4 py-2 font-bold text-sm"
                  style={{ background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}
                >
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p className="text-muted text-sm m-0">
                  Returned to <strong className="text-foreground">{effectPopup.ownerName}</strong>'s hand
                </p>
              </>
            ) : effectPopup.type === 'blue' ? (
              <>
                <span style={{ fontSize: '2.5rem' }}>🔮</span>
                <p className="m-0 font-semibold" style={{ color: EFFECT_COLORS.blue, fontSize: '1rem' }}>
                  Blue Land Effect
                </p>
                <p className="text-muted text-sm m-0">
                  Opponent's top deck card was{' '}
                  <strong className="text-foreground">
                    {effectPopup.keptOnTop ? 'kept on top' : 'sent to the bottom'}
                  </strong>
                </p>
              </>
            ) : (
              <>
                <span style={{ fontSize: '2.5rem' }}>💀</span>
                <p className="m-0 font-semibold" style={{ color: EFFECT_COLORS.black, fontSize: '1rem' }}>
                  Card Discarded
                </p>
                <div
                  className="rounded-lg px-4 py-2 font-bold text-sm"
                  style={{ background: `${EFFECT_COLORS[effectPopup.cardColor]}22`, color: EFFECT_COLORS[effectPopup.cardColor], border: `1px solid ${EFFECT_COLORS[effectPopup.cardColor]}66` }}
                >
                  {effectPopup.cardColor.charAt(0).toUpperCase() + effectPopup.cardColor.slice(1)} land
                </div>
                <p className="text-muted text-sm m-0">
                  Discarded from <strong className="text-foreground">{effectPopup.ownerName}</strong>'s hand
                </p>
              </>
            )}
            <p className="text-muted text-[0.7rem] m-0">click to dismiss</p>
          </div>
        </div>
      )}

      {/* Chat panel overlay */}
      <ChatPanel
        messages={chatMessages}
        myName={playerName}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(v => !v)}
        onSend={onSendChat}
      />

      {/* Game log overlay */}
      <GameLog
        entries={logEntries}
        isOpen={logOpen}
        onToggle={() => setLogOpen(v => !v)}
      />
    </div>
  );
}
