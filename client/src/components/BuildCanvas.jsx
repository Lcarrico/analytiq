// R16S1E2: live build view + dashboard canvas for the Create Workbench.
// Stage chips are driven by the run's DAG nodes (lineage = execution);
// on completion the canvas renders real chart data from the saved artifact.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge } from './ui';
import { FONT, MONO, P } from '../tokens';
import { Icon } from './icons';   // R21S1E3

const STAGE_LABELS = {
  ingest_profile: 'Profiling source',
  session_plan: 'Understanding request',
  gold_build: 'Building gold data',
  model_train: 'Training models',
  walk_forward: 'Validating accuracy',
  viz_specs: 'Generating visuals',
  artifact_ready: 'Assembling dashboard',
};
const STAGE_ORDER = ['session_plan', 'ingest_profile', 'gold_build', 'model_train',
                     'walk_forward', 'viz_specs', 'artifact_ready'];

function chipState(node) {
  if (!node) return 'pending';
  if (node.status === 'done') return 'done';
  if (node.status === 'running') return 'running';
  if (node.status === 'blocked' || node.status === 'failed') return 'blocked';
  return 'pending';
}

function Sparkline({ rows, width = 640, height = 150 }) {
  const pts = rows.filter(r => r.actual != null);
  const fc = rows.filter(r => r.is_forecast);
  if (!pts.length) return null;
  const all = rows.map(r => r.actual ?? r.predicted).filter(v => v != null);
  const min = Math.min(...all), max = Math.max(...all);
  const x = i => (i / (rows.length - 1)) * width;
  const y = v => height - ((v - min) / (max - min || 1)) * (height - 16) - 8;
  const line = pts.map(r => `${x(r.day_index)},${y(r.actual)}`).join(' ');
  const pred = rows.map(r => `${x(r.day_index)},${y(r.predicted)}`).join(' ');
  const band = fc.length
    ? fc.map(r => `${x(r.day_index)},${y(r.ci_high)}`).join(' ') + ' ' +
      [...fc].reverse().map(r => `${x(r.day_index)},${y(r.ci_low)}`).join(' ')
    : null;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      {band && <polygon points={band} fill={P.accentSoft} stroke="none" />}
      <polyline points={pred} fill="none" stroke={P.chart[1]}
                strokeDasharray="4 3" strokeWidth={1.5} />
      <polyline points={line} fill="none" stroke={P.chart[0]} strokeWidth={2} />
    </svg>
  );
}

export default function BuildCanvas({ runId, sessionMetric, onArtifact }) {
  const [dag, setDag] = useState(null);
  const [status, setStatus] = useState('running');
  const [artifact, setArtifact] = useState(null);
  const [rows, setRows] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [layout, setLayout] = useState(null);        // R16S2E4
  const [renaming, setRenaming] = useState(null);
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    if (!runId) return;
    let stop = false;
    const tick = async () => {
      try {
        const [run, g] = await Promise.all([api.getPipelineRun(runId), api.pipelineDag(runId)]);
        if (stop) return;
        setDag(g);
        setStatus(run.status);
        if (run.status === 'done' || run.status === 'failed') return;
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
  const kpis = actuals.length ? [
    ['Total (window)', actuals.reduce((a, b) => a + b, 0).toLocaleString()],
    ['Daily average', Math.round(actuals.reduce((a, b) => a + b, 0) / actuals.length).toLocaleString()],
    ['Forecast days', String(rows.filter(r => r.is_forecast).length)],
    ['MAPE', artifact?.mape != null ? `${artifact.mape}%` : '—'],
  ] : [];

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

      <div data-testid="stage-chips"
           style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 12,
                    border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff' }}>
        {STAGE_ORDER.map(key => {
          const st = chipState(nodes[key]);
          const icon = st === 'done' ? '✓' : st === 'running' ? '…' : st === 'blocked' ? '✕' : '·';
          const color = st === 'done' ? P.green : st === 'running' ? P.accentHover
                      : st === 'blocked' ? P.red : P.faint;
          return (
            <span key={key} data-stage-state={st}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                           border: `1px solid ${st === 'pending' ? P.border : color}`,
                           color, borderRadius: 14, padding: '4px 10px',
                           fontSize: 11.5, fontFamily: FONT, fontWeight: 500,
                           background: st === 'done' ? P.greenBg : '#fff' }}>
              <span style={{ fontFamily: MONO }}>{icon}</span>
              {STAGE_LABELS[key]}
              {nodes[key]?.cached ? <Icon name="Bolt" size={10} /> : null}
            </span>
          );
        })}
      </div>

      {status === 'done' && rows.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                 style={{ border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff', padding: 16 }}>
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
                    {s.title}
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
                ? <Sparkline rows={rows.filter(r => r.is_forecast)} height={110} />
                : s.id === 'timeseries_ci'
                  ? <Sparkline rows={rows} />
                  : <div style={{ fontFamily: MONO, fontSize: 11, color: P.faint }}>
                      {s.mark} panel · data in artifact
                    </div>}
            </div>
          ))}
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
