// R36S2E3-US1 (program R30–R36) — SSO settings + workspace branding
// (`Admin.dc.html` frames 03–04, admin). SSO persists through the settings
// kv DEP (domains auto-verify in the local stack — noted), Test login runs
// a real (simulated-stack) validation, both audited. Branding rides the
// live branding API and previews in place.
import { useEffect, useState } from 'react';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const input = { width: '100%', height: 32, boxSizing: 'border-box', borderRadius: 7,
                border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                fontSize: 12, fontFamily: MONO, outline: 'none', marginBottom: 11 };

export function AdminSso() {
  const role = useRole();
  const [s, setS] = useState(null);
  const [form, setForm] = useState(null);
  const [testMsg, setTestMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => api.getSso().then(d => { setS(d); setForm({
    provider: d.provider || 'saml', sso_url: d.sso_url || '',
    entity_id: d.entity_id || '',
    domain: (d.domains[0] || {}).domain || '', enforced: d.enforced });
  }).catch(() => setS(false));
  useEffect(() => { load(); }, []);

  if (role !== 'admin') return <Forbidden />;
  if (!s || !form) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const save = async () => {
    setErr('');
    try {
      await api.putSso({ provider: form.provider, sso_url: form.sso_url,
        entity_id: form.entity_id, domains: form.domain ? [form.domain] : [],
        default_role: 'analyst', session_hours: 8, enforced: form.enforced });
      load();
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <PageHeader title="Single sign-on"
                    sub="SAML 2.0 or OIDC — enforced for every member once a domain verifies." />
        <span data-testid="sso-status"
              style={{ marginLeft: 'auto', marginTop: -26, display: 'inline-flex',
                       alignItems: 'center', gap: 5, height: 22, padding: '0 11px',
                       borderRadius: 999,
                       background: s.status === 'ENFORCED' ? P.greenBg : P.tableHeadBg,
                       color: s.status === 'ENFORCED' ? P.green : P.muted,
                       fontFamily: MONO, fontSize: 9.5, fontWeight: 700 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
                         background: 'currentColor' }} />
          {s.status}
        </span>
      </div>
      <div style={{ ...card, padding: 18 }}>
        <div style={{ ...label, marginBottom: 5 }}>PROVIDER</div>
        <select value={form.provider}
                onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                style={{ height: 30, borderRadius: 7, fontSize: 12, fontFamily: FONT,
                         border: `1px solid ${P.borderStrong}`, background: '#fff',
                         marginBottom: 11 }}>
          <option value="saml">SAML 2.0</option>
          <option value="oidc">OIDC</option>
        </select>
        <div style={{ ...label, marginBottom: 5 }}>IDENTITY PROVIDER SSO URL</div>
        <input data-testid="sso-url" value={form.sso_url}
               onChange={e => setForm(f => ({ ...f, sso_url: e.target.value }))}
               placeholder="https://acme.okta.com/app/analytiq/sso/saml" style={input} />
        <div style={{ ...label, marginBottom: 5 }}>ENTITY ID</div>
        <input data-testid="sso-entity" value={form.entity_id}
               onChange={e => setForm(f => ({ ...f, entity_id: e.target.value }))}
               placeholder="urn:analytiq:workspace:acme" style={input} />
        <div style={{ ...label, marginBottom: 5 }}>DOMAIN</div>
        <input data-testid="sso-domain" value={form.domain}
               onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
               placeholder="acmeretail.com" style={input} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 11 }}>
          {s.domains.map((d_, i) => (
            <span key={d_.domain} data-testid={`sso-domain-chip-${i}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                           height: 22, padding: '0 10px', borderRadius: 999,
                           border: `1px solid ${P.borderStrong}`, fontFamily: MONO,
                           fontSize: 10, color: P.body }}>
              {d_.domain}
              <span style={{ color: P.green, fontWeight: 700 }}>✓ VERIFIED</span>
            </span>
          ))}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: P.faint, marginBottom: 10 }}>
          domains verify instantly in the local stack — DNS TXT checks arrive with
          hosted deployments
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5,
                        fontFamily: FONT, color: P.body, marginBottom: 14 }}>
          <input data-testid="sso-enforce" type="checkbox" checked={form.enforced}
                 onChange={e => setForm(f => ({ ...f, enforced: e.target.checked }))} />
          Enforce for all members
        </label>
        {err && (
          <div style={{ fontSize: 11.5, color: P.red, fontFamily: FONT,
                        marginBottom: 10 }}>
            {err}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn data-testid="sso-save" size="sm" onClick={save}>Save configuration</Btn>
          <Btn data-testid="sso-test" size="sm" variant="outline"
               onClick={async () => {
                 try { setTestMsg((await api.testSso()).message); }
                 catch { setTestMsg('Configure and save first.'); }
               }}>
            Test login
          </Btn>
          {testMsg && (
            <span data-testid="sso-test-result"
                  style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
              {testMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminBranding() {
  const role = useRole();
  const [brand, setBrand] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');

  const load = () => api.getBranding().then(b => {
    setBrand(b);
    setName(b.logo_text || '');
    setColor(b.primary_color || '#2563eb');
  }).catch(() => setBrand(false));
  useEffect(() => { load(); }, []);

  if (role !== 'admin') return <Forbidden />;
  if (brand === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const initials = (name || 'AnalytIQ').split(/\s+/).map(w => w[0]).join('')
    .slice(0, 2).toUpperCase();
  const save = async () => {
    try {
      await api.putBranding({ logo_text: name, primary_color: color });
      load();
    } catch { /* role gated */ }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHeader title="Workspace branding"
                  sub="Applied to dashboards, public share pages and email digests." />
      <div style={{ ...card, padding: 18 }}>
        <div style={{ ...label, marginBottom: 5 }}>WORKSPACE NAME</div>
        <input data-testid="brand-name" value={name}
               onChange={e => setName(e.target.value)} placeholder="Acme Retail"
               style={input} />
        <div style={{ ...label, marginBottom: 5 }}>ACCENT COLOR</div>
        <input data-testid="brand-color" value={color}
               onChange={e => setColor(e.target.value)} placeholder="#2563eb"
               style={input} />
        <Btn data-testid="brand-save" size="sm" onClick={save}
             style={{ marginBottom: 16 }}>
          Save branding
        </Btn>
        <div style={{ ...label, marginBottom: 8 }}>LIVE PREVIEW</div>
        <div data-testid="brand-preview"
             style={{ border: `1px solid ${P.border}`, borderRadius: 10,
                      padding: '12px 14px', display: 'flex', alignItems: 'center',
                      gap: 10 }}>
          <span data-testid="brand-preview-mark"
                style={{ width: 26, height: 26, borderRadius: 7,
                         background: color || P.accent, color: '#fff',
                         display: 'inline-flex', alignItems: 'center',
                         justifyContent: 'center', fontFamily: FONT, fontSize: 11,
                         fontWeight: 700 }}>
            {initials}
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: P.ink,
                         fontFamily: FONT }}>
            {name || 'AnalytIQ'}
          </span>
          <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9.5,
                         color: P.faint }}>
            artifacts &middot; share pages &middot; email
          </span>
        </div>
      </div>
    </div>
  );
}
