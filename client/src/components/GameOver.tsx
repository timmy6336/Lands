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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '1.5rem', textAlign: 'center',
      padding: '2rem',
    }}>
      {isDraw ? (
        <>
          <p style={{ fontSize: '5rem' }}>🤯</p>
          <h1 style={{ color: 'var(--muted)' }}>DRAW???</h1>
          <p style={{ color: 'var(--muted)', maxWidth: 400, lineHeight: 1.5 }}>{funnyLine}</p>
        </>
      ) : iWon ? (
        <>
          <p style={{ fontSize: '5rem' }}>🏆</p>
          <h1 style={{ color: '#f1c40f' }}>Victory!</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
            You defeated <strong style={{ color: 'var(--text)' }}>{them.name}</strong>
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: '5rem' }}>💀</p>
          <h1 style={{ color: 'var(--accent)' }}>Defeat</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>
            <strong style={{ color: 'var(--text)' }}>{winner !== undefined && !isDraw ? players[winner].name : ''}</strong> won this time.
          </p>
        </>
      )}

      {winReason && (
        <p style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.6rem 1.2rem',
          color: 'var(--muted)', fontSize: '0.9rem',
        }}>
          {winReason}
        </p>
      )}

      {/* Final board snapshot */}
      <div style={{
        display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '1rem 1.5rem',
      }}>
        {[me, them].map((p, i) => (
          <div key={i}>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 4 }}>{p.name}</p>
            <p style={{ fontSize: '0.9rem' }}>
              {p.field.length} land{p.field.length !== 1 ? 's' : ''} in play
            </p>
          </div>
        ))}
      </div>

      {/* Rematch */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
        <button
          className="btn-primary"
          onClick={onRematch}
          disabled={myVote}
          style={{ padding: '0.75rem 2rem', opacity: myVote ? 0.6 : 1 }}
        >
          {myVote ? '✓ Rematch Voted' : 'Rematch'}
        </button>
        {opponentVote && !myVote && (
          <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: 0 }}>
            {them.name} wants a rematch!
          </p>
        )}
        {myVote && !opponentVote && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Waiting for {them.name}…
          </p>
        )}
      </div>

      <button className="btn-secondary" onClick={onPlayAgain} style={{ padding: '0.5rem 1.5rem' }}>
        Leave Game
      </button>
    </div>
  );
}
