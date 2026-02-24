// ─────────────────────────────────────────────────────────────────────────────
// client/src/components/ProfileScreen.tsx — player stats & ELO display
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { UserProfile } from '@lands/shared';
import { AuthState } from '../hooks/useAuth';

interface Props {
  auth: AuthState;
  serverUrl: string;
  onBack: () => void;
  onLogout: () => void;
  onShop: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '0.9rem 1rem', minWidth: 90,
    }}>
      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{value}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  );
}

export function ProfileScreen({ auth, serverUrl, onBack, onLogout, onShop, onProfileUpdated }: Props) {
  const { profile } = auth;
  const [equipBusy, setEquipBusy] = useState<string | null>(null);
  const [equipMsg, setEquipMsg]   = useState('');

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

  const totalGames = profile ? profile.wins + profile.losses + profile.draws : 0;
  const winRate = totalGames > 0 ? Math.round((profile!.wins / totalGames) * 100) : 0;

  // ELO tier badge
  function eloTier(elo: number): { label: string; color: string } {
    if (elo >= 2000) return { label: 'Master',   color: '#f39c12' };
    if (elo >= 1600) return { label: 'Diamond',  color: '#9b59b6' };
    if (elo >= 1300) return { label: 'Platinum', color: '#27ae60' };
    if (elo >= 1100) return { label: 'Gold',     color: '#f1c40f' };
    if (elo >= 900)  return { label: 'Silver',   color: '#95a5a6' };
    return                   { label: 'Bronze',  color: '#cd7f32' };
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'flex-start', height: '100%', padding: '2rem 1.5rem',
    overflowY: 'auto', gap: 24,
  };

  if (!profile) {
    return (
      <div style={containerStyle}>
        <p style={{ color: 'var(--muted)' }}>Loading profile…</p>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.5rem 1.5rem' }}>← Back</button>
      </div>
    );
  }

  const tier = eloTier(profile.elo);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(129,140,248,0.2))',
          border: '2px solid rgba(99,102,241,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', fontSize: '2rem',
        }}>
          🧙
        </div>
        <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--foreground)' }}>{profile.username}</h2>
        <span style={{
          display: 'inline-block', marginTop: 6,
          background: `${tier.color}22`, border: `1px solid ${tier.color}88`,
          color: tier.color, borderRadius: 20, padding: '2px 12px',
          fontSize: '0.82rem', fontWeight: 700,
        }}>
          {tier.label}
        </span>
      </div>

      {/* ELO */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>
          {profile.elo}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ELO Rating
        </div>
      </div>

      {/* Core stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <StatBox label="Wins"   value={profile.wins} />
        <StatBox label="Losses" value={profile.losses} />
        <StatBox label="Draws"  value={profile.draws} />
        <StatBox label="Win Rate" value={`${winRate}%`} />
      </div>

      {/* Streak */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <StatBox label="Current Streak" value={profile.win_streak > 0 ? `🔥 ${profile.win_streak}` : profile.win_streak} />
        <StatBox label="Best Streak"    value={profile.best_win_streak} />
        <StatBox label="Total Games"    value={totalGames} />
      </div>

      {/* Win conditions */}
      {(profile.wins_five_kind > 0 || profile.wins_rainbow > 0) && (
        <div style={{
          width: '100%', maxWidth: 360,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '1rem 1.25rem',
        }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Win Conditions
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {profile.wins_five_kind > 0 && (
              <div style={{ color: 'var(--foreground)', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{profile.wins_five_kind}</span>
                <span style={{ color: 'var(--muted)', marginLeft: 4 }}>× Five-of-a-Kind</span>
              </div>
            )}
            {profile.wins_rainbow > 0 && (
              <div style={{ color: 'var(--foreground)', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{profile.wins_rainbow}</span>
                <span style={{ color: 'var(--muted)', marginLeft: 4 }}>× Rainbow</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member since */}
      <p style={{ margin: 0, color: 'var(--muted2)', fontSize: '0.78rem' }}>
        Member since {new Date(profile.created_at).toLocaleDateString()}
      </p>

      {/* Skin Packs */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Card Skin</span>
          <button
            onClick={onShop}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
          >
            Browse Shop →
          </button>
        </div>
        {equipMsg && <p style={{ margin: '0 0 8px', color: 'var(--accent)', fontSize: '0.82rem' }}>{equipMsg}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Always show Classic */}
          {['default', ...(profile.owned_pack_ids ?? [])].filter((v, i, a) => a.indexOf(v) === i).map(packId => {
            const isActive = (profile.active_pack_id ?? 'default') === packId;
            return (
              <button
                key={packId}
                onClick={() => handleEquip(packId)}
                disabled={isActive || equipBusy === packId}
                style={{
                  padding: '0.35rem 0.9rem', borderRadius: 20, fontSize: '0.82rem',
                  border: isActive ? '1px solid rgba(99,102,241,0.7)' : '1px solid var(--border)',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'var(--bg)',
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                  cursor: isActive ? 'default' : 'pointer',
                  fontWeight: isActive ? 700 : 400,
                  opacity: equipBusy && equipBusy !== packId ? 0.5 : 1,
                }}
              >
                {equipBusy === packId ? '…' : packId === 'default' ? '✦ Classic' : packId}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '0.65rem' }}>
          ← Back
        </button>
        <button
          onClick={onLogout}
          style={{
            background: 'none', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8,
            color: '#e74c3c', padding: '0.55rem', fontSize: '0.9rem', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(231,76,60,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
