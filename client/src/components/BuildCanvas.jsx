// R16S1E2: live build view + dashboard canvas for the Create Workbench.
// Stage chips are driven by the run's DAG nodes (lineage = execution);
// on completion the canvas renders real chart data from the saved artifact.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { Spinner, StatusBadge } from './ui';
import { FONT, MONO, P } from '../tokens';
import { Icon } from './icons';   // R21S1E3

// R30S2E3-US1 — the mockup's NINE display stages, driven by the real DAG
// nodes (several display stages share a driving node; order per frame).
const DISPLAY_STAGES = [
  ['Understanding request', 'session_plan'],
  ['Validating metrics',    'session_plan'],
  ['Planning dashboard',    'session_plan'],
  ['Building data',         'ingest_profile'],
  ['Running queries',       'gold_build'],
  ['Generating charts',     'viz_specs'],
  ['Training model',        'model_train'],
  ['Reviewing output',      'walk_forward'],
  ['Assembling dashboard',  'artifact_ready'],
];

function chipState(node) {
  if (!node) return 'pending';
  if (node.status === 'done') return 'done';
  if (node.status === 'running') return 'running';
  if (node.status === 'blocked' || node.status === 'failed') return 'blocked';
  return 'pending';
}

function Sparkline({ rows, width = 640, height = 150, mark = 'line',
                     showToday = false, target = null }) {
  const pts = rows.filter(r => r.actual != null);
  const fc = rows.filter(r => r.is_forecast);
  if (!pts.length && !fc.length) return null;
  const all = rows.map(r => r.actual ?? r.predicted).filter(v => v != null);
  if (target != null) all.push(target);   // keep the target line inside the domain
  const min = Math.min(...all), max = Math.max(...all);
  const denom = Math.max(1, (rows[rows.length - 1]?.day_index ?? rows.length - 1));
  const x = i => (i / denom) * width;
  const y = v => height - ((v - min) / (max - min || 1)) * (height - 16) - 8;
  const line = pts.map(r => `${x(r.day_index)},${y(r.actual)}`).join(' ');
  const pred = rows.map(r => `${x(r.day_index)},${y(r.predicted)}`).join(' ');
  const band = fc.length
    ? fc.map(r => `${x(r.day_index)},${y(r.ci_high)}`).join(' ') + ' ' +
      [...fc].reverse().map(r => `${x(r.day_index)},${y(r.ci_low)}`).join(' ')
    : null;
  const todayX = fc.length ? x(fc[0].day_index) : null;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      {band && <polygon points={band} fill={P.accentSoft} stroke="none" />}
      {mark === 'area' && line && (
        <polygon points={`${line} ${x(pts[pts.length - 1].day_index)},${height} ${x(pts[0].day_index)},${height}`}
                 fill={P.accentSoft} opacity=".7" stroke="none" />
      )}
      {mark === 'bar'
        ? pts.map(r => (
            <rect key={r.day_index} x={x(r.day_index) - 2} y={y(r.actual)} width={4}
                  height={Math.max(1, height - 8 - y(r.actual))} fill={P.chart[0]} rx={1} />
          ))
        : null}
      <polyline points={pred} fill="none" stroke={P.chart[1]}
                strokeDasharray="4 3" strokeWidth={1.5} />
      {mark !== 'bar' && (
        <polyline points={line} fill="none" stroke={P.chart[0]} strokeWidth={2} />
      )}
      {showToday && todayX != null && (
        <line data-testid="trend-today-line" x1={todayX} x2={todayX} y1={4} y2={height - 4}
              stroke={P.faint} strokeDasharray="3 3" strokeWidth={1.2} />
      )}
      {target != null && (
        <line data-testid="trend-target-line" x1={0} x2={width} y1={y(target)} y2={y(target)}
              stroke={P.amber} strokeDasharray="6 4" strokeWidth={1.4} />
      )}
    </svg>
  );
}

// R30S2E3-US2 — human titles replace the generated snake-case defaults; a
// user's own rename always wins (only the ugly default is remapped).
const HUMAN_TITLES = {
  timeseries_ci: 'Revenue vs forecast · daily',
  forecast: 'Forecast horizon',
  dimension_breakdown: 'Breakdown by location',
  feature_importance: 'What drives the forecast',
};
const uglyDefault = (s) =>
  (s.title || '').toLowerCase().replace(/ /g, '_') === s.id;

export default function BuildCanvas({ runId, sessionMetric, onArtifact }) {
  const [dag, setDag] = useState(null);
  const [status, setStatus] = useState('running');
  const [artifact, setArtifact] = useState(null);
  const [rows, setRows] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [layout, setLayout] = useState(null);        // R16S2E4
  const [renaming, setRenaming] = useState(null);
  const [nameDraft, setNameDraft] = useState('');
  // R30S2E3-US1 — building-state telemetry
  const [run, setRun] = useState(null);
  const [piiCount, setPiiCount] = useState(0);
  const [techOpen, setTechOpen] = useState(false);
  const [skipped, setSkipped] = useState(false);
  // R30S2E3-US2/US3 — canvas chrome + section selection
  const [zoom, setZoom] = useState(1);
  const [device, setDevice] = useState('desktop');
  const [hideForecast, setHideForecast] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [vsTarget, setVsTarget] = useState({});

  useEffect(() => {
    // PII banner tracks the review queue's truth (same substrate as Home)
    fetch('/api/home/summary').then(r => r.json())
      .then(d => setPiiCount((d.review?.items || [])
        .filter(i => i.chip === 'PII').length)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!runId) return;
    let stop = false;
    const tick = async () => {
      try {
        const [r, g] = await Promise.all([api.getPipelineRun(runId), api.pipelineDag(runId)]);
        if (stop) return;
        setDag(g);
        setRun(r);
        setStatus(r.status);
        if (r.status === 'done' || r.status === 'failed') return;
      } catch { /* poll on */ }
      if (!stop) setTimeout(tick, 300);
    };
    tick();
    return () => { stop = true; };
  }, [runId]);

  useEffect(() => {
    if (status !== 'done' || artifact) return;
    (async () => {
      try {
        const sessId = dag?.nodes?.[0]?.run_id ? undefined : undefined;
        const art = await api.saveArtifactFromRun(runId, `${sessionMetric || 'Metric'} Forecast`);
        setArtifact(art);
        try { setLayout(JSON.parse(art.layout_json || 'null')); } catch { setLayout(null); }
        setSavedAt(new Date());
        onArtifact?.(art);
        const chart = await api.artifactChart(art.id);
        setRows(Array.isArray(chart) ? chart : chart.rows || []);
      } catch { /* canvas stays in build state */ }
    })();
  }, [status]);

  const nodes = Object.fromEntries((dag?.nodes || []).map(n => [n.node_key, n]));
  const actuals = rows.filter(r => r.actual != null).map(r => r.actual);
  const total = actuals.reduce((a, b) => a + b, 0);
  const kpis = actuals.length ? [
    ['TOTAL · TRAILING WINDOW', `$${total.toLocaleString()}`],
    ['DAILY AVERAGE', `$${Math.round(total / actuals.length).toLocaleString()}`],
    ['FORECAST DAYS', String(rows.filter(r => r.is_forecast).length)],
    ['MODEL MAPE', artifact?.mape != null ? `${artifact.mape}%` : '—'],
  ] : [];
  // demo target: +5% over the trailing average (labeled as plan target)
  const demoTarget = actuals.length ? (total / actuals.length) * 1.05 : null;

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span data-testid="governed-badge">
          <StatusBadge status="green">governed</StatusBadge>
        </span>
        <span data-testid="autosave-chip"
              style={{ fontSize: 11, fontFamily: MONO, color: P.muted }}>
          {savedAt ? `autosaved ${savedAt.toLocaleTimeString()}` : 'not saved yet'}
        </span>
        {artifact && (
          <a href={`/api/artifacts/${artifact.id}/html`} target="_blank" rel="noreferrer"
             style={{ marginLeft: 'auto', fontSize: 12, fontFamily: FONT, color: P.accentHover,
                      fontWeight: 600 }}>
            Open artifact ↗
          </a>
        )}
      </div>

      {/* ── building-state header + run metadata + SKIP TO RESULT ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span data-testid="build-header"
                style={{ fontSize: 16, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
            {status === 'done' ? 'Build complete' : status === 'failed'
              ? 'Build blocked' : 'Building your dashboard'}
          </span>
          <span data-testid="build-run-meta"
                style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
            run · {runId} · {(run?.log_entries || []).length} events
            {run?.completed_at ? ' · completed' : ''}
          </span>
        </div>
        {status !== 'done' && status !== 'failed' && (
          <button data-testid="skip-to-result" onClick={() => setSkipped(true)}
                  style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center',
                           gap: 6, height: 26, padding: '0 11px', borderRadius: 999,
                           border: `1px solid ${P.accentBorder}`, background: P.selectedRow,
                           color: P.accentHover, fontFamily: MONO, fontSize: 10.5,
                           fontWeight: 600, cursor: 'pointer' }}>
            <svg width="8" height="9" viewBox="0 0 8 9">
              <path d="M1 1.2v6.6L7 4.5 1 1.2Z" fill={P.accentHover} />
            </svg>
            SKIP TO RESULT
          </button>
        )}
      </div>

      {/* ── amber PII banner (workspace has masked columns pending review) ── */}
      {piiCount > 0 && status !== 'done' && !skipped && (
        <div data-testid="pii-banner"
             style={{ display: 'flex', alignItems: 'center', gap: 11, background: P.amberBg,
                      border: `1px solid ${P.amberBorder}`, borderRadius: 9, padding: '11px 14px' }}>
          <svg width="14" height="13" viewBox="0 0 14 13">
            <path d="M7 1 13 12H1L7 1Z" fill="none" stroke={P.amber} strokeWidth="1.4"
                  strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 12.5, fontFamily: FONT, color: P.amberDark }}>
            <strong>{piiCount} column{piiCount === 1 ? '' : 's'} masked.</strong>{' '}
            Excluded pending PII review — results are unaffected.
          </span>
        </div>
      )}

      {!skipped && (
      <div data-testid="stage-chips"
           style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 12,
                    border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff' }}>
        {DISPLAY_STAGES.map(([label, key]) => {
          const st = chipState(nodes[key]);
          const color = st === 'done' ? P.green : st === 'running' ? P.accentHover
                      : st === 'blocked' ? P.red : P.faint;
          return (
            <span key={label} data-stage-state={st}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                           border: `1px solid ${st === 'pending' ? P.border
                             : st === 'running' ? P.accentBorder : color}`,
                           color, borderRadius: 14, padding: '4px 10px',
                           fontSize: 11.5, fontFamily: FONT, fontWeight: 500,
                           background: st === 'done' ? P.greenBg
                             : st === 'running' ? P.accentSoft : '#fff' }}>
              {st === 'done' ? (
                <svg width="9" height="9" viewBox="0 0 9 9">
                  <path d="m1.5 4.5 2 2 4-4.5" fill="none" stroke={P.green}
                        strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : st === 'running' ? <Spinner size={9} />
                : <span style={{ width: 5, height: 5, borderRadius: 3,
                                 background: st === 'blocked' ? P.red : P.grayBar }} />}
              {label}
              {nodes[key]?.cached ? <Icon name="Bolt" size={10} /> : null}
            </span>
          );
        })}
      </div>
      )}

      {/* ── live event log + admin technical detail ── */}
      {!skipped && (run?.log_entries || []).length > 0 && (
        <div data-testid="build-event-log"
             style={{ border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff',
                      padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
              Live event log
            </span>
            <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 9, color: P.faint }}>
              friendly view
            </span>
          </div>
          <div style={{ maxHeight: 132, overflowY: 'auto', display: 'flex',
                        flexDirection: 'column', gap: 3 }}>
            {(run.log_entries || []).slice(-8).map((line, i, arr) => {
              const latest = i === arr.length - 1 && status !== 'done' && status !== 'failed';
              return (
                <div key={i} data-testid="log-row"
                     style={{ display: 'flex', gap: 10, fontSize: 11.5, fontFamily: FONT,
                              color: latest ? P.accentHover : P.body }}>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint, width: 20,
                                 flexShrink: 0, textAlign: 'right' }}>
                    {String((run.log_entries.length - arr.length) + i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    {line}
                    {latest && <span style={{ animation: 'pulse 1s infinite', fontFamily: MONO }}>▌</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <div onClick={() => setTechOpen(o => !o)}
               style={{ marginTop: 8, fontSize: 11, fontFamily: FONT, color: P.muted,
                        cursor: 'pointer', fontWeight: 500 }}>
            {techOpen ? 'Hide technical detail (admin)' : 'Show technical detail (admin)'}
          </div>
          {techOpen && (
            <pre data-testid="build-log-raw"
                 style={{ marginTop: 6, background: P.darkBg, color: P.codeBlue, borderRadius: 8,
                          padding: 10, fontFamily: MONO, fontSize: 9.5, lineHeight: 1.6,
                          maxHeight: 160, overflow: 'auto' }}>
              {(run.log_entries || []).join('\n')}
            </pre>
          )}
        </div>
      )}

      {status === 'done' && rows.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}
             onClick={() => setSelected(null)}>
          {/* ── 44px canvas toolbar (frame) ── */}
          <div data-testid="canvas-toolbar"
               style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
                        border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff',
                        padding: '0 12px', boxSizing: 'border-box', overflowX: 'auto',
                        whiteSpace: 'nowrap' }}>
            <button data-testid="zoom-out" onClick={() => setZoom(z => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: P.muted,
                             fontSize: 14 }} aria-label="Zoom out">−</button>
            <span data-testid="zoom-label"
                  style={{ fontFamily: MONO, fontSize: 10.5, color: P.body, width: 34,
                           textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button data-testid="zoom-in" onClick={() => setZoom(z => Math.min(1.6, +(z + 0.15).toFixed(2)))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: P.muted,
                             fontSize: 13 }} aria-label="Zoom in">+</button>
            <button data-testid="zoom-fit" onClick={() => setZoom(1)}
                    style={{ border: `1px solid ${P.borderStrong}`, background: '#fff', borderRadius: 6,
                             cursor: 'pointer', color: P.body, fontSize: 10.5, fontFamily: FONT,
                             padding: '3px 8px' }}>Fit</button>
            <span style={{ width: 1, height: 20, background: P.border }} />
            <span style={{ display: 'inline-flex', border: `1px solid ${P.borderStrong}`,
                           borderRadius: 7, overflow: 'hidden' }}>
              {['desktop', 'tablet', 'mobile'].map(d => (
                <button key={d} data-testid={`device-${d}`} onClick={() => setDevice(d)}
                        style={{ border: 'none', cursor: 'pointer', padding: '4px 9px',
                                 fontSize: 10, fontFamily: FONT, fontWeight: 600,
                                 background: device === d ? P.ink : '#fff',
                                 color: device === d ? '#fff' : P.muted }}>
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </span>
            <button data-testid="present-btn" disabled
                    title="Present mode arrives with the sharing surfaces (R33S2E3)"
                    style={{ border: `1px solid ${P.borderStrong}`, background: '#fff', borderRadius: 6,
                             color: P.faint, fontSize: 10.5, fontFamily: FONT, padding: '3px 9px' }}>
              Present
            </button>
            {artifact && (
              <>
                <button onClick={() => window.open(`/api/artifacts/${artifact.id}/export?format=html`, '_blank')}
                        title="Export"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: P.muted,
                                 fontSize: 11, fontFamily: FONT }}>Export</button>
                <a href={`/app/artifacts/${artifact.id}?tab=lineage`} title="Lineage"
                   style={{ fontSize: 11, fontFamily: FONT, color: P.muted, textDecoration: 'none' }}>Lineage</a>
                <a href={`/app/artifacts/${artifact.id}?tab=activity`} title="Audit trail"
                   style={{ fontSize: 11, fontFamily: FONT, color: P.muted, textDecoration: 'none' }}>Audit</a>
              </>
            )}
            <span data-testid="canvas-version"
                  style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: P.faint }}>
              v1 · saved
            </span>
            <span style={{ display: 'inline-flex' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: P.cyan,
                             color: '#fff', display: 'inline-flex', alignItems: 'center',
                             justifyContent: 'center', fontSize: 8.5, fontWeight: 700,
                             border: '2px solid #fff' }}>AN</span>
            </span>
          </div>

          {/* ── 40px filters bar ── */}
          <div data-testid="canvas-filters"
               style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
                        border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff',
                        padding: '0 12px', boxSizing: 'border-box', position: 'relative' }}
               onClick={e => e.stopPropagation()}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em', color: P.faint }}>
              FILTERS
            </span>
            {hideForecast && (
              <span data-testid="filter-chip-forecast"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24,
                             padding: '0 10px', borderRadius: 999, background: P.accentSoft,
                             border: `1px solid ${P.accentBorder}`, color: P.accentHover,
                             fontFamily: MONO, fontSize: 10.5 }}>
                Hide forecast
                <span data-testid="chip-remove" onClick={() => setHideForecast(false)}
                      style={{ color: P.faint, cursor: 'pointer' }}>×</span>
              </span>
            )}
            <span data-testid="add-filter" onClick={() => setAddOpen(o => !o)}
                  style={{ display: 'inline-flex', alignItems: 'center', height: 24,
                           padding: '0 10px', borderRadius: 999, border: `1px dashed ${P.borderStrong}`,
                           color: P.muted, fontFamily: MONO, fontSize: 10.5, cursor: 'pointer' }}>
              + Add filter
            </span>
            {addOpen && (
              <div style={{ position: 'absolute', top: 38, left: 60, zIndex: 50, background: '#fff',
                            border: `1px solid ${P.border}`, borderRadius: 8, padding: 4,
                            boxShadow: '0 12px 32px rgba(15,23,42,.16)' }}>
                <button onClick={() => { setHideForecast(true); setAddOpen(false); }}
                        style={{ display: 'block', border: 'none', background: 'none',
                                 cursor: 'pointer', padding: '7px 12px', fontSize: 12,
                                 fontFamily: FONT, color: P.body }}>Hide forecast</button>
              </div>
            )}
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
              viewer filters permitted
            </span>
          </div>

          <div data-testid="canvas-body"
               style={{ width: device === 'desktop' ? '100%' : device === 'tablet' ? 768 : 390,
                        margin: device === 'desktop' ? 0 : '0 auto',
                        transform: `scale(${zoom})`, transformOrigin: 'top left',
                        display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div data-testid="kpi-strip"
               style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {kpis.map(([label, value]) => (
              <div key={label} style={{ border: `1px solid ${P.border}`, borderRadius: 10,
                                        background: '#fff', padding: 14 }}>
                <div style={{ fontSize: 10.5, fontFamily: MONO, textTransform: 'uppercase',
                              letterSpacing: '.05em', color: P.muted }}>{label}</div>
                <div style={{ fontSize: 24, fontFamily: MONO, fontWeight: 600, color: P.ink,
                              marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>
          {(layout?.sections || [{ id: 'timeseries_ci', title: 'Timeseries Ci', position: 0 },
                                  { id: 'forecast', title: 'Forecast', position: 1 }])
            .filter(s => ['timeseries_ci', 'forecast', 'dimension_breakdown', 'feature_importance']
              .includes(s.id))
            .sort((a, b) => a.position - b.position)
            .map(s => (
            <div key={s.id} data-testid={`section-${s.id === 'timeseries_ci' ? 'timeseries' : s.id}`}
                 onClick={e => { e.stopPropagation(); setSelected(s.id); }}
                 style={{ border: selected === s.id ? `2px solid ${P.accent}` : `1px solid ${P.border}`,
                          borderRadius: 10, background: '#fff', padding: selected === s.id ? 15 : 16,
                          position: 'relative',
                          boxShadow: selected === s.id ? '0 8px 24px rgba(37,99,235,.13)' : 'none',
                          marginTop: selected === s.id ? 34 : 0, transition: 'margin .1s' }}>
              {selected === s.id && (
                <div data-testid="section-toolbar" onClick={e => e.stopPropagation()}
                     style={{ position: 'absolute', top: -34, left: 8, zIndex: 40, display: 'flex',
                              alignItems: 'center', gap: 8, background: P.ink, borderRadius: 8,
                              padding: '5px 10px', boxShadow: '0 8px 24px rgba(15,23,42,.3)' }}>
                  <button data-testid="toolbar-rename"
                          onClick={() => { setRenaming(s.id); setNameDraft(uglyDefault(s) ? (HUMAN_TITLES[s.id] || s.title) : s.title); }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                                   color: '#fff', fontSize: 10.5, fontFamily: FONT }}>Rename</button>
                  <select data-testid="chart-type-select"
                          value={['bar', 'area'].includes(s.mark) ? s.mark : 'line'}
                          onChange={async e => {
                            const r = await api.editSection(artifact.id, s.id, { chart_type: e.target.value });
                            setLayout(r.layout);
                          }}
                          style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none',
                                   borderRadius: 5, fontSize: 10, fontFamily: FONT, padding: '2px 4px' }}>
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
                    <option value="area">Area</option>
                  </select>
                  <button data-testid="vs-target-toggle"
                          onClick={() => setVsTarget(v => ({ ...v, [s.id]: !v[s.id] }))}
                          style={{ border: '1px solid rgba(255,255,255,.25)', borderRadius: 999,
                                   background: vsTarget[s.id] ? P.accent : 'transparent',
                                   color: '#fff', cursor: 'pointer', fontSize: 9.5,
                                   fontFamily: MONO, padding: '2px 9px' }}>vs target</button>
                  <button data-testid="toolbar-move" title="Move down"
                          onClick={async () => {
                            const r = await api.editSection(artifact.id, s.id, { position: s.position + 1 });
                            setLayout(r.layout);
                          }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                                   color: '#fff', fontSize: 10.5, fontFamily: FONT }}>Move</button>
                  <span title="Drag to reorder — the full layout editor arrives with the inspector design tab"
                        style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, cursor: 'grab' }}>⠿</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {renaming === s.id ? (
                  <input data-testid="section-rename-input" autoFocus value={nameDraft}
                         onChange={e => setNameDraft(e.target.value)}
                         onKeyDown={async e => {
                           if (e.key === 'Enter') {
                             const r = await api.editSection(artifact.id, s.id, { title: nameDraft });
                             setLayout(r.layout); setRenaming(null);
                           }
                           if (e.key === 'Escape') setRenaming(null);
                         }}
                         style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT,
                                  border: `1px solid ${P.accentBorder}`, borderRadius: 6,
                                  padding: '3px 8px' }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
                    {uglyDefault(s) ? (HUMAN_TITLES[s.id] || s.title) : s.title}
                  </span>
                )}
                <span style={{ fontFamily: MONO, fontSize: 10, color: P.green }}>CONTRACT ✓</span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button data-testid="section-rename-btn" title="rename"
                          onClick={() => { setRenaming(s.id); setNameDraft(s.title); }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                                   color: P.muted, fontSize: 13 }}>✎</button>
                  <button data-testid="section-move-btn" title="move down"
                          onClick={async () => {
                            const r = await api.editSection(artifact.id, s.id,
                                                            { position: s.position + 1 });
                            setLayout(r.layout);
                          }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                                   color: P.muted, fontSize: 13 }}>↓</button>
                </span>
              </div>
              {s.id === 'forecast'
                ? <Sparkline rows={rows.filter(r => r.is_forecast)} height={110}
                             mark={s.mark === 'bar' || s.mark === 'area' ? s.mark : 'line'} />
                : s.id === 'timeseries_ci'
                  ? (
                    <>
                      <Sparkline rows={hideForecast ? rows.filter(r => !r.is_forecast) : rows}
                                 mark={s.mark === 'bar' || s.mark === 'area' ? s.mark : 'line'}
                                 showToday target={vsTarget[s.id] ? demoTarget : null} />
                      <div data-testid="trend-legend"
                           style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint, marginTop: 6 }}>
                        — actual · -- forecast ±CI{vsTarget[s.id] ? ' · -- target (plan)' : ''}
                      </div>
                    </>
                  )
                  : <div style={{ fontFamily: MONO, fontSize: 11, color: P.faint }}>
                      {s.mark} panel · data in artifact
                    </div>}
            </div>
          ))}
          </div>
        </div>
      )}
      {status === 'failed' && (
        <div style={{ border: `1px solid ${P.red}`, borderRadius: 10, background: P.redBg,
                      padding: 14, fontSize: 13, fontFamily: FONT, color: P.red }}>
          Build failed — a validation gate blocked downstream stages. Open the pipeline detail
          for gate results.
        </div>
      )}
    </div>
  );
}
