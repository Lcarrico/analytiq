// R35S1E2-US1 (program R30–R36) — Add-source connector grid (`Data
// Sources.dc.html` frame 02 / PRD §8 audit-first): 12 typed connector
// cards + search + read-only note. Snowflake routes into the guided
// wizard (R35S1E3); upload / REST / webhook / dbt route into the import
// flows (R35S1E4); the remaining warehouse / database / file types open
// a credentials drawer (S02's form map rehomed) that POSTs the real
// connections API. Replaces S02.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn, PageHeader } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9, fontWeight: 700,
                letterSpacing: '.06em', color: P.muted };

export const CONNECTORS = [
  { key: 'snowflake', name: 'Snowflake', cat: 'WAREHOUSE', glyph: 'SF', to: '/app/data/connect/snowflake' },
  { key: 'bigquery', name: 'BigQuery', cat: 'WAREHOUSE', glyph: 'BQ', form: true },
  { key: 'databricks', name: 'Databricks SQL', cat: 'WAREHOUSE', glyph: 'DB', form: true },
  { key: 'redshift', name: 'Redshift', cat: 'WAREHOUSE', glyph: 'RS', form: true },
  { key: 'postgres', name: 'PostgreSQL', cat: 'DATABASE', glyph: 'PG', form: true },
  { key: 'mysql', name: 'MySQL', cat: 'DATABASE', glyph: 'MY', form: true },
  { key: 'duckdb', name: 'DuckDB', cat: 'DATABASE', glyph: 'DD', form: true },
  { key: 'upload', name: 'CSV / XLSX / Parquet', cat: 'FILE UPLOAD', glyph: 'UP', to: '/app/data/import/upload' },
  { key: 'rest_api', name: 'REST API', cat: 'POLL', glyph: '{}', to: '/app/data/import/rest' },
  { key: 'webhook', name: 'Webhook', cat: 'PUSH', glyph: 'WH', to: '/app/data/import/webhook' },
  { key: 'dbt', name: 'dbt Project', cat: 'MODELS + TESTS', glyph: 'dbt', to: '/app/data/import/dbt' },
  { key: 'gsheet', name: 'Google Sheets', cat: 'FILE', glyph: 'GS', form: true },
];

// S02's FORM_CONFIGS rehomed — fields per connector type (validated
// server-side by CONNECTOR_REQUIRED_FIELDS).
const FORMS = {
  bigquery: { title: 'BigQuery', fields: [
    ['project_id', 'Project ID', 'my-gcp-project'],
    ['credentials_json', 'Service account JSON', '{ "type": "service_account", … }'],
  ] },
  databricks: { title: 'Databricks SQL', fields: [
    ['host', 'Workspace host', 'adb-123.azuredatabricks.net'],
    ['http_path', 'HTTP path', '/sql/1.0/warehouses/abc'],
    ['access_token', 'Access token', 'dapi…', 'password'],
  ] },
  redshift: { title: 'Redshift', fields: [
    ['host', 'Cluster host', 'cluster.abc.redshift.amazonaws.com'],
    ['database_name', 'Database', 'analytics'],
    ['username', 'Username', 'reader'],
    ['password', 'Password', '••••••••', 'password'],
  ] },
  postgres: { title: 'PostgreSQL', fields: [
    ['host', 'Host', 'db.example.com'],
    ['database_name', 'Database', 'analytics'],
    ['username', 'Username', 'reader'],
    ['password', 'Password', '••••••••', 'password'],
  ] },
  mysql: { title: 'MySQL', fields: [
    ['host', 'Host', 'db.example.com'],
    ['database_name', 'Database', 'analytics'],
    ['username', 'Username', 'reader'],
    ['password', 'Password', '••••••••', 'password'],
  ] },
  duckdb: { title: 'DuckDB', fields: [
    ['database_path', 'Database path', '/data/analytics.duckdb'],
  ] },
  gsheet: { title: 'Google Sheets', fields: [
    ['sheet_url', 'Sheet URL', 'https://docs.google.com/spreadsheets/d/…'],
  ] },
};

export default function ConnectGrid() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);      // connector key
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const cards = CONNECTORS.filter(c =>
    !q || c.name.toLowerCase().includes(q.toLowerCase())
      || c.cat.toLowerCase().includes(q.toLowerCase()));
  const cfg = open ? FORMS[open] : null;

  const submit = async () => {
    if (busy) return;
    setErr(''); setBusy(true);
    try {
      await api.createConnection({ type: open,
        name: form[FORMS[open].fields[0][0]] || FORMS[open].title, ...form });
      navigate('/app/data/sources');
    } catch (e) {
      let m = e.message;
      try {
        const parsed = JSON.parse(e.message);
        m = parsed.fields ? Object.entries(parsed.fields)
          .map(([k, v]) => `${k}: ${v}`).join(' · ') : parsed.error || m;
      } catch { /* raw */ }
      setErr(m);
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader title="Connect a source" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                    margin: '-8px 0 16px' }}>
        <span data-testid="connect-note"
              style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
          All connections are read-only. Credentials are encrypted at rest.
        </span>
        <input data-testid="connect-search" value={q}
               onChange={e => setQ(e.target.value)} placeholder="Search connectors…"
               style={{ marginLeft: 'auto', height: 30, width: 220, borderRadius: 8,
                        border: `1px solid ${P.borderStrong}`, padding: '0 11px',
                        fontSize: 12, fontFamily: FONT, outline: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {cards.map(c => (
          <div key={c.key} data-testid={`conn-card-${c.key}`}
               onClick={() => c.to ? navigate(c.to)
                 : (setOpen(c.key), setForm({}), setErr(''))}
               style={{ background: '#fff', border: `1px solid ${P.border}`,
                        borderRadius: 10, padding: '16px 14px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8,
                           background: P.tableHeadBg, display: 'inline-flex',
                           alignItems: 'center', justifyContent: 'center',
                           fontFamily: MONO, fontSize: 11, fontWeight: 700,
                           color: P.body }}>
              {c.glyph}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: P.ink,
                           fontFamily: FONT }}>
              {c.name}
            </span>
            <span data-testid="conn-cat" style={label}>{c.cat}</span>
          </div>
        ))}
      </div>

      <div data-testid="request-connector" onClick={() => navigate('/app/team')}
           title="Tell your workspace admin which connector you need"
           style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                    marginTop: 16, fontSize: 12.5, color: P.accent,
                    cursor: 'pointer', fontFamily: FONT }}>
        Request a connector &rarr;
      </div>

      {cfg && (
        <div data-testid="cred-drawer"
             style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
                      background: '#fff', borderLeft: `1px solid ${P.border}`,
                      boxShadow: '-10px 0 30px rgba(15,23,42,.08)', padding: 22,
                      zIndex: 40, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: P.ink,
                           fontFamily: FONT }}>
              Connect {cfg.title}
            </span>
            <span onClick={() => setOpen(null)}
                  style={{ marginLeft: 'auto', cursor: 'pointer', color: P.muted }}>
              &#10005;
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT,
                        marginBottom: 14 }}>
            Read-only credentials, encrypted at rest.
          </div>
          {cfg.fields.map(([k, name, ph, type]) => (
            <div key={k} style={{ marginBottom: 11 }}>
              <div style={{ ...label, marginBottom: 5 }}>{name.toUpperCase()}</div>
              <input data-testid={`cred-${k}`} type={type || 'text'}
                     value={form[k] || ''} placeholder={ph}
                     onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                     style={{ width: '100%', height: 32, boxSizing: 'border-box',
                              borderRadius: 7, border: `1px solid ${P.borderStrong}`,
                              padding: '0 10px', fontSize: 12, fontFamily: MONO,
                              outline: 'none' }} />
            </div>
          ))}
          {err && (
            <div style={{ fontSize: 11.5, color: P.red, fontFamily: FONT,
                          marginBottom: 10 }}>
              {err}
            </div>
          )}
          <Btn data-testid="cred-submit" full onClick={submit} disabled={busy}>
            {busy ? 'Connecting…' : 'Connect'}
          </Btn>
        </div>
      )}
    </div>
  );
}
