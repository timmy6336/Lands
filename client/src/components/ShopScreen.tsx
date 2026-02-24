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

const CARD_COLORS = ['white', 'red', 'blue', 'green', 'black', 'back'] as const;

export function ShopScreen({ auth, serverUrl, onBack, onProfileUpdated }: Props) {
  const [shop, setShop]         = useState<ShopData | null>(null);
  const [loadErr, setLoadErr]   = useState('');
  const [busy, setBusy]         = useState<string | null>(null);
  const [toast, setToast]       = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // In Electron the page loads from file:// so root-relative paths like
  // /cards/skins/gilded/preview.svg don't resolve — we need a file:// base.
  const [assetsBase, setAssetsBase] = useState('');

  useEffect(() => {
    if (window.electronAPI?.getCardAssetsBase) {
      window.electronAPI.getCardAssetsBase().then(setAssetsBase).catch(() => {});
    }
  }, []);

  /** Resolve a root-relative asset path to a usable URL in both web and Electron. */
  function resolveUrl(assetPath: string): string {
    if (!assetsBase) return assetPath;
    return assetsBase + assetPath;
  }

  function cardUrl(packId: string, color: string) {
    return resolveUrl(`/cards/skins/${packId}/${color}.svg`);
  }

  function toggleExpand(packId: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(packId)) next.delete(packId);
      else next.add(packId);
      return next;
    });
  }

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

  // Only show non-default packs
  const visiblePacks = shop?.packs.filter(p => p.id !== 'default') ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Fixed header bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '1.1rem 1.5rem 0.9rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
          ← Back
        </button>
        <div>
          <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.3rem' }}>Skin Shop</h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.78rem' }}>Cosmetic card packs — purely visual. Equip from your profile.</p>
        </div>
        {!auth.profile && (
          <span style={{ marginLeft: 'auto', color: 'var(--muted2)', fontSize: '0.8rem' }}>
            Sign in to unlock
          </span>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          background: 'var(--surface)', borderBottom: '1px solid var(--accent)',
          padding: '0.55rem 1rem', color: 'var(--accent)', fontSize: '0.88rem',
          textAlign: 'center', flexShrink: 0,
        }}>
          {toast}
        </div>
      )}

      {/* ── Scrollable pack grid (2 columns) ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, alignItems: 'start' }}>

        {/* Error */}
        {loadErr && (
          <div style={{ color: '#e74c3c', textAlign: 'center', paddingTop: '2rem' }}>
            {loadErr}
            <button onClick={fetchShop} style={{ marginLeft: 8, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )}

        {!shop && !loadErr && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: '4rem' }}>Loading…</p>
        )}

        {shop && visiblePacks.map(pack => {
          const isOwned    = ownedIds.includes(pack.id);
          const isLoading  = busy === pack.id;
          const isExpanded = expanded.has(pack.id);

          return (
            <div
              key={pack.id}
              style={{
                background: 'var(--surface)',
                border: isOwned ? '1px solid rgba(99,102,241,0.55)' : '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: isOwned ? '0 0 12px rgba(99,102,241,0.12)' : 'none',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {/* ── Preview image ── */}
              <div style={{ height: 110, position: 'relative', overflow: 'hidden', background: 'var(--bg)', flexShrink: 0 }}>
                <img
                  src={resolveUrl(pack.preview_url)}
                  alt={pack.name}
                  style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.15'; }}
                />
                {isOwned && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(99,102,241,0.88)', color: '#fff',
                    borderRadius: 6, padding: '1px 7px', fontSize: '0.62rem', fontWeight: 700,
                  }}>
                    OWNED
                  </span>
                )}
              </div>

              {/* ── Info ── */}
              <div style={{ padding: '0.7rem 0.85rem', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>{pack.name}</span>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.74rem', lineHeight: 1.4 }}>{pack.description}</p>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 'auto', paddingTop: 4 }}>
                  {isOwned ? (
                    <span style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600 }}>✓ Owned</span>
                  ) : (
                    <button
                      onClick={() => handleBuy(pack)}
                      disabled={isLoading || !auth.token}
                      className="btn-primary"
                      style={{ padding: '0.28rem 0.75rem', fontSize: '0.78rem' }}
                      title={!auth.token ? 'Sign in to unlock packs' : undefined}
                    >
                      {isLoading ? '…' : `Unlock — ${formatPrice(pack.price_cents)}`}
                    </button>
                  )}

                  <button
                    onClick={() => toggleExpand(pack.id)}
                    style={{
                      marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '0.22rem 0.55rem',
                      color: 'var(--muted)', fontSize: '0.74rem', cursor: 'pointer',
                    }}
                  >
                    Cards {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* ── Expandable card strip ── */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '0.7rem 0.85rem',
                  display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
                  background: 'var(--bg)',
                }}>
                  {CARD_COLORS.map(color => (
                    <div key={color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <img
                        src={cardUrl(pack.id, color)}
                        alt={color}
                        style={{
                          width: 44, height: 62, borderRadius: 5,
                          objectFit: 'cover',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                        }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
                      />
                      <span style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{color}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
