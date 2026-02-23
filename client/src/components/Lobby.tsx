// Multiplayer lobby screens (remote dedicated-server edition).
//
// HostLobby: user configures settings → "Create Room" connects to the
//            dedicated server and receives a 4-char room code to share.
//
// JoinLobby: user enters a 4-char room code → "Connect" joins the room.
//
// The actual Socket.io connection is managed in App.tsx via serverUrl/useSocket.
import { useState } from 'react';
import { GameSettings } from '@lands/shared';

// ── Host Lobby ────────────────────────────────────────────────────────────────

interface HostProps {
  mode: 'host';
  playerName: string;
  /** True once the socket connects to the dedicated server. */
  connected: boolean;
  /** Room code from server, null while waiting for it. */
  roomCode: string | null;
  error: string | null;
  /** Called once when the user clicks "Create Room"; sets serverUrl in App. */
  onCreateRoom: (settings: GameSettings) => void;
  onBack: () => void;
}

// ── Join Lobby ────────────────────────────────────────────────────────────────

interface JoinProps {
  mode: 'join';
  playerName: string;
  error: string | null;
  /** Called with the room code when user clicks "Connect"; sets serverUrl in App. */
  onConnect: (roomCode: string) => void;
  onBack: () => void;
}

type Props = HostProps | JoinProps;

export function Lobby(props: Props) {
  if (props.mode === 'host') return <HostLobby {...props} />;
  return <JoinLobby {...props} />;
}

// ── HostLobby ─────────────────────────────────────────────────────────────────

function HostLobby({ playerName, connected, roomCode, error, onCreateRoom, onBack }: HostProps) {
  const [timerSec, setTimerSec] = useState<number | null>(15);
  const [started, setStarted] = useState(false);

  function handleCreate() {
    setStarted(true);
    onCreateRoom({ counterTimeLimitSeconds: timerSec });
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center">
        <h2 className="text-accent mb-1">Host Game</h2>
        <p className="text-muted text-sm">Create a private room and share the code with your friend</p>
      </div>

      {error && (
        <p className="text-sm px-4 py-2 rounded-md" style={{ color: '#e74c3c', background: '#2c1010' }}>
          {error}
        </p>
      )}

      {!started ? (
        /* Settings form */
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 min-w-[300px]">
          <p className="text-muted text-sm m-0">
            Playing as: <strong className="text-foreground">{playerName}</strong>
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-muted text-sm">Counter window timer</span>
            <select
              value={timerSec === null ? 'infinite' : String(timerSec)}
              onChange={e => setTimerSec(e.target.value === 'infinite' ? null : Number(e.target.value))}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text)', padding: '0.5rem', fontSize: '0.95rem',
              }}
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="15">15 seconds (default)</option>
              <option value="30">30 seconds</option>
              <option value="infinite">Infinite (must click Pass)</option>
            </select>
          </label>

          <div className="flex gap-2 mt-1">
            <button className="btn-primary" onClick={handleCreate}>
              🖥 Create Room
            </button>
            <button className="btn-secondary" onClick={onBack}>Back</button>
          </div>
        </div>
      ) : roomCode ? (
        /* Room ready */
        <div className="bg-surface border border-border rounded-xl px-8 py-6 flex flex-col items-center gap-4 min-w-[300px]">
          <p className="text-muted text-xs uppercase tracking-widest m-0">Share this code</p>
          <p
            className="text-[3rem] font-black text-accent m-0"
            style={{ letterSpacing: '0.35em' }}
          >
            {roomCode}
          </p>
          <p className="text-muted text-sm text-center m-0">
            ⏳ Waiting for your opponent to enter this code…
          </p>
          <button className="btn-secondary text-sm mt-2" onClick={onBack}>✕ Cancel</button>
        </div>
      ) : (
        /* Connecting */
        <div className="bg-surface border border-border rounded-xl px-8 py-6 flex flex-col items-center gap-4 min-w-[300px]">
          <div
            className="animate-spin"
            style={{
              width: 32, height: 32,
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
            }}
          />
          <p className="text-muted text-sm m-0">
            {connected ? 'Creating room…' : 'Connecting to server…'}
          </p>
          <button className="btn-secondary text-sm" onClick={onBack}>✕ Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── JoinLobby ─────────────────────────────────────────────────────────────────

function JoinLobby({ playerName, error, onConnect, onBack }: JoinProps) {
  const [roomCode, setRoomCode] = useState('');

  const canConnect = roomCode.trim().length === 4;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center">
        <h2 className="text-accent mb-1">Join Game</h2>
        <p className="text-muted text-sm">Enter the room code your friend shared with you</p>
      </div>

      {error && (
        <p className="text-sm px-4 py-2 rounded-md" style={{ color: '#e74c3c', background: '#2c1010' }}>
          {error}
        </p>
      )}

      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 min-w-[300px]">
        <p className="text-muted text-sm m-0">
          Playing as: <strong className="text-foreground">{playerName}</strong>
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Room code</span>
          <input
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="XXXX"
            maxLength={4}
            autoFocus
            style={{ letterSpacing: '0.3em', fontWeight: 700, fontSize: '1.4rem', textAlign: 'center' }}
          />
        </label>

        <div className="flex gap-2 mt-1">
          <button
            className="btn-primary"
            disabled={!canConnect}
            onClick={() => onConnect(roomCode.trim())}
          >
            🔗 Connect
          </button>
          <button className="btn-secondary" onClick={onBack}>Back</button>
        </div>
      </div>
    </div>
  );
}
