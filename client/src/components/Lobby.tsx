import { useEffect, useState } from 'react';
import { GameSettings } from '@lands/shared';

// ── Host Lobby ────────────────────────────────────────────────────────────────

interface HostProps {
  mode: 'host';
  playerName: string;
  setPlayerName: (n: string) => void;
  connected: boolean;
  roomCode: string | null;
  error: string | null;
  defaultPort?: number;
  upnpEnabled?: boolean;
  onStartServer: (name: string, port: number, settings: GameSettings) => void;
  onBack: () => void;
}

// ── Join Lobby ────────────────────────────────────────────────────────────────

interface JoinProps {
  mode: 'join';
  playerName: string;
  setPlayerName: (n: string) => void;
  error: string | null;
  onConnect: (name: string, hostIp: string, port: number, roomCode: string) => void;
  onBack: () => void;
}

type Props = HostProps | JoinProps;

export function Lobby(props: Props) {
  if (props.mode === 'host') return <HostLobby {...props} />;
  return <JoinLobby {...props} />;
}

// ── HostLobby ─────────────────────────────────────────────────────────────────

function HostLobby({
  playerName, setPlayerName, connected, roomCode, error,
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

  // Load IPs after server starts
  useEffect(() => {
    if (!serverStarted || !window.electronAPI) return;
    window.electronAPI.getIPs().then(setIps);
  }, [serverStarted]);

  async function handleStart() {
    if (!playerName.trim()) return;
    setStarting(true);
    onStartServer(playerName.trim(), port, { counterTimeLimitSeconds: timerSec });
    setServerStarted(true);
    setStarting(false);

    // Auto UPnP if enabled in settings
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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '1.5rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent)', marginBottom: '0.3rem' }}>Host Game</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Start a server and share the connection info with your opponent
        </p>
      </div>

      {error && (
        <p style={{ color: '#e74c3c', background: '#2c1010', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem' }}>
          {error}
        </p>
      )}

      {!serverStarted ? (
        /* ── Setup form ── */
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '1.5rem', display: 'flex',
          flexDirection: 'column', gap: '1rem', minWidth: 300,
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Your name</span>
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Port</span>
            <input
              type="number"
              min={1024}
              max={65535}
              value={portStr}
              onChange={e => setPortStr(e.target.value)}
              style={{ width: '100%', fontSize: '0.95rem', padding: '0.4rem 0.6rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Counter window timer</span>
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

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
            <button
              className="btn-primary"
              disabled={!playerName.trim() || starting}
              onClick={handleStart}
            >
              {starting ? 'Starting…' : '🖥 Start Hosting'}
            </button>
            <button className="btn-secondary" onClick={onBack}>Back</button>
          </div>
        </div>
      ) : (
        /* ── Hosting info ── */
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '1.5rem 2rem', display: 'flex',
          flexDirection: 'column', gap: '1rem', minWidth: 320,
        }}>
          {/* Room code */}
          {roomCode ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 4 }}>ROOM CODE</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.35em', color: 'var(--accent)', margin: 0 }}>
                {roomCode}
              </p>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', textAlign: 'center' }}>
              {connected ? 'Creating room…' : 'Connecting to server…'}
            </p>
          )}

          {/* IP addresses */}
          <div style={{
            background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem 1rem',
            display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              Share with your opponent
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Local IP (LAN)</span>
              <span style={{ fontWeight: 600 }}>{ips ? `${ips.local}:${port}` : '…'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Public IP (internet)</span>
              <span style={{ fontWeight: 600 }}>
                {ips
                  ? (ips.public ? `${ips.public}:${port}` : 'Unavailable')
                  : '…'}
              </span>
            </div>
          </div>

          {/* UPnP */}
          {window.electronAPI && (
            <div>
              {upnpResult ? (
                <p style={{
                  fontSize: '0.8rem',
                  color: upnpResult.success ? '#4ade80' : '#f87171',
                  margin: 0,
                }}>
                  {upnpResult.message}
                </p>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={handleUPnP}
                  disabled={upnpLoading}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.9rem' }}
                >
                  {upnpLoading ? 'Trying port forward…' : '🌐 Try Auto Port Forward'}
                </button>
              )}
            </div>
          )}

          {/* Status */}
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
            {roomCode
              ? '⏳ Waiting for opponent to connect…'
              : 'Starting server…'}
          </p>

          <button className="btn-secondary" onClick={onBack} style={{ fontSize: '0.85rem' }}>
            ✕ Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── JoinLobby ─────────────────────────────────────────────────────────────────

function JoinLobby({ playerName, setPlayerName, error, onConnect, onBack }: JoinProps) {
  const [hostIp, setHostIp] = useState('');
  const [portStr, setPortStr] = useState('3001');
  const [roomCode, setRoomCode] = useState('');

  const port = parseInt(portStr, 10) || 3001;
  const canConnect = !!playerName.trim() && !!hostIp.trim() && roomCode.length === 4;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '1.5rem',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent)', marginBottom: '0.3rem' }}>Join Game</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Enter the connection info from your opponent
        </p>
      </div>

      {error && (
        <p style={{ color: '#e74c3c', background: '#2c1010', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem' }}>
          {error}
        </p>
      )}

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '1.5rem', display: 'flex',
        flexDirection: 'column', gap: '1rem', minWidth: 300,
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Your name</span>
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Host IP address</span>
          <input
            value={hostIp}
            onChange={e => setHostIp(e.target.value.trim())}
            placeholder="192.168.1.5  or  1.2.3.4"
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Port</span>
          <input
            type="number"
            min={1024}
            max={65535}
            value={portStr}
            onChange={e => setPortStr(e.target.value)}
            style={{ width: '100%' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Room code</span>
          <input
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="XXXX"
            maxLength={4}
            style={{ letterSpacing: '0.25em', fontWeight: 700, fontSize: '1.1rem' }}
          />
        </label>

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
          <button
            className="btn-primary"
            disabled={!canConnect}
            onClick={() => onConnect(playerName.trim(), hostIp, port, roomCode)}
          >
            🔗 Connect
          </button>
          <button className="btn-secondary" onClick={onBack}>Back</button>
        </div>
      </div>
    </div>
  );
}
