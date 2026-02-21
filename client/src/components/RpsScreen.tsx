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

  // Reset local pick whenever a new RPS result arrives (draw → new round)
  const resultKey = rpsResult ? `${rpsResult.picks[0]}-${rpsResult.picks[1]}` : '';
  useEffect(() => {
    setMyPick(null);
  }, [resultKey]);

  // ── rps_choose: show result + let winner pick order ──────────────────────
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
      <div style={wrapperStyle}>
        <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.4rem' }}>Rock Paper Scissors</h2>

        {/* Picks display */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div>{emojiFor(myPickDisp)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>You</div>
          </div>
          <span style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>vs</span>
          <div style={{ textAlign: 'center' }}>
            <div>{emojiFor(oppPickDisp)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>{opponent.name}</div>
          </div>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>{outcomeText}</p>

        {iAmWinner ? (
          <>
            <h3 style={{ color: '#f1c40f', margin: 0 }}>You won! Choose who goes first:</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
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
          <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>
            {opponent.name} won — waiting for them to choose who goes first…
          </p>
        )}
      </div>
    );
  }

  // ── rps_pick: both pick simultaneously ───────────────────────────────────
  const isDraw = rpsResult?.winner === 'draw';

  return (
    <div style={wrapperStyle}>
      <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.4rem' }}>Rock Paper Scissors</h2>
      <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
        {me.name} vs {opponent.name} — winner chooses who goes first
      </p>

      {/* Draw result from previous round */}
      {isDraw && rpsResult && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '0.75rem 1.5rem',
        }}>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '2.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div>{emojiFor(rpsResult.picks[myIndex])}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 2 }}>You</div>
            </div>
            <span style={{ fontSize: '1rem', color: 'var(--muted)', alignSelf: 'center' }}>vs</span>
            <div style={{ textAlign: 'center' }}>
              <div>{emojiFor(rpsResult.picks[(1 - myIndex) as 0 | 1])}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 2 }}>{opponent.name}</div>
            </div>
          </div>
          <p style={{ color: '#f1c40f', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
            Draw! Pick again.
          </p>
        </div>
      )}

      {myPick ? (
        /* Waiting for opponent after picking */
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem' }}>{emojiFor(myPick)}</div>
          <p style={{ color: 'var(--muted)', marginTop: 8 }}>
            You chose <strong style={{ color: 'var(--text)' }}>{myPick}</strong> — waiting for {opponent.name}…
          </p>
        </div>
      ) : (
        /* Pick buttons */
        <div style={{ display: 'flex', gap: '1rem' }}>
          {RPS_OPTIONS.map(({ choice, label, emoji }) => (
            <button
              key={choice}
              onClick={() => { setMyPick(choice); onPick(choice); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.4rem', padding: '1rem 1.5rem',
                background: 'var(--surface)', border: '2px solid var(--border)',
                borderRadius: 12, cursor: 'pointer', color: 'var(--text)',
                fontSize: '1rem', fontWeight: 600,
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
              <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{emoji}</span>
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

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: '1.75rem',
  textAlign: 'center',
  padding: '2rem',
};
