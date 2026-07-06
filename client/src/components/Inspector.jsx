// R30S2E4-US1 (program R30–R36) — workbench inspector at frame parity.
// Tab-set RULING (recorded per RELEASE_PLAN Agent Notes): the canvas frame in
// `Create Workbench.dc.html` is the authority — Design · Data · Pipeline ·
// Lineage · Model · Comments · Share. ch12's "Filters" variant is not in the
// frame; Versions lives in the session topbar (panel lands R30S3E5); Insights
// live on the artifact detail page (+ R30S3E3 panel). The Design tab is an
// EDITING panel driven by the canvas selection (title rename, 6-tile chart
// picker, vs-target toggle, validation pills, de-leaked rationale, REPLACE
// WITH cards) — the old read-only debug key/values and the "(§5.3)" internal
// citation are gone (PRD §5.1). Data/Pipeline keep their R16/R17 content until
// R30S3E1/E2 rebuild them.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { StatusBadge, Tabs, Toggle } from './ui';
import { FONT, MONO, P } from '../tokens';

const TABS = ['Design', 'Data', 'Pipeline', 'Lineage', 'Model', 'Comments', 'Share'];

// R30S3E1 — component ids → human names (per-frame vocabulary)
const HUMAN_TITLES = {
  kpi_row: 'KPI summary row',
  timeseries_ci: 'Revenue vs forecast · daily',
  forecast: 'Forecast horizon',
  dimension_breakdown: 'Breakdown by location',
  feature_importance: 'What drives the forecast',
};
const humanTitle = (s) =>
  ((s.title || '').toLowerCase().replace(/ /g, '_') === s.id
    ? (HUMAN_TITLES[s.id] || s.title) : s.title);

const RATIONALE = {
  line: 'A daily series with a forecast split reads best as a line — the CI band and today divider keep the projection honest.',
  area: 'An area fill emphasizes cumulative magnitude while keeping the trend legible.',
  bar: 'Bars make period-over-period comparison legible when individual values matter more than the trend.',
};

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12.5, fontFamily: FONT }}>
      <span style={{ width: 90, flexShrink: 0, fontFamily: MONO, fontSize: 10.5,
                     textTransform: 'uppercase', color: P.muted, paddingTop: 1 }}>{k}</span>
      <span style={{ color: P.body, minWidth: 0, overflowWrap: 'anywhere' }}>{v}</span>
    </div>
  );
}

const monoLabel = { fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em',
                    textTransform: 'uppercase', color: P.faint };

const TILE_MARKS = [
  ['line', true], ['bar', true], ['area', true],
  ['scatter', false], ['treemap', false], ['table', false],
];

function TileGlyph({ mark }) {
  const c = P.muted;
  switch (mark) {
    case 'line': return <svg width="16" height="12" viewBox="0 0 16 12"><polyline points="1,10 5,5 9,7 15,2" fill="none" stroke={c} strokeWidth="1.4" /></svg>;
    case 'bar': return <svg width="16" height="12" viewBox="0 0 16 12"><rect x="2" y="6" width="3" height="5" fill={c} /><rect x="7" y="3" width="3" height="8" fill={c} /><rect x="12" y="7" width="3" height="4" fill={c} /></svg>;
    case 'area': return <svg width="16" height="12" viewBox="0 0 16 12"><polygon points="1,10 5,5 9,7 15,2 15,11 1,11" fill={c} opacity=".5" /></svg>;
    case 'scatter': return <svg width="16" height="12" viewBox="0 0 16 12"><circle cx="4" cy="8" r="1.4" fill={c} /><circle cx="8" cy="4" r="1.4" fill={c} /><circle cx="12" cy="7" r="1.4" fill={c} /></svg>;
    case 'treemap': return <svg width="16" height="12" viewBox="0 0 16 12"><rect x="1" y="1" width="8" height="10" fill="none" stroke={c} /><rect x="10" y="1" width="5" height="5" fill="none" stroke={c} /><rect x="10" y="7" width="5" height="4" fill="none" stroke={c} /></svg>;
    default: return <svg width="16" height="12" viewBox="0 0 16 12"><path d="M1 3h14M1 6h14M1 9h14" stroke={c} strokeWidth="1" /></svg>;
  }
}

export default function Inspector({ artifact, runId, selected, layout, setLayout,
                                    vsTarget, setVsTarget, metric, grain }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Design');
  const [explain, setExplain] = useState(null);
  const [steps, setSteps] = useState([]);
  const [dag, setDag] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [contracts, setContracts] = useState(null);   // R17S1E1
  const [titleDraft, setTitleDraft] = useState('');
  const [openCard, setOpenCard] = useState(0);         // R30S3E1 accordion
  const [openStage, setOpenStage] = useState(0);        // R30S3E2 accordion
  const [stageTech, setStageTech] = useState(false);      // admin detail affordance
  const [sessionId, setSessionId] = useState(null);     // R30S3E2 fork substrate

  useEffect(() => {
    if (!runId) return;
    api.getPipelineRun(runId).then(r => setSessionId(r.session_id)).catch(() => {});
  }, [runId]);

  useEffect(() => {
    if (!artifact) return;
    api.explainArtifact(artifact.id).then(setExplain).catch(() => {});
    api.provenance(artifact.id).then(r => setDag(r.dag || null)).catch(() => {});
  }, [artifact?.id]);
  useEffect(() => {
    if (!runId) return;
    api.pipelineSteps(runId).then(setSteps).catch(() => {});
    api.pipelineContracts(runId).then(setContracts).catch(() => {});
  }, [runId]);

  const section = (layout?.sections || []).find(s => s.id === selected) || null;
  useEffect(() => { setTitleDraft(section ? humanTitle(section) : ''); }, [selected]);

  if (!artifact) return null;

  const gates = (dag?.edges || []).map(e => `${e.gate_name}:${e.gate_status}`);
  const gatesPass = gates.length > 0 && gates.every(g => g.endsWith('PASS'));
  const applyMark = async (mark) => {
    const r = await api.editSection(artifact.id, section.id, { chart_type: mark });
    setLayout(r.layout);
  };

  return (
    <div data-testid="inspector"
         style={{ width: 340, flexShrink: 0, borderLeft: `1px solid ${P.border}`,
                  paddingLeft: 14, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Tabs dense tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12 }}>

        {tab === 'Design' && (!section ? (
          <div data-testid="design-empty"
               style={{ fontSize: 12.5, fontFamily: FONT, color: P.muted }}>
            Select a section on the canvas to edit it — title, chart type, and
            comparisons apply live.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={monoLabel}>Selected</div>
              <span data-testid="design-selected-chip"
                    style={{ display: 'inline-flex', marginTop: 4, padding: '3px 9px',
                             borderRadius: 999, background: P.accentSoft, color: P.accentHover,
                             fontFamily: MONO, fontSize: 10.5 }}>
                {humanTitle(section)} · {['bar', 'area'].includes(section.mark) ? section.mark : 'line'}
              </span>
            </div>
            <div>
              <div style={monoLabel}>Title</div>
              <input data-testid="design-title-input" value={titleDraft}
                     onChange={e => setTitleDraft(e.target.value)}
                     onKeyDown={async e => {
                       if (e.key === 'Enter' && titleDraft.trim()) {
                         const r = await api.editSection(artifact.id, section.id,
                                                         { title: titleDraft.trim() });
                         setLayout(r.layout);
                       }
                     }}
                     style={{ marginTop: 4, height: 32, width: '100%', boxSizing: 'border-box',
                              border: `1px solid ${P.borderStrong}`, borderRadius: 8,
                              padding: '0 10px', fontSize: 12.5, fontFamily: FONT,
                              color: P.ink, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={monoLabel}>Metric</div>
                <select disabled title="Metric changes re-plan the dashboard — ask in chat"
                        style={{ marginTop: 4, width: '100%', height: 30, borderRadius: 7,
                                 border: `1px solid ${P.borderStrong}`, fontFamily: MONO,
                                 fontSize: 11, color: P.accentHover, background: '#fff' }}>
                  <option>{metric || 'Net Revenue'}</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={monoLabel}>Dimension</div>
                <select disabled title="Dimension changes re-plan the dashboard — ask in chat"
                        style={{ marginTop: 4, width: '100%', height: 30, borderRadius: 7,
                                 border: `1px solid ${P.borderStrong}`, fontFamily: MONO,
                                 fontSize: 11, color: P.body, background: '#fff' }}>
                  <option>{(grain || 'Location · Day').split('·')[0].trim().toLowerCase()}</option>
                </select>
              </div>
            </div>
            <div>
              <div style={monoLabel}>Chart type</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {TILE_MARKS.map(([mark, live]) => {
                  const cur = ['bar', 'area'].includes(section.mark) ? section.mark : 'line';
                  const sel = cur === mark;
                  return (
                    <button key={mark} data-testid={`chart-tile-${mark}`} data-live={String(live)}
                            data-selected={String(sel)} disabled={!live}
                            title={live ? mark : `${mark} arrives with richer panel data`}
                            onClick={() => live && applyMark(mark)}
                            style={{ width: 34, height: 34, borderRadius: 8, cursor: live ? 'pointer' : 'not-allowed',
                                     border: sel ? `2px solid ${P.accent}` : `1px solid ${P.borderStrong}`,
                                     background: sel ? P.selectedRow : '#fff',
                                     opacity: live ? 1 : .45, display: 'inline-flex',
                                     alignItems: 'center', justifyContent: 'center' }}>
                      <TileGlyph mark={mark} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <div style={monoLabel}>Time grain</div>
                <select disabled title="Grain changes re-plan the dashboard — ask in chat"
                        style={{ marginTop: 4, width: '100%', height: 30, borderRadius: 7,
                                 border: `1px solid ${P.borderStrong}`, fontFamily: MONO,
                                 fontSize: 11, color: P.body, background: '#fff' }}>
                  <option>{(grain || 'Location · Day').split('·').pop().trim()}</option>
                </select>
              </div>
              <div data-testid="design-vs-target"
                   style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
                <span style={monoLabel}>vs target</span>
                <Toggle on={!!vsTarget[section.id]}
                        onChange={v => setVsTarget(m => ({ ...m, [section.id]: v }))} />
                {vsTarget[section.id] && (
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.green }}>ON</span>
                )}
              </div>
            </div>
            <div data-testid="design-validation" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={(contracts?.trust?.contracts || 0) > 0
                  && (gatesPass || (contracts?.data_contracts || []).length)
                  ? 'green' : 'gray'}>
                {(contracts?.trust?.contracts || 0) > 0 ? 'CONTRACT PASSED' : 'NO CONTRACT YET'}
              </StatusBadge>
              <StatusBadge status={contracts?.trust?.sql_validated ? 'green' : 'gray'}>
                {contracts?.trust?.sql_validated ? 'SQL VALIDATED' : 'SQL NOT VALIDATED'}
              </StatusBadge>
            </div>
            <div style={{ fontSize: 12, fontFamily: FONT, color: P.muted }}>
              <strong style={{ color: P.body }}>Why this chart?</strong>{' '}
              {RATIONALE[['bar', 'area'].includes(section.mark) ? section.mark : 'line']}
            </div>
            <div>
              <div style={monoLabel}>Replace with…</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                {[['bar', 'Bar comparison'], ['area', 'Area fill']].map(([mark, label]) => (
                  <button key={mark} data-testid={`replace-card-${mark}`}
                          onClick={() => applyMark(mark)}
                          style={{ border: `1px solid ${P.border}`, borderRadius: 8,
                                   padding: '9px 10px', background: '#fff', cursor: 'pointer',
                                   display: 'flex', flexDirection: 'column', gap: 6,
                                   alignItems: 'flex-start' }}>
                    <TileGlyph mark={mark} />
                    <span style={{ fontSize: 11.5, fontFamily: FONT, color: P.body }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {tab === 'Data' && (
          <div>
            <div style={{ fontSize: 11.5, fontFamily: FONT, color: P.muted, marginBottom: 10 }}>
              Per-component trust contracts — what the data promised, and whether it delivered.
            </div>
            {(contracts?.data_contracts || []).map((dc, idx) => {
              const qc = (contracts?.query_contracts || [])
                .find(q => q.component_id === dc.component_id);
              const warn = !!dc.empty_result;
              const open = openCard === idx;
              const human = HUMAN_TITLES[dc.component_id]
                || dc.component_id.replace(/_/g, ' ');
              const mark = (layout?.sections || []).find(s => s.id === dc.component_id)?.mark || 'line';
              const range = Object.entries(dc.numeric_ranges)[0];
              const passCount = gates.filter(g => g.endsWith('PASS')).length;
              return (
                <div key={dc.component_id} data-testid={`trust-card-${dc.component_id}`}
                     style={{ border: `1px solid ${warn ? P.amberBorder : P.border}`,
                              borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                  <div data-testid="trust-card-header"
                       onClick={() => setOpenCard(open ? -1 : idx)}
                       style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer',
                                padding: '9px 10px',
                                background: warn ? '#fdf9ef' : P.tableHeadBg }}>
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT, color: P.ink,
                                   minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                                   whiteSpace: 'nowrap' }}>
                      {human} · {['bar', 'area'].includes(mark) ? mark : 'line'}
                    </span>
                    <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <StatusBadge status={warn ? 'amber' : 'green'}>
                        {warn ? '1 WARNING' : 'PASSED'}
                      </StatusBadge>
                    </span>
                  </div>
                  {open && (
                    <div style={{ padding: '6px 10px 10px' }}>
                      <Row k="Rows" v={`${dc.row_count}${qc?.row_limit ? ` · cap ${qc.row_limit}` : ''}`} />
                      {range && (
                        <Row k="Range" v={`${range[1].min} – ${range[1].max} (μ ${range[1].mean})`} />
                      )}
                      {qc?.execution_time_ms != null && (
                        <Row k="Query" v={`${qc.execution_time_ms}ms · validated`} />
                      )}
                      <Row k="Freshness" v="this run · SLA 24h" />
                      <div data-testid="gates-row"
                           style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12.5,
                                    fontFamily: FONT }}>
                        <span style={{ width: 90, flexShrink: 0, fontFamily: MONO, fontSize: 10.5,
                                       textTransform: 'uppercase', color: P.muted }}>Gates</span>
                        <span style={{ fontFamily: MONO, fontSize: 11.5,
                                       color: passCount === gates.length ? P.green : P.amber }}>
                          {passCount}/{gates.length} passed
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'Pipeline' && (
          <div>
            {/* R30S3E2 — run header + gates pill; per-stage detail replaces the
                raw node ids / gate dump (PRD §5.1) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span data-testid="pipeline-run-header"
                    style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '.05em',
                             color: P.muted }}>
                RUN {runId} · {steps.length} STAGES
              </span>
              <span data-testid="all-gates-pill" style={{ marginLeft: 'auto' }}>
                <StatusBadge status={gatesPass ? 'green' : 'amber'}>
                  {gatesPass ? 'ALL GATES ✓' : 'GATES PENDING'}
                </StatusBadge>
              </span>
            </div>
            {steps.map((s, idx) => {
              const open = openStage === idx;
              const repaired = !!s.flagged;
              const inputs = (s.input_schema || []).map(c => c.name || c).join(', ') || '—';
              const outputs = (s.output_schema || []).map(c => c.name || c).join(', ') || '—';
              return (
                <div key={s.id} data-testid={`stage-card-${s.step}`}
                     style={{ border: `1px solid ${P.border}`, borderRadius: 8,
                              marginBottom: 8, overflow: 'hidden' }}>
                  <div data-testid="stage-card-header"
                       onClick={() => setOpenStage(open ? -1 : idx)}
                       style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
                                padding: '9px 10px', background: P.tableHeadBg }}>
                    <span data-testid="stage-circle"
                          style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                   display: 'inline-flex', alignItems: 'center',
                                   justifyContent: 'center',
                                   background: repaired ? P.amberBg : P.greenBg }}>
                      {repaired ? (
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700,
                                       color: P.amber }}>!</span>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 9 9">
                          <path d="m1.5 4.5 2 2 4-4.5" fill="none" stroke={P.green}
                                strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FONT,
                                   color: P.ink, minWidth: 0, overflow: 'hidden',
                                   textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                    {repaired && (
                      <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.amber }}>1 repair</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10,
                                   color: P.faint }}>{open ? '−' : '+'}</span>
                  </div>
                  {open && (
                    <div style={{ padding: '6px 10px 10px' }}>
                      <Row k="Input" v={inputs} />
                      <Row k="Gate result"
                           v={repaired ? `repaired · ${s.flag_reason || 'auto-repair'}` : 'passed · 0 repairs'} />
                      <Row k="Output" v={outputs} />
                      {/* PRD §5.6 — technical identifiers only behind the
                          explicit admin affordance */}
                      <div data-testid="stage-tech-toggle" onClick={() => setStageTech(o => !o)}
                           style={{ fontFamily: MONO, fontSize: 9, color: P.faint,
                                    marginTop: 6, cursor: 'pointer' }}>
                        technical detail · admin only {stageTech ? '−' : '+'}
                      </div>
                      {stageTech && (
                        <div data-testid="stage-tech-block"
                             style={{ background: P.bg, border: `1px solid ${P.borderRow}`,
                                      borderRadius: 6, padding: '8px 10px', fontFamily: MONO,
                                      fontSize: 9.5, lineHeight: 1.6, color: P.muted,
                                      marginTop: 4, overflowWrap: 'anywhere' }}>
                          {s.description || `in: ${inputs} → out: ${outputs}`}
                        </div>
                      )}
                      <button data-testid="fork-from-here" disabled={!sessionId}
                              title="Forks the session from its confirmed spec (per-stage forking arrives with cached DAG replay)"
                              onClick={async () => {
                                try {
                                  const f = await api.forkSession(sessionId, {});
                                  if (f?.id) navigate(`/app/create/${f.id}`);
                                } catch { /* noop */ }
                              }}
                              style={{ marginTop: 8, height: 24, padding: '0 10px',
                                       borderRadius: 7, border: `1px solid ${P.borderStrong}`,
                                       background: '#fff', color: P.body, fontSize: 11,
                                       fontFamily: FONT, cursor: 'pointer' }}>
                        Fork from here
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'Lineage' && (
          <div data-testid="tab-lineage">
            <div style={monoLabel}>Gold tables</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0 12px' }}>
              {(explain?.lineage?.gold_tables?.length ? explain.lineage.gold_tables
                : ['(no gold tables)']).map(t => (
                <span key={t} style={{ fontFamily: MONO, fontSize: 10.5, background: '#fdf9ef',
                                       border: `1px solid ${P.amberBorder}`, color: P.amber,
                                       borderRadius: 6, padding: '3px 8px' }}>{t}</span>
              ))}
            </div>
            <div style={monoLabel}>Provenance chain</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {(explain?.lineage?.provenance_chain || []).map((c, i) => (
                <span key={i} style={{ fontFamily: MONO, fontSize: 10.5, background: P.bg,
                                       border: `1px solid ${P.border}`, borderRadius: 6,
                                       padding: '3px 8px', color: P.body }}>
                  {c.artifact_type} v{c.version}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT, marginTop: 12 }}>
              Full graph with impact analysis lands at governance lineage (R32S1E5).
            </div>
          </div>
        )}

        {tab === 'Model' && (
          <div data-testid="tab-model">
            {explain?.model ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: P.purple }}>
                    {explain.model.algorithm}
                  </span>
                  {artifact.mape != null && (
                    <StatusBadge status="green">MAPE {artifact.mape}%</StatusBadge>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(explain.model.gates || {}).map(([k, v]) => (
                    <span key={k} style={{ fontFamily: MONO, fontSize: 10, color:
                                             String(v).toLowerCase().includes('pass') ? P.green : P.amber }}>
                      {k.replace(/_/g, ' ')} · {String(v)}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT }}>
                  The full model card lands with the models pillar (R33S1E3).
                </div>
              </div>
            ) : (
              <span data-testid="model-empty"
                    style={{ fontSize: 12.5, fontFamily: FONT, color: P.muted }}>
                Descriptive artifact — no model attached.
              </span>
            )}
          </div>
        )}

        {tab === 'Comments' && (
          <div data-testid="tab-comments"
               style={{ fontSize: 12.5, fontFamily: FONT, color: P.muted }}>
            The comments drawer — section-anchored threads, inline pins, and
            "Ask AI to apply" — arrives with R30S3E6 over the existing comments
            APIs.
          </div>
        )}

        {tab === 'Share' && (
          <div>
            <button data-testid="make-share-link"
                    onClick={() => api.createShareLink(artifact.id, { expires_in_hours: 168 })
                      .then(r => setShareUrl(r.url)).catch(() => setShareUrl('failed'))}
                    style={{ height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                             border: `1px solid ${P.accentBorder}`, background: P.accentSoft,
                             color: P.accentHover, fontSize: 12, fontWeight: 600,
                             fontFamily: FONT, marginBottom: 10 }}>
              Create public link (7d)
            </button>
            {shareUrl && (
              <div data-testid="share-link-url"
                   style={{ fontFamily: MONO, fontSize: 11, color: P.body,
                            overflowWrap: 'anywhere' }}>{shareUrl}</div>
            )}
            <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT, marginTop: 8 }}>
              The full share modal (visibility, distribute, advanced) lands with R30S3E4.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
