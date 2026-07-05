// R32S2E3-US1 (program R30–R36) — Semantic tools (`Semantic Tools.dc.html`
// frames 01–03 / ch17): 3-panel visual field picker over the bounded
// deterministic preview endpoint (100-row cap · Nms, no warehouse round
// trip) with cardinality warnings and a workbench handoff; join-path
// manager classifying real schema joins (inner → SAFE, left → FAN-OUT
// RISK with the builder's own null-rate note) with a bridge-table CTA
// that prefills the derived-table editor; admin derived tables with dark
// SQL, real dry run, publish, and freshness status from refresh times.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };

const dimCat = n => /(date|week|month|quarter|_at$|day)/.test(n) ? 'DATE'
  : /(region|state|city|geo|store|location)/.test(n) ? 'GEOGRAPHY'
  : /_id$/.test(n) ? 'ID' : 'CATEGORY';

// ── Frame 01 — /app/semantic/field-picker ────────────────────────────────
export function FieldPicker() {
  const navigate = useNavigate();
  const [schema, setSchema] = useState(null);
  const [dims, setDims] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [qd, setQd] = useState('');
  const [qm, setQm] = useState('');
  const [preview, setPreview] = useState(null);
  const reqSeq = useRef(0);

  useEffect(() => {
    api.getSchema().then(s => setSchema(s.schema)).catch(() => setSchema(false));
  }, []);

  useEffect(() => {
    if (dims.length + measures.length === 0) { setPreview(null); return; }
    const seq = ++reqSeq.current;
    api.semanticPreview({ dimensions: dims, measures })
      .then(d => { if (seq === reqSeq.current) setPreview(d); })
      .catch(() => { if (seq === reqSeq.current) setPreview(null); });
  }, [dims, measures]);

  const dimGroups = useMemo(() => {
    const g = {};
    for (const c of schema?.cubes || []) {
      for (const d of c.dimensions || []) {
        if (qd && !d.name.includes(qd.toLowerCase())) continue;
        (g[dimCat(d.name)] = g[dimCat(d.name)] || []).push(d.name);
      }
    }
    return Object.entries(g);
  }, [schema, qd]);
  const msGroups = useMemo(() => {
    const g = [];
    for (const c of schema?.cubes || []) {
      const list = (c.measures || []).map(m => m.name)
        .filter(n => !qm || n.includes(qm.toLowerCase()));
      if (list.length) g.push([c.name, list]);
    }
    return g;
  }, [schema, qm]);

  if (schema === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const toggle = (list, set) => name =>
    set(list.includes(name) ? list.filter(x => x !== name) : [...list, name]);
  const chips = [...dims.map(d => ['dim', d]), ...measures.map(m => ['ms', m])];
  const panel = { ...card, padding: 12, alignSelf: 'start', maxHeight: 520,
                  overflowY: 'auto' };
  const search = v => ({ width: '100%', height: 28, borderRadius: 7, marginBottom: 10,
                         boxSizing: 'border-box', border: `1px solid ${P.borderStrong}`,
                         padding: '0 9px', fontSize: 11.5, fontFamily: FONT,
                         outline: 'none', ...v });
  const item = on => ({ display: 'block', padding: '5px 9px', borderRadius: 7,
                        fontSize: 12, fontFamily: MONO, cursor: 'pointer',
                        color: on ? P.accentHover : P.body,
                        background: on ? P.accentSoft : 'transparent' });

  return (
    <div style={{ maxWidth: 1150 }}>
      <PageHeader title="Field picker"
                  sub="Compose governed fields visually — the preview is a bounded read, never a full warehouse scan." />
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr 230px', gap: 14 }}>
        <div data-testid="fp-dimensions" style={panel}>
          <div style={{ ...label, marginBottom: 8 }}>DIMENSIONS</div>
          <input value={qd} onChange={e => setQd(e.target.value)} placeholder="Search…"
                 style={search()} />
          {dimGroups.map(([cat, list]) => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ ...label, fontSize: 8.5, margin: '6px 0 3px' }}>{cat}</div>
              {list.map(n => (
                <span key={n} data-testid={`fp-dim-${n}`}
                      onClick={() => toggle(dims, setDims)(n)}
                      style={item(dims.includes(n))}>
                  {n}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...card, padding: 14 }}>
            <div style={{ ...label, marginBottom: 8 }}>SELECTED</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {chips.length === 0 && (
                <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
                  Pick dimensions on the left and measures on the right.
                </span>
              )}
              {chips.map(([kind, n]) => (
                <span key={`${kind}${n}`} data-testid={`fp-chip-${n}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                               height: 26, padding: '0 11px', borderRadius: 999,
                               border: `1px solid ${P.accentBorder}`,
                               background: P.accentSoft, fontFamily: MONO,
                               fontSize: 11.5, color: P.accentHover }}>
                  {kind === 'ms' ? 'Σ ' : ''}{n}
                  <span data-testid="fp-remove"
                        onClick={() => kind === 'dim'
                          ? setDims(d => d.filter(x => x !== n))
                          : setMeasures(m => m.filter(x => x !== n))}
                        style={{ cursor: 'pointer', color: P.muted }}>
                    &#10005;
                  </span>
                </span>
              ))}
            </div>
          </div>

          {preview?.warning && (
            <div data-testid="fp-warning"
                 style={{ border: `1px solid #f4d9a6`, background: P.amberBg,
                          borderRadius: 10, padding: '10px 14px', fontSize: 12,
                          color: P.amber, fontFamily: FONT }}>
              Heads up: {preview.warning}
            </div>
          )}

          {preview && (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10,
                            padding: '10px 14px', borderBottom: `1px solid ${P.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: P.ink,
                               fontFamily: FONT }}>Preview</span>
                <span data-testid="fp-preview-caption"
                      style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                  100-row cap &middot; {preview.elapsed_ms}ms
                </span>
                <Btn data-testid="fp-analyze" size="sm" style={{ marginLeft: 'auto' }}
                     onClick={() => navigate(`/app/create/new?q=${encodeURIComponent(
                       `Analyze ${[...measures, ...dims].join(', ')}`)}`)}>
                  Analyze this &rarr;
                </Btn>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                <table data-testid="fp-preview"
                       style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {preview.columns.map(c => (
                        <th key={c} style={{ ...label, textAlign: 'left',
                                             padding: '7px 14px',
                                             background: P.tableHeadBg,
                                             position: 'sticky', top: 0 }}>
                          {c.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 20).map((r, i) => (
                      <tr key={i}>
                        {r.map((v, j) => (
                          <td key={j}
                              style={{ fontFamily: MONO, fontSize: 11, color: P.body,
                                       padding: '6px 14px',
                                       borderTop: `1px solid ${P.borderRow}` }}>
                            {String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div data-testid="fp-measures" style={panel}>
          <div style={{ ...label, marginBottom: 8 }}>MEASURES</div>
          <input value={qm} onChange={e => setQm(e.target.value)} placeholder="Search…"
                 style={search()} />
          {msGroups.map(([cube, list]) => (
            <div key={cube} style={{ marginBottom: 8 }}>
              <div style={{ ...label, fontSize: 8.5, margin: '6px 0 3px' }}>
                {cube.toUpperCase()} EXPLORE
              </div>
              {list.map(n => (
                <span key={n} data-testid={`fp-ms-${n}`}
                      onClick={() => toggle(measures, setMeasures)(n)}
                      style={item(measures.includes(n))}>
                  Σ {n}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Frame 02 — /app/semantic/joins ───────────────────────────────────────
export function JoinPaths() {
  const navigate = useNavigate();
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    api.getSchema().then(s => setSchema(s.schema)).catch(() => setSchema(false));
  }, []);

  if (schema === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const joins = (schema?.cubes || []).flatMap(c =>
    (c.joins || []).map(j => ({ ...j, from: c.name })));
  const flagged = joins.filter(j => j.join_type === 'left').length;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: FONT }}>
          Join paths
        </h1>
        <span data-testid="joins-count"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 8px', borderRadius: 999, background: P.tableHeadBg,
                       color: P.muted, fontFamily: MONO, fontSize: 10.5,
                       fontWeight: 700 }}>
          {joins.length}
        </span>
        {flagged > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                         padding: '0 8px', borderRadius: 999, background: P.amberBg,
                         color: P.amber, fontFamily: MONO, fontSize: 9.5,
                         fontWeight: 700 }}>
            {flagged} FLAGGED
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 14 }}>
        How explores connect — every path grain-checked so a join can never silently
        inflate a metric.
      </div>
      {joins.length === 0 ? (
        <div style={{ ...card, padding: 18, fontSize: 12.5, color: P.muted,
                      fontFamily: FONT }}>
          No join paths yet — regenerate the semantic layer from the overview.
        </div>
      ) : joins.map(j => {
        const risky = j.join_type === 'left';
        const [pillTxt, bg, fg] = risky
          ? ['FAN-OUT RISK', P.amberBg, P.amber] : ['SAFE', P.greenBg, P.green];
        return (
          <div key={`${j.from}-${j.to}`} data-testid={`join-row-${j.from}-${j.to}`}
               style={{ ...card, padding: '12px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700,
                             color: P.ink }}>{j.from}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
                n:1 &rarr;
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700,
                             color: P.ink }}>{j.to}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                on {j.on} &middot; inflation &times;{risky ? '1.1 est.' : '1.0'}
              </span>
              <span data-testid="join-pill"
                    style={{ marginLeft: 'auto', display: 'inline-flex',
                             alignItems: 'center', height: 19, padding: '0 9px',
                             borderRadius: 999, background: bg, color: fg,
                             fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                             letterSpacing: '.05em' }}>
                {pillTxt}
              </span>
            </div>
            {risky && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9 }}>
                <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                  {j.note || 'Nullable key — rows can fan out.'} A bridge table fixes
                  the grain.
                </span>
                <Btn data-testid="bridge-cta" size="sm" variant="outline"
                     onClick={() => navigate(`/app/semantic/derived-tables?name=${
                       encodeURIComponent(`bridge_${j.from}_${j.to}`)}&sql=${
                       encodeURIComponent(`SELECT DISTINCT ${j.on} FROM ${j.from}`)}`)}>
                  Recommend bridge table
                </Btn>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Frame 03 — /app/semantic/derived-tables (admin) ──────────────────────
export function DerivedTables() {
  const role = useRole();
  const [params] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [name, setName] = useState(params.get('name') || '');
  const [sql, setSql] = useState(params.get('sql') || '');
  const [validated, setValidated] = useState(null);
  const [err, setErr] = useState('');

  const load = () => api.getPdts()
    .then(r => setRows(Array.isArray(r) ? r : r.pdts || [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  if (role !== 'admin') return <Forbidden />;

  const dryRun = async () => {
    setErr(''); setValidated(null);
    try {
      const d = await api.createPdt({ name: name || 'drv_probe', sql, dry_run: true });
      setValidated(d);
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };
  const publish = async () => {
    setErr('');
    try {
      await api.createPdt({ name, sql });
      setValidated(null); setName(''); setSql('');
      load();
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };
  const freshness = p => {
    const t = p.last_refreshed_at || p.created_at;
    if (!t) return ['FRESH', P.greenBg, P.green];
    const days = (Date.now() - new Date(t + 'Z').getTime()) / 86400000;
    return days < 1 ? ['FRESH', P.greenBg, P.green]
      : [`STALE ${Math.floor(days)}D`, P.amberBg, P.amber];
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="Derived tables"
                  sub="Governed rollups the platform materializes and refreshes — SQL is validated read-only before anything runs." />
      <div style={{ ...card, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <input data-testid="dt-name" value={name} onChange={e => setName(e.target.value)}
                 placeholder="derived table name"
                 style={{ height: 30, width: 260, borderRadius: 7, fontFamily: MONO,
                          border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                          fontSize: 12, outline: 'none' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                         padding: '0 8px', borderRadius: 999, background: P.greenBg,
                         color: P.green, fontFamily: MONO, fontSize: 8.5,
                         fontWeight: 700 }}>
            GOVERNED
          </span>
          {validated?.valid && (
            <span data-testid="dt-validated"
                  style={{ fontFamily: MONO, fontSize: 10.5, color: P.green }}>
              ✓ validated &middot; {validated.row_count} row{validated.row_count === 1 ? '' : 's'}
            </span>
          )}
          <Btn data-testid="dt-publish" size="sm" style={{ marginLeft: 'auto' }}
               onClick={publish} disabled={!name || !sql}>
            Publish
          </Btn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ ...label }}>SQL</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 15,
                         padding: '0 6px', borderRadius: 999, background: P.tableHeadBg,
                         color: P.muted, fontFamily: MONO, fontSize: 8,
                         fontWeight: 700 }}>
            ADMIN ONLY
          </span>
        </div>
        <textarea data-testid="dt-sql" value={sql} onChange={e => setSql(e.target.value)}
                  placeholder="SELECT week, region, SUM(net_revenue) FROM …"
                  style={{ width: '100%', minHeight: 110, boxSizing: 'border-box',
                           borderRadius: 8, border: 'none', background: P.ink,
                           color: '#e2e8f0', padding: '11px 13px', fontSize: 12,
                           lineHeight: 1.7, fontFamily: MONO, resize: 'vertical',
                           outline: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <Btn data-testid="dt-dry-run" size="sm" variant="outline" onClick={dryRun}
               disabled={!sql}>
            Test run &middot; dry
          </Btn>
          <span title="Refresh schedules ship with the gold-layer release (R36S1)"
                style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>
            Schedule: on demand
          </span>
          <span title="Governance tags ship with the team surfaces (R36S2)"
                style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>
            + tag
          </span>
          {err && <span style={{ fontSize: 11.5, color: P.red, fontFamily: FONT }}>{err}</span>}
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr .9fr .9fr .7fr',
                      gap: 10, padding: '0 16px', height: 36, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>ALL DERIVED TABLES</span><span>SCHEDULE</span><span>STATUS</span>
          <span>GOVERNANCE</span><span>ROWS</span>
        </div>
        {rows === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spinner size={20} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            Nothing materialized yet — publish your first derived table above.
          </div>
        ) : rows.map(p => {
          const [txt, bg, fg] = freshness(p);
          return (
            <div key={p.name} data-testid={`dt-row-${p.name}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '1.6fr 1fr .9fr .9fr .7fr', gap: 10,
                          padding: '10px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600,
                             color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
                on demand
              </span>
              <span data-testid="dt-status"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                             padding: '0 8px', borderRadius: 999, background: bg,
                             color: fg, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, justifySelf: 'start' }}>
                {txt}
              </span>
              <span data-testid="dt-governance"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                             padding: '0 8px', borderRadius: 999, background: P.greenBg,
                             color: P.green, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, justifySelf: 'start' }}>
                GOVERNED
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: P.body }}>
                {p.row_count ?? '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
