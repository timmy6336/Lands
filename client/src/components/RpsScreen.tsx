// Rock-Paper-Scissors screen — mobile-first large tap targets.
import { useEffect, useState } from 'react';
import { GameState, RpsChoice } from '@lands/shared';

const RPS_OPTIONS: { choice: RpsChoice; emoji: string }[] = [
  { choice: 'rock',     emoji: '🪨' },
  { choice: 'paper',    emoji: '📄' },
  { choice: 'scissors', emoji: '✂️' },
];

const OUTCOME_LINES: Record<string, string> = {
  rock_scissors:  'Rock crushes Scissors',
  scissors_paper: 'Scissors cuts Paper',
  paper_rock:     'Paper covers Rock',
};

interface Props {
  gameState: GameState;
  myIndex: 0 | 1;
  onPick:   (choice: RpsChoice) => void;
  onChoose: (firstPlayer: 0 | 1) => void;
}

const outerStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  minHeight: '100dvh', gap: 24, textAlign: 'center',
  paddingTop: 'max(env(safe-area-inset-top, 0px), 1.5rem)',
  paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
  paddingLeft: '1.5rem', paddingRight: '1.5rem',
};

export function RpsScreen({ gameState, myIndex, onPick, onChoose }: Props) {
  const [myPick, setMyPick] = useState<RpsChoice | null>(null);

  const { phase, rpsResult } = gameState;
  const me       = gameState.players[myIndex];
  const opponent = gameState.players[(1 - myIndex) as 0 | 1];

  const resultKey = rpsResult ? `${rpsResult.picks[0]}-${rpsResult.picks[1]}` : '';
  useEffect(() => { setMyPick(null); }, [resultKey]);

  if (phase === 'rps_choose' && rpsResult) {
    const iAmWinner     = rpsResult.winner === myIndex;
    const myPickDisp    = rpsResult.picks[myIndex];
    const oppPickDisp   = rpsResult.picks[(1 - myIndex) as 0 | 1];
    const outcomeKey    = `${myPickDisp}_${oppPickDisp}`;
    const revOutcomeKey = `${oppPickDisp}_${myPickDisp}`;
    const outcomeText   = iAmWinner
      ? (OUTCOME_LINES[outcomeKey]    ?? 'You win!')
      : (OUTCOME_LINES[revOutcomeKey] ?? 'They win!');

    return (
      <div style={outerStyle}>
        <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.6rem' }}>Rock Paper Scissors</h2>

        <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontSize: '3.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div>{emojiFor(myPickDisp)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>You</div>
          </div>
          <span style={{ fontSize: '1.1rem', color: 'var(--muted)' }}>vs</span>
          <div style={{ textAlign: 'center' }}>
            <div>{emojiFor(oppPickDisp)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>{opponent.name}</div>
          </div>
        </div>

        <p style={{ color: 'var(--muted)', margin: 0 }}>{outcomeText}</p>

        {iAmWinner ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 320 }}>
            <h3 style={{ margin: 0, color: '#f1c40f', fontSize: '1.1rem' }}>You won! Who goes first?</h3>
            <button className="btn-primary" onClick={() => onChoose(myIndex)} style={{ width: '100%', minHeight: 54, fontSize: '1rem' }}>
              I go first
            </button>
            <button className="btn-secondary" onClick={() => onChoose((1 - myIndex) as 0 | 1)} style={{ width: '100%', minHeight: 54, fontSize: '1rem' }}>
              {opponent.name} goes first
            </button>
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>
            {opponent.name} won — waiting for them to choose who goes first…
          </p>
        )}
      </div>
    );
  }

  const isDraw = rpsResult?.winner === 'draw';

  return (
    <div style={outerStyle}>
      <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.6rem' }}>Rock Paper Scissors</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
        {me.name} vs {opponent.name} — winner chooses who goes first
      </p>

      {isDraw && rpsResult && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 24, fontSize: '2.8rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div>{emojiFor(rpsResult.picks[myIndex])}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 4 }}>You</div>
            </div>
            <span style={{ fontSize: '1rem', color: 'var(--muted)', alignSelf: 'center' }}>vs</span>
            <div style={{ textAlign: 'center' }}>
              <div>{emojiFor(rpsResult.picks[(1 - myIndex) as 0 | 1])}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 4 }}>{opponent.name}</div>
            </div>
          </div>
          <p style={{ fontWeight: 700, margin: 0, color: '#f1c40f' }}>Draw! Pick again.</p>
        </div>
      )}

      {myPick ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem' }}>{emojiFor(myPick)}</div>
          <p style={{ color: 'var(--muted)', marginTop: 12, margin: '12px 0 0' }}>
            You chose <strong style={{ color: 'var(--text)' }}>{myPick}</strong> — waiting for {opponent.name}…
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', width: '100%', maxWidth: 320 }}>
          {RPS_OPTIONS.map(({ choice, emoji }) => (
            <button
              key={choice}
              onClick={() => { setMyPick(choice); onPick(choice); }}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 14,
                padding: '1rem 0.5rem', fontSize: '0.9rem', fontWeight: 700,
                minHeight: 90, touchAction: 'manipulation',
                color: 'var(--text)',
              }}
            >
              <span style={{ fontSize: '2.6rem', lineHeight: 1 }}>{emoji}</span>
              <span style={{ textTransform: 'capitalize' }}>{choice}</span>
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
