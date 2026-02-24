// ─────────────────────────────────────────────────────────────────────────────
// client/src/components/ShopScreen.tsx — skin pack shop
// The default/Classic pack is never shown here; it is always available for free
// in the player's profile.  Only purchasable packs appear.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { SkinPack, UserProfile } from '@lands/shared';
import { AuthState } from '../hooks/useAuth';

interface Props {
  auth: AuthState;
  serverUrl: string;
  onBack: () => void;
  /** Called after a successful purchase so the parent can re-render. */
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
  const [shop, setShop]       = useState<ShopData | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [busy, setBusy]       = useState<string | null>(null);
  const [toast, setToast]     = useState('');

  // Merge server ownedIds with what we know from the auth profile
  const ownedIds = shop?.ownedIds ?? auth.profile?.owned_pack_ids ?? [];

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
    if (!auth.token) { showToast('Sign in to unlock packs'); return; }
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
        window.open(data.checkoutUrl, '_blank');
        showToast('Redirecting to payment page…');
      } else if (data.granted) {
        setShop(prev => prev ? { ...prev, ownedIds: [...prev.ownedIds, pack.id] } : prev);
        showToast(`"${pack.name}" unlocked! Equip it from your profile.`);
        await auth.refreshProfile(serverUrl);
        if (auth.profile) onProfileUpdated(auth.profile);
      }
    } catch {
      showToast('Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: '100%',
    padding: '1.5rem 2rem', gap: 20,
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

  // Only show non-default packs
  const visiblePacks = shop?.packs.filter(p => p.id !== 'default') ?? [];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
          ← Back
        </button>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.4rem' }}>Skin Shop</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.8rem' }}>Cosmetic card packs — purely visual. Equip from your profile.</p>
        </div>
        {!auth.profile && (
          <span style={{ marginLeft: 'auto', color: 'var(--muted2)', fontSize: '0.8rem' }}>
            Sign in to unlock
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

      {!shop && !loadErr && (
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '4rem' }}>Loading…</p>
      )}

      {shop && (
        <div style={gridStyle}>
          {visiblePacks.map(pack => {
            const isOwned   = ownedIds.includes(pack.id);
            const isLoading = busy === pack.id;

            return (
              <div
                key={pack.id}
                style={{
                  ...cardStyle,
                  borderColor: isOwned ? 'rgba(99,102,241,0.55)' : 'var(--border)',
                  boxShadow:   isOwned ? '0 0 12px rgba(99,102,241,0.15)' : 'none',
                }}
              >
                {/* Preview */}
                <div style={{ height: 120, background: 'var(--bg)', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={pack.preview_url}
                    alt={pack.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15'; }}
                  />
                  {isOwned && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(99,102,241,0.85)', color: '#fff',
                      borderRadius: 8, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700,
                    }}>
                      OWNED
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>{pack.name}</span>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>{pack.description}</p>

                  <div style={{ marginTop: 'auto' }}>
                    {isOwned ? (
                      <div style={{
                        textAlign: 'center', padding: '0.5rem',
                        color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600,
                      }}>
                        ✓ Owned — equip from your profile
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuy(pack)}
                        disabled={isLoading || !auth.token}
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                        title={!auth.token ? 'Sign in to unlock packs' : undefined}
                      >
                        {isLoading ? '…' : `Unlock — ${formatPrice(pack.price_cents)}`}
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
