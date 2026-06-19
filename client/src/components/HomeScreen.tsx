// Main menu screen — mobile-first layout.
interface Props {
  onPlay: () => void;
  onSettings: () => void;
  onRules: () => void;
  onReplays: () => void;
  onProfile: () => void;
  onShop: () => void;
  username: string | null;
}

const menuItems = [
  { label: 'Play',     sub: 'Single or multiplayer',     primary: true  },
  { label: 'Rules',    sub: 'Learn how to play',         primary: false },
  { label: 'Replays',  sub: 'Watch past games',          primary: false },
  { label: 'Settings', sub: 'Customize your experience', primary: false },
] as const;

export function HomeScreen({ onPlay, onSettings, onRules, onReplays, onProfile, onShop, username }: Props) {
  const handlers = [onPlay, onRules, onReplays, onSettings];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 0.6rem)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)',
      paddingLeft: '1.1rem', paddingRight: '1.1rem',
    }}>

      {/* ── 1. Top bar: Shop + Profile ── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 8,
        flexShrink: 0, paddingBottom: '0.4rem',
      }}>
        <button
          onClick={onShop}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 22, padding: '0.45rem 1rem',
            color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 500,
            minHeight: 40,
          }}
        >
          Shop
        </button>
        <button
          onClick={onProfile}
          style={{
            background: 'var(--surface)',
            border: `1px solid ${username ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 22, padding: '0.45rem 1rem',
            color: username ? 'var(--accent)' : 'var(--muted)',
            fontSize: '0.85rem', fontWeight: username ? 700 : 400,
            minHeight: 40,
          }}
        >
          {username ?? 'Sign In'}
        </button>
      </div>

      {/* ── 2. Title — fills remaining middle space ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', paddingBottom: '0.5rem',
      }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(3rem, 14vw, 5rem)',
            fontWeight: 900, letterSpacing: '0.22em', lineHeight: 1,
            color: 'var(--accent)',
            textShadow: '0 0 60px rgba(129,140,248,0.45), 0 0 120px rgba(99,102,241,0.2)',
          }}>
            LANDS
          </h1>
          <div style={{
            position: 'absolute', bottom: -8, left: '10%', right: '10%', height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)',
            borderRadius: 2,
          }} />
        </div>
        <p style={{
          margin: '1rem 0 0', color: 'var(--muted)', fontSize: '0.8rem',
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          A 2-Player Land Card Duel
        </p>
      </div>

      {/* ── 3. Menu buttons — anchored to bottom ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flexShrink: 0 }}>
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={handlers[i]}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1.1rem', borderRadius: 12, minHeight: 54,
              border: item.primary
                ? '1px solid rgba(99,102,241,0.6)'
                : '1px solid var(--border)',
              background: item.primary
                ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(129,140,248,0.1))'
                : 'var(--surface)',
              color: item.primary ? '#c7d2fe' : 'var(--text)',
              boxShadow: item.primary ? '0 0 18px rgba(99,102,241,0.18)' : 'none',
              fontSize: '0.95rem', fontWeight: item.primary ? 700 : 500,
              touchAction: 'manipulation',
            }}
          >
            <span>{item.label}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400 }}>
              {item.sub}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}
