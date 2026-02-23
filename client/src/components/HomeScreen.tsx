// Main menu screen: entry point of the app.
// Buttons navigate to Play, Settings, Rules, and Replays.
interface Props {
  onPlay: () => void;
  onSettings: () => void;
  onRules: () => void;
  onReplays: () => void;
}

const menuItems = [
  { label: '▶  Play',     sub: 'Single or multiplayer',   primary: true },
  { label: '📖  Rules',   sub: 'Learn how to play',        primary: false },
  { label: '▷  Replays', sub: 'Watch past games',          primary: false },
  { label: '⚙  Settings', sub: 'Customize your experience', primary: false },
] as const;

export function HomeScreen({ onPlay, onSettings, onRules, onReplays }: Props) {
  const handlers = [onPlay, onRules, onReplays, onSettings];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 48, padding: '2rem',
    }}>
      {/* ── Title block ── */}
      <div style={{ textAlign: 'center', userSelect: 'none' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <h1 style={{
            margin: 0, fontSize: '5.5rem', fontWeight: 900,
            letterSpacing: '0.22em', lineHeight: 1,
            color: 'var(--accent)',
            textShadow: '0 0 60px rgba(129,140,248,0.45), 0 0 120px rgba(99,102,241,0.2)',
          }}>
            LANDS
          </h1>
          {/* subtle underline glow */}
          <div style={{
            position: 'absolute', bottom: -8, left: '10%', right: '10%', height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)',
            borderRadius: 2,
          }} />
        </div>
        <p style={{
          margin: '1.2rem 0 0', color: 'var(--muted2)', fontSize: '0.88rem',
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          A 2-Player Land Card Duel
        </p>
      </div>

      {/* ── Menu ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 240, width: '100%', maxWidth: 320 }}>
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={handlers[i]}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1.25rem', borderRadius: 10, cursor: 'pointer',
              border: item.primary
                ? '1px solid rgba(99,102,241,0.6)'
                : '1px solid var(--border)',
              background: item.primary
                ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(129,140,248,0.1))'
                : 'var(--surface)',
              color: item.primary ? '#c7d2fe' : 'var(--foreground)',
              boxShadow: item.primary
                ? '0 0 18px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.04)'
                : 'inset 0 1px 0 rgba(255,255,255,0.03)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              fontSize: '0.95rem', fontWeight: item.primary ? 700 : 500,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = item.primary
                ? '0 4px 24px rgba(99,102,241,0.3)'
                : '0 4px 14px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = item.primary
                ? '0 0 18px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.04)'
                : 'inset 0 1px 0 rgba(255,255,255,0.03)';
            }}
          >
            <span>{item.label}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted3)', fontWeight: 400 }}>
              {item.sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

