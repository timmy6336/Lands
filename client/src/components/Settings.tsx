import { useEffect, useState } from 'react';
import { AppSettings } from '../electron.d';
import { ALL_COLORS, Color } from '@lands/shared';
import { useUISettings } from '../hooks/useUISettings';

const COLOR_LABELS: Record<Color, string> = {
  white: 'White', red: 'Red', blue: 'Blue', green: 'Green', black: 'Black',
};

const COLOR_PREVIEW_BG: Record<Color, string> = {
  white: '#f0ead6', red: '#c0392b', blue: '#2980b9', green: '#27ae60', black: '#1a1a2a',
};

interface Props {
  onBack: () => void;
  onRefreshImages: () => Promise<void>;
  playerName: string;
  setPlayerName: (name: string) => void;
}

export function Settings({ onBack, onRefreshImages, playerName, setPlayerName }: Props) {
  const isElectron = !!window.electronAPI;
  const {
    showCardTypeOnHover, setShowCardTypeOnHover,
    showCardEffectsOnHover, setShowCardEffectsOnHover,
    showEffectResultRed, setShowEffectResultRed,
    showEffectResultGreen, setShowEffectResultGreen,
    showEffectResultBlue, setShowEffectResultBlue,
    showEffectResultBlack, setShowEffectResultBlack,
  } = useUISettings();

  const [defaultPort, setDefaultPort] = useState(3001);
  const [upnpEnabled, setUpnpEnabled] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({
    white: '/cards/white.svg', red: '/cards/red.svg', blue: '/cards/blue.svg',
    green: '/cards/green.svg', black: '/cards/black.svg', back: '/cards/back.svg',
  });
  const [imageStatus, setImageStatus] = useState<Record<string, string>>({
    white: '', red: '', blue: '', green: '', black: '', back: '',
  });

  useEffect(() => {
    if (!isElectron) return;
    window.electronAPI!.getSettings().then((s: AppSettings) => {
      setDefaultPort(s.defaultPort ?? 3001);
      setUpnpEnabled(s.upnpEnabled ?? false);
    });
    refreshPreviews();
  }, []);

  async function refreshPreviews() {
    if (!window.electronAPI) return;
    const urls = await window.electronAPI.getCardImageUrls();
    setPreviewUrls(urls as Record<string, string>);
  }

  async function handleUpload(color: Color | 'back') {
    if (!window.electronAPI) return;
    const filePath = await window.electronAPI.openImageDialog();
    if (!filePath) return;
    setImageStatus(prev => ({ ...prev, [color]: 'Saving…' }));
    await window.electronAPI.saveCardImage(color, filePath);
    await refreshPreviews();
    await onRefreshImages();
    setImageStatus(prev => ({ ...prev, [color]: 'Saved!' }));
    setTimeout(() => setImageStatus(prev => ({ ...prev, [color]: '' })), 2000);
  }

  async function handleReset(color: Color | 'back') {
    if (!window.electronAPI) return;
    await window.electronAPI.resetCardImage(color);
    await refreshPreviews();
    await onRefreshImages();
    setImageStatus(prev => ({ ...prev, [color]: 'Reset!' }));
    setTimeout(() => setImageStatus(prev => ({ ...prev, [color]: '' })), 2000);
  }

  function saveName(name: string) {
    const trimmed = name.trim() || 'Player';
    setPlayerName(trimmed);
    localStorage.setItem('playerName', trimmed);
    if (window.electronAPI) {
      window.electronAPI.saveSettings({ defaultPort, upnpEnabled, playerName: trimmed });
    }
  }

  async function saveNetworkSettings() {
    if (!window.electronAPI) return;
    await window.electronAPI.saveSettings({ defaultPort, upnpEnabled, playerName });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  const sectionHeadingStyle: React.CSSProperties = {
    color: 'var(--text)', fontSize: '0.9rem', fontWeight: 700,
    marginTop: 0, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: '0.07em',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '0 1rem',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, minHeight: 52, borderBottom: '1px solid var(--border)',
  };

  const lastRowStyle: React.CSSProperties = {
    ...rowStyle, borderBottom: 'none',
  };

  const rowLabelStyle: React.CSSProperties = {
    color: 'var(--muted)', fontSize: '0.88rem', flex: 1,
  };

  const checkboxStyle: React.CSSProperties = {
    width: 20, height: 20, cursor: 'pointer',
    accentColor: 'var(--accent)', flexShrink: 0,
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
    }}>
      {/* Sticky header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        padding: '0.65rem 1rem',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 0.65rem)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 1rem', minHeight: 44, fontSize: '0.9rem' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.3rem' }}>Settings</h2>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Player Name */}
        <section>
          <h3 style={sectionHeadingStyle}>Player</h3>
          <div style={cardStyle}>
            <label style={lastRowStyle}>
              <span style={rowLabelStyle}>Display name</span>
              <input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onBlur={e => saveName(e.target.value)}
                placeholder="Player"
                maxLength={20}
                style={{ textAlign: 'right', fontSize: '0.9rem', padding: '0.3rem 0.5rem', minWidth: 0, maxWidth: 140, minHeight: 36 }}
              />
            </label>
          </div>
        </section>

        {/* Card Appearance */}
        <section>
          <h3 style={sectionHeadingStyle}>Card Appearance</h3>
          {!isElectron && (
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 10, marginTop: 0 }}>
              Card image upload is only available in the desktop app.
            </p>
          )}
          <div style={cardStyle}>
            <label style={rowStyle}>
              <span style={rowLabelStyle}>Show card type on select</span>
              <input
                type="checkbox" checked={showCardTypeOnHover}
                onChange={e => setShowCardTypeOnHover(e.target.checked)}
                style={checkboxStyle}
              />
            </label>
            <label style={lastRowStyle}>
              <span style={rowLabelStyle}>Show card effect on select</span>
              <input
                type="checkbox" checked={showCardEffectsOnHover}
                onChange={e => setShowCardEffectsOnHover(e.target.checked)}
                style={checkboxStyle}
              />
            </label>
          </div>
        </section>

        {/* Effect Notifications */}
        <section>
          <h3 style={sectionHeadingStyle}>Effect Notifications</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 10, marginTop: 0 }}>
            Show a popup to the opponent after an effect resolves.
          </p>
          <div style={cardStyle}>
            {([
              { key: 'red',   label: 'Red — land destroyed',                   val: showEffectResultRed,   set: setShowEffectResultRed   },
              { key: 'green', label: 'Green — land retrieved from graveyard',   val: showEffectResultGreen, set: setShowEffectResultGreen },
              { key: 'blue',  label: 'Blue — deck card peeked / reordered',     val: showEffectResultBlue,  set: setShowEffectResultBlue  },
              { key: 'black', label: 'Black — card discarded from hand',        val: showEffectResultBlack, set: setShowEffectResultBlack },
            ] as const).map(({ key, label, val, set }, i, arr) => (
              <label key={key} style={i === arr.length - 1 ? lastRowStyle : rowStyle}>
                <span style={rowLabelStyle}>{label}</span>
                <input
                  type="checkbox" checked={val}
                  onChange={e => set(e.target.checked)}
                  style={checkboxStyle}
                />
              </label>
            ))}
          </div>
        </section>

        {/* Card Images */}
        <section>
          <h3 style={sectionHeadingStyle}>Card Images</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {ALL_COLORS.map(color => (
              <div key={color} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '0.75rem 0.6rem',
                display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
              }}>
                <div style={{
                  width: 60, height: 84, borderRadius: 7, overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.15)',
                  background: COLOR_PREVIEW_BG[color], flexShrink: 0,
                }}>
                  <img
                    src={previewUrls[color]} alt={color} key={previewUrls[color]}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    style={{ width: '100%', height: '70%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center' }}>{COLOR_LABELS[color]}</span>
                {imageStatus[color] && (
                  <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>{imageStatus[color]}</span>
                )}
                {isElectron && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                    <button className="btn-primary" onClick={() => handleUpload(color)}
                      style={{ fontSize: '0.7rem', padding: '0.3rem 0.4rem', minHeight: 32 }}>Upload</button>
                    <button className="btn-secondary" onClick={() => handleReset(color)}
                      style={{ fontSize: '0.7rem', padding: '0.3rem 0.4rem', minHeight: 32 }}>Default</button>
                  </div>
                )}
              </div>
            ))}

            {/* Card Back */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.75rem 0.6rem',
              display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
            }}>
              <div style={{
                width: 60, height: 84, borderRadius: 7, overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.15)',
                background: '#12122a', flexShrink: 0,
              }}>
                <img
                  src={previewUrls['back']} alt="card back" key={previewUrls['back']}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center' }}>Card Back</span>
              {imageStatus['back'] && (
                <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>{imageStatus['back']}</span>
              )}
              {isElectron && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  <button className="btn-primary" onClick={() => handleUpload('back')}
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.4rem', minHeight: 32 }}>Upload</button>
                  <button className="btn-secondary" onClick={() => handleReset('back')}
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.4rem', minHeight: 32 }}>Default</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Network — Electron only */}
        {isElectron && (
          <section>
            <h3 style={sectionHeadingStyle}>Network</h3>
            <div style={cardStyle}>
              <label style={rowStyle}>
                <span style={rowLabelStyle}>Default hosting port</span>
                <input
                  type="number" min={1024} max={65535} value={defaultPort}
                  onChange={e => setDefaultPort(Number(e.target.value))}
                  style={{ width: 80, textAlign: 'center', fontSize: '0.9rem', padding: '0.3rem 0.5rem', minHeight: 36 }}
                />
              </label>
              <label style={rowStyle}>
                <div style={{ flex: 1 }}>
                  <span style={rowLabelStyle}>Auto port forward (UPnP)</span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted)', opacity: 0.7 }}>
                    Attempt UPnP when starting a host game
                  </p>
                </div>
                <input
                  type="checkbox" checked={upnpEnabled}
                  onChange={e => setUpnpEnabled(e.target.checked)}
                  style={{ ...checkboxStyle }}
                />
              </label>
              <div style={{ padding: '0.75rem 0' }}>
                <button className="btn-primary" onClick={saveNetworkSettings}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem', minHeight: 44 }}>
                  {settingsSaved ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
