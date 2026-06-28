import { C, FONT, MONO } from '../tokens';
import { useApp } from '../context';
import { useAuth } from '../auth';

const NAV = [
  { id: 1,  label: 'Workspace',      icon: '⌂',  group: null               },
  { id: 2,  label: 'Data sources',   icon: '⬡',  group: '0 · Governance'   },
  { id: 3,  label: 'Governance run', icon: '◎',  group: null               },
  { id: 4,  label: 'Table health',   icon: '✦',  group: null               },
  { id: 5,  label: 'Semantic layer', icon: '◈',  group: '1 · Semantic'     },
  { id: 6,  label: 'Analysis',       icon: '⬥',  group: '2 · Analysis'     },
  { id: 7,  label: 'Spec review',    icon: '◇',  group: null               },
  { id: 8,  label: 'Pipeline',       icon: '▶',  group: '3–5 · Pipeline'   },
  { id: 9,  label: 'Dashboard ★',    icon: '✦',  group: '6 · Artifact'     },
  { id: 10, label: 'All artifacts',  icon: '⊞',  group: '7 · Workspace'    },
];

export default function Sidebar() {
  const { screen, nav } = useApp();
  const { user, logout } = useAuth();
  let lastGroup = null;

  return (
    <div style={{
      width: 212, flexShrink: 0, background: C.sidebar,
      display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${C.sidebarBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: C.primary, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700, fontFamily: FONT }}>A</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: FONT, letterSpacing: '-0.3px' }}>AnalytIQ</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: MONO }}>v1.0.0-mvp</div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: '8px 8px', flex: 1 }}>
        {NAV.map(item => {
          const showGroup = item.group && item.group !== lastGroup;
          if (item.group) lastGroup = item.group;
          const active = screen === item.id;
          return (
            <div key={item.id}>
              {showGroup && (
                <div style={{ padding: '10px 8px 3px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.24)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Stage {item.group}
                </div>
              )}
              <button onClick={() => nav(item.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(45,91,208,0.22)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.54)',
                fontFamily: FONT, fontSize: 13, fontWeight: active ? 500 : 400,
                textAlign: 'left', borderLeft: `2px solid ${active ? C.primary : 'transparent'}`,
                transition: 'all 0.1s',
              }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                {item.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.sidebarBorder}` }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
              {user.name}
            </div>
            <button onClick={logout} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              fontSize: 11, cursor: 'pointer', fontFamily: FONT, padding: '2px 0',
            }}>
              Sign out
            </button>
          </div>
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.24)', fontFamily: MONO }}>acme-corp / analytics</div>
      </div>
    </div>
  );
}
