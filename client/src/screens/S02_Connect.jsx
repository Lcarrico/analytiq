import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Badge, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

const CONNECTORS = [
  { id: 'snowflake',  name: 'Snowflake',   icon: 'SF', live: true  },
  { id: 'bigquery',   name: 'BigQuery',    icon: 'BQ', live: true  },
  { id: 'redshift',   name: 'Redshift',    icon: 'RS', live: true  },
  { id: 'postgres',   name: 'PostgreSQL',  icon: 'PG', live: true  },
  { id: 'databricks', name: 'Databricks',  icon: 'DB', live: true  },
  { id: 'dbt',        name: 'dbt Cloud',   icon: 'dbt', live: false },
];

const FORM_CONFIGS = {
  snowflake: {
    title: 'Connect Snowflake',
    fields: [
      { k: 'account',       label: 'Account URL',  ph: 'xyz12345.snowflakecomputing.com', t: 'text'     },
      { k: 'username',      label: 'Username',     ph: 'analytics_user',                  t: 'text'     },
      { k: 'password',      label: 'Password',     ph: '••••••••••',                      t: 'password' },
      { k: 'warehouse',     label: 'Warehouse',    ph: 'COMPUTE_WH',                      t: 'text'     },
      { k: 'database_name', label: 'Database',     ph: 'ANALYTICS_DB',                    t: 'text'     },
      { k: 'schema_name',   label: 'Schema',       ph: 'PUBLIC',                          t: 'text'     },
    ],
    defaults: { account: '', username: '', password: '', warehouse: 'COMPUTE_WH', database_name: 'ANALYTICS_DB', schema_name: 'PUBLIC' },
    buildPayload: (form) => ({
      name: form.account || 'My Snowflake',
      type: 'snowflake',
      account: form.account,
      username: form.username,
      password: form.password,
      warehouse: form.warehouse,
      database_name: form.database_name,
      schema_name: form.schema_name,
    }),
  },
  postgres: {
    title: 'Connect PostgreSQL',
    fields: [
      { k: 'host',          label: 'Host',     ph: 'db.example.com',   t: 'text'     },
      { k: 'port',          label: 'Port',     ph: '5432',             t: 'text'     },
      { k: 'database_name', label: 'Database', ph: 'my_database',      t: 'text'     },
      { k: 'username',      label: 'Username', ph: 'postgres',         t: 'text'     },
      { k: 'password',      label: 'Password', ph: '••••••••••',       t: 'password' },
      { k: 'schema_name',   label: 'Schema',   ph: 'public',           t: 'text'     },
    ],
    defaults: { host: '', port: '5432', database_name: '', username: '', password: '', schema_name: 'public' },
    buildPayload: (form) => ({
      name: form.host || 'My PostgreSQL',
      type: 'postgres',
      host: form.host,
      port: form.port,
      database_name: form.database_name,
      username: form.username,
      password: form.password,
      schema_name: form.schema_name,
    }),
  },
  redshift: {
    title: 'Connect Redshift',
    fields: [
      { k: 'host',          label: 'Cluster host', ph: 'cluster.abc.redshift.amazonaws.com', t: 'text' },
      { k: 'database_name', label: 'Database',     ph: 'dw',        t: 'text'     },
      { k: 'username',      label: 'Username',     ph: 'awsuser',   t: 'text'     },
      { k: 'password',      label: 'Password',     ph: '••••••••••', t: 'password' },
    ],
    defaults: { host: '', database_name: '', username: '', password: '' },
    buildPayload: (form) => ({
      name: form.host || 'My Redshift', type: 'redshift',
      host: form.host, database_name: form.database_name,
      username: form.username, password: form.password,
    }),
  },
  databricks: {
    title: 'Connect Databricks',
    fields: [
      { k: 'host',         label: 'Workspace host', ph: 'adb-123.azuredatabricks.net', t: 'text' },
      { k: 'http_path',    label: 'HTTP path',      ph: '/sql/1.0/warehouses/abc',     t: 'text' },
      { k: 'access_token', label: 'Access token',   ph: 'dapi...',                     t: 'password' },
    ],
    defaults: { host: '', http_path: '', access_token: '' },
    buildPayload: (form) => ({
      name: form.host || 'My Databricks', type: 'databricks',
      host: form.host, http_path: form.http_path, access_token: form.access_token,
    }),
  },
  bigquery: {
    title: 'Connect BigQuery',
    fields: [
      { k: 'project_id',       label: 'Project ID',                 ph: 'my-gcp-project',                       t: 'text'     },
      { k: 'dataset',          label: 'Dataset',                    ph: 'analytics',                            t: 'text'     },
      { k: 'credentials_json', label: 'Service Account Key (JSON)', ph: 'Paste your service account JSON here...', t: 'textarea' },
    ],
    defaults: { project_id: '', dataset: '', credentials_json: '' },
    buildPayload: (form) => ({
      name: form.project_id || 'My BigQuery',
      type: 'bigquery',
      project_id: form.project_id,
      dataset: form.dataset,
      credentials_json: form.credentials_json,
    }),
  },
};

const CONNECTOR_ICON = { snowflake: 'SF', postgres: 'PG', bigquery: 'BQ', redshift: 'RS', databricks: 'DB', dbt: 'dbt' };

function SavedConnections({ onRescan, onNew }) {
  const [conns,   setConns]   = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.getConnections()
      .then(rows => setConns(rows || []))
      .catch(() => setConns([]));
  }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.deleteConnection(id);
      setConns(c => c.filter(x => x.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  if (conns === null) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
      <Spinner size={20} />
    </div>
  );

  if (conns.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO, marginBottom: 10 }}>
        Your data sources
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conns.map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '12px 16px',
          }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, width: 30, height: 30, borderRadius: 8, background: '#eff4ff', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{CONNECTOR_ICON[c.type] || '?'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name}
              </div>
              <div style={{ fontSize: 11, color: C.textSec, fontFamily: MONO, marginTop: 2 }}>
                {c.type}{c.database_name ? ` · ${c.database_name}` : ''}{c.schema_name ? ` / ${c.schema_name}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn size="sm" onClick={() => onRescan(c)}>Re-scan →</Btn>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={deleting === c.id}
                style={{
                  padding: '4px 10px', borderRadius: 5, border: `1px solid ${C.border}`,
                  background: 'transparent', color: C.textSec, fontSize: 12,
                  cursor: 'pointer', fontFamily: FONT,
                }}
              >
                {deleting === c.id ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <Btn variant="outline" onClick={onNew}>+ Add new data source</Btn>
      </div>
    </div>
  );
}

export default function Screen02() {
  const { update, nav } = useApp();
  const [sel,        setSel]        = useState(null);
  const [view,       setView]       = useState('list');  // 'list' | 'picker' | 'form'
  const [form,       setForm]       = useState({});
  const [busy,       setBusy]       = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error,      setError]      = useState('');

  const config = sel ? FORM_CONFIGS[sel] : null;

  const openForm = (id) => {
    setSel(id);
    setForm({ ...FORM_CONFIGS[id].defaults });
    setTestResult(null);
    setError('');
    setView('form');
  };

  const handleRescan = async (conn) => {
    setBusy(true);
    try {
      update({ connectionId: conn.id });
      const { runId } = await api.startGovernance({ connectionId: conn.id });
      update({ runId });
      nav(3);
    } catch (err) {
      setError(err.message || 'Failed to start scan');
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    setError('');
    setTesting(true);
    try {
      const payload = config.buildPayload(form);
      const res = await api.testConnection(payload);
      setTestResult({ ok: res.ok, message: res.message });
    } catch (err) {
      let msg = 'Connection failed';
      try { msg = JSON.parse(err.message)?.error || msg; } catch {}
      setTestResult({ ok: false, message: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    setError('');
    setBusy(true);
    try {
      const payload = config.buildPayload(form);
      const conn = await api.createConnection(payload);
      update({ connectionId: conn.id });
      const { runId } = await api.startGovernance({ connectionId: conn.id });
      update({ runId });
      nav(3);
    } catch (err) {
      // Surface server-side field validation errors (400 {error, fields})
      let msg = err.message || 'Connection failed';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.fields) {
          const labels = Object.fromEntries((config.fields || []).map(f => [f.k, f.label]));
          msg = Object.entries(parsed.fields)
            .map(([k, v]) => `${labels[k] || k}: ${v}`)
            .join(' · ');
        } else if (parsed?.error) {
          msg = parsed.error;
        }
      } catch {}
      setError(msg);
      setBusy(false);
    }
  };

  // Form view
  if (view === 'form' && config) return (
    <div style={{ maxWidth: 540 }}>
      <PageHeader
        title={config.title}
        sub="Credentials are encrypted at rest and never shared with the LLM layer."
        badge={{ label: 'Encrypted', v: 'success' }}
      />
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {config.fields.map(f => (
            <div key={f.k}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 5, fontFamily: FONT }}>
                {f.label}
              </label>
              {f.t === 'textarea' ? (
                <textarea
                  placeholder={f.ph}
                  value={form[f.k] || ''}
                  onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))}
                  rows={4}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: MONO, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              ) : (
                <input
                  type={f.t}
                  placeholder={f.ph}
                  value={form[f.k] || ''}
                  onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: MONO, outline: 'none' }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, padding: '10px 12px', background: C.primaryLight, borderRadius: 6, fontSize: 12, color: C.primary, display: 'flex', gap: 6, fontFamily: FONT }}>
          Credentials submit directly to the secrets manager — never logged, never sent to any agent.
        </div>

        {testResult && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: testResult.ok ? '#f0fdf4' : '#fff5f5', borderRadius: 6, fontSize: 12, color: testResult.ok ? '#16a34a' : '#dc2626', fontFamily: FONT }}>
            {testResult.ok ? '✓' : '️'} {testResult.message}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff5f5', borderRadius: 6, fontSize: 12, color: '#dc2626', fontFamily: FONT }}>
            ️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => { setView('list'); setError(''); setTestResult(null); }}>← Back</Btn>
          <Btn variant="outline" disabled={testing} onClick={handleTest}>
            {testing ? 'Testing...' : 'Test connection'}
          </Btn>
          <Btn disabled={busy} onClick={handleConnect}>
            {busy ? 'Connecting...' : 'Connect & scan →'}
          </Btn>
        </div>
      </Card>
    </div>
  );

  // Connector picker
  if (view === 'picker') return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader title="Choose a connector" sub="Snowflake, PostgreSQL, and BigQuery are live. Other connectors coming in Phase 2." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {CONNECTORS.map(c => (
          <button key={c.id} onClick={() => c.live && setSel(c.id)} style={{
            background: sel === c.id ? C.primaryLight : C.surface,
            border: `2px solid ${sel === c.id ? C.primary : C.border}`,
            borderRadius: 8, padding: 20, cursor: c.live ? 'pointer' : 'not-allowed',
            opacity: c.live ? 1 : 0.4, textAlign: 'left', position: 'relative', transition: 'all 0.15s',
          }}>
            <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, width: 34, height: 34, borderRadius: 9, background: '#eff4ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>{c.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>{c.name}</div>
            {!c.live && <div style={{ position: 'absolute', top: 8, right: 8 }}><Badge xs>Soon</Badge></div>}
            {c.live  && <div style={{ marginTop: 4 }}><Badge variant="success" xs>Available</Badge></div>}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
        <Btn variant="secondary" onClick={() => setView('list')}>← Back</Btn>
        <Btn size="lg" disabled={!sel} onClick={() => sel && openForm(sel)}>
          Continue with {sel ? CONNECTORS.find(c => c.id === sel)?.name : 'a connector'} →
        </Btn>
      </div>
    </div>
  );

  // Default: list view (saved connections + add new)
  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader title="Connect a data source" sub="Select a saved connection to re-scan, or add a new one." />
      <SavedConnections onRescan={handleRescan} onNew={() => { setSel(null); setView('picker'); }} />
      {busy && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textSec, fontFamily: FONT, fontSize: 13 }}>
          <Spinner size={16} /> Starting governance scan…
        </div>
      )}
      {error && (
        <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff5f5', borderRadius: 6, fontSize: 12, color: '#dc2626', fontFamily: FONT }}>
          ️ {error}
        </div>
      )}
    </div>
  );
}
