import { useEffect, useRef, useState } from 'react';
import { ChatMessage, GameState, ClientToServerEvents } from '@lands/shared';
import { Field } from './Field';
import { Hand } from './Hand';
import { Graveyard } from './Graveyard';
import { DeckDisplay } from './DeckDisplay';
import { CounterPrompt } from './CounterPrompt';
import { EffectPrompt } from './EffectPrompt';
import { PreTargetPrompt } from './PreTargetPrompt';
import { GameLog } from './GameLog';
import { ChatPanel } from './ChatPanel';
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
  pre_target_red:    'Targeting…',
  pre_target_green:  'Targeting…',
  counter_window:    'Counter window open…',
  counter_response:  'Counter-counter window open…',
  effect_red_pick:   'Red land effect',
  effect_green_pick: 'Green land effect',
  effect_blue_look:  'Blue land effect',
  effect_black_show: 'Black land effect',
  effect_black_pick: 'Black land effect',
};

export function GameBoard({ gameState, myIndex, send, chatMessages, onSendChat, playerName }: Props) {
  const [surrenderConfirm, setSurrenderConfirm] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { playDraw, playPlay, playCounter } = useSound();
  const { entries: logEntries, addEntry: addLogEntry } = useGameLog(gameState);

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
  const isPreTarget = phase === 'pre_target_red' || phase === 'pre_target_green';

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

      {isPreTarget && (
        <PreTargetPrompt
          gameState={gameState}
          myIndex={myIndex}
          onTarget={(cardId) => send('pre_target_response', { cardId })}
        />
      )}

      {/* Pending play indicator */}
      {gameState.pendingPlay && !showCounterWindow && !showCounterCounterWindow && !isPreTarget && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 bg-surface-2 border border-border rounded-lg px-4 py-1.5 text-sm text-muted pointer-events-none z-50">
          {isMyTurn
            ? `Waiting for ${opponent.name} to respond…`
            : `${opponent.name} played a ${gameState.pendingPlay.color} land`}
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
