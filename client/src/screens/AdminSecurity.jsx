// R36S2E4-US1 (program R30–R36) — admin security console (`Admin
// Security.dc.html` frames 01–04 / ch16): audit log with CSV/JSON export,
// connector credentials listed masked-only with audited rotation, sharing
// governance rules over the workspace kv, and row-level-security policies
// with the "test as user" simulator. Values never leave the server in the
// clear — the API returns masked tails only.
import { useEffect, useState } from 'react';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`,
               borderRadius: 10, padding: 16, marginBottom: 14 };
const input = { height: 30, borderRadius: 7, padding: '0 10px', fontSize: 12,
                border: `1px solid ${P.borderStrong}`, fontFamily: MONO,
                outline: 'none', background: '#fff' };

const SEV_COLOR = { warn: P.amber, error: P.red, notice: P.cyan };

export default function AdminSecurity() {
  const role = useRole();
  const [audit, setAudit] = useState(null);
  const [secrets, setSecrets] = useState(null);
  const [sharing, setSharing] = useState(null);
  const [policies, setPolicies] = useState(null);
  const [expiry, setExpiry] = useState('90');
  const [rlsTable, setRlsTable] = useState('');
  const [rlsExpr, setRlsExpr] = useState('');
  const [sim, setSim] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const [a, s, sh, r] = await Promise.all([
        api.auditLogs(40), api.adminSecrets(), api.getSharing(), api.rlsPolicies()]);
      setAudit(Array.isArray(a) ? a : a.entries || []);
      setSecrets(s.secrets);
      setSharing(sh);
      setExpiry(String(sh.rules.max_expiration_days ?? 90));
      setPolicies(r.policies);
    } catch { setAudit([]); setSecrets([]); setPolicies([]); }
  };
  useEffect(() => { load(); }, []);

  if (role !== 'admin') return <Forbidden />;
  if (audit === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 4000); };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        workspace / admin / security
      </div>
      <PageHeader title="Security & access"
                  sub="The audit trail, connector credentials, sharing rules, and row-level policies — everything that gates who sees what." />
      {msg && (
        <div style={{ background: P.greenBg, color: P.green, borderRadius: 8,
                      padding: '8px 14px', fontSize: 12.5, fontWeight: 600,
                      fontFamily: FONT, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <span style={label}>AUDIT LOG · LAST 40 EVENTS</span>
          <a data-testid="sec-audit-export" href="/api/audit-logs/export?format=csv"
             style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 600,
                      color: P.accentHover, textDecoration: 'none', fontFamily: FONT }}>
            Export CSV/JSON
          </a>
        </div>
        <div data-testid="sec-audit-table">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 2.2fr .8fr',
                        gap: 10, padding: '6px 0', borderBottom: `1px solid ${P.border}`,
                        ...label }}>
            <span>TIMESTAMP</span><span>EVENT</span><span>TARGET</span><span>SEVERITY</span>
          </div>
          {audit.slice(0, 12).map((e, i) => (
            <div key={e.id ?? i} data-testid={`sec-audit-row-${i}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '1.2fr 1.3fr 2.2fr .8fr', gap: 10,
                          padding: '7px 0', borderBottom: `1px solid ${P.borderRow}`,
                          alignItems: 'center' }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>
                {(e.created_at || '').slice(0, 16)}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600,
                             color: P.ink }}>
                {e.action}
              </span>
              <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT,
                             overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap' }}>
                {e.resource_type}{e.resource_id ? ` · ${e.resource_id}` : ''}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                             color: SEV_COLOR[(e.severity || 'info').toLowerCase()]
                               || P.muted }}>
                {(e.severity || 'INFO').toUpperCase()}
              </span>
            </div>
          ))}
          {audit.length === 0 && (
            <div style={{ padding: 14, fontSize: 12, color: P.muted, fontFamily: FONT }}>
              No audit events yet.
            </div>
          )}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <span style={label}>SECRETS & CREDENTIALS</span>
          <span style={{ marginLeft: 10, fontFamily: MONO, fontSize: 9,
                         fontWeight: 700, color: P.purple, background: P.purpleBg,
                         borderRadius: 8, padding: '2px 8px' }}>
            ENCRYPTED AT REST
          </span>
        </div>
        {(secrets || []).map(s => (
          <div key={s.connection_id} data-testid="sec-secret-row"
               style={{ display: 'grid',
                        gridTemplateColumns: '1.6fr 1.2fr 1fr 1fr .9fr auto', gap: 10,
                        padding: '8px 0', borderBottom: `1px solid ${P.borderRow}`,
                        alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: P.ink,
                           fontFamily: FONT }}>
              {s.connector}
            </span>
            <span data-testid="sec-secret-cred"
                  style={{ fontFamily: MONO, fontSize: 11, color: P.body }}>
              {s.credential}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
              rotated {s.age_days != null ? `${s.age_days}d ago` : '—'}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
              {s.last_used ? `used ${s.last_used.slice(5, 16)}` : 'not used yet'}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                           color: s.status === 'stale' ? P.amber : P.green }}>
              {s.status.toUpperCase()}
            </span>
            <Btn data-testid="sec-rotate" size="sm" variant="outline"
                 onClick={async () => {
                   try {
                     await api.rotateSecret(s.connection_id);
                     flash('Credential rotated and audited.');
                     load();
                   } catch { /* noop */ }
                 }}>
              Rotate
            </Btn>
          </div>
        ))}
        {(secrets || []).length === 0 && (
          <div style={{ padding: 12, fontSize: 12, color: P.muted, fontFamily: FONT }}>
            No connector credentials stored yet — add a connection to see it here.
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <span style={label}>SHARING GOVERNANCE</span>
          <span data-testid="sec-share-counts"
                style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10.5,
                         color: P.faint }}>
            {sharing?.counts.active_links ?? 0} active links ·{' '}
            {sharing?.counts.expiring_3d ?? 0} expiring within 3 days
          </span>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12.5,
                          fontFamily: FONT, color: P.body }}>
            <input data-testid="sec-share-public" type="checkbox"
                   defaultChecked={sharing?.rules.public_links !== false} />
            Public links allowed — signed, expiring, revocable
          </label>
          <label style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12.5,
                          fontFamily: FONT, color: P.body }}>
            Max link expiration
            <input data-testid="sec-share-expiry" value={expiry}
                   onChange={e => setExpiry(e.target.value)}
                   style={{ ...input, width: 56 }} />
            days
          </label>
          <Btn data-testid="sec-share-save" size="sm" onClick={async () => {
            try {
              await api.putSharing({
                public_links: document.querySelector('[data-testid=sec-share-public]').checked,
                max_expiration_days: Number(expiry) || 90,
                allowed_domains: sharing?.rules.allowed_domains || [],
                scopes: sharing?.rules.scopes || ['read_only'] });
              flash('Sharing rules saved.');
            } catch { /* noop */ }
          }}>
            Save rules
          </Btn>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint, marginTop: 8 }}>
          embed domains + token scopes are enforced by the embed settings (R33S2)
        </div>
      </div>

      <div style={card}>
        <span style={label}>ROW-LEVEL SECURITY · POLICIES + SIMULATOR</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0' }}>
          <input data-testid="sec-rls-table" value={rlsTable} placeholder="table name"
                 onChange={e => setRlsTable(e.target.value)} style={{ ...input, width: 160 }} />
          <input data-testid="sec-rls-expr" value={rlsExpr}
                 placeholder="expression, e.g. region = 'EMEA'"
                 onChange={e => setRlsExpr(e.target.value)} style={{ ...input, flex: 1 }} />
          <Btn data-testid="sec-rls-save" size="sm" onClick={async () => {
            try {
              await api.createRls({ table_name: rlsTable, expression: rlsExpr });
              setRlsExpr('');
              load();
            } catch { flash('Expression rejected — simple comparisons only.'); }
          }}>
            Add policy
          </Btn>
        </div>
        {(policies || []).map(pol => (
          <div key={pol.id} data-testid="sec-rls-row"
               style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '7px 0',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                           color: P.ink }}>
              {pol.table_name}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: P.body }}>
              {pol.expression}
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9.5,
                           fontWeight: 700,
                           color: pol.status === 'on' ? P.green : P.faint }}>
              {(pol.status || 'on').toUpperCase()}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
          <Btn data-testid="sec-sim-run" size="sm" variant="outline" onClick={async () => {
            try {
              const r = await api.simulateRls({
                table_name: rlsTable || (policies?.[0]?.table_name ?? '') });
              setSim(r);
            } catch { /* noop */ }
          }}>
            Test as user
          </Btn>
          {sim && (
            <span data-testid="sec-sim-result"
                  style={{ fontSize: 12, fontFamily: FONT, color: P.body }}>
              {sim.note}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
