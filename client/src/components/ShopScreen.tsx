// ─────────────────────────────────────────────────────────────────────────────
// client/src/components/ShopScreen.tsx — skin pack shop
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { SkinPack, UserProfile } from '@lands/shared';
import { AuthState } from '../hooks/useAuth';

interface Props {
  auth: AuthState;
  serverUrl: string;
  onBack: () => void;
  /** Called after a successful purchase or equip so the parent can re-render. */
  onProfileUpdated: (profile: UserProfile) => void;
}

interface ShopData {
  packs: SkinPack[];
  ownedIds: string[];
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

export function ShopScreen({ auth, serverUrl, onBack, onProfileUpdated }: Props) {
  const [shop, setShop]           = useState<ShopData | null>(null);
  const [loadErr, setLoadErr]     = useState('');
  const [busy, setBusy]           = useState<string | null>(null); // packId currently processing
  const [toast, setToast]         = useState('');

  const activePack = auth.profile?.active_pack_id ?? null;
  const ownedIds   = shop?.ownedIds ?? auth.profile?.owned_pack_ids ?? [];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function fetchShop() {
    setLoadErr('');
    try {
      const headers: Record<string, string> = {};
      if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
      const res  = await fetch(`${serverUrl}/shop/packs`, { headers });
      const data = await res.json() as ShopData;
      setShop(data);
    } catch {
      setLoadErr('Could not load shop. Check your connection.');
    }
  }

  useEffect(() => { fetchShop(); }, []);

  async function handleBuy(pack: SkinPack) {
    if (!auth.token) { showToast('Sign in to purchase packs'); return; }
    setBusy(pack.id);
    try {
      const res  = await fetch(`${serverUrl}/shop/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ packId: pack.id }),
      });
      const data = await res.json() as {
        granted?: boolean; pack?: SkinPack; checkoutUrl?: string; _devMode?: boolean; error?: string;
      };
      if (!res.ok) { showToast(data.error ?? 'Checkout failed'); return; }

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.open(data.checkoutUrl, '_blank');
        showToast('Redirecting to payment page…');
      } else if (data.granted) {
        // Immediately granted (free pack or dev mode)
        setShop(prev => prev ? { ...prev, ownedIds: [...prev.ownedIds, pack.id] } : prev);
        showToast(data._devMode ? `🎁 Dev mode: "${pack.name}" granted!` : `"${pack.name}" unlocked!`);
        // Auto-equip if they have nothing equippted
        if (!activePack || activePack === 'default') {
          await handleEquip(pack.id);
        } else {
          await auth.refreshProfile(serverUrl);
        }
      }
    } catch {
      showToast('Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  async function handleEquip(packId: string) {
    if (!auth.token) return;
    try {
      const res  = await fetch(`${serverUrl}/profile/equip-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json() as { profile?: UserProfile; error?: string };
      if (res.ok && data.profile) {
        onProfileUpdated(data.profile);
        showToast(packId === 'default' ? 'Reverted to Classic art' : 'Skin equipped!');
        setShop(prev => prev ? { ...prev, ownedIds: prev.ownedIds } : prev);
      } else {
        showToast(data.error ?? 'Equip failed');
      }
    } catch {
      showToast('Something went wrong');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: '100%',
    padding: '1.5rem 2rem', gap: 20,
  };
  const headerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 16,
  };
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16, overflowY: 'auto', flex: 1,
  };
  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
          ← Back
        </button>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.4rem' }}>Skin Shop</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.8rem' }}>Cosmetic card packs — purely visual</p>
        </div>
        {!auth.profile && (
          <span style={{ marginLeft: 'auto', color: 'var(--muted2)', fontSize: '0.8rem' }}>
            Sign in to purchase
          </span>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--accent)',
          borderRadius: 8, padding: '0.6rem 1rem',
          color: 'var(--accent)', fontSize: '0.9rem', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}

      {/* Error */}
      {loadErr && (
        <div style={{ color: '#e74c3c', textAlign: 'center' }}>
          {loadErr}
          <button onClick={fetchShop} style={{ marginLeft: 8, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Retry
          </button>
        </div>
      )}

      {/* Pack grid */}
      {!shop && !loadErr && (
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '4rem' }}>Loading…</p>
      )}

      {shop && (
        <div style={gridStyle}>
          {shop.packs.map(pack => {
            const isOwned    = pack.price_cents === 0 || ownedIds.includes(pack.id);
            const isActive   = activePack === pack.id || (pack.id === 'default' && !activePack);
            const isLoading  = busy === pack.id;

            return (
              <div
                key={pack.id}
                style={{
                  ...cardStyle,
                  borderColor: isActive ? 'rgba(99,102,241,0.7)' : 'var(--border)',
                  boxShadow: isActive ? '0 0 16px rgba(99,102,241,0.2)' : 'none',
                }}
              >
                {/* Preview image */}
                <div style={{
                  height: 120, background: 'var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <img
                    src={pack.preview_url}
                    alt={pack.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
                  />
                </div>

                {/* Info */}
                <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>{pack.name}</span>
                    {isActive && (
                      <span style={{
                        background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.4)',
                        color: 'var(--accent)', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700,
                      }}>
                        Active
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>{pack.description}</p>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    {isOwned ? (
                      <button
                        onClick={() => handleEquip(pack.id)}
                        disabled={isActive || isLoading}
                        className={isActive ? 'btn-secondary' : 'btn-primary'}
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', opacity: isActive ? 0.5 : 1 }}
                      >
                        {isActive ? 'Equipped' : 'Equip'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(pack)}
                        disabled={isLoading || !auth.token}
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                      >
                        {isLoading ? '…' : formatPrice(pack.price_cents)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
