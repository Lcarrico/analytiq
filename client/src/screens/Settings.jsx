// R36S3E2-US1 (program R30–R36) — the Settings area (`Settings.dc.html` /
// ch16): profile (rehomes the S11 identity card + the R10 platform-memory
// admin affordance, testids preserved), preferences (the app-wide
// technical-detail toggle — flips the R30S3 §5.6 admin blocks from
// role-gated to toggle-gated, default on for admins), API keys (hashed at
// rest, revealed once, revoke → 410), and the help center.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Btn, Card, PageHeader, Spinner, Toggle } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api, auth } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`,
               borderRadius: 10, padding: 16 };

const TABS = [
  ['Profile', '/app/settings/profile'],
  ['Preferences', '/app/settings/preferences'],
  ['API keys', '/app/settings/api-keys'],
  ['Help', '/app/settings/help'],
];

function SettingsTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <div data-testid="settings-tabs"
         style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {TABS.map(([name, to]) => {
        const on = pathname === to;
        return (
          <span key={to} data-testid={`st-tab-${name.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => navigate(to)}
                style={{ display: 'inline-flex', alignItems: 'center', height: 30,
                         padding: '0 13px', borderRadius: 999, cursor: 'pointer',
                         background: on ? P.ink : '#fff',
                         border: on ? 'none' : `1px solid ${P.borderStrong}`,
                         color: on ? '#fff' : P.itemInk, fontSize: 12.5,
                         fontWeight: on ? 600 : 500, fontFamily: FONT }}>
            {name}
          </span>
        );
      })}
    </div>
  );
}

function Crumb({ leaf }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
      workspace / settings / {leaf}
    </div>
  );
}

export function SettingsProfile() {
  const user = auth.user();
  const [memOpen, setMemOpen] = useState(false);
  const [memory, setMemory] = useState(null);
  useEffect(() => {
    if (memOpen && memory === null) {
      api.listMemory().then(r => setMemory(Array.isArray(r) ? r : r.entries || r.memories || []))
        .catch(() => setMemory([]));
    }
  }, [memOpen]);
  return (
    <div style={{ maxWidth: 720 }}>
      <Crumb leaf="profile" />
      <PageHeader title="Profile" sub="Workspace identity and what the platform remembers." />
      <SettingsTabs />
      <Card style={{ maxWidth: 520 }}>
        {user ? (
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar initials={(user.email || '?').slice(0, 2).toUpperCase()} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                {user.email}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginTop: 2 }}>
                role · {user.role || 'member'}
              </div>
            </div>
            <Btn variant="outline" size="sm" style={{ marginLeft: 'auto' }}
                 onClick={() => { auth.clear(); window.location.href = '/login'; }}>
              Sign out
            </Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 13, fontFamily: FONT, color: P.body }}>
              You are browsing the demo workspace. Sign in to a personal account:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login"><Btn size="sm">Log in</Btn></Link>
              <Link to="/register"><Btn size="sm" variant="outline">Create account</Btn></Link>
            </div>
          </div>
        )}
      </Card>
      <Card style={{ maxWidth: 520, marginTop: 14 }}>
        <div data-testid="memory-toggle" onClick={() => setMemOpen(o => !o)}
             style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em',
                      textTransform: 'uppercase', color: P.faint, cursor: 'pointer' }}>
          Platform memory · admin only {memOpen ? '−' : '+'}
        </div>
        {memOpen && (
          <div data-testid="memory-panel" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontFamily: FONT, color: P.muted, marginBottom: 8 }}>
              What the platform has learned about this workspace — a prior on
              future plans, never an override. PII-gated and deletable.
            </div>
            {memory == null ? null : memory.length === 0 ? (
              <span style={{ fontSize: 12, fontFamily: FONT, color: P.faint }}>
                Nothing remembered yet.
              </span>
            ) : memory.map(m => (
              <div key={m.id} data-testid={`memory-row-${m.id}`}
                   style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0',
                            borderBottom: `1px solid ${P.borderRow}` }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: P.body, minWidth: 0,
                               overflow: 'hidden', textOverflow: 'ellipsis',
                               whiteSpace: 'nowrap', flex: 1 }}>
                  {m.mem_key} → {m.value}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: P.faint }}>{m.agent}</span>
                <button data-testid="memory-delete" aria-label="Forget entry"
                        onClick={async () => {
                          await api.deleteMemory(m.id);
                          setMemory(list => list.filter(x => x.id !== m.id));
                        }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer',
                                 color: P.faint, fontSize: 13 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function SettingsPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { api.getPreferences().then(setPrefs).catch(() => setPrefs(false)); }, []);
  if (!prefs) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Spinner size={24} /></div>;
  }
  const save = async next => {
    setPrefs(next);
    try {
      await api.putPreferences(next);
      // the R30S3 admin blocks read this app-wide (flipped from role-gated
      // to toggle-gated here — R36S3E2)
      localStorage.setItem('aiq_tech_detail', next.technical_detail ? 'on' : 'off');
      window.dispatchEvent(new Event('aiq-prefs'));
      setMsg('Preferences saved.');
      setTimeout(() => setMsg(''), 3500);
    } catch { /* noop */ }
  };
  return (
    <div style={{ maxWidth: 720 }}>
      <Crumb leaf="preferences" />
      <PageHeader title="Preferences" sub="How the workspace reads — for you." />
      <SettingsTabs />
      {msg && (
        <div style={{ background: P.greenBg, color: P.green, borderRadius: 8,
                      padding: '8px 14px', fontSize: 12.5, fontWeight: 600,
                      fontFamily: FONT, marginBottom: 12 }}>
          {msg}
        </div>
      )}
      <div style={{ ...card, maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
              Show technical detail
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT, marginTop: 3 }}>
              Reveals the admin-only technical blocks (pipeline internals, cache
              state, run metadata) across the app. Off keeps every surface in
              plain language.
            </div>
          </div>
          <Toggle testid="pref-tech-detail" on={!!prefs.technical_detail}
                  onChange={v => save({ ...prefs, technical_detail: v })} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16,
                      paddingTop: 14, borderTop: `1px solid ${P.borderRow}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
              Density
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT, marginTop: 3 }}>
              Table and list spacing.
            </div>
          </div>
          <select data-testid="pref-density" value={prefs.density}
                  onChange={e => save({ ...prefs, density: e.target.value })}
                  style={{ height: 28, borderRadius: 7, fontSize: 12,
                           border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                           padding: '0 8px', background: '#fff' }}>
            <option value="comfortable">comfortable</option>
            <option value="compact">compact</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function SettingsKeys() {
  const [keys, setKeys] = useState(null);
  const [name, setName] = useState('');
  const [fresh, setFresh] = useState(null);
  const load = () => api.apiKeys().then(d => setKeys(d.keys)).catch(() => setKeys([]));
  useEffect(() => { load(); }, []);
  return (
    <div style={{ maxWidth: 720 }}>
      <Crumb leaf="api-keys" />
      <PageHeader title="API keys"
                  sub="Hashed at rest, shown exactly once, revocable — revoked keys answer 410." />
      <SettingsTabs />
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input data-testid="key-name" value={name} placeholder="key name, e.g. ci robot"
                 onChange={e => setName(e.target.value)}
                 style={{ flex: 1, height: 30, borderRadius: 7, padding: '0 10px',
                          fontSize: 12, border: `1px solid ${P.borderStrong}`,
                          fontFamily: FONT, outline: 'none' }} />
          <Btn data-testid="key-create" size="sm" disabled={!name.trim()}
               onClick={async () => {
                 try {
                   const r = await api.createApiKey(name.trim());
                   setFresh(r);
                   setName('');
                   load();
                 } catch { /* noop */ }
               }}>
            Create key
          </Btn>
        </div>
        {fresh && (
          <div data-testid="key-reveal"
               style={{ marginTop: 12, background: P.darkBg, color: P.darkText,
                        borderRadius: 8, padding: '10px 14px', fontFamily: MONO,
                        fontSize: 12 }}>
            {fresh.key}
            <div style={{ fontSize: 9.5, color: P.darkMuted, marginTop: 6 }}>
              copy it now — this is the only time the full key is shown
            </div>
          </div>
        )}
      </div>
      <div style={card}>
        <div style={{ ...label, marginBottom: 8 }}>KEYS</div>
        {(keys || []).map(k => (
          <div key={k.id} data-testid={`key-row-${k.id}`}
               style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
              {k.name}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: P.body }}>
              {k.prefix}••••••••
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
              created {String(k.created_at).slice(0, 10)}
            </span>
            {k.revoked_at ? (
              <span data-testid="key-revoked"
                    style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9.5,
                             fontWeight: 700, color: P.red }}>
                REVOKED
              </span>
            ) : (
              <Btn data-testid="key-revoke" size="sm" variant="outline"
                   style={{ marginLeft: 'auto' }}
                   onClick={async () => { await api.revokeApiKey(k.id); load(); }}>
                Revoke
              </Btn>
            )}
          </div>
        ))}
        {keys && keys.length === 0 && (
          <div style={{ padding: 10, fontSize: 12, color: P.muted, fontFamily: FONT }}>
            No API keys yet.
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsHelp() {
  const items = [
    ['Documentation', 'Guides for connecting data, governance, and building artifacts.',
     'https://docs.analytiq.example'],
    ['Contact support', 'Email the team — we answer within one business day.',
     'mailto:support@analytiq.example'],
    ['Platform status', 'The 8 local services and their health, live.',
     '/app/admin/platform'],
    ['Keyboard shortcuts', '⌘K search · g then a for artifacts · ? for this list', null],
  ];
  return (
    <div style={{ maxWidth: 720 }}>
      <Crumb leaf="help" />
      <PageHeader title="Help" sub="Docs, support, and where to look when something is off." />
      <SettingsTabs />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map(([name, sub, href]) => (
          <div key={name} data-testid={`help-${name.toLowerCase().split(' ')[0]}`}
               style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
              {name}
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT,
                          margin: '5px 0 10px', lineHeight: 1.5 }}>
              {sub}
            </div>
            {href && (href.startsWith('/') ? (
              <Link to={href} style={{ fontSize: 11.5, fontWeight: 600,
                                       color: P.accentHover, textDecoration: 'none',
                                       fontFamily: FONT }}>
                Open →
              </Link>
            ) : (
              <a href={href} target={href.startsWith('http') ? '_blank' : undefined}
                 rel="noreferrer"
                 style={{ fontSize: 11.5, fontWeight: 600, color: P.accentHover,
                          textDecoration: 'none', fontFamily: FONT }}>
                Open →
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
