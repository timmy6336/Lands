// Settings screen: theme, card hover options, effect notifications, custom card art.
import { useEffect, useState } from 'react';
import { ALL_COLORS, Color } from '@lands/shared';
import { useUISettings } from '../hooks/useUISettings';

const COLOR_LABELS: Record<Color, string> = {
  white: 'White',
  red:   'Red',
  blue:  'Blue',
  green: 'Green',
  black: 'Black',
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
  const {
    showCardTypeOnHover, setShowCardTypeOnHover,
    showCardEffectsOnHover, setShowCardEffectsOnHover,
    showEffectResultRed, setShowEffectResultRed,
    showEffectResultGreen, setShowEffectResultGreen,
    showEffectResultBlue, setShowEffectResultBlue,
    showEffectResultBlack, setShowEffectResultBlack,
    theme, setTheme,
  } = useUISettings();

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({
    white: '/cards/white.svg', red: '/cards/red.svg', blue: '/cards/blue.svg',
    green: '/cards/green.svg', black: '/cards/black.svg', back: '/cards/back.svg',
  });
  const [imageStatus, setImageStatus] = useState<Record<string, string>>({
    white: '', red: '', blue: '', green: '', black: '', back: '',
  });

  useEffect(() => {
    if (!isElectron) return;
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

  const SectionBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-surface border border-border rounded-[10px] px-5 py-4 flex flex-col gap-3 max-w-[480px]">
      {children}
    </div>
  );

  const Toggle = ({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <span className="text-muted text-sm">{label}</span>
        {sub && <p className="m-0 text-xs text-muted" style={{ opacity: 0.65 }}>{sub}</p>}
      </div>
      <input
        type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 17, height: 17, cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }}
      />
    </label>
  );

  return (
    <div className="flex flex-col h-full px-8 py-6 gap-7 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <button className="btn-secondary px-4 py-1.5" onClick={onBack}>← Back</button>
        <h2 className="text-accent m-0">Settings</h2>
      </div>

      {/* ── Appearance ───────────────────────────────── */}
      <section>
        <h3 className="text-foreground mb-3 text-base mt-0">Appearance</h3>
        <SectionBox>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted text-sm">Theme</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['dark', 'light'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  padding: '0.3rem 1rem', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600,
                  border: theme === t ? '1px solid var(--accent)' : '1px solid var(--border2)',
                  background: theme === t ? 'rgba(99,102,241,0.18)' : 'var(--surface2)',
                  color: theme === t ? 'var(--accent)' : 'var(--muted2)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              ))}
            </div>
          </div>
        </SectionBox>
      </section>

      {/* ── Cards ──────────────────────────────────── */}
      <section>
        <h3 className="text-foreground mb-3 text-base mt-0">Cards</h3>
        <SectionBox>
          <Toggle
            label="Show card type on hover"
            checked={showCardTypeOnHover}
            onChange={setShowCardTypeOnHover}
          />
          <Toggle
            label="Show card effect on hover"
            checked={showCardEffectsOnHover}
            onChange={setShowCardEffectsOnHover}
          />
        </SectionBox>

        {/* Card art */}
        {!isElectron && (
          <p className="text-muted text-sm mt-3 mb-2">Card art upload is only available in the desktop app.</p>
        )}
        <div className="flex flex-wrap gap-3 mt-3">
          {[...ALL_COLORS, 'back' as const].map(color => (
            <div key={color} className="bg-surface border border-border rounded-[10px] p-3 flex flex-col gap-2 items-center" style={{ minWidth: 110 }}>
              <div style={{
                width: 68, height: 96, borderRadius: 7, overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.12)',
                background: color === 'back' ? '#12122a' : COLOR_PREVIEW_BG[color as Color],
                flexShrink: 0,
              }}>
                <img
                  src={previewUrls[color]} alt={color} key={previewUrls[color]}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  style={{ width: '100%', height: color === 'back' ? '100%' : '70%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <p className="text-[0.72rem] text-muted text-center m-0">
                {color === 'back' ? 'Card Back' : COLOR_LABELS[color as Color]}
              </p>
              {imageStatus[color] && (
                <p className="text-[0.7rem] m-0" style={{ color: '#4ade80' }}>{imageStatus[color]}</p>
              )}
              {isElectron && (
                <div className="flex flex-col gap-1 w-full">
                  <button className="btn-primary" onClick={() => handleUpload(color as Color | 'back')}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}>Upload</button>
                  <button className="btn-secondary" onClick={() => handleReset(color as Color | 'back')}
                    style={{ fontSize: '0.72rem', padding: '0.3rem 0.5rem' }}>Default</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Effect Notifications ─────────────────────── */}
      <section>
        <h3 className="text-foreground mb-1 text-base mt-0">Effect Notifications</h3>
        <p className="text-muted text-sm mb-3 mt-0">Show a popup to the opponent when an effect resolves.</p>
        <SectionBox>
          <Toggle label="Red — land destroyed"                        checked={showEffectResultRed}   onChange={setShowEffectResultRed}   />
          <Toggle label="Green — land retrieved from graveyard"        checked={showEffectResultGreen} onChange={setShowEffectResultGreen} />
          <Toggle label="Blue — deck card kept on top / sent to bottom" checked={showEffectResultBlue}  onChange={setShowEffectResultBlue}  />
          <Toggle label="Black — card discarded from hand"             checked={showEffectResultBlack} onChange={setShowEffectResultBlack} />
        </SectionBox>
      </section>
    </div>
  );
}
