// R35S1E3-US1 (program R30–R36) — Snowflake connector wizard (`Data
// Sources.dc.html` frame 03 / PRD §8 audit-first). Every step is real:
// Test connection hits the validation endpoint (latency chip), the scope
// picker reads the deterministic preview catalog and its selection is
// enforced by the governance run (scope_json), SLAs persist per table,
// and the health check IS the governance run, polled live.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const STEPS = ['Credentials', 'Scope & tables', 'Freshness SLA', 'Health check'];

export default function ConnectorWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ account: '', username: '', password: '',
    warehouse: 'COMPUTE_WH', database_name: 'ANALYTICS_DB', schema_name: 'PUBLIC' });
  const [verified, setVerified] = useState(null);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState({});
  const [filter, setFilter] = useState('');
  const [slas, setSlas] = useState({});
  const [health, setHealth] = useState({ state: 'idle' });
  const started = useRef(false);

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const chosen = Object.keys(selected).filter(k => selected[k]);
  const total = preview
    ? preview.schemas.reduce((s, sc) => s + sc.tables.length, 0) : 0;

  const testConn = async () => {
    setErr('');
    try {
      const r = await api.testConnection({ type: 'snowflake', ...form });
      setVerified(r);
    } catch (e) {
      let m = e.message;
      try {
        const parsed = JSON.parse(e.message);
        m = parsed.fields ? Object.entries(parsed.fields)
          .map(([k, v]) => `${k}: ${v}`).join(' · ') : parsed.error || m;
      } catch { /* raw */ }
      setErr(m); setVerified(null);
    }
  };

  const enterScope = async () => {
    try {
      const p = await api.previewScope({ type: 'snowflake', ...form });
      setPreview(p);
      setStep(2);
    } catch { setErr('Scope discovery failed — check the credentials.'); }
  };

  useEffect(() => {
    if (step !== 4 || started.current) return;
    started.current = true;
    (async () => {
      try {
        setHealth({ state: 'creating' });
        const conn = await api.createConnection({ type: 'snowflake',
          name: form.account, ...form, selected_tables: chosen });
        for (const [t, h] of Object.entries(slas)) {
          if (h) await api.setSla({ connectionId: conn.id, table: t,
                                    max_age_hours: Number(h) });
        }
        setHealth({ state: 'running' });
        const run = await api.startGovernance({ connectionId: conn.id });
        const runId = run.runId ?? run.run_id ?? run.id;
        const poll = async () => {
          try {
            const r = await api.getGovernanceRun(runId);
            if (r.status === 'done' || r.status === 'complete') {
              setHealth({ state: 'done', tables: chosen.length, connId: conn.id });
              return;
            }
            setHealth({ state: 'running', step: r.current_step });
          } catch { /* poll on */ }
          setTimeout(poll, 400);
        };
        poll();
      } catch (e) {
        let m = e.message;
        try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
        setHealth({ state: 'failed', error: m });
      }
    })();
  }, [step]);

  const input = (k, name, ph, type) => (
    <div key={k} style={{ marginBottom: 11 }}>
      <div style={{ ...label, marginBottom: 5 }}>{name.toUpperCase()}</div>
      <input data-testid={`wiz-${k}`} type={type || 'text'} value={form[k]}
             placeholder={ph} onChange={e => F(k, e.target.value)}
             style={{ width: '100%', height: 32, boxSizing: 'border-box',
                      borderRadius: 7, border: `1px solid ${P.borderStrong}`,
                      padding: '0 10px', fontSize: 12, fontFamily: MONO,
                      outline: 'none' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 880 }}>
      <div onClick={() => navigate('/app/data/connect')}
           style={{ fontSize: 12, color: P.accent, cursor: 'pointer', marginBottom: 10,
                    fontFamily: FONT }}>
        &larr; Connectors
      </div>
      <PageHeader title="Connect Snowflake"
                  sub="Read-only, scoped to exactly the tables you pick — the health check profiles them before anything else touches this source." />
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {STEPS.map((name, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'active' : 'todo';
          return (
            <div key={name} data-testid={`wiz-step-${n}`} data-active={String(n === step)}
                 style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px', borderRadius: 9,
                          background: state === 'active' ? P.accentSoft : '#fff',
                          border: `1px solid ${state === 'active' ? P.accentBorder : P.border}` }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%',
                             display: 'inline-flex', alignItems: 'center',
                             justifyContent: 'center', fontFamily: MONO, fontSize: 10,
                             fontWeight: 700,
                             background: state === 'done' ? P.greenBg : P.tableHeadBg,
                             color: state === 'done' ? P.green : P.muted }}>
                {state === 'done' ? '✓' : n}
              </span>
              <span style={{ fontSize: 12, fontWeight: state === 'active' ? 600 : 400,
                             color: state === 'active' ? P.ink : P.muted,
                             fontFamily: FONT }}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div style={{ ...card, padding: 18, maxWidth: 480 }}>
          {input('account', 'Account URL', 'xyz12345.snowflakecomputing.com')}
          {input('username', 'Username', 'analytics_reader')}
          {input('password', 'Password', '••••••••', 'password')}
          {input('warehouse', 'Warehouse', 'COMPUTE_WH')}
          {input('database_name', 'Database', 'ANALYTICS_DB')}
          {verified?.ok && (
            <div data-testid="wiz-verified"
                 style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                          height: 24, padding: '0 11px', borderRadius: 999,
                          background: P.greenBg, color: P.green, fontFamily: MONO,
                          fontSize: 10, fontWeight: 700, marginBottom: 10 }}>
              Connection verified &middot; read-only role &middot; {verified.latency_ms}ms
            </div>
          )}
          {err && (
            <div style={{ fontSize: 11.5, color: P.red, fontFamily: FONT,
                          marginBottom: 10 }}>
              {err}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn data-testid="wiz-test" size="sm" variant="outline" onClick={testConn}>
              Test connection
            </Btn>
            <Btn data-testid="wiz-continue" size="sm" onClick={enterScope}
                 disabled={!verified?.ok}>
              Continue &rarr; Choose tables
            </Btn>
          </div>
        </div>
      )}

      {step === 2 && preview && (
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                        marginBottom: 12 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: P.ink,
                           fontFamily: FONT }}>
              Choose schemas &amp; tables
            </span>
            <span style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>
              AnalytIQ profiles only what you select. You can expand scope later.
            </span>
            <input data-testid="scope-filter" value={filter}
                   onChange={e => setFilter(e.target.value)} placeholder="Filter tables…"
                   style={{ marginLeft: 'auto', height: 28, width: 180, borderRadius: 7,
                            border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                            fontSize: 11.5, fontFamily: FONT, outline: 'none' }} />
            <span data-testid="scope-count"
                  style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>
              {chosen.length} of {total} selected
            </span>
          </div>
          {preview.schemas.map(sc => (
            <div key={sc.name} style={{ marginBottom: 12 }}>
              <div data-testid={`scope-schema-${sc.name}`}
                   style={{ ...label, marginBottom: 6 }}>
                {sc.name} &middot; schema &middot; {sc.tables.length} tables
              </div>
              {sc.tables
                .filter(t => !filter || t.name.includes(filter.toLowerCase()))
                .map(t => (
                <div key={t.name} data-testid={`scope-table-${t.name}`}
                     onClick={() => setSelected(s => ({ ...s, [t.name]: !s[t.name] }))}
                     style={{ display: 'flex', alignItems: 'center', gap: 10,
                              padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                              border: `1px solid ${selected[t.name] ? P.accentBorder : P.borderRow}`,
                              background: selected[t.name] ? P.accentSoft : '#fff',
                              marginBottom: 5 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4,
                                 border: `1.5px solid ${selected[t.name] ? P.accent : P.borderStrong}`,
                                 background: selected[t.name] ? P.accent : '#fff',
                                 display: 'inline-flex', alignItems: 'center',
                                 justifyContent: 'center', color: '#fff',
                                 fontSize: 10 }}>
                    {selected[t.name] ? '✓' : ''}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                                 color: P.ink }}>
                    {t.name}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                    {t.rows} rows
                  </span>
                  {t.pii_likely && (
                    <span data-testid="pii-likely"
                          style={{ marginLeft: 'auto', display: 'inline-flex',
                                   alignItems: 'center', height: 17, padding: '0 8px',
                                   borderRadius: 999, background: P.amberBg,
                                   color: P.amber, fontFamily: MONO, fontSize: 8.5,
                                   fontWeight: 700 }}>
                      PII LIKELY
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" variant="ghost" onClick={() => setStep(1)}>&larr; Back</Btn>
            <Btn data-testid="wiz-continue" size="sm" onClick={() => setStep(3)}
                 disabled={chosen.length === 0}>
              Continue &rarr; Freshness SLA
            </Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ ...card, padding: 18, maxWidth: 560 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: P.ink, fontFamily: FONT,
                        marginBottom: 4 }}>
            Freshness expectations
          </div>
          <div style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT,
                        marginBottom: 12 }}>
            How stale is too stale? Breaches raise alerts and mark the source at risk.
          </div>
          {chosen.map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '6px 0',
                                  borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: P.ink, flex: 1 }}>
                {t}
              </span>
              <input data-testid={`sla-${t}`} type="number" min="0"
                     value={slas[t] ?? ''} placeholder="24"
                     onChange={e => setSlas(s => ({ ...s, [t]: e.target.value }))}
                     style={{ width: 70, height: 28, borderRadius: 7,
                              border: `1px solid ${P.borderStrong}`, padding: '0 8px',
                              fontSize: 11.5, fontFamily: MONO, outline: 'none' }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>hours</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Btn size="sm" variant="ghost" onClick={() => setStep(2)}>&larr; Back</Btn>
            <Btn data-testid="wiz-continue" size="sm" onClick={() => setStep(4)}>
              Continue &rarr; Run health check
            </Btn>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ ...card, padding: 22, maxWidth: 560, textAlign: 'center' }}>
          {health.state === 'done' ? (
            <>
              <div data-testid="wiz-health-done"
                   style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                            height: 26, padding: '0 13px', borderRadius: 999,
                            background: P.greenBg, color: P.green, fontFamily: MONO,
                            fontSize: 11, fontWeight: 700 }}>
                Health check complete &middot; {health.tables} tables profiled
              </div>
              <div style={{ fontSize: 12.5, color: P.body, fontFamily: FONT,
                            margin: '12px 0 16px' }}>
                Gates evaluated, PII scanned, and the semantic scan queued its
                definitions for review.
              </div>
              <Btn data-testid="wiz-view-source"
                   onClick={() => navigate('/app/data/sources')}>
                View source
              </Btn>
            </>
          ) : health.state === 'failed' ? (
            <div style={{ fontSize: 12.5, color: P.red, fontFamily: FONT }}>
              {health.error || 'The health check failed.'}
            </div>
          ) : (
            <>
              <Spinner size={22} />
              <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT,
                            marginTop: 10 }}>
                Profiling {chosen.length} selected tables
                {health.step ? ` · step ${health.step} of 4` : ''}&hellip;
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
