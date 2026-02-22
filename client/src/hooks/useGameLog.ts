import { useEffect, useRef, useState } from 'react';
import { Card, GameState } from '@lands/shared';

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Snapshot {
  turnNumber: number;
  pendingPlayId: string | undefined;
  pendingPlayColor: string | undefined;
  chainLength: number;
  phase: string;
  winner: GameState['winner'];
  p0Field: Card[];
  p1Field: Card[];
  p0Graveyard: Card[];
  p1Graveyard: Card[];
  currentPlayerIdx: 0 | 1;
}

export function useGameLog(gameState: GameState): { entries: LogEntry[]; addEntry: (msg: string) => void } {
  const startRef = useRef(Date.now());
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const idRef = useRef(0);
  const prevRef = useRef<Snapshot | null>(null);

  function ts(): string {
    const s = Math.floor((Date.now() - startRef.current) / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function add(msg: string) {
    setEntries(prev => [...prev, { id: idRef.current++, timestamp: ts(), message: msg }]);
  }

  useEffect(() => {
    const { players, turnNumber, pendingPlay, counterChain, phase, winner, currentPlayerIndex, pendingEffect } = gameState;

    const snapshot: Snapshot = {
      turnNumber,
      pendingPlayId: pendingPlay?.id,
      pendingPlayColor: pendingPlay?.color,
      chainLength: counterChain.length,
      phase, winner,
      p0Field:     [...players[0].field],
      p1Field:     [...players[1].field],
      p0Graveyard: [...players[0].graveyard],
      p1Graveyard: [...players[1].graveyard],
      currentPlayerIdx: currentPlayerIndex,
    };

    const prev = prevRef.current;
    if (!prev) {
      add(`Game started — ${players[currentPlayerIndex].name} goes first`);
      prevRef.current = snapshot;
      return;
    }

    // New card played
    if (pendingPlay?.id && pendingPlay.id !== prev.pendingPlayId) {
      add(`${players[currentPlayerIndex].name} plays a ${cap(pendingPlay.color)} land`);
    }

    // Counter chain grew — chain starts at 1 (the play itself), so > 1 means actual counter
    if (counterChain.length > prev.chainLength && counterChain.length > 1) {
      // chain=2: first counter by defender (even); chain=3: counter-counter by attacker (odd)
      const whoIdx = counterChain.length % 2 === 0
        ? (1 - currentPlayerIndex) as 0 | 1
        : currentPlayerIndex;
      if (counterChain.length === 2) {
        add(`${players[whoIdx].name} counters!`);
      } else {
        add(`${players[whoIdx].name} counter-counters!`);
      }
    }

    // Pending play cleared — checked before turn change so resolve logs before draw
    if (prev.pendingPlayId && !pendingPlay?.id) {
      const p0Grew = players[0].field.length > prev.p0Field.length;
      const p1Grew = players[1].field.length > prev.p1Field.length;
      if (p0Grew || p1Grew) {
        const who = p0Grew ? players[0].name : players[1].name;
        add(`${cap(prev.pendingPlayColor ?? '')} land resolves → ${who}'s field`);
      } else {
        add(`${cap(prev.pendingPlayColor ?? '')} land countered → graveyard`);
      }
    }

    // Black: opponent reveals cards (entering effect_black_pick)
    if (phase === 'effect_black_pick' && prev.phase !== 'effect_black_pick') {
      const defIdx = (1 - currentPlayerIndex) as 0 | 1;
      if (pendingEffect?.shownCards && pendingEffect.shownCards.length > 0) {
        const cardList = pendingEffect.shownCards.map(c => cap(c.color)).join(', ');
        add(`${players[defIdx].name} reveals: ${cardList}`);
      }
    }

    // Black: card discarded (leaving effect_black_pick)
    if (prev.phase === 'effect_black_pick' && phase !== 'effect_black_pick') {
      const defIdx = (1 - prev.currentPlayerIdx) as 0 | 1;
      const prevGraveIds = new Set((defIdx === 0 ? prev.p0Graveyard : prev.p1Graveyard).map(c => c.id));
      const discarded = players[defIdx].graveyard.find(c => !prevGraveIds.has(c.id));
      if (discarded) add(`${players[defIdx].name} discards ${cap(discarded.color)}`);
    }

    // Green retrieval: attacker's graveyard shrinks (pre-target or prompt)
    const attackerIdx = prev.currentPlayerIdx;
    const prevGrave = attackerIdx === 0 ? prev.p0Graveyard : prev.p1Graveyard;
    const isGreenEffect = prev.phase === 'effect_green_pick' || prev.pendingPlayColor === 'green';
    if (players[attackerIdx].graveyard.length < prevGrave.length && isGreenEffect) {
      const currIds = new Set(players[attackerIdx].graveyard.map(c => c.id));
      const retrieved = prevGrave.find(c => !currIds.has(c.id));
      add(`${players[attackerIdx].name} retrieves ${retrieved ? cap(retrieved.color) : 'a land'} from graveyard`);
    }

    // Field shrinkage = land destroyed by red effect; identify which card was lost
    for (const i of [0, 1] as const) {
      const prevField = i === 0 ? prev.p0Field : prev.p1Field;
      if (players[i].field.length < prevField.length) {
        const currIds = new Set(players[i].field.map(c => c.id));
        const destroyed = prevField.find(c => !currIds.has(c.id));
        add(`${players[i].name} loses ${destroyed ? `a ${cap(destroyed.color)} land` : 'a land'}`);
      }
    }

    // Turn change — logged after resolve/effects so order is: resolve → draw
    if (turnNumber > prev.turnNumber) {
      add(`Turn ${turnNumber} — ${players[currentPlayerIndex].name} draws`);
    }

    // Effect phase entry announcements
    if (phase !== prev.phase) {
      const name = players[currentPlayerIndex].name;
      if (phase === 'effect_red_pick')   add(`${name} targets a land to destroy`);
      if (phase === 'effect_green_pick') add(`${name} chooses a card to retrieve`);
      if (phase === 'effect_blue_look')  add(`${name} peeks at their deck`);
      if (phase === 'effect_black_show') add(`${name} forces opponent to reveal cards`);
    }

    // Game over
    if (winner !== undefined && prev.winner === undefined) {
      if (winner === 'draw') {
        add('Game over — Draw!');
      } else {
        const reason = gameState.winReason ? ` (${gameState.winReason})` : '';
        add(`${players[winner].name} wins!${reason}`);
      }
    }

    prevRef.current = snapshot;
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  return { entries, addEntry: add };
}
