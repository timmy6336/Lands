// Multiplayer lobby screens — mobile-first layout.
import { useState } from 'react';
import { GameSettings } from '@lands/shared';

interface HostProps {
  mode: 'host';
  playerName: string;
  connected: boolean;
  roomCode: string | null;
  error: string | null;
  onCreateRoom: (settings: GameSettings) => void;
  onBack: () => void;
}

interface JoinProps {
  mode: 'join';
  playerName: string;
  error: string | null;
  onConnect: (roomCode: string) => void;
  onBack: () => void;
}

type Props = HostProps | JoinProps;

export function Lobby(props: Props) {
  if (props.mode === 'host') return <HostLobby {...props} />;
  return <JoinLobby {...props} />;
}

function HostLobby({ playerName, connected, roomCode, error, onCreateRoom, onBack }: HostProps) {
  const [timerSec, setTimerSec] = useState<number | null>(15);
  const [started, setStarted] = useState(false);

  function handleCreate() {
    setStarted(true);
    onCreateRoom({ counterTimeLimitSeconds: timerSec });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, padding: '1.5rem 1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent)', margin: '0 0 6px' }}>Host Game</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Create a private room and share the code</p>
      </div>

      {error && (
        <p style={{ color: '#e74c3c', background: '#2c1010', padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.88rem', margin: 0 }}>
          {error}
        </p>
      )}

      {!started ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 360 }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
            Playing as: <strong style={{ color: 'var(--text)' }}>{playerName}</strong>
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Counter window timer</span>
            <select
              value={timerSec === null ? 'infinite' : String(timerSec)}
              onChange={e => setTimerSec(e.target.value === 'infinite' ? null : Number(e.target.value))}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '0.65rem 0.75rem', fontSize: '0.95rem', minHeight: 44 }}
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="15">15 seconds (default)</option>
              <option value="30">30 seconds</option>
              <option value="infinite">Infinite (must click Pass)</option>
            </select>
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={handleCreate} style={{ flex: 1, minHeight: 50 }}>
              🖥 Create Room
            </button>
            <button className="btn-secondary" onClick={onBack} style={{ flex: 1, minHeight: 50 }}>Back</button>
          </div>
        </div>
      ) : roomCode ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 360 }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Share this code</p>
          <p style={{ fontSize: '3.2rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '0.35em', margin: 0 }}>
            {roomCode}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center', margin: 0 }}>
            ⏳ Waiting for your opponent to enter this code…
          </p>
          <button className="btn-secondary" onClick={onBack} style={{ minHeight: 48, padding: '0.6rem 1.75rem' }}>✕ Cancel</button>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 360 }}>
          <Spinner />
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
            {connected ? 'Creating room…' : 'Connecting to server…'}
          </p>
          <button className="btn-secondary" onClick={onBack} style={{ minHeight: 48 }}>✕ Cancel</button>
        </div>
      )}
    </div>
  );
}

function JoinLobby({ playerName, error, onConnect, onBack }: JoinProps) {
  const [roomCode, setRoomCode] = useState('');
  const canConnect = roomCode.trim().length === 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, padding: '1.5rem 1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent)', margin: '0 0 6px' }}>Join Game</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Enter the room code your friend shared</p>
      </div>

      {error && (
        <p style={{ color: '#e74c3c', background: '#2c1010', padding: '0.6rem 1rem', borderRadius: 8, fontSize: '0.88rem', margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 360 }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
          Playing as: <strong style={{ color: 'var(--text)' }}>{playerName}</strong>
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Room code</span>
          <input
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="XXXX"
            maxLength={4}
            autoFocus
            style={{ letterSpacing: '0.3em', fontWeight: 700, fontSize: '1.6rem', textAlign: 'center', minHeight: 56 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            disabled={!canConnect}
            onClick={() => onConnect(roomCode.trim())}
            style={{ flex: 1, minHeight: 50 }}
          >
            🔗 Connect
          </button>
          <button className="btn-secondary" onClick={onBack} style={{ flex: 1, minHeight: 50 }}>Back</button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  );
}
