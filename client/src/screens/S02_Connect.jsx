import { useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Badge } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

const CONNECTORS = [
  { id: 'snowflake',  name: 'Snowflake',   icon: '❄️',  live: true  },
  { id: 'bigquery',   name: 'BigQuery',    icon: '🔵', live: false },
  { id: 'redshift',   name: 'Redshift',    icon: '🔴', live: false },
  { id: 'postgres',   name: 'PostgreSQL',  icon: '🐘', live: false },
  { id: 'databricks', name: 'Databricks',  icon: '⚡', live: false },
  { id: 'dbt',        name: 'dbt Cloud',   icon: '⬡',  live: false },
];

const DEFAULT_FORM = {
  account:       '',
  username:      '',
  password:      '',
  warehouse:     'COMPUTE_WH',
  database_name: 'ANALYTICS_DB',
  schema_name:   'PUBLIC',
};

export default function Screen02() {
  const { update, nav } = useApp();
  const [sel,      setSel]      = useState(null);
  const [view,     setView]     = useState('picker'); // picker | form
  const [form,     setForm]     = useState(DEFAULT_FORM);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');

  const handleConnect = async () => {
    setError('');
    setBusy(true);
    try {
      const conn = await api.createConnection({
        name:          `${form.account || 'My Snowflake'}`,
        type:          'snowflake',
        account:       form.account,
        username:      form.username,
        warehouse:     form.warehouse,
        database_name: form.database_name,
        schema_name:   form.schema_name,
      });
      update({ connectionId: conn.id });

      // Start governance immediately
      const { runId } = await api.startGovernance({ connectionId: conn.id });
      update({ runId });
      nav(3);
    } catch (err) {
      setError(err.message || 'Connection failed');
      setBusy(false);
    }
  };

  if (view === 'form') return (
    <div style={{ maxWidth: 540 }}>
      <PageHeader
        title="Connect Snowflake"
        sub="Credentials are encrypted at rest and never shared with the LLM layer."
        badge={{ label: 'Encrypted', v: 'success' }}
      />
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { k: 'account',       label: 'Account URL',  ph: 'xyz12345.snowflakecomputing.com', t: 'text'     },
            { k: 'username',      label: 'Username',     ph: 'analytics_user',                  t: 'text'     },
            { k: 'password',      label: 'Password',     ph: '••••••••••',                      t: 'password' },
            { k: 'warehouse',     label: 'Warehouse',    ph: 'COMPUTE_WH',                      t: 'text'     },
            { k: 'database_name', label: 'Database',     ph: 'ANALYTICS_DB',                    t: 'text'     },
            { k: 'schema_name',   label: 'Schema',       ph: 'PUBLIC',                          t: 'text'     },
          ].map(f => (
            <div key={f.k}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 5, fontFamily: FONT }}>
                {f.label}
              </label>
              <input
                type={f.t}
                placeholder={f.ph}
                value={form[f.k]}
                onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: MONO, outline: 'none' }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, padding: '10px 12px', background: C.primaryLight, borderRadius: 6, fontSize: 12, color: C.primary, display: 'flex', gap: 6, fontFamily: FONT }}>
          🔒 Credentials submit directly to the secrets manager — never logged, never sent to any agent.
        </div>

        {error && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: C.errorBg, borderRadius: 6, fontSize: 12, color: C.error, fontFamily: FONT }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => { setView('picker'); setError(''); }}>← Back</Btn>
          <Btn disabled={busy} onClick={handleConnect}>
            {busy ? 'Connecting...' : 'Connect securely →'}
          </Btn>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ maxWidth: 680 }}>
      <PageHeader title="Connect a data source" sub="Snowflake is live. Other connectors are coming in Phase 2." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {CONNECTORS.map(c => (
          <button key={c.id} onClick={() => c.live && setSel(c.id)} style={{
            background: sel === c.id ? C.primaryLight : C.surface,
            border: `2px solid ${sel === c.id ? C.primary : C.border}`,
            borderRadius: 8, padding: 20, cursor: c.live ? 'pointer' : 'not-allowed',
            opacity: c.live ? 1 : 0.4, textAlign: 'left', position: 'relative', transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>{c.name}</div>
            {!c.live && <div style={{ position: 'absolute', top: 8, right: 8 }}><Badge xs>Soon</Badge></div>}
            {c.live  && <div style={{ marginTop: 4 }}><Badge variant="success" xs>Available</Badge></div>}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <Btn size="lg" disabled={!sel} onClick={() => sel && setView('form')}>
          Continue with {sel ? CONNECTORS.find(c => c.id === sel)?.name : 'a connector'} →
        </Btn>
      </div>
    </div>
  );
}
