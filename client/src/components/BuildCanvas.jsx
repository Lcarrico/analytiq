// R16S1E2: live build view + dashboard canvas for the Create Workbench.
// Stage chips are driven by the run's DAG nodes (lineage = execution);
// on completion the canvas renders real chart data from the saved artifact.
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import ComponentBuilder from './ComponentBuilder';
import { Btn, Spinner, StatusBadge } from './ui';
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

export default function BuildCanvas({ runId, sessionMetric, onArtifact,
                                      selected, setSelected, vsTarget, setVsTarget,
                                      layout, setLayout, comments = [],
                                      setComments, onOpenComments }) {
  const [dag, setDag] = useState(null);
  const [status, setStatus] = useState('running');
  const [artifact, setArtifact] = useState(null);
  const [rows, setRows] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [nameDraft, setNameDraft] = useState('');
  // R30S2E3-US1 — building-state telemetry
  const [run, setRun] = useState(null);
  const [piiCount, setPiiCount] = useState(0);
  const [techOpen, setTechOpen] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(1);   // R37S1E2 (F-14)
  const [builderOpen, setBuilderOpen] = useState(false);   // R39S1E2
  const [canvasSessionId, setCanvasSessionId] = useState(null);
  const [componentRows, setComponentRows] = useState({});   // fresh add renders
  const [confirmDelete, setConfirmDelete] = useState(null);   // R39S1E2-US2
  // R40S1E2 (deep-dive F-04): the canvas is a real 12-column grid
  const [gridCells, setGridCells] = useState(null);      // desktop breakpoint
  const [specVersion, setSpecVersion] = useState(null);
  const dragRef = useRef(null);
  const gridBodyRef = useRef(null);
  const ROW_H = 46, GRID_GAP = 10;
  const undoStack = useRef([]);                           // R40S1E3
  const redoStack = useRef([]);
  const [multiSel, setMultiSel] = useState([]);
  const [announce, setAnnounce] = useState('');

  const loadGrid = async () => {
    if (!canvasSessionId) return;
    try {
      const d = await api.specHead(canvasSessionId);
      setGridCells(d.spec.grid?.desktop || null);
      setSpecVersion(d.spec_version);
    } catch { setGridCells(null); }
  };
  useEffect(() => { if (artifact) loadGrid(); }, [canvasSessionId, artifact]);

  const commitGrid = async (cells, note) => {
    const prev = specVersion;
    try {
      const r = await api.patchGrid(canvasSessionId, {
        base_version: prev, breakpoint: 'desktop', cells });
      undoStack.current.push(prev);
      redoStack.current = [];
      setGridCells(r.grid.desktop);
      setSpecVersion(r.spec_version);
      setAnnounce(note || 'Layout updated');
    } catch { loadGrid(); setAnnounce('Layout change rejected — reloaded.'); }
  };

  const undoGrid = async () => {
    const v = undoStack.current.pop();
    if (v == null) return;
    try {
      const r = await api.restoreSpec(canvasSessionId, v);
      redoStack.current.push(specVersion);
      setSpecVersion(r.spec_version);
      setGridCells(JSON.parse(r.spec_json).grid?.desktop || null);
      setAnnounce('Undid the last layout change');
    } catch { loadGrid(); }
  };

  const redoGrid = async () => {
    const v = redoStack.current.pop();
    if (v == null) return;
    try {
      const r = await api.restoreSpec(canvasSessionId, v);
      undoStack.current.push(specVersion);
      setSpecVersion(r.spec_version);
      setGridCells(JSON.parse(r.spec_json).grid?.desktop || null);
      setAnnounce('Redid the layout change');
    } catch { loadGrid(); }
  };

  // R40S1E3: keyboard move/resize on the selected card (accessible path)
  useEffect(() => {
    const onKey = e => {
      if (!gridCells || !selected) return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        (e.shiftKey ? redoGrid : undoGrid)();
        return;
      }
      const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0],
                     ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (!dirs[e.key]) return;
      e.preventDefault();
      const [dx, dy] = dirs[e.key];
      const ids = multiSel.length ? multiSel : [selected];
      const next = gridCells.map(c => {
        if (!ids.includes(c.component_id) || c.locked) return c;
        if (e.shiftKey) {
          return { ...c, w: Math.max(1, Math.min(c.w + dx, 12 - c.x)),
                   h: Math.max(1, c.h + dy) };
        }
        return { ...c, x: Math.max(0, Math.min(c.x + dx, 12 - c.w)),
                 y: Math.max(0, c.y + dy) };
      });
      commitGrid(next, e.shiftKey
        ? `Resized ${ids.join(', ')} with the keyboard`
        : `Moved ${ids.join(', ')} with the keyboard`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gridCells, selected, multiSel, specVersion, canvasSessionId]);

  const startGridOp = (e, cellId, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const el = gridBodyRef.current;
    if (!el || !gridCells) return;
    const colW = (el.offsetWidth - GRID_GAP * 11) / 12 + GRID_GAP;
    const start = { px: e.clientX, py: e.clientY, mode, cellId, colW,
                    cells: gridCells.map(c => ({ ...c })) };
    dragRef.current = start;
    const onMove = ev => {
      const st = dragRef.current;
      if (!st) return;
      const dCol = Math.round((ev.clientX - st.px) / st.colW);
      const dRow = Math.round((ev.clientY - st.py) / (ROW_H + GRID_GAP));
      st.next = st.cells.map(c => {
        if (c.component_id !== st.cellId) return c;
        if (st.mode === 'move') {
          return { ...c, x: Math.max(0, Math.min(c.x + dCol, 12 - c.w)),
                   y: Math.max(0, c.y + dRow) };
        }
        return { ...c, w: Math.max(1, Math.min(c.w + dCol, 12 - c.x)),
                 h: Math.max(1, c.h + dRow) };
      });
      setGridCells(st.next);
    };
    const onUp = async () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const st = dragRef.current;
      dragRef.current = null;
      if (!st || !st.next) return;
      await commitGrid(st.next, st.mode === 'move' ? 'Component moved' : 'Component resized');
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  const [patchError, setPatchError] = useState('');
  // R30S2E3-US2/US3 — canvas chrome + section selection
  const [zoom, setZoom] = useState(1);
  const [device, setDevice] = useState('desktop');
  const [hideForecast, setHideForecast] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [popFor, setPopFor] = useState(null);        // R30S3E6 pin popover
  const [popDraft, setPopDraft] = useState('');

  useEffect(() => {
    // PII banner tracks the review queue's truth (same substrate as Home)
    fetch('/api/home/summary').then(r => r.json())
      .then(d => setPiiCount((d.review?.items || [])
        .filter(i => i.chip === 'PII').length)).catch(() => {});
  }, []);

  // R37S1E2 (deep-dive F-09 groundwork): a run change resets build state so
  // a later run can assemble into the canvas instead of being ignored.
  const prevRun = useRef(null);
  useEffect(() => {
    if (prevRun.current && runId && prevRun.current !== runId) {
      setArtifact(null);
      setLayoutVersion(1);
      setPatchError('');
    }
    prevRun.current = runId;
  }, [runId]);

  useEffect(() => {
    if (!runId) return;
    api.getPipelineRun(runId).then(r => setCanvasSessionId(r.session_id)).catch(() => {});
  }, [runId]);

  const [contractIds, setContractIds] = useState(null);   // R37S1E1 (F-10)
  useEffect(() => {
    if (!runId) { setContractIds(null); return; }
    // contracts persist while the run executes — refetch once the artifact
    // lands so the evidence chips reflect the finished run (R37S1E1)
    api.pipelineContracts(runId)
      .then(d => setContractIds(new Set((d.query_contracts || []).map(c => c.component_id))))
      .catch(() => setContractIds(new Set()));
  }, [runId, artifact]);

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
        // R30S2E4: the lifted layout is the single source of truth — when the
        // artifact carries none, seed the default two sections here so the
        // canvas AND the inspector edit the same objects.
        let parsed = null;
        try { parsed = JSON.parse(art.layout_json || 'null'); } catch { parsed = null; }
        setLayout(parsed && parsed.sections ? parsed : {
          sections: [
            { id: 'timeseries_ci', title: 'Timeseries Ci', position: 0, mark: 'line' },
            { id: 'forecast', title: 'Forecast', position: 1, mark: 'line' },
          ],
        });
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
            HIDE BUILD TELEMETRY
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
          <div data-testid="canvas-toolbar" onClick={e => e.stopPropagation()}
               style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
                        border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff',
                        padding: '0 12px', boxSizing: 'border-box', overflowX: 'auto',
                        whiteSpace: 'nowrap' }}>
            <button data-testid="canvas-undo" title="Undo layout change (Ctrl+Z)"
                    onClick={undoGrid}
                    style={{ border: 'none', background: 'none', cursor: 'pointer',
                             color: P.muted, fontSize: 13, marginRight: 2 }}>↩</button>
            <button data-testid="canvas-redo" title="Redo (Ctrl+Shift+Z)"
                    onClick={redoGrid}
                    style={{ border: 'none', background: 'none', cursor: 'pointer',
                             color: P.muted, fontSize: 13, marginRight: 8 }}>↪</button>
            <button data-testid="add-component"
                    disabled={!artifact || !canvasSessionId}
                    title={artifact ? 'Add a component from the palette'
                      : 'Available after the first build'}
                    onClick={() => setBuilderOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                             height: 26, padding: '0 11px', borderRadius: 999,
                             border: `1px solid ${P.accentBorder}`,
                             background: P.selectedRow, color: P.accentHover,
                             fontFamily: MONO, fontSize: 10.5, fontWeight: 600,
                             cursor: artifact ? 'pointer' : 'default', marginRight: 8 }}>
              + ADD COMPONENT
            </button>
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
            <button data-testid="present-btn" disabled={!artifact}
                    title={artifact ? 'Open the full-screen presentation stage'
                      : 'Save the artifact first — Present runs on the saved dashboard'}
                    onClick={() => artifact
                      && window.location.assign(`/app/artifacts/${artifact.id}/present`)}
                    style={{ border: `1px solid ${P.borderStrong}`, background: '#fff', borderRadius: 6,
                             color: artifact ? P.body : P.faint, fontSize: 10.5, fontFamily: FONT,
                             padding: '3px 9px', cursor: artifact ? 'pointer' : 'default' }}>
              Present
            </button>
            {artifact && (
              <>
                <button data-testid="open-comments" onClick={onOpenComments}
                        title="Comments"
                        style={{ border: 'none', background: 'none', cursor: 'pointer',
                                 color: P.muted, fontSize: 11, fontFamily: FONT }}>
                  Comments{comments.filter(c => !c.parent_id && !c.resolved).length
                    ? ` · ${comments.filter(c => !c.parent_id && !c.resolved).length}` : ''}
                </button>
                <span data-testid="export-menu" style={{ display: 'inline-flex', gap: 6 }}>
                  {['csv', 'json', 'html'].map(f => (
                    <a key={f} data-testid={`export-${f}`}
                       href={artifact ? `/api/artifacts/${artifact.id}/export?format=${f}` : undefined}
                       target="_blank" rel="noreferrer"
                       style={{ border: 'none', background: 'none',
                                cursor: artifact ? 'pointer' : 'default', textDecoration: 'none',
                                color: artifact ? P.body : P.faint, fontSize: 10.5, fontFamily: FONT,
                                padding: '3px 4px' }}>
                      Export {f.toUpperCase()}
                    </a>
                  ))}
                </span>
                <a href={`/app/artifacts/${artifact.id}?tab=lineage`} title="Lineage"
                   style={{ fontSize: 11, fontFamily: FONT, color: P.muted, textDecoration: 'none' }}>Lineage</a>
                <a href={`/app/artifacts/${artifact.id}?tab=activity`} title="Audit trail"
                   style={{ fontSize: 11, fontFamily: FONT, color: P.muted, textDecoration: 'none' }}>Audit</a>
              </>
            )}
            {patchError && (
              <span data-testid="canvas-error"
                    style={{ fontFamily: FONT, fontSize: 11, color: P.red }}>
                {patchError}
              </span>
            )}
            <span data-testid="canvas-version"
                  style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: P.faint }}>
              v{layoutVersion} · saved
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
               style={{ display: 'grid', gap: 10,
                        /* R40S1E4: the KPI strip actually reflows */
                        gridTemplateColumns: device === 'desktop'
                          ? 'repeat(4,1fr)' : 'repeat(2,1fr)' }}>
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
          <div data-testid="grid-canvas" ref={gridBodyRef}
               style={gridCells
                 ? { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)',
                     gridAutoRows: 46, gap: 10, alignItems: 'stretch' }
                 : { display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(layout?.sections || [])
            .sort((a, b) => a.position - b.position)   /* R39S1E2: all sections render */
            .map(s => { const cell = gridCells?.find(c => c.component_id === s.id); return (
            <div key={s.id} data-testid={`section-${s.id === 'timeseries_ci' ? 'timeseries' : s.id}`}
                 onClick={e => {
                   e.stopPropagation();
                   if (e.shiftKey) {
                     setMultiSel(m => {
                       const base = m.length ? m : (selected ? [selected] : []);
                       return base.includes(s.id)
                         ? base.filter(x => x !== s.id) : [...base, s.id];
                     });
                   } else { setMultiSel([]); }
                   setSelected(s.id);
                 }}
                 style={{ border: selected === s.id ? `2px solid ${P.accent}` : `1px solid ${P.border}`,
                          borderRadius: 10, background: '#fff', padding: selected === s.id ? 15 : 16,
                          position: 'relative',
                          ...(cell ? (device === 'mobile'
                            ? { gridColumn: '1 / span 12', overflow: 'hidden', margin: 0 }
                            : { gridColumn: `${cell.x + 1} / span ${cell.w}`,
                                gridRow: `${cell.y + 1} / span ${cell.h}`,
                                overflow: 'hidden', margin: 0 }) : {}),
                          boxShadow: selected === s.id ? '0 8px 24px rgba(37,99,235,.13)' : 'none',
                          marginTop: selected === s.id ? 34 : 0, transition: 'margin .1s' }}>
              {(() => {
                const anchored = comments.filter(c => !c.parent_id && !c.resolved
                                                      && c.section_id === s.id);
                if (!anchored.length) return null;
                const thread = anchored[0];
                const threadReplies = comments.filter(c => c.parent_id === thread.id);
                const pinNo = comments.filter(c => !c.parent_id && !c.resolved)
                  .findIndex(c => c.id === thread.id) + 1;
                return (
                  <span data-menu-root onClick={e => e.stopPropagation()}
                        style={{ position: 'absolute', top: -10, right: -8, zIndex: 45 }}>
                    <span data-testid="comment-pin"
                          onClick={() => setPopFor(popFor === s.id ? null : s.id)}
                          style={{ width: 26, height: 26, borderRadius: '50% 50% 50% 4px',
                                   background: P.accent, border: '2.5px solid #fff',
                                   boxShadow: '0 4px 12px rgba(37,99,235,.4)', color: '#fff',
                                   fontSize: 10, fontWeight: 700, display: 'inline-flex',
                                   alignItems: 'center', justifyContent: 'center',
                                   cursor: 'pointer', fontFamily: FONT }}>
                      {pinNo}
                    </span>
                    {popFor === s.id && (
                      <div data-testid="comment-popover"
                           style={{ position: 'absolute', top: 30, right: 0, width: 290,
                                    background: '#fff', border: `1px solid ${P.border}`,
                                    borderRadius: 10, padding: 12, zIndex: 60,
                                    boxShadow: '0 20px 48px rgba(15,23,42,.18)' }}>
                        <div style={{ fontSize: 12, fontFamily: FONT, color: P.body }}>
                          <strong style={{ color: P.ink }}>{(thread.author || '?').split('@')[0]}</strong>{' '}
                          {thread.body}
                        </div>
                        {threadReplies.map(r => (
                          <div key={r.id} style={{ fontSize: 11.5, fontFamily: FONT,
                                                   color: P.body, marginTop: 6, paddingLeft: 12,
                                                   borderLeft: `2px solid ${P.borderRow}` }}>
                            {r.body}
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                          <input data-testid="popover-reply-input" value={popDraft}
                                 onChange={e => setPopDraft(e.target.value)}
                                 placeholder="Reply…"
                                 style={{ flex: 1, height: 26, borderRadius: 7, padding: '0 8px',
                                          border: `1px solid ${P.borderStrong}`, fontSize: 11.5,
                                          fontFamily: FONT, outline: 'none' }} />
                          <button data-testid="popover-reply-send" aria-label="Send reply"
                                  onClick={async () => {
                                    const t = popDraft.trim();
                                    if (!t) return;
                                    setPopDraft('');
                                    await api.postComment(artifact.id,
                                      { body: t, parent_id: thread.id, section_id: s.id });
                                    const list = await api.getComments(artifact.id);
                                    setComments?.(list);
                                  }}
                                  style={{ width: 26, height: 26, borderRadius: 7, border: 'none',
                                           background: P.accent, color: '#fff',
                                           cursor: 'pointer', fontSize: 11 }}>»</button>
                        </div>
                      </div>
                    )}
                  </span>
                );
              })()}
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
                            if (r?.layout_version) setLayoutVersion(r.layout_version);
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
                            if (r?.layout_version) setLayoutVersion(r.layout_version);
                            setLayout(r.layout);
                          }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                                   color: '#fff', fontSize: 10.5, fontFamily: FONT }}>Move</button>
                  <span title="Drag to reorder — the full layout editor arrives with the inspector design tab"
                        style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, cursor: 'grab' }}>⠿</span>
                </div>
              )}
              {cell?.locked && (
                <span data-testid="section-locked"
                      style={{ position: 'absolute', top: 5, left: 8, fontSize: 10,
                               color: P.amber, zIndex: 3 }}>🔒</span>
              )}
              {multiSel.includes(s.id) && (
                <span data-testid="section-multisel"
                      style={{ position: 'absolute', inset: 0, borderRadius: 10,
                               border: `2px dashed ${P.accent}`, pointerEvents: 'none',
                               zIndex: 2 }} />
              )}
              {cell && (
                <>
                  <span data-testid="section-drag" title="Drag to move"
                        onPointerDown={e => startGridOp(e, s.id, 'move')}
                        style={{ position: 'absolute', top: 5, right: 8, cursor: 'grab',
                                 color: P.faint, fontSize: 12, userSelect: 'none',
                                 touchAction: 'none', zIndex: 3 }}>⠿</span>
                  <span data-testid="section-resize" title="Drag to resize"
                        onPointerDown={e => startGridOp(e, s.id, 'resize')}
                        style={{ position: 'absolute', right: 2, bottom: 0,
                                 cursor: 'nwse-resize', color: P.faint, fontSize: 13,
                                 userSelect: 'none', touchAction: 'none', zIndex: 3,
                                 padding: '0 4px' }}>◢</span>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {renaming === s.id ? (
                  <input data-testid="section-rename-input" autoFocus value={nameDraft}
                         onChange={e => setNameDraft(e.target.value)}
                         onKeyDown={async e => {
                           if (e.key === 'Enter') {
                             try {
                               const r = await api.editSection(artifact.id, s.id, { title: nameDraft });
                               if (r?.layout_version) setLayoutVersion(r.layout_version);
                               setLayout(r.layout); setRenaming(null);
                             } catch (err) {
                               setPatchError(err?.message || 'Edit failed — nothing was saved.');
                               setTimeout(() => setPatchError(''), 4500);
                             }
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
                {contractIds?.has(s.id) ? (
                  <span style={{ fontFamily: MONO, fontSize: 10, color: P.green }}>CONTRACT ✓</span>
                ) : (
                  <span data-testid="section-no-contract"
                        title="No per-component contract recorded for this section yet — full evidence blocks arrive with R42."
                        style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>NO CONTRACT</span>
                )}
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button data-testid="section-duplicate" title="duplicate"
                          onClick={async e => {
                            e.stopPropagation();
                            try {
                              const r = await api.duplicateComponent(canvasSessionId, s.id);
                              if (r?.data) setComponentRows(m => ({ ...m, [r.component.id]: r.data }));
                              const fresh = await api.getArtifact(artifact.id);
                              setArtifact(fresh);
                              setLayout(JSON.parse(fresh.layout_json || 'null'));
                            } catch { setPatchError('Duplicate failed — nothing was saved.'); }
                          }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                                   color: P.muted, fontSize: 12 }}>⧉</button>
                  <button data-testid="section-delete" title="delete"
                          onClick={e => { e.stopPropagation(); setConfirmDelete(s.id); }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                                   color: P.muted, fontSize: 12 }}>🗑</button>
                  <button data-testid="section-rename-btn" title="rename"
                          onClick={() => { setRenaming(s.id); setNameDraft(s.title); }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer',
                                   color: P.muted, fontSize: 13 }}>✎</button>
                  <button data-testid="section-move-btn" title="move down"
                          onClick={async () => {
                            const r = await api.editSection(artifact.id, s.id,
                                                            { position: s.position + 1 });
                            if (r?.layout_version) setLayoutVersion(r.layout_version);
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
                  : componentRows[s.id]?.length ? (
                    <div data-testid="generic-bars"
                         style={{ display: 'flex', alignItems: 'flex-end', gap: 5,
                                  height: 90 }}>
                      {componentRows[s.id].slice(0, 10).map((r, i) => {
                        const vals = componentRows[s.id].map(x => Math.abs(Number(x[1]) || 0));
                        const max = Math.max(...vals, 1);
                        return (
                          <div key={i} title={`${r[0]}: ${r[1]}`}
                               style={{ flex: 1, borderRadius: '3px 3px 0 0',
                                        background: P.accent, opacity: .85,
                                        height: Math.max(4, (Math.abs(Number(r[1]) || 0) / max) * 90) }} />
                        );
                      })}
                    </div>
                  ) : <div style={{ fontFamily: MONO, fontSize: 11, color: P.faint }}>
                      {s.mark} panel · data in artifact
                    </div>}
            </div>
          ); })}
          </div>
          </div>
        </div>
      )}
      <div aria-live="polite" data-testid="grid-announce"
           style={{ position: 'absolute', left: -9999, top: 0 }}>{announce}</div>
      {multiSel.length > 1 && (
        <div data-testid="bulk-bar"
             style={{ position: 'fixed', bottom: 18, left: '50%',
                      transform: 'translateX(-50%)', background: P.ink, color: '#fff',
                      borderRadius: 999, padding: '8px 16px', display: 'flex', gap: 12,
                      alignItems: 'center', zIndex: 65, fontFamily: FONT, fontSize: 12 }}>
          {multiSel.length} selected
          <button data-testid="bulk-lock"
                  onClick={() => {
                    const anyUnlocked = gridCells.some(
                      c => multiSel.includes(c.component_id) && !c.locked);
                    commitGrid(gridCells.map(c => multiSel.includes(c.component_id)
                      ? { ...c, locked: anyUnlocked } : c),
                      anyUnlocked ? 'Locked selection' : 'Unlocked selection');
                  }}
                  style={{ border: 'none', background: 'rgba(255,255,255,.15)',
                           color: '#fff', borderRadius: 999, padding: '4px 12px',
                           cursor: 'pointer', fontSize: 11.5, fontFamily: FONT }}>
            Lock / unlock
          </button>
        </div>
      )}
      {confirmDelete && (
        <div data-testid="del-impact"
             style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 70 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 22, width: 380 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
              Delete this component?
            </div>
            <div style={{ fontSize: 12.5, color: P.body, fontFamily: FONT,
                          margin: '10px 0 14px', lineHeight: 1.55 }}>
              {contractIds?.has(confirmDelete)
                ? 'Its query contract stays in the run history. ' : ''}
              This creates a <strong>reversible version</strong> — the previous
              layout can be restored from version history.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn data-testid="del-confirm" size="sm" onClick={async () => {
                try {
                  await api.deleteComponent(canvasSessionId, confirmDelete);
                  const fresh = await api.getArtifact(artifact.id);
                  setArtifact(fresh);
                  setLayout(JSON.parse(fresh.layout_json || 'null'));
                } catch { setPatchError('Delete failed — nothing was removed.'); }
                setConfirmDelete(null);
              }}>
                Delete
              </Btn>
              <Btn size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      )}
      {builderOpen && canvasSessionId && (
        <ComponentBuilder sessionId={canvasSessionId}
                          onClose={() => setBuilderOpen(false)}
                          onCreated={async r => {
                            if (r?.data) {
                              setComponentRows(m => ({ ...m, [r.component.id]: r.data }));
                            }
                            try {
                              const fresh = await api.getArtifact(artifact.id);
                              setArtifact(fresh);
                              const lay = JSON.parse(fresh.layout_json || 'null');
                              if (lay) setLayout(lay);
                            } catch { /* noop */ }
                          }} />
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
