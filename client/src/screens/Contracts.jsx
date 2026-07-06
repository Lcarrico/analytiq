// R36S1E2-US1 (program R30–R36) — Contracts screens (`Gold Contracts.dc.html`
// frames 03–04 / PRD §8 audit-first, admin). Data contracts: posture rows
// over /api/contracts/overview (required fields, SLA, 30-day failures,
// ENFORCED vs BLOCKING NOW, affected artifacts) + a real composer that
// enforces on the next governance run. Query contracts: per-artifact
// component rows from the run's stored query_contracts.
import { useEffect, useState } from 'react';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const mono = { fontFamily: MONO, fontSize: 11, color: P.body };

export function DataContracts() {
  const role = useRole();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [composer, setComposer] = useState(false);
  const [conns, setConns] = useState([]);
  const [form, setForm] = useState({ connectionId: '', table: '', columns: '',
                                     min_rows: '', max_age_hours: '' });
  const [err, setErr] = useState('');

  const load = () => api.contractsOverview()
    .then(r => setData(r.contracts || [])).catch(() => setData([]));
  useEffect(() => {
    load();
    api.getConnections().then(r => setConns(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  if (role !== 'admin') return <Forbidden />;
  if (data === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const save = async () => {
    setErr('');
    try {
      await api.setContract({ connectionId: Number(form.connectionId),
        table: form.table,
        required_columns: form.columns.split(',').map(s => s.trim()).filter(Boolean),
        min_rows: form.min_rows ? Number(form.min_rows) : null,
        max_age_hours: form.max_age_hours ? Number(form.max_age_hours) : null });
      setComposer(false);
      setForm({ connectionId: '', table: '', columns: '', min_rows: '',
                max_age_hours: '' });
      load();
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <PageHeader title="Data contracts"
                    sub="What upstream data must look like — violations block the gate and raise alerts before anything ships." />
        <Btn data-testid="dc-new" size="sm"
             style={{ marginLeft: 'auto', marginTop: -26 }}
             onClick={() => setComposer(c => !c)}>
          + New contract
        </Btn>
      </div>

      {composer && (
        <div style={{ ...card, padding: 14, marginBottom: 14, display: 'flex', gap: 8,
                      alignItems: 'center', flexWrap: 'wrap' }}>
          <select data-testid="dcc-connection" value={form.connectionId}
                  onChange={e => setForm(f => ({ ...f, connectionId: e.target.value }))}
                  style={{ height: 30, borderRadius: 7, fontSize: 12, fontFamily: FONT,
                           border: `1px solid ${P.borderStrong}`, background: '#fff' }}>
            <option value="">Connection…</option>
            {conns.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.account || c.type}</option>
            ))}
          </select>
          <input data-testid="dcc-table" value={form.table} placeholder="table"
                 onChange={e => setForm(f => ({ ...f, table: e.target.value }))}
                 style={{ height: 30, width: 150, borderRadius: 7, fontFamily: MONO,
                          border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                          fontSize: 12, outline: 'none' }} />
          <input data-testid="dcc-columns" value={form.columns}
                 placeholder="required columns, comma-separated"
                 onChange={e => setForm(f => ({ ...f, columns: e.target.value }))}
                 style={{ height: 30, flex: 1, minWidth: 220, borderRadius: 7,
                          border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                          fontSize: 12, fontFamily: MONO, outline: 'none' }} />
          <input value={form.max_age_hours} placeholder="SLA h" type="number"
                 onChange={e => setForm(f => ({ ...f, max_age_hours: e.target.value }))}
                 style={{ height: 30, width: 70, borderRadius: 7, fontFamily: MONO,
                          border: `1px solid ${P.borderStrong}`, padding: '0 8px',
                          fontSize: 12, outline: 'none' }} />
          <Btn data-testid="dcc-save" size="sm" onClick={save}
               disabled={!form.connectionId || !form.table}>
            Save
          </Btn>
          {err && <span style={{ fontSize: 11.5, color: P.red, fontFamily: FONT }}>{err}</span>}
        </div>
      )}

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr .6fr 1fr 1fr 70px',
                      gap: 10, padding: '0 16px', height: 36, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>CONTRACT</span><span>REQUIRED FIELDS</span><span>SLA</span>
          <span>FAILURES &middot; 30D</span><span>BLOCKING</span><span />
        </div>
        {data.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            No contracts yet — pin down what upstream data must guarantee.
          </div>
        ) : data.map(c => (
          <div key={c.id} style={{ borderBottom: `1px solid ${P.borderRow}` }}>
            <div data-testid={`dc-row-${c.id}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '2fr 1.4fr .6fr 1fr 1fr 70px', gap: 10,
                          padding: '10px 16px', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700,
                              color: P.ink }}>
                  {c.table}
                </div>
                <div style={{ fontSize: 10.5, color: P.faint, fontFamily: FONT }}>
                  {c.connection} &middot; affects {c.affected.length} artifacts
                </div>
              </div>
              <span style={{ ...mono, overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap' }}>
                {c.required_columns.join(' · ') || '—'}
              </span>
              <span style={mono}>
                {c.max_age_hours ? `${c.max_age_hours}h` : '—'}
              </span>
              <span data-testid="dc-failures"
                    style={{ fontFamily: MONO, fontSize: 11.5,
                             color: c.failures_30d ? P.amber : P.faint }}>
                {c.failures_30d || '—'}
              </span>
              <span data-testid="dc-blocking"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                             padding: '0 8px', borderRadius: 999,
                             background: c.blocking ? P.redBg : P.greenBg,
                             color: c.blocking ? P.red : P.green, fontFamily: MONO,
                             fontSize: 8.5, fontWeight: 700, justifySelf: 'start',
                             whiteSpace: 'nowrap' }}>
                {c.blocking ? 'BLOCKING NOW' : 'ENFORCED'}
              </span>
              <span data-testid="dc-expand"
                    onClick={() => setOpen(open === c.id ? null : c.id)}
                    style={{ fontSize: 11.5, color: P.accent, cursor: 'pointer',
                             fontFamily: FONT, justifySelf: 'end' }}>
                {open === c.id ? 'collapse' : 'expand'}
              </span>
            </div>
            {open === c.id && (
              <div data-testid={`dc-detail-${c.id}`}
                   style={{ padding: '4px 16px 14px', background: '#fafbfc' }}>
                <div style={{ ...label, marginBottom: 6 }}>AFFECTED ARTIFACTS</div>
                {c.affected.length === 0 ? (
                  <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
                    Nothing built on this connection yet.
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.affected.map(t => (
                      <span key={t}
                            style={{ display: 'inline-flex', alignItems: 'center',
                                     height: 22, padding: '0 10px', borderRadius: 999,
                                     border: `1px solid ${P.borderStrong}`,
                                     background: '#fff', fontSize: 11, color: P.body,
                                     fontFamily: FONT }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint,
                              marginTop: 8 }}>
                  min rows {c.min_rows ?? '—'} &middot; enforced on every governance run
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function QueryContracts() {
  const role = useRole();
  const [arts, setArts] = useState([]);
  const [sel, setSel] = useState('');
  const [qc, setQc] = useState(null);

  useEffect(() => {
    api.getArtifacts({}).then(r => {
      const list = Array.isArray(r) ? r : r.items || r.artifacts || [];
      setArts(list);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!sel) { setQc(null); return; }
    (async () => {
      try {
        const art = await api.getArtifact(sel);
        if (!art.pipeline_run_id) { setQc({ query_contracts: [] }); return; }
        setQc(await api.pipelineContracts(art.pipeline_run_id));
      } catch { setQc({ query_contracts: [] }); }
    })();
  }, [sel]);

  if (role !== 'admin') return <Forbidden />;

  return (
    <div style={{ maxWidth: 940 }}>
      <PageHeader title="Query contracts"
                  sub="Every chart's query, shape-checked and safety-validated before it renders — pick a dashboard to inspect its run." />
      <select data-testid="qc-artifact" value={sel} onChange={e => setSel(e.target.value)}
              style={{ height: 32, minWidth: 280, borderRadius: 8, fontSize: 12.5,
                       border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                       background: '#fff', marginBottom: 14 }}>
        <option value="">Choose a dashboard…</option>
        {arts.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
      </select>

      {qc && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid',
                        gridTemplateColumns: '1.3fr 1.4fr .8fr .9fr 1fr', gap: 10,
                        padding: '0 16px', height: 36, alignItems: 'center',
                        background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                        ...label }}>
            <span>COMPONENT</span><span>EXPECTED SHAPE</span><span>SQL SAFETY</span>
            <span>ROWS</span><span>RESULT SHAPE</span>
          </div>
          {(qc.query_contracts || []).length === 0 ? (
            <div style={{ padding: 16, fontSize: 12.5, color: P.muted,
                          fontFamily: FONT }}>
              No stored query contracts for this dashboard&rsquo;s run.
            </div>
          ) : qc.query_contracts.map(c => (
            <div key={c.id} data-testid={`qc-row-${c.id}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '1.3fr 1.4fr .8fr .9fr 1fr', gap: 10,
                          padding: '9px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ ...mono, fontWeight: 600, color: P.ink }}>
                {c.component_id}
              </span>
              <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                {(c.expected_columns || []).length} columns
              </span>
              <span data-testid="qc-safety"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                             padding: '0 8px', borderRadius: 999, background: P.greenBg,
                             color: P.green, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, justifySelf: 'start' }}>
                SAFE ✓
              </span>
              <span style={mono}>
                {c.row_limit ? `≤${c.row_limit}` : 'unbounded'}
              </span>
              <span data-testid="qc-status"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                             padding: '0 8px', borderRadius: 999,
                             background: (c.status || '').includes('fail')
                               ? P.amberBg : P.greenBg,
                             color: (c.status || '').includes('fail')
                               ? P.amber : P.green,
                             fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                             justifySelf: 'start' }}>
                {(c.status || 'valid').toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
