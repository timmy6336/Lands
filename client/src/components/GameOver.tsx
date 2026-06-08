// End-of-game overlay — mobile-first layout.
import { GameState } from '@lands/shared';

const FUNNY_DRAW_LINES = [
  "The universe breaks. A draw? Impossible. Yet here we are.",
  "Both players have achieved quantum superposition. Neither won. Neither lost.",
  "Error 418: I'm a teapot. Also, somehow a draw occurred.",
  "The ancient prophecy said one shall win. The ancient prophecy was wrong.",
  "Scientists baffled. Philosophers wept. It's a draw.",
];

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onPlayAgain: () => void;
  onRematch: () => void;
}

export function GameOver({ gameState, myIndex, onPlayAgain, onRematch }: Props) {
  const { winner, winReason, players } = gameState;
  const rematchVotes = gameState.rematchVotes;
  const myVote = rematchVotes?.[myIndex] ?? false;
  const opponentVote = rematchVotes?.[(1 - myIndex) as 0 | 1] ?? false;

  const isDraw = winner === 'draw';
  const iWon = !isDraw && winner === myIndex;
  const me = players[myIndex];
  const them = players[1 - myIndex];

  const funnyLine = FUNNY_DRAW_LINES[Math.floor(Math.random() * FUNNY_DRAW_LINES.length)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, textAlign: 'center', padding: '1.5rem 1.25rem', overflowY: 'auto' }}>
      {isDraw ? (
        <>
          <p style={{ fontSize: '4rem', margin: 0 }}>🤯</p>
          <h1 style={{ color: 'var(--muted)', margin: 0, fontSize: '2rem' }}>DRAW???</h1>
          <p style={{ color: 'var(--muted)', margin: 0, maxWidth: 340, lineHeight: 1.55, fontSize: '0.9rem' }}>{funnyLine}</p>
        </>
      ) : iWon ? (
        <>
          <p style={{ fontSize: '4rem', margin: 0 }}>🏆</p>
          <h1 style={{ color: '#f1c40f', margin: 0, fontSize: '2.2rem' }}>Victory!</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>
            You defeated <strong style={{ color: 'var(--text)' }}>{them.name}</strong>
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: '4rem', margin: 0 }}>💀</p>
          <h1 style={{ color: 'var(--accent)', margin: 0, fontSize: '2.2rem' }}>Defeat</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>
            <strong style={{ color: 'var(--text)' }}>{winner !== undefined && !isDraw ? players[winner as 0 | 1].name : ''}</strong> won this time.
          </p>
        </>
      )}

      {winReason && (
        <p style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.6rem 1.1rem', color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
          {winReason}
        </p>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.9rem 1.25rem' }}>
        {[me, them].map((p, i) => (
          <div key={i}>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: 4 }}>{p.name}</p>
            <p style={{ fontSize: '0.92rem' }}>{p.field.length} land{p.field.length !== 1 ? 's' : ''} in play</p>
          </div>
        ))}
      </div>

      {/* Rematch */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%', maxWidth: 320 }}>
        <button
          className="btn-primary"
          onClick={onRematch}
          disabled={myVote}
          style={{ width: '100%', minHeight: 52, fontSize: '1rem', opacity: myVote ? 0.6 : 1 }}
        >
          {myVote ? '✓ Rematch Voted' : '🔄 Rematch'}
        </button>
        {opponentVote && !myVote && (
          <p style={{ color: '#4ade80', fontSize: '0.88rem', margin: 0 }}>{them.name} wants a rematch!</p>
        )}
        {myVote && !opponentVote && (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Waiting for {them.name}…</p>
        )}
      </div>

      <button className="btn-secondary" onClick={onPlayAgain} style={{ minHeight: 48, padding: '0.6rem 2rem' }}>
        Leave Game
      </button>
    </div>
  );
}
