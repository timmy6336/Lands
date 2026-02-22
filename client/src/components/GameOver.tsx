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
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
      {isDraw ? (
        <>
          <p className="text-[5rem] m-0">🤯</p>
          <h1 className="text-muted m-0">DRAW???</h1>
          <p className="text-muted m-0" style={{ maxWidth: 400, lineHeight: 1.5 }}>{funnyLine}</p>
        </>
      ) : iWon ? (
        <>
          <p className="text-[5rem] m-0">🏆</p>
          <h1 className="m-0" style={{ color: '#f1c40f' }}>Victory!</h1>
          <p className="text-muted text-[1.1rem] m-0">
            You defeated <strong className="text-foreground">{them.name}</strong>
          </p>
        </>
      ) : (
        <>
          <p className="text-[5rem] m-0">💀</p>
          <h1 className="text-accent m-0">Defeat</h1>
          <p className="text-muted text-[1.1rem] m-0">
            <strong className="text-foreground">{winner !== undefined && !isDraw ? players[winner].name : ''}</strong> won this time.
          </p>
        </>
      )}

      {winReason && (
        <p className="bg-surface border border-border rounded-lg m-0 text-muted text-sm"
          style={{ padding: '0.6rem 1.2rem' }}>
          {winReason}
        </p>
      )}

      <div className="flex gap-8 flex-wrap justify-center bg-surface border border-border rounded-[10px]"
        style={{ padding: '1rem 1.5rem' }}>
        {[me, them].map((p, i) => (
          <div key={i}>
            <p className="text-muted text-[0.8rem] mb-1 m-0">{p.name}</p>
            <p className="text-sm m-0">
              {p.field.length} land{p.field.length !== 1 ? 's' : ''} in play
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <button
          className="btn-primary"
          onClick={onRematch}
          disabled={myVote}
          style={{ padding: '0.75rem 2rem', opacity: myVote ? 0.6 : 1 }}
        >
          {myVote ? '✓ Rematch Voted' : 'Rematch'}
        </button>
        {opponentVote && !myVote && (
          <p className="m-0 text-sm" style={{ color: '#4ade80' }}>
            {them.name} wants a rematch!
          </p>
        )}
        {myVote && !opponentVote && (
          <p className="text-muted text-sm m-0">
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
