import { useEffect, useState } from 'react';
import { Color, ALL_COLORS } from '@lands/shared';
import { AppSettings } from '../electron.d';
import { useUISettings } from '../hooks/useUISettings';

const COLOR_LABELS: Record<Color, string> = {
  white: 'White / Plains',
  red:   'Red / Mountain',
  blue:  'Blue / Island',
  green: 'Green / Forest',
  black: 'Black / Swamp',
};

const COLOR_PREVIEW_BG: Record<Color, string> = {
  white: '#f0ead6',
  red:   '#c0392b',
  blue:  '#2980b9',
  green: '#27ae60',
  black: '#1a1a2a',
};

interface Props {
  onBack: () => void;
  onRefreshImages: () => Promise<void>;
  playerName: string;
  setPlayerName: (name: string) => void;
}

export function Settings({ onBack, onRefreshImages, playerName, setPlayerName }: Props) {
  const isElectron = !!window.electronAPI;
  const { showCardTypeOnHover, setShowCardTypeOnHover, showCardEffectsOnHover, setShowCardEffectsOnHover } = useUISettings();

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

  return (
    <div className="flex flex-col h-full px-8 py-6 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button className="btn-secondary px-4 py-1.5" onClick={onBack}>← Back</button>
        <h2 className="text-accent m-0">Settings</h2>
      </div>

      {/* Player Name */}
      <section>
        <h3 className="text-foreground mb-3 text-base mt-0">Player</h3>
        <div className="bg-surface border border-border rounded-[10px] px-5 py-4 max-w-[380px]">
          <label className="flex justify-between items-center gap-4">
            <span className="text-muted text-sm shrink-0">Display name</span>
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onBlur={e => saveName(e.target.value)}
              placeholder="Player"
              maxLength={20}
              style={{ textAlign: 'right', fontSize: '0.9rem', padding: '0.3rem 0.5rem', minWidth: 0, flex: 1 }}
            />
          </label>
        </div>
      </section>

      {/* Card Images */}
      <section>
        <h3 className="text-foreground mb-3 text-base mt-0">Card Appearance</h3>
        {!isElectron && (
          <p className="text-muted text-sm mb-3">Card image upload is only available in the desktop app.</p>
        )}

        <label className="flex items-center gap-3 mb-4 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={showCardTypeOnHover}
            onChange={e => setShowCardTypeOnHover(e.target.checked)}
            style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <span className="text-muted text-sm">Show card type on hover</span>
        </label>

        <label className="flex items-center gap-3 mb-4 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={showCardEffectsOnHover}
            onChange={e => setShowCardEffectsOnHover(e.target.checked)}
            style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <span className="text-muted text-sm">Show card effect on hover</span>
        </label>

        <div className="flex flex-wrap gap-4">
          {ALL_COLORS.map(color => (
            <div key={color} className="bg-surface border border-border rounded-[10px] p-3 flex flex-col gap-2 items-center min-w-[120px]">
              <div style={{
                width: 72, height: 100, borderRadius: 7, overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.15)', position: 'relative',
                background: COLOR_PREVIEW_BG[color], flexShrink: 0,
              }}>
                <img
                  src={previewUrls[color]} alt={color} key={previewUrls[color]}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  style={{ width: '100%', height: '70%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <p className="text-[0.72rem] text-muted text-center m-0">{COLOR_LABELS[color]}</p>
              {imageStatus[color] && (
                <p className="text-[0.7rem] m-0" style={{ color: '#4ade80' }}>{imageStatus[color]}</p>
              )}
              {isElectron && (
                <div className="flex flex-col gap-1 w-full">
                  <button className="btn-primary" onClick={() => handleUpload(color)}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}>Upload</button>
                  <button className="btn-secondary" onClick={() => handleReset(color)}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}>Default</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Card Back */}
      <section>
        <h3 className="text-foreground mb-3 text-base mt-0">Card Back</h3>
        <div className="flex flex-wrap gap-4">
          <div className="bg-surface border border-border rounded-[10px] p-3 flex flex-col gap-2 items-center min-w-[120px]">
            <div style={{
              width: 72, height: 100, borderRadius: 7, overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.15)', position: 'relative',
              background: '#12122a', flexShrink: 0,
            }}>
              <img
                src={previewUrls['back']} alt="card back" key={previewUrls['back']}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <p className="text-[0.72rem] text-muted text-center m-0">Card Back</p>
            {imageStatus['back'] && (
              <p className="text-[0.7rem] m-0" style={{ color: '#4ade80' }}>{imageStatus['back']}</p>
            )}
            {isElectron && (
              <div className="flex flex-col gap-1 w-full">
                <button className="btn-primary" onClick={() => handleUpload('back')}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}>Upload</button>
                <button className="btn-secondary" onClick={() => handleReset('back')}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}>Default</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Network Settings — Electron only */}
      {isElectron && (
        <section>
          <h3 className="text-foreground mb-3 text-base mt-0">Network</h3>
          <div className="bg-surface border border-border rounded-[10px] px-5 py-4 flex flex-col gap-3 max-w-[380px]">
            <label className="flex justify-between items-center gap-4">
              <span className="text-muted text-sm">Default hosting port</span>
              <input
                type="number" min={1024} max={65535} value={defaultPort}
                onChange={e => setDefaultPort(Number(e.target.value))}
                style={{ width: 80, textAlign: 'center', fontSize: '0.9rem', padding: '0.3rem 0.5rem' }}
              />
            </label>
            <label className="flex justify-between items-center gap-4 cursor-pointer">
              <div>
                <span className="text-muted text-sm">Auto port forward (UPnP)</span>
                <p className="m-0 text-xs text-muted" style={{ opacity: 0.7 }}>
                  Attempt UPnP when starting a host game
                </p>
              </div>
              <input
                type="checkbox" checked={upnpEnabled}
                onChange={e => setUpnpEnabled(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </label>
            <button className="btn-primary self-start text-sm px-5 py-1.5" onClick={saveNetworkSettings}>
              {settingsSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
