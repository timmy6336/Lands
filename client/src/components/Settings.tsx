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
}

export function Settings({ onBack, onRefreshImages }: Props) {
  const isElectron = !!window.electronAPI;
  const { showCardTypeOnHover, setShowCardTypeOnHover, showCardEffectsOnHover, setShowCardEffectsOnHover } = useUISettings();

  // Network settings
  const [defaultPort, setDefaultPort] = useState(3001);
  const [upnpEnabled, setUpnpEnabled] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Card image preview URLs (refreshed after upload/reset)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({
    white: '/cards/white.svg',
    red:   '/cards/red.svg',
    blue:  '/cards/blue.svg',
    green: '/cards/green.svg',
    black: '/cards/black.svg',
    back:  '/cards/back.svg',
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

  async function saveNetworkSettings() {
    if (!window.electronAPI) return;
    await window.electronAPI.saveSettings({ defaultPort, upnpEnabled });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '1.5rem 2rem', gap: '1.5rem', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 1rem' }}>
          ← Back
        </button>
        <h2 style={{ color: 'var(--accent)', margin: 0 }}>Settings</h2>
      </div>

      {/* Card Images */}
      <section>
        <h3 style={{ color: 'var(--text)', marginBottom: '0.75rem', fontSize: '1rem' }}>
          Card Appearance
        </h3>
        {!isElectron && (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            Card image upload is only available in the desktop app.
          </p>
        )}

        {/* Show card type on hover toggle */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          marginBottom: '1rem', cursor: 'pointer', width: 'fit-content',
        }}>
          <input
            type="checkbox"
            checked={showCardTypeOnHover}
            onChange={e => setShowCardTypeOnHover(e.target.checked)}
            style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Show card type on hover
          </span>
        </label>

        <label style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          marginBottom: '1rem', cursor: 'pointer', width: 'fit-content',
        }}>
          <input
            type="checkbox"
            checked={showCardEffectsOnHover}
            onChange={e => setShowCardEffectsOnHover(e.target.checked)}
            style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Show card effect on hover
          </span>
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {ALL_COLORS.map(color => (
            <div key={color} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0.75rem', display: 'flex',
              flexDirection: 'column', gap: '0.5rem', alignItems: 'center',
              minWidth: 120,
            }}>
              {/* Preview */}
              <div style={{
                width: 72, height: 100, borderRadius: 7, overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.15)', position: 'relative',
                background: COLOR_PREVIEW_BG[color], flexShrink: 0,
              }}>
                <img
                  src={previewUrls[color]}
                  alt={color}
                  key={previewUrls[color]}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  style={{ width: '100%', height: '70%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
                {COLOR_LABELS[color]}
              </p>
              {imageStatus[color] && (
                <p style={{ fontSize: '0.7rem', color: '#4ade80', margin: 0 }}>{imageStatus[color]}</p>
              )}
              {isElectron && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%' }}>
                  <button
                    className="btn-primary"
                    onClick={() => handleUpload(color)}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
                  >
                    Upload
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleReset(color)}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
                  >
                    Default
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Card Back */}
      <section>
        <h3 style={{ color: 'var(--text)', marginBottom: '0.75rem', fontSize: '1rem' }}>
          Card Back
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '0.75rem', display: 'flex',
            flexDirection: 'column', gap: '0.5rem', alignItems: 'center',
            minWidth: 120,
          }}>
            <div style={{
              width: 72, height: 100, borderRadius: 7, overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.15)', position: 'relative',
              background: '#12122a', flexShrink: 0,
            }}>
              <img
                src={previewUrls['back']}
                alt="card back"
                key={previewUrls['back']}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
              Card Back
            </p>
            {imageStatus['back'] && (
              <p style={{ fontSize: '0.7rem', color: '#4ade80', margin: 0 }}>{imageStatus['back']}</p>
            )}
            {isElectron && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%' }}>
                <button
                  className="btn-primary"
                  onClick={() => handleUpload('back')}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
                >
                  Upload
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleReset('back')}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}
                >
                  Default
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Network Settings — Electron only */}
      {isElectron && (
        <section>
          <h3 style={{ color: 'var(--text)', marginBottom: '0.75rem', fontSize: '1rem' }}>
            Network
          </h3>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '1rem 1.25rem',
            display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: 380,
          }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Default hosting port</span>
              <input
                type="number"
                min={1024}
                max={65535}
                value={defaultPort}
                onChange={e => setDefaultPort(Number(e.target.value))}
                style={{ width: 80, textAlign: 'center', fontSize: '0.9rem', padding: '0.3rem 0.5rem' }}
              />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Auto port forward (UPnP)</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', opacity: 0.7 }}>
                  Attempt UPnP when starting a host game
                </p>
              </div>
              <input
                type="checkbox"
                checked={upnpEnabled}
                onChange={e => setUpnpEnabled(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </label>
            <button
              className="btn-primary"
              onClick={saveNetworkSettings}
              style={{ alignSelf: 'flex-start', fontSize: '0.9rem', padding: '0.4rem 1.25rem' }}
            >
              {settingsSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
