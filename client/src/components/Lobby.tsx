// Multiplayer lobby: starts the server (host) or connects to one (join), shows
// the local + public IP addresses, and handles UPnP port forwarding.
// Uses IPC via window.electronAPI to start the server and query network info.
import { useEffect, useState } from 'react';
import { GameSettings } from '@lands/shared';

// ── Host Lobby ────────────────────────────────────────────────────────────────

interface HostProps {
  mode: 'host';
  playerName: string;
  connected: boolean;
  roomCode: string | null;
  error: string | null;
  defaultPort?: number;
  upnpEnabled?: boolean;
  onStartServer: (port: number, settings: GameSettings) => void;
  onBack: () => void;
}

// ── Join Lobby ────────────────────────────────────────────────────────────────

interface JoinProps {
  mode: 'join';
  playerName: string;
  error: string | null;
  onConnect: (hostIp: string, port: number, roomCode: string) => void;
  onBack: () => void;
}

type Props = HostProps | JoinProps;

export function Lobby(props: Props) {
  if (props.mode === 'host') return <HostLobby {...props} />;
  return <JoinLobby {...props} />;
}

// ── HostLobby ─────────────────────────────────────────────────────────────────

function HostLobby({
  playerName, connected, roomCode, error,
  defaultPort = 3001, upnpEnabled = false,
  onStartServer, onBack,
}: HostProps) {
  const [portStr, setPortStr] = useState(String(defaultPort));
  const [timerSec, setTimerSec] = useState<number | null>(15);
  const [serverStarted, setServerStarted] = useState(false);
  const [ips, setIps] = useState<{ local: string; public: string | null } | null>(null);
  const [upnpResult, setUpnpResult] = useState<{ success: boolean; message: string } | null>(null);
  const [upnpLoading, setUpnpLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const port = parseInt(portStr, 10) || defaultPort;

  useEffect(() => {
    if (!serverStarted || !window.electronAPI) return;
    window.electronAPI.getIPs().then(setIps);
  }, [serverStarted]);

  async function handleStart() {
    setStarting(true);
    onStartServer(port, { counterTimeLimitSeconds: timerSec });
    setServerStarted(true);
    setStarting(false);
    if (upnpEnabled && window.electronAPI) {
      setUpnpLoading(true);
      const result = await window.electronAPI.attemptUPnP(port);
      setUpnpResult(result);
      setUpnpLoading(false);
    }
  }

  async function handleUPnP() {
    if (!window.electronAPI) return;
    setUpnpLoading(true);
    const result = await window.electronAPI.attemptUPnP(port);
    setUpnpResult(result);
    setUpnpLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center">
        <h2 className="text-accent mb-1">Host Game</h2>
        <p className="text-muted text-sm">Start a server and share the connection info with your opponent</p>
      </div>

      {error && (
        <p className="text-sm px-4 py-2 rounded-md" style={{ color: '#e74c3c', background: '#2c1010' }}>
          {error}
        </p>
      )}

      {!serverStarted ? (
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 min-w-[300px]">
          <p className="text-muted text-sm m-0">
            Playing as: <strong className="text-foreground">{playerName}</strong>
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-muted text-sm">Port</span>
            <input type="number" min={1024} max={65535} value={portStr}
              onChange={e => setPortStr(e.target.value)} style={{ width: '100%' }} />
          </label>

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
            <button className="btn-primary" disabled={starting} onClick={handleStart}>
              {starting ? 'Starting…' : '🖥 Start Hosting'}
            </button>
            <button className="btn-secondary" onClick={onBack}>Back</button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl px-8 py-6 flex flex-col gap-4 min-w-[320px]">
          {roomCode ? (
            <div className="text-center">
              <p className="text-muted text-xs mb-1">ROOM CODE</p>
              <p className="text-[2.5rem] font-black text-accent m-0" style={{ letterSpacing: '0.35em' }}>
                {roomCode}
              </p>
            </div>
          ) : (
            <p className="text-muted text-center">
              {connected ? 'Creating room…' : 'Connecting to server…'}
            </p>
          )}

          <div className="bg-surface-2 rounded-lg px-4 py-3 flex flex-col gap-1.5 text-sm">
            <p className="text-muted text-xs uppercase tracking-widest mb-1">Share with your opponent</p>
            <div className="flex justify-between">
              <span className="text-muted">Local IP (LAN)</span>
              <span className="font-semibold">{ips ? `${ips.local}:${port}` : '…'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Public IP (internet)</span>
              <span className="font-semibold">
                {ips ? (ips.public ? `${ips.public}:${port}` : 'Unavailable') : '…'}
              </span>
            </div>
          </div>

          {window.electronAPI && (
            <div>
              {upnpResult ? (
                <p className="text-xs m-0" style={{ color: upnpResult.success ? '#4ade80' : '#f87171' }}>
                  {upnpResult.message}
                </p>
              ) : (
                <button className="btn-secondary text-xs px-3.5 py-1.5" onClick={handleUPnP} disabled={upnpLoading}>
                  {upnpLoading ? 'Trying port forward…' : '🌐 Try Auto Port Forward'}
                </button>
              )}
            </div>
          )}

          <p className="text-muted text-sm text-center m-0">
            {roomCode ? '⏳ Waiting for opponent to connect…' : 'Starting server…'}
          </p>

          <button className="btn-secondary text-sm" onClick={onBack}>✕ Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── JoinLobby ─────────────────────────────────────────────────────────────────

function JoinLobby({ playerName, error, onConnect, onBack }: JoinProps) {
  const [hostIp, setHostIp] = useState('');
  const [portStr, setPortStr] = useState('3001');
  const [roomCode, setRoomCode] = useState('');

  const port = parseInt(portStr, 10) || 3001;
  const canConnect = !!hostIp.trim() && roomCode.length === 4;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center">
        <h2 className="text-accent mb-1">Join Game</h2>
        <p className="text-muted text-sm">Enter the connection info from your opponent</p>
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
          <span className="text-muted text-sm">Host IP address</span>
          <input value={hostIp} onChange={e => setHostIp(e.target.value.trim())}
            placeholder="192.168.1.5  or  1.2.3.4" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Port</span>
          <input type="number" min={1024} max={65535} value={portStr}
            onChange={e => setPortStr(e.target.value)} style={{ width: '100%' }} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Room code</span>
          <input
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="XXXX"
            maxLength={4}
            style={{ letterSpacing: '0.25em', fontWeight: 700, fontSize: '1.1rem' }}
          />
        </label>

        <div className="flex gap-2 mt-1">
          <button className="btn-primary" disabled={!canConnect}
            onClick={() => onConnect(hostIp, port, roomCode)}>
            🔗 Connect
          </button>
          <button className="btn-secondary" onClick={onBack}>Back</button>
        </div>
      </div>
    </div>
  );
}
