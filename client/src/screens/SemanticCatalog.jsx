// R32S2E2-US1 (program R30–R36) — Metrics + dimensions catalogs (`Semantic
// Metrics.dc.html` frames 01–03 / ch17). The metrics table is live schema
// truth: conflicted vocabulary rows (pending vs accepted definition) tint
// amber and deep-link the review diff; deprecated rows (present in the
// previous schema version, absent in the latest — e.g. after a rollback)
// render gray; "+ Calculated metric" posts through the real endpoint.
// Metric detail shows the plain-English definition, ADMIN-ONLY compiled
// SQL (§5.6), lineage chips, live DQ tests, and schema versions.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const CONF_NUM = { high: 0.9, medium: 0.75, low: 0.55 };
const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const AGG = t => (t || 'sum').replace('count_distinct', 'count d').toUpperCase();
const fmtOf = ms => ms.format || (/(amount|revenue|price|cost)/.test(ms.sql || '')
  ? '$ USD' : /(pct|rate|ratio)/.test(ms.sql || ms.name) ? '%' : '#');

function useCatalog() {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const [sch, ex, conf, vs] = await Promise.all([
          api.getSchema(), api.semanticExplores(),
          api.semanticConflicts().catch(() => ({ conflicts: [] })),
          api.schemaVersions().catch(() => []),
        ]);
        let removed = [];
        if (vs.length >= 2) {
          try {
            const d = await api.artifactDiff('semantic_schema', vs[1].version, vs[0].version);
            removed = d.summary?.removed_metrics || [];
          } catch { /* no diff */ }
        }
        const byName = Object.fromEntries((ex.explores || []).map(r => [r.name, r]));
        const rows = [];
        for (const c of sch.schema?.cubes || []) {
          for (const ms of c.measures || []) {
            rows.push({ ...ms, cube: c.name, used_by: byName[c.name]?.used_by ?? 0 });
          }
        }
        setData({ rows, conflicts: conf.conflicts || [], removed,
                  version: sch.version, cubes: sch.schema?.cubes || [] });
      } catch { setData({ rows: [], conflicts: [], removed: [], cubes: [] }); }
    })();
  }, []);
  return data;
}

// ── Frame 01 — /app/semantic/metrics ─────────────────────────────────────
export function MetricsCatalog() {
  const navigate = useNavigate();
  const data = useCatalog();
  const [q, setQ] = useState('');
  const [composer, setComposer] = useState(false);
  const [calcName, setCalcName] = useState('');
  const [calcExpr, setCalcExpr] = useState('');
  const [err, setErr] = useState('');
  const [extra, setExtra] = useState([]);   // calc metrics added this visit

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const rows = [...data.rows, ...extra]
    .filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  const saveCalc = async () => {
    setErr('');
    try {
      await api.createCalculatedMetric({ name: calcName, expr: calcExpr });
      setExtra(x => [...x, { name: calcName, sql: calcExpr, type: 'calculated',
                             cube: 'calculated', confidence: 'high', used_by: 0 }]);
      setComposer(false); setCalcName(''); setCalcExpr('');
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };
  const grid = { display: 'grid', gap: 10, padding: '9px 16px', alignItems: 'center',
                 gridTemplateColumns: '1.4fr 2fr .6fr .7fr .9fr .8fr .7fr .5fr' };

  return (
    <div style={{ maxWidth: 1150 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: FONT }}>
          Metrics
        </h1>
        <span data-testid="metrics-count"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 8px', borderRadius: 999, background: P.tableHeadBg,
                       color: P.muted, fontFamily: MONO, fontSize: 10.5, fontWeight: 700 }}>
          {data.rows.length + extra.length}
        </span>
        <input data-testid="metric-search" value={q} onChange={e => setQ(e.target.value)}
               placeholder="Search metrics…"
               style={{ marginLeft: 'auto', height: 30, width: 220, borderRadius: 8,
                        border: `1px solid ${P.borderStrong}`, padding: '0 11px',
                        fontSize: 12, fontFamily: FONT, outline: 'none' }} />
        <Btn data-testid="add-calc-metric" size="sm"
             onClick={() => { setComposer(c => !c); setErr(''); }}>
          + Calculated metric
        </Btn>
      </div>
      <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 12 }}>
        Every governed number in the workspace — one definition each, conflicts surfaced
        until a human resolves them.
      </div>

      {composer && (
        <div style={{ ...card, padding: 14, marginBottom: 12, display: 'flex', gap: 8,
                      alignItems: 'center', flexWrap: 'wrap' }}>
          <input data-testid="calc-name" value={calcName}
                 onChange={e => setCalcName(e.target.value)}
                 placeholder="metric name (snake case)"
                 style={{ height: 30, width: 220, borderRadius: 7, fontFamily: MONO,
                          border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                          fontSize: 12, outline: 'none' }} />
          <input data-testid="calc-expr" value={calcExpr}
                 onChange={e => setCalcExpr(e.target.value)}
                 placeholder="expression over existing measures"
                 style={{ height: 30, flex: 1, minWidth: 240, borderRadius: 7,
                          border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                          fontSize: 12, fontFamily: MONO, outline: 'none' }} />
          <Btn data-testid="calc-save" size="sm" onClick={saveCalc}>Save</Btn>
          {err && <span style={{ fontSize: 11.5, color: P.red, fontFamily: FONT }}>{err}</span>}
        </div>
      )}

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ ...grid, padding: '0 16px', height: 36,
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>METRIC</span><span>DEFINITION</span><span>AGG</span><span>FORMAT</span>
          <span>SOURCE</span><span>CONFIDENCE</span><span>USED BY</span><span>VER</span>
        </div>

        {data.conflicts.map(c => (
          <div key={`cf${c.pending_id}`} data-testid={`metric-conflict-${c.pending_id}`}
               onClick={() => navigate(`/app/governance/review/${c.pending_id}`)}
               style={{ ...grid, background: P.amberBg, cursor: 'pointer',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700,
                             color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap' }}>{c.name}</span>
              <span data-testid="conflict-pill"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                             padding: '0 7px', borderRadius: 999, background: '#fff',
                             color: P.amber, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, flex: 'none' }}>
                &times;2 CONFLICT
              </span>
            </span>
            <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
              Two competing definitions — open to resolve
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>—</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>—</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>{c.explore}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: P.amber }}>
              {Number(c.pending_confidence).toFixed(2)}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>—</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>—</span>
          </div>
        ))}

        {rows.map(r => (
          <div key={`${r.cube}.${r.name}`} data-testid={`metric-live-${r.name}`}
               onClick={() => navigate(`/app/semantic/metrics/${r.name}`)}
               style={{ ...grid, cursor: 'pointer',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: P.ink,
                           overflow: 'hidden', textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap' }}>{r.name}</span>
            <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT,
                           overflow: 'hidden', textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap' }}>
              {r.title || `${AGG(r.type)} of ${r.sql || r.name}`}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: P.body }}>{AGG(r.type)}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: P.body }}>{fmtOf(r)}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: P.body,
                           overflow: 'hidden', textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap' }}>{r.cube}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600,
                           color: (CONF_NUM[r.confidence] ?? 0.75) >= 0.85 ? P.green : P.body }}>
              {(CONF_NUM[r.confidence] ?? 0.75).toFixed(2)}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>{r.used_by}</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
              v{String(data.version || '1').split('.')[0]}
            </span>
          </div>
        ))}

        {data.removed.map(name => (
          <div key={`dep${name}`} data-testid={`metric-deprecated-${name}`}
               style={{ ...grid, background: '#fafbfc',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.faint,
                             textDecoration: 'line-through', overflow: 'hidden',
                             textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <span data-testid="deprecated-pill"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                             padding: '0 7px', borderRadius: 999, background: P.tableHeadBg,
                             color: P.faint, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, flex: 'none' }}>
                DEPRECATED
              </span>
            </span>
            <span style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>
              Removed in the latest schema version
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>—</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>—</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>—</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>—</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>0</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>—</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Frame 02 — /app/semantic/metrics/:name ───────────────────────────────
export function MetricDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const role = useRole();
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sch, ex, vs] = await Promise.all([
          api.getSchema(), api.semanticExplores(), api.schemaVersions().catch(() => []),
        ]);
        let cube = null, ms = null;
        for (const c of sch.schema?.cubes || []) {
          const hit = (c.measures || []).find(m => m.name === name);
          if (hit) { cube = c; ms = hit; break; }
        }
        let tests = [];
        try {
          const latest = await api.governanceLatest();
          const all = await api.getDqTests(latest.connection_id);
          tests = (all || []).filter(t => !cube
            || t.table_name === (cube.sql_table || '').split('.').pop()
            || t.table_name === cube.name);
        } catch { /* none */ }
        const row = (ex.explores || []).find(r => r.name === cube?.name);
        setState({ cube, ms, tests, versions: vs, row });
      } catch { setState({ cube: null }); }
    })();
  }, [name]);

  if (state === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const { cube, ms, tests, versions, row } = state;
  if (!cube || !ms) {
    return (
      <div style={{ maxWidth: 700 }}>
        <PageHeader title="Metric not found"
                    sub="It may be deprecated in the latest schema version." />
        <Btn size="sm" variant="outline" onClick={() => navigate('/app/semantic/metrics')}>
          Back to metrics
        </Btn>
      </div>
    );
  }
  const conf = (CONF_NUM[ms.confidence] ?? 0.75).toFixed(2);
  const vMajor = String(versions[0]?.version || '1').split('.')[0];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        semantic / metrics
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: MONO }}>
          {name}
        </h1>
        <span data-testid="metric-status-pill"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 9px', borderRadius: 999, background: P.greenBg,
                       color: P.green, fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>
          GOVERNED &middot; v{vMajor}
        </span>
        <span data-testid="metric-conf-pill"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 9px', borderRadius: 999, background: P.tableHeadBg,
                       color: P.body, fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>
          CONF {conf}
        </span>
        <Btn size="sm" variant="outline" style={{ marginLeft: 'auto' }}
             title="Change proposals surface on the semantic overview — the layer scans usage and proposes, admins decide"
             onClick={() => navigate('/app/semantic')}>
          Propose change
        </Btn>
      </div>

      <div style={{ ...card, padding: 16, marginBottom: 12 }}>
        <div style={{ ...label, marginBottom: 7 }}>PLAIN-ENGLISH DEFINITION</div>
        <div data-testid="metric-plain-def"
             style={{ fontSize: 13, lineHeight: 1.6, color: P.body, fontFamily: FONT }}>
          {ms.title || `${AGG(ms.type)} of ${ms.sql || ms.name} on ${cube.name}`}
          {' '}&mdash; the single governed definition for &ldquo;{name}&rdquo; in
          this workspace.
        </div>
      </div>

      {role === 'admin' && (
        <div data-testid="metric-sql"
             style={{ background: P.ink, borderRadius: 10, padding: '13px 16px',
                      marginBottom: 12, fontFamily: MONO }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.07em',
                           color: '#64748b' }}>
              SQL EXPRESSION
            </span>
            <span data-testid="admin-only-pill"
                  style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center',
                           height: 16, padding: '0 7px', borderRadius: 999,
                           background: '#1e293b', color: '#94a3b8', fontSize: 8.5,
                           fontWeight: 700, letterSpacing: '.05em' }}>
              ADMIN ONLY
            </span>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.7, color: '#e2e8f0' }}>
            {AGG(ms.type)}({ms.sql || ms.name})
          </div>
        </div>
      )}

      <div style={{ ...card, padding: 16, marginBottom: 12 }}>
        {[['AGGREGATION', AGG(ms.type), 'metric-agg-row'],
          ['FORMAT', fmtOf(ms), null],
          ['ALLOWED FILTERS', (cube.dimensions || []).slice(0, 3).map(d => d.name)
            .join(' · ') || 'time', null]].map(([k, v, tid]) => (
          <div key={k} {...(tid ? { 'data-testid': tid } : {})}
               style={{ display: 'flex', gap: 12, padding: '6px 0',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ ...label, width: 150, flex: 'none' }}>{k}</span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.body }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ ...card, padding: 16, marginBottom: 12 }}>
        <div style={{ ...label, marginBottom: 8 }}>LINEAGE</div>
        <div data-testid="metric-lineage"
             style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[cube.name, name, `${row?.used_by ?? 0} dashboards`].map((chip, i) => (
            <span key={chip} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span style={{ color: P.faint }}>&rarr;</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 24,
                             padding: '0 11px', borderRadius: 7,
                             border: `1px solid ${P.borderStrong}`, background: '#fff',
                             fontFamily: MONO, fontSize: 11, color: P.body }}>
                {chip}
              </span>
            </span>
          ))}
        </div>
        <div onClick={() => navigate('/app/governance/lineage')}
             style={{ fontSize: 11.5, color: P.accent, cursor: 'pointer', marginTop: 8,
                      fontFamily: FONT }}>
          Open the full lineage graph
        </div>
      </div>

      <div style={{ ...card, padding: 16, marginBottom: 12 }}>
        <div style={{ ...label, marginBottom: 8 }}>TESTS</div>
        <div data-testid="metric-tests" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tests.length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              No custom tests target this metric&rsquo;s table yet &mdash; add one under
              Data quality rules.
            </span>
          ) : tests.map(t => (
            <span key={t.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22,
                           padding: '0 10px', borderRadius: 999,
                           background: t.last_status === 'PASS' ? P.greenBg : P.tableHeadBg,
                           color: t.last_status === 'PASS' ? P.green : P.muted,
                           fontFamily: MONO, fontSize: 9.5, fontWeight: 700 }}>
              {t.expression.toUpperCase().slice(0, 26)} {t.last_status === 'PASS' ? '✓' : ''}
            </span>
          ))}
        </div>
      </div>

      <div style={{ ...card, padding: 16 }}>
        <div style={{ ...label, marginBottom: 8 }}>VERSIONS</div>
        {versions.slice(0, 6).map(v => (
          <div key={v.id} data-testid={`metric-version-${v.version}`}
               style={{ display: 'flex', gap: 10, padding: '5px 0',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700,
                           color: P.ink }}>v{v.version}</span>
            <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
              {v.change_note}
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10,
                           color: P.faint }}>
              {(v.created_at || '').slice(0, 10)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Frame 03 — /app/semantic/dimensions ──────────────────────────────────
const catOf = d => {
  const n = d.name || '';
  if (d.type === 'time' || /(date|week|month|quarter|_at$|day)/.test(n)) return 'Date';
  if (/(region|country|city|geo|location|store)/.test(n)) return 'Geography';
  if (d.type === 'boolean' || /^(is|has)_/.test(n)) return 'Boolean';
  if (/_id$/.test(n) || n === 'id') return 'ID';
  if (/(segment|tier|category|status|channel|type)$/.test(n)) return 'Category';
  return d.type === 'number' ? 'Numeric' : 'Text';
};

export function DimensionsCatalog() {
  const [schema, setSchema] = useState(null);
  const [open, setOpen] = useState({});

  useEffect(() => {
    api.getSchema().then(s => setSchema(s.schema)).catch(() => setSchema(false));
  }, []);

  const groups = useMemo(() => {
    const g = {};
    for (const c of schema?.cubes || []) {
      for (const d of c.dimensions || []) {
        const k = catOf(d);
        (g[k] = g[k] || []).push({ ...d, cube: c.name });
      }
    }
    return Object.entries(g).sort((a, b) => b[1].length - a[1].length);
  }, [schema]);

  if (schema === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const total = groups.reduce((s, [, list]) => s + list.length, 0);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: FONT }}>
          Dimensions
        </h1>
        <span data-testid="dims-count"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 8px', borderRadius: 999, background: P.tableHeadBg,
                       color: P.muted, fontFamily: MONO, fontSize: 10.5, fontWeight: 700 }}>
          {total}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 14 }}>
        Every way the workspace can slice a metric, grouped by category.
      </div>
      {groups.length === 0 && (
        <div style={{ ...card, padding: 18, fontSize: 12.5, color: P.muted,
                      fontFamily: FONT }}>
          No dimensions yet — regenerate the semantic layer from the overview.
        </div>
      )}
      {groups.map(([cat, list]) => (
        <div key={cat} data-testid={`dim-group-${cat}`}
             style={{ ...card, marginBottom: 10, overflow: 'hidden' }}>
          <div data-testid="dim-group-toggle"
               onClick={() => setOpen(o => ({ ...o, [cat]: !o[cat] }))}
               style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44,
                        padding: '0 16px', cursor: 'pointer' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
              {cat}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                           padding: '0 8px', borderRadius: 999, background: P.tableHeadBg,
                           color: P.muted, fontFamily: MONO, fontSize: 10,
                           fontWeight: 700 }}>
              {list.length}
            </span>
            <svg width="11" height="11" viewBox="0 0 12 12" style={{ marginLeft: 'auto',
                 transform: open[cat] ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
              <path d="M2 4l4 4 4-4" fill="none" stroke={P.muted} strokeWidth="1.6" />
            </svg>
          </div>
          {open[cat] && list.map(d => (
            <div key={`${d.cube}.${d.name}`} data-testid={`dim-item-${d.cube}-${d.name}`}
                 style={{ display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 16px', borderTop: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: P.ink }}>{d.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>{d.cube}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                             padding: '0 7px', borderRadius: 999, background: P.tableHeadBg,
                             color: P.muted, fontFamily: MONO, fontSize: 8.5 }}>
                {d.type}
              </span>
              <span data-testid="dim-item-conf"
                    style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11,
                             fontWeight: 600, color: P.body }}>
                {(CONF_NUM[d.confidence] ?? 0.75).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
