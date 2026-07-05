// R15S1E2: PRD v3 app shell — 240px light sidebar (collapsible to 64px
// rail), 64px top bar (workspace chip, global search overlay, bell, help,
// avatar), breadcrumbs. Tokens per docs/specs/PLAN.md design language.
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { api, auth } from '../api';
import { useRole } from './roles';
import { FONT, MONO } from '../tokens';
import { Icon, Logo } from './icons';   // R21S1E3 / R21S2E1

const T = {
  sidebarBg: '#fbfcfe', border: '#e4e8ef', ink: '#0f172a', body: '#334155',
  muted: '#64748b', faint: '#94a3b8', accent: '#2563eb', accentSoft: '#e8effc',
  accentInk: '#1d4ed8', item: '#47516b',
};

// R21S2E1 — group structure per App Home.dc.html #home: top ungrouped ·
// DATA · INTELLIGENCE · flex spacer · bottom border-top group + Collapse.
export const NAV_GROUPS = [
  { label: null, items: [
    { label: 'Home', icon: 'Home', to: '/app' },
    { label: 'Create', icon: 'Create', to: '/app/create' },
    { label: 'Artifacts', icon: 'Artifacts', to: '/app/artifacts' },
  ]},
  { label: 'DATA', items: [
    { label: 'Data', icon: 'Data', to: '/app/data/sources' },
    { label: 'Semantic Layer', icon: 'Semantic', to: '/app/semantic' },
    { label: 'Gold Tables', icon: 'Gold', to: '/app/gold' },
  ]},
  { label: 'INTELLIGENCE', items: [
    { label: 'Models', icon: 'Models', to: '/app/models' },
    { label: 'Alerts', icon: 'Alerts', to: '/app/alerts' },
    { label: 'Governance', icon: 'Governance', to: '/app/governance' },
  ]},
];
export const NAV_BOTTOM = [
  { label: 'Team', icon: 'Team', to: '/app/team' },
  { label: 'Admin', icon: 'Admin', to: '/app/admin/platform' },
  { label: 'Billing', icon: 'Billing', to: '/app/billing' },
  { label: 'Settings', icon: 'Settings', to: '/app/settings/profile' },
];

function LogoRow({ collapsed }) {
  return (
    <div data-testid="sidebar-logo-row"
         style={{ height: 64, display: 'flex', alignItems: 'center',
                  padding: collapsed ? '0 0 0 21px' : '0 20px', flexShrink: 0,
                  borderBottom: '1px solid #eef1f5' }}>
      <Logo size={22} withWordmark={!collapsed} />
    </div>
  );
}

function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const navigate = useNavigate();
  const box = useRef(null);
  useEffect(() => { box.current?.focus(); }, []);
  useEffect(() => {   // PAR-2: overlays dismiss on Escape
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    const t = setTimeout(() => {
      api.search(q).then(r => setHits(Array.isArray(r) ? r : [])).catch(() => setHits([]));
    }, 120);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div data-testid="search-overlay" onClick={onClose}
         style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', zIndex: 60,
                  display: 'flex', justifyContent: 'center', paddingTop: 96 }}>
      <div onClick={e => e.stopPropagation()}
           style={{ width: 640, maxHeight: 420, background: '#fff', borderRadius: 12,
                    border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(15,23,42,.18)',
                    overflow: 'hidden', height: 'fit-content' }}>
        <input ref={box} value={q} onChange={e => setQ(e.target.value)}
               placeholder="Search artifacts, metrics, sources…"
               style={{ width: '100%', border: 'none', outline: 'none', padding: '14px 18px',
                        fontSize: 14, fontFamily: FONT, borderBottom: `1px solid ${T.border}` }} />
        <div style={{ overflowY: 'auto', maxHeight: 360 }}>
          {hits.map(h => (
            <div key={h.artifact_id || h.id}
                 onClick={() => { onClose(); navigate('/app/artifacts'); }}
                 style={{ padding: '10px 18px', cursor: 'pointer', fontSize: 13,
                          fontFamily: FONT, color: T.body, borderBottom: '1px solid #eef1f5' }}>
              <span style={{ fontWeight: 600, color: T.ink }}>{h.title}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: T.faint, marginLeft: 8 }}>
                ARTIFACT
              </span>
            </div>
          ))}
          {q.trim() && hits.length === 0 && (
            <div style={{ padding: '14px 18px', fontSize: 12, color: T.muted, fontFamily: FONT }}>
              No matches
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// R21S2E4 — notifications drawer per App Home.dc.html #notifications.
const NOTIF_TILES = {
  alert:     { bg: '#fdeaea', fg: '#dc2626', icon: 'Alerts' },
  mention:   { bg: '#f3eefe', fg: '#7c3aed', icon: 'Team' },
  freshness: { bg: '#fdf3e3', fg: '#b45309', icon: 'Warning' },
  build:     { bg: '#eff4ff', fg: '#1d4ed8', icon: 'Create' },
  success:   { bg: '#e8f5ec', fg: '#15803d', icon: 'Check' },
  default:   { bg: '#f1f5f9', fg: '#64748b', icon: 'Info' },
};

function dayGroup(iso) {
  if (!iso) return 'EARLIER';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  const now = new Date();
  const day = 864e5;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= startToday) return 'TODAY';
  if (d >= new Date(startToday - day)) return 'YESTERDAY';
  return 'EARLIER';
}

function NotificationsDrawer({ notifs, onClose, onReadAll }) {
  const [tab, setTab] = useState('All');
  const rows = notifs.notifications.filter(n =>
    tab === 'All' ? true : tab === 'Mentions' ? n.kind === 'mention' : !n.read);
  const groups = ['TODAY', 'YESTERDAY', 'EARLIER']
    .map(g => [g, rows.filter(n => dayGroup(n.created_at) === g)])
    .filter(([, list]) => list.length);
  const chip = (label, text) => (
    <button key={label} onClick={() => setTab(label)}
            style={{ height: 24, padding: '0 10px', borderRadius: 999, cursor: 'pointer',
                     border: `1px solid ${tab === label ? '#c7d9f8' : T.border}`,
                     background: tab === label ? '#eff4ff' : '#fff',
                     color: tab === label ? T.accentInk : T.item,
                     fontSize: 11.5, fontWeight: tab === label ? 600 : 500, fontFamily: FONT }}>
      {text}
    </button>
  );
  return (
    <div onClick={onClose}
         style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.28)', zIndex: 65 }}>
      <div data-testid="notifications-drawer" onClick={e => e.stopPropagation()}
           style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 420,
                    background: '#fff', boxShadow: '-16px 0 48px rgba(15,23,42,.18)',
                    display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '15px 18px', borderBottom: '1px solid #eef1f5' }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, fontFamily: FONT, color: T.ink }}>
            Notifications
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
            <button data-testid="mark-all-read" onClick={onReadAll}
                    style={{ border: 'none', background: 'none', cursor: 'pointer',
                             color: T.accent, fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
              Mark all read
            </button>
            <button onClick={onClose} aria-label="Close"
                    style={{ border: 'none', background: 'none', cursor: 'pointer',
                             fontSize: 15, color: T.muted, lineHeight: 1 }}>✕</button>
          </span>
        </div>
        <div data-testid="notif-tabs"
             style={{ display: 'flex', gap: 6, padding: '10px 18px',
                      borderBottom: '1px solid #eef1f5' }}>
          {chip('All', 'All')}
          {chip('Unread', `Unread · ${notifs.unread}`)}
          {chip('Mentions', 'Mentions')}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rows.length === 0 && (
            <div style={{ padding: 18, fontSize: 12, color: T.muted, fontFamily: FONT }}>
              Nothing yet
            </div>
          )}
          {groups.map(([g, list]) => (
            <div key={g}>
              <div data-testid="notif-group-label"
                   style={{ padding: '12px 18px 5px', fontSize: 9.5, fontWeight: 600,
                            fontFamily: MONO, letterSpacing: '.1em',
                            textTransform: 'uppercase', color: T.faint }}>{g}</div>
              {list.map(n => {
                const tile = NOTIF_TILES[n.kind] || NOTIF_TILES.default;
                const time = (n.created_at || '').slice(11, 16);
                return (
                  <div key={n.id} data-testid="notif-row" data-kind={n.kind}
                       style={{ display: 'flex', gap: 11, alignItems: 'flex-start',
                                padding: '11px 18px 11px 16px',
                                borderBottom: '1px solid #f3f5f9',
                                borderLeft: n.read ? '2px solid transparent' : `2px solid ${T.accent}`,
                                background: n.read ? 'transparent' : '#f8faff' }}>
                    <span data-testid="notif-icon-tile"
                          style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                   background: tile.bg, color: tile.fg, display: 'inline-flex',
                                   alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={tile.icon} size={13} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontFamily: FONT,
                                     color: T.ink, fontWeight: n.read ? 400 : 600,
                                     overflow: 'hidden', textOverflow: 'ellipsis',
                                     whiteSpace: 'nowrap' }}>{n.message}</span>
                      <span style={{ display: 'block', fontSize: 11, fontFamily: FONT,
                                     color: T.muted, marginTop: 2, textTransform: 'capitalize' }}>
                        {n.kind}
                      </span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: T.faint }}>{time}</span>
                      {!n.read && (
                        <span data-testid="notif-unread-dot"
                              style={{ width: 7, height: 7, borderRadius: 4,
                                       background: T.accent }} />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: '11px 18px', borderTop: '1px solid #eef1f5' }}>
          <a data-testid="drawer-activity-link" href="/app/activity"
             style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', fontFamily: FONT }}>
            View all activity →
          </a>
        </div>
      </div>
    </div>
  );
}

const ADMIN_AREA_LABELS = ['Admin', 'Billing', 'Governance'];

function SideItem({ item, collapsed }) {
  const role = useRole();
  if (role !== 'admin' && ADMIN_AREA_LABELS.includes(item.label)) return null;
  return (
    <NavLink to={item.to} end={item.to === '/app'} title={item.label} aria-label={item.label}
             style={({ isActive }) => ({
               display: 'flex', alignItems: 'center', gap: 10,
               height: 32, padding: '0 10px', borderRadius: 6,
               fontSize: 13, fontWeight: isActive ? 600 : 500, fontFamily: FONT,
               color: isActive ? T.accentInk : T.item,
               background: isActive ? T.accentSoft : 'transparent',
               justifyContent: collapsed ? 'center' : 'flex-start',
             })}>
      <Icon name={item.icon} size={15} />
      {!collapsed && item.label}
    </NavLink>
  );
}

export default function Shell({ children }) {
  const role = useRole();
  const [collapsed, setCollapsed] = useState(false);
  // R30S2E1: the workbench keeps the icon-only rail (approved deviation,
  // Reconciliation (e)) and swaps the workspace topbar for its own session
  // topbar — Shell renders rail-only chrome on /app/create/* routes.
  const isWorkbench = useLocation().pathname.startsWith('/app/create');
  const railOnly = collapsed || isWorkbench;
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState({ unread: 0, notifications: [] });   // R18S1E1
  const [bellOpen, setBellOpen] = useState(false);
  const loadNotifs = () => api.notifications().then(setNotifs).catch(() => {});
  useEffect(() => { loadNotifs(); }, []);   // PAR-2: promise must not be returned as cleanup
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = auth.user();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f8fa' }}>
      <aside data-testid="app-sidebar"
             style={{ width: railOnly ? 64 : 240, flexShrink: 0, background: T.sidebarBg,
                      borderRight: `1px solid ${T.border}`, display: 'flex',
                      flexDirection: 'column', transition: 'width .15s' }}>
        <LogoRow collapsed={railOnly} />
        {/* R21S2E1 — frame group anatomy: labeled navs, spacer, bottom group */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {NAV_GROUPS.map((g, gi) => (
            <div key={g.label || 'top'}>
              {g.label && !railOnly && (
                <div data-testid="nav-group-label"
                     style={{ padding: '12px 22px 4px 22px', fontSize: 9.5, fontWeight: 600,
                              fontFamily: MONO, textTransform: 'uppercase',
                              letterSpacing: '.12em', color: T.faint }}>{g.label}</div>
              )}
              <nav style={{ padding: gi === 0 ? '14px 12px 8px 12px' : '4px 12px',
                            display: 'flex', flexDirection: 'column', gap: 2 }}>
                {g.items.map(item => <SideItem key={item.to} item={item} collapsed={railOnly} />)}
              </nav>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div data-testid="nav-bottom-group"
               style={{ borderTop: '1px solid #eef1f5', padding: '8px 12px 4px',
                        display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_BOTTOM.map(item => <SideItem key={item.to} item={item} collapsed={railOnly} />)}
            {!isWorkbench && (
            <div data-testid="sidebar-collapse" onClick={() => setCollapsed(!collapsed)}
                 role="button" aria-label="Collapse sidebar"
                 style={{ display: 'flex', alignItems: 'center', gap: 10, height: 32,
                          padding: '0 10px', margin: '4px 0 8px', borderRadius: 6,
                          fontSize: 12, color: T.faint, fontFamily: FONT, cursor: 'pointer',
                          justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <Icon name="Collapse" size={14}
                    style={collapsed ? { transform: 'rotate(180deg)' } : undefined} />
              {!railOnly && 'Collapse'}
            </div>
            )}
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!isWorkbench && (
        <header data-testid="topbar"
                style={{ height: 64, flexShrink: 0, background: '#fff',
                         borderBottom: `1px solid ${T.border}`, display: 'flex',
                         alignItems: 'center', gap: 16, padding: '0 28px' }}>
          {/* R21S2E2 — workspace switcher chip per frame */}
          <button data-testid="workspace-chip"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36,
                           padding: '0 11px', border: `1px solid ${T.border}`, borderRadius: 8,
                           background: '#fff', cursor: 'pointer' }}>
            <span data-testid="workspace-mark"
                  style={{ width: 20, height: 20, borderRadius: 5, background: '#7c3aed',
                           color: '#fff', fontFamily: FONT, fontSize: 9.5, fontWeight: 700,
                           display: 'inline-flex', alignItems: 'center',
                           justifyContent: 'center', flexShrink: 0 }}>AR</span>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: T.ink }}>
              Acme Retail
            </span>
            <Icon name="Caret" size={12} style={{ color: '#94a3b8' }} />
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <button data-testid="global-search" onClick={() => setSearchOpen(true)}
                    style={{ width: 520, maxWidth: '46vw', height: 36, borderRadius: 999,
                             border: `1px solid ${T.border}`, background: '#f7f8fa',
                             color: T.faint, fontSize: 13, fontFamily: FONT,
                             display: 'inline-flex', alignItems: 'center', gap: 9,
                             padding: '0 7px 0 14px', cursor: 'pointer' }}>
              <Icon name="Search" size={13} style={{ color: '#94a3b8' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>Search artifacts, metrics, sources…</span>
              <span data-testid="search-keycap"
                    style={{ fontFamily: MONO, fontSize: 10, color: T.muted, background: '#fff',
                             border: `1px solid ${T.border}`, borderRadius: 6,
                             padding: '3px 6px', lineHeight: 1 }}>⌘K</span>
            </button>
          </div>
          <div title="Notifications" data-testid="bell"
               onClick={() => { setBellOpen(true); loadNotifs(); }}
               style={{ position: 'relative', width: 34, height: 34, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: T.item, cursor: 'pointer' }}>
            <Icon name="Bell" size={17} />
            {/* R31S2E2 (PRD ch10): badge unmounts at zero — r15s1/r18s1 migrated */}
            {notifs.unread > 0 && (
          <span data-testid="bell-count"
                  style={{ position: 'absolute', top: 3, right: 3, minWidth: 15,
                           height: 15, borderRadius: 999, background: '#dc2626', color: '#fff',
                           fontSize: 9, fontWeight: 600, fontFamily: MONO, display: 'flex',
                           alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                           boxShadow: '0 0 0 2px #fff' }}>{notifs.unread}</span>
            )}
          </div>
          <a title="Help" data-testid="help-btn" href="/app/help"
             style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13.5, fontWeight: 600, color: T.item, background: '#fff' }}>?</a>
          <div style={{ position: 'relative' }}>
            <button data-testid="avatar-menu" onClick={() => setMenuOpen(!menuOpen)}
                    style={{ width: 34, height: 34, borderRadius: '50%', border: 'none',
                             background: '#0e7490', color: '#fff', fontWeight: 700,
                             fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
              {(() => {   // R21S2E2 — 2-letter initials; demo cast default DK
                const e = user?.email || '';
                return e ? e.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase() || 'DK' : 'DK';
              })()}
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 38, background: '#fff',
                            border: `1px solid ${T.border}`, borderRadius: 10, minWidth: 180,
                            boxShadow: '0 8px 24px rgba(15,23,42,.12)', zIndex: 50, padding: 6 }}>
                <div style={{ padding: '7px 10px', fontSize: 12, color: T.muted, fontFamily: FONT }}>
                  {user?.email || 'dev admin'}
                </div>
                <button onClick={() => { auth.clear(); setMenuOpen(false); navigate('/app/settings/profile'); }}
                        style={{ width: '100%', textAlign: 'left', padding: '7px 10px',
                                 border: 'none', background: 'none', cursor: 'pointer',
                                 fontSize: 13, fontFamily: FONT, color: T.body, borderRadius: 6 }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        )}

        {/* R21S2E3 — crumb belongs to PageHeader now (frame pattern) */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      {bellOpen && (
        <NotificationsDrawer notifs={notifs} onClose={() => setBellOpen(false)}
                             onReadAll={async () => { await api.readAllNotifications(); loadNotifs(); }} />
      )}
    </div>
  );
}
