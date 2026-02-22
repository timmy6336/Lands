import { useEffect, useState } from 'react';
import { GameState, RpsChoice } from '@lands/shared';

const RPS_OPTIONS: { choice: RpsChoice; label: string; emoji: string }[] = [
  { choice: 'rock',     label: 'Rock',     emoji: '🪨' },
  { choice: 'paper',    label: 'Paper',    emoji: '📄' },
  { choice: 'scissors', label: 'Scissors', emoji: '✂️' },
];

const OUTCOME_LINES: Record<string, string> = {
  rock_scissors:     'Rock crushes Scissors',
  scissors_paper:    'Scissors cuts Paper',
  paper_rock:        'Paper covers Rock',
};

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onPick:   (choice: RpsChoice) => void;
  onChoose: (firstPlayer: 0 | 1) => void;
}

export function RpsScreen({ gameState, myIndex, onPick, onChoose }: Props) {
  const [myPick, setMyPick] = useState<RpsChoice | null>(null);

  const { phase, rpsResult } = gameState;
  const me       = gameState.players[myIndex];
  const opponent = gameState.players[(1 - myIndex) as 0 | 1];

  const resultKey = rpsResult ? `${rpsResult.picks[0]}-${rpsResult.picks[1]}` : '';
  useEffect(() => {
    setMyPick(null);
  }, [resultKey]);

  if (phase === 'rps_choose' && rpsResult) {
    const iAmWinner = rpsResult.winner === myIndex;
    const myPickDisp   = rpsResult.picks[myIndex];
    const oppPickDisp  = rpsResult.picks[(1 - myIndex) as 0 | 1];
    const outcomeKey   = `${myPickDisp}_${oppPickDisp}`;
    const revOutcomeKey = `${oppPickDisp}_${myPickDisp}`;
    const outcomeText  = iAmWinner
      ? (OUTCOME_LINES[outcomeKey]   ?? 'You win!')
      : (OUTCOME_LINES[revOutcomeKey] ?? 'They win!');

    return (
      <div className="flex flex-col items-center justify-center h-full gap-7 text-center p-8">
        <h2 className="text-accent m-0 text-[1.4rem]">Rock Paper Scissors</h2>

        <div className="flex gap-8 items-center text-[3rem]">
          <div className="text-center">
            <div>{emojiFor(myPickDisp)}</div>
            <div className="text-[0.7rem] text-muted mt-1">You</div>
          </div>
          <span className="text-[1.2rem] text-muted">vs</span>
          <div className="text-center">
            <div>{emojiFor(oppPickDisp)}</div>
            <div className="text-[0.7rem] text-muted mt-1">{opponent.name}</div>
          </div>
        </div>

        <p className="text-muted text-sm m-0">{outcomeText}</p>

        {iAmWinner ? (
          <>
            <h3 className="m-0" style={{ color: '#f1c40f' }}>You won! Choose who goes first:</h3>
            <div className="flex gap-4">
              <button
                className="btn-primary"
                onClick={() => onChoose(myIndex)}
                style={{ padding: '0.65rem 1.75rem', fontSize: '1rem' }}
              >
                I go first
              </button>
              <button
                className="btn-secondary"
                onClick={() => onChoose((1 - myIndex) as 0 | 1)}
                style={{ padding: '0.65rem 1.75rem', fontSize: '1rem' }}
              >
                {opponent.name} goes first
              </button>
            </div>
          </>
        ) : (
          <p className="text-muted text-base m-0">
            {opponent.name} won — waiting for them to choose who goes first…
          </p>
        )}
      </div>
    );
  }

  const isDraw = rpsResult?.winner === 'draw';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-7 text-center p-8">
      <h2 className="text-accent m-0 text-[1.4rem]">Rock Paper Scissors</h2>
      <p className="text-muted text-sm m-0">
        {me.name} vs {opponent.name} — winner chooses who goes first
      </p>

      {isDraw && rpsResult && (
        <div className="flex flex-col items-center gap-2 border border-border rounded-[10px]"
          style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.5rem' }}>
          <div className="flex gap-6 text-[2.5rem]">
            <div className="text-center">
              <div>{emojiFor(rpsResult.picks[myIndex])}</div>
              <div className="text-[0.65rem] text-muted mt-0.5">You</div>
            </div>
            <span className="text-base text-muted self-center">vs</span>
            <div className="text-center">
              <div>{emojiFor(rpsResult.picks[(1 - myIndex) as 0 | 1])}</div>
              <div className="text-[0.65rem] text-muted mt-0.5">{opponent.name}</div>
            </div>
          </div>
          <p className="font-bold m-0 text-sm" style={{ color: '#f1c40f' }}>
            Draw! Pick again.
          </p>
        </div>
      )}

      {myPick ? (
        <div className="text-center">
          <div className="text-[4rem]">{emojiFor(myPick)}</div>
          <p className="text-muted mt-2 m-0">
            You chose <strong className="text-foreground">{myPick}</strong> — waiting for {opponent.name}…
          </p>
        </div>
      ) : (
        <div className="flex gap-4">
          {RPS_OPTIONS.map(({ choice, label, emoji }) => (
            <button
              key={choice}
              onClick={() => { setMyPick(choice); onPick(choice); }}
              className="flex flex-col items-center gap-1.5 bg-surface border-2 border-border rounded-xl font-semibold text-foreground"
              style={{
                padding: '1rem 1.5rem', fontSize: '1rem', cursor: 'pointer',
                transition: 'border-color 0.15s ease, transform 0.12s ease, background 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)';
              }}
            >
              <span className="text-[2.5rem] leading-none">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function emojiFor(choice: RpsChoice): string {
  return choice === 'rock' ? '🪨' : choice === 'paper' ? '📄' : '✂️';
}
