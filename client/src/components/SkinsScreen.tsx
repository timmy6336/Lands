// ─────────────────────────────────────────────────────────────────────────────
// client/src/components/SkinsScreen.tsx — card skin equip screen
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { UserProfile } from '@lands/shared';
import { AuthState } from '../hooks/useAuth';

interface Props {
  auth: AuthState;
  serverUrl: string;
  onBack: () => void;
  onShop: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
}

export function SkinsScreen({ auth, serverUrl, onBack, onShop, onProfileUpdated }: Props) {
  const { profile } = auth;
  const [equipBusy, setEquipBusy] = useState<string | null>(null);
  const [equipMsg,  setEquipMsg]  = useState('');
  const [assetsBase, setAssetsBase] = useState('');

  useEffect(() => {
    if (window.electronAPI?.getCardAssetsBase) {
      window.electronAPI.getCardAssetsBase().then(setAssetsBase).catch(() => {});
    }
  }, []);

  function resolveUrl(assetPath: string): string {
    return assetsBase ? assetsBase + assetPath : assetPath;
  }

  async function handleEquip(packId: string) {
    if (!auth.token) return;
    setEquipBusy(packId);
    try {
      const res  = await fetch(`${serverUrl}/profile/equip-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json() as { profile?: UserProfile; error?: string };
      if (res.ok && data.profile) {
        onProfileUpdated(data.profile);
        setEquipMsg('Skin updated!');
        setTimeout(() => setEquipMsg(''), 2000);
      }
    } catch { /* ignore */ } finally {
      setEquipBusy(null);
    }
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.5rem 1.5rem' }}>← Back</button>
      </div>
    );
  }

  const ownedPacks = ['default', ...(profile.owned_pack_ids ?? [])]
    .filter((v, i, a) => a.indexOf(v) === i);

  const cardColors = ['white', 'red', 'blue', 'green', 'black', 'back'] as const;

  function cardUrl(packId: string, color: string) {
    return resolveUrl(packId === 'default'
      ? `/cards/${color}.svg`
      : `/cards/skins/${packId}/${color}.svg`);
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Fixed header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem 1.5rem 0.8rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--foreground)' }}>Card Skins</h2>
        <button
          onClick={onShop}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
        >
          Browse Shop →
        </button>
      </div>

      {/* Success toast */}
      {equipMsg && (
        <div style={{
          padding: '0.5rem', textAlign: 'center',
          color: 'var(--accent)', fontSize: '0.82rem',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {equipMsg}
        </div>
      )}

      {/* Scrollable pack list */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '1.25rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: 14,
        alignItems: 'center',
      }}>
        {ownedPacks.map(packId => {
          const isActive = (profile.active_pack_id ?? 'default') === packId;
          const isBusy   = equipBusy === packId;
          const packName = packId === 'default' ? 'Classic' : packId.charAt(0).toUpperCase() + packId.slice(1);

          return (
            <div
              key={packId}
              style={{
                width: '100%', maxWidth: 480,
                background: 'var(--surface)',
                border: isActive ? '1px solid rgba(99,102,241,0.7)' : '1px solid var(--border)',
                borderRadius: 12,
                padding: '0.9rem 1rem',
                boxShadow: isActive ? '0 0 14px rgba(99,102,241,0.15)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {/* Pack name + active badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>{packName}</span>
                {isActive && (
                  <span style={{
                    background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.4)',
                    color: 'var(--accent)', borderRadius: 8, padding: '2px 8px',
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
                  }}>
                    ACTIVE
                  </span>
                )}
              </div>

              {/* 5 card face previews */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, justifyContent: 'center' }}>
                {cardColors.map(color => (
                  <div key={color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <img
                      key={color}
                      src={cardUrl(packId, color)}
                      alt={color}
                      style={{
                        width: 50, height: 70, borderRadius: 6,
                        objectFit: 'cover',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
                      }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
                    />
                    <span style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{color}</span>
                  </div>
                ))}
              </div>

              {/* Equip button */}
              <button
                onClick={() => handleEquip(packId)}
                disabled={isActive || isBusy || !!equipBusy}
                className={isActive ? 'btn-secondary' : 'btn-primary'}
                style={{
                  width: '100%', padding: '0.5rem', fontSize: '0.85rem',
                  opacity: !isActive && equipBusy && equipBusy !== packId ? 0.45 : 1,
                }}
              >
                {isBusy ? '…' : isActive ? '✓ Currently Active' : 'Use This Skin'}
              </button>
            </div>
          );
        })}

        {ownedPacks.length <= 1 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center', marginTop: 16 }}>
            You only have the Classic skin. Visit the shop to unlock more!
          </p>
        )}
      </div>
    </div>
  );
}
