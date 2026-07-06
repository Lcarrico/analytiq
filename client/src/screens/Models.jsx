// R33S1E1-US1 (program R30–R36) — Models overview (`Models.dc.html` frame 01
// / ch18): crumb + 6 live KPI cards + model table with typed status pills
// (CHAMPION / CHALLENGER / TRAINING / RUN FAILED / ARCHIVED) and per-state
// actions over /api/models/overview. Retrain = the real one-click retrain
// (archives champion, queues a run); Evaluate = real challenger evaluation;
// Card / View logs deep-link the model card (R33S1E3) and run detail
// (R33S1E2) routes. Replaces S14 — its deep ops rehome to E2/E4.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const card2 = card;

const STATUS_TINT = {
  CHAMPION: [P.greenBg, P.green], CHALLENGER: [P.accentSoft, P.accentHover],
  TRAINING: [P.amberBg, P.amber], 'RUN FAILED': [P.redBg, P.red],
  ARCHIVED: [P.tableHeadBg, P.muted],
};

export default function ModelsOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState({});

  const load = () => api.modelsOverview().then(setData).catch(() => setData(false));
  useEffect(() => { load(); }, []);

  if (data === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const k = data?.kpis || {};
  const rows = data?.models || [];
  const act = (id, fn) => async () => {
    if (busy[id]) return;
    setBusy(b => ({ ...b, [id]: true }));
    try { await fn(); } catch { /* surfaced by reload */ }
    await load();
    setBusy(b => ({ ...b, [id]: false }));
  };
  const kpis = [
    ['models-kpi-promoted', 'PROMOTED', k.promoted ?? 0],
    ['models-kpi-runs', 'TRAINING RUNS · 30D', k.runs_30d ?? 0],
    ['models-kpi-failed', 'FAILED', k.failed ?? 0],
    ['models-kpi-retrain', 'RETRAIN DUE', k.retrain_due ?? 0],
    ['models-kpi-challenger', 'CHAMP/CHALLENGER', k.champ_challenger ?? 0],
    ['models-kpi-tables', 'PREDICTION TABLES', k.prediction_tables ?? 0],
  ];

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        workspace / models
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: FONT, letterSpacing: '-0.01em' }}>
          Predictive models
        </h1>
        <Btn data-testid="retrain-center-link" size="sm" variant="outline" disabled
             title="The retrain center ships with R33S1E4"
             style={{ marginLeft: 'auto' }}>
          Retrain center &rarr;
        </Btn>
      </div>
      <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 16 }}>
        Every model the workspace trusts — champions, challengers, and the runs
        that produced them.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10,
                    marginBottom: 16 }}>
        {kpis.map(([tid, name, v]) => (
          <div key={tid} data-testid={tid} style={{ ...card, padding: '12px 13px' }}>
            <div style={{ ...label, fontSize: 8.5, whiteSpace: 'nowrap' }}>{name}</div>
            <div data-testid="models-kpi-value"
                 style={{ fontSize: 22, fontWeight: 700, color: P.ink, fontFamily: FONT,
                          marginTop: 5 }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid',
                      gridTemplateColumns: '1.6fr 1.2fr 1fr 1fr .9fr 1.5fr', gap: 10,
                      padding: '0 16px', height: 36, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>MODEL</span><span>PURPOSE</span><span>STATUS</span>
          <span>LAST TRAINED</span><span>ACCURACY</span><span>ACTIONS</span>
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            No models yet — build an analysis in the workbench; training runs land here.
          </div>
        ) : rows.map(m => {
          const key = m.registry_id ?? `job-${m.job_id}`;
          const [bg, fg] = STATUS_TINT[m.status] || STATUS_TINT.ARCHIVED;
          return (
            <div key={key} data-testid={`model-row-${key}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '1.6fr 1.2fr 1fr 1fr .9fr 1.5fr', gap: 10,
                          padding: '10px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700,
                              color: P.ink, overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' }}>
                  {m.model_id}{m.version ? ` v${m.version}` : ''}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' }}>
                  {m.algorithm || 'candidates pending'}{m.grain ? ` · ${m.grain}` : ''}
                </div>
              </div>
              <span style={{ fontSize: 12, color: P.body, fontFamily: FONT,
                             overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap' }}>
                {m.purpose}
              </span>
              <span data-testid="model-status-pill"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 19,
                             padding: '0 9px', borderRadius: 999, background: bg,
                             color: fg, fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                             letterSpacing: '.05em', justifySelf: 'start',
                             whiteSpace: 'nowrap' }}>
                {m.status}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
                {(m.last_trained || '').slice(0, 16) || '—'}
              </span>
              <span data-testid="model-accuracy"
                    style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600,
                             color: P.body }}>
                {m.accuracy?.value ? `${m.accuracy.label} ${m.accuracy.value}` : '—'}
              </span>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(m.status === 'CHAMPION' || m.status === 'ARCHIVED') && m.session_id && (
                  <button data-testid="model-retrain" disabled={!!busy[key]}
                          onClick={act(key, () => api.retrain(m.session_id))}
                          style={{ height: 24, padding: '0 10px', borderRadius: 7,
                                   border: 'none', background: P.accentSoft,
                                   color: P.accentHover, fontSize: 11, fontWeight: 600,
                                   fontFamily: FONT, cursor: 'pointer' }}>
                    {m.status === 'CHAMPION' ? 'Retrain' : 'Retrain now'}
                  </button>
                )}
                {m.status === 'CHALLENGER' && (
                  <button data-testid="model-evaluate" disabled={!!busy[key]}
                          onClick={act(key, () => api.evaluateChallenger(m.registry_id))}
                          style={{ height: 24, padding: '0 10px', borderRadius: 7,
                                   border: 'none', background: P.amberBg, color: P.amber,
                                   fontSize: 11, fontWeight: 600, fontFamily: FONT,
                                   cursor: 'pointer' }}>
                    Evaluate vs champion
                  </button>
                )}
                {m.card_id && (
                  <button data-testid="model-card-link"
                          onClick={() => navigate(`/app/models/${m.card_id}`)}
                          style={{ height: 24, padding: '0 10px', borderRadius: 7,
                                   border: `1px solid ${P.borderStrong}`,
                                   background: '#fff', color: P.body, fontSize: 11,
                                   fontFamily: FONT, cursor: 'pointer' }}>
                    Card
                  </button>
                )}
                {(m.status === 'RUN FAILED' || m.status === 'TRAINING') && m.job_id && (
                  <button data-testid="model-logs-link"
                          onClick={() => navigate(`/app/models/runs/${m.job_id}`)}
                          style={{ height: 24, padding: '0 10px', borderRadius: 7,
                                   border: `1px solid ${P.borderStrong}`,
                                   background: '#fff', color: P.body, fontSize: 11,
                                   fontFamily: FONT, cursor: 'pointer' }}>
                    View logs
                  </button>
                )}
                {m.status === 'CHAMPION' && (
                  <button disabled={!!busy[key]} title="Retire this champion from serving"
                          onClick={act(key, () => api.archiveModel(m.registry_id))}
                          style={{ height: 24, padding: '0 10px', borderRadius: 7,
                                   border: 'none', background: 'transparent',
                                   color: P.faint, fontSize: 11, fontFamily: FONT,
                                   cursor: 'pointer' }}>
                    Archive
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── R33S1E2-US1 — Training run detail (`Models.dc.html` frame 02) ─────────
// Six tabs over run truth: backtest bars from card fold metrics, candidates
// from trials, features from the immutable manifest, leakage from the
// modeler's persisted scan, and a dark log derived from real run facts
// (line timestamps are synthesized from started_at — Agent Note in plan).

const RTABS = ['summary', 'backtest', 'candidates', 'features', 'leakage', 'logs'];

export function RunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('summary');
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const job = await api.trainingJob(id);
        const [card, trials, manifests, gold, registry] = await Promise.all([
          job.model_card_id ? api.modelCard(job.model_card_id) : null,
          api.jobTrials(id).catch(() => []),
          api.featureManifests(job.session_id).catch(() => []),
          api.goldTables(job.session_id).catch(() => []),
          api.registryModels(job.session_id).catch(() => []),
        ]);
        setState({ job, card, trials, manifest: manifests[0],
                   leakage: gold[0]?.dq_gates?.leakage,
                   promoted: registry.some(r => r.model_card_id === job.model_card_id) });
      } catch { setState(false); }
    })();
  }, [id]);

  if (state === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  if (!state || !state.job) {
    return (
      <div style={{ maxWidth: 700 }}>
        <PageHeader title="Training run not found" sub="It may have been cleaned up." />
        <Btn size="sm" variant="outline" onClick={() => navigate('/app/models')}>
          Back to models
        </Btn>
      </div>
    );
  }
  const { job, card, trials, manifest, leakage, promoted } = state;
  const folds = card?.metrics?.folds || [];
  const dur = job.started_at && job.completed_at
    ? Math.max(0.1, (new Date(job.completed_at + 'Z') - new Date(job.started_at + 'Z')) / 1000)
    : null;
  const status = job.status === 'done' ? 'COMPLETED'
    : job.status === 'failed' ? 'FAILED' : job.status.toUpperCase();
  const dropped = leakage?.dropped || [];
  const scan = leakage?.report || leakage?.features || [];
  const maxMape = Math.max(...folds.map(f => f.mape || 0), 1);

  const stamp = i => {
    const t = new Date((job.started_at || job.created_at) + 'Z');
    t.setSeconds(t.getSeconds() + i * 7);
    return t.toISOString().slice(11, 19);
  };
  const logLines = [
    `training started · ${manifest ? manifest.feature_list.length : '—'} features · ${trials.length || 3} candidate families`,
    ...folds.map((f, i) => `window ${f.fold ?? i + 1}/${folds.length} · ${card?.algorithm} mape=${f.mape}`),
    ...dropped.map(d => `dropped feature ${d} · leakage risk HIGH`),
    ...(card ? [`promotion gate ${Object.values(card.gates || {}).every(g => g.status === 'PASS') ? 'passed' : 'reviewed'} · champion=${card.algorithm}`] : []),
    ...(card ? [`model card generated · card ${card.id}`] : []),
    ...(job.error ? [`run failed · ${job.error}`] : []),
  ];

  return (
    <div style={{ maxWidth: 980 }}>
      <div onClick={() => navigate('/app/models')}
           style={{ fontSize: 12, color: P.accent, cursor: 'pointer', marginBottom: 10,
                    fontFamily: FONT }}>
        &larr; Models
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 data-testid="run-headline"
            style={{ margin: 0, fontSize: 20, fontWeight: 700, color: P.ink,
                     fontFamily: MONO }}>
          run {job.id}{card ? ` · ${card.algorithm}` : ''}
        </h1>
        <span data-testid="run-status-pill"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 10px', borderRadius: 999,
                       background: status === 'COMPLETED' ? P.greenBg : P.redBg,
                       color: status === 'COMPLETED' ? P.green : P.red,
                       fontFamily: MONO, fontSize: 9, fontWeight: 700,
                       letterSpacing: '.05em' }}>
          {status}{promoted ? ' · PROMOTED' : ''}
        </span>
        <span data-testid="run-meta"
              style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10.5,
                       color: P.muted }}>
          {(job.completed_at || job.created_at || '').slice(0, 16)}
          {dur != null ? ` · ${dur.toFixed(1)}s` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${P.border}`,
                    margin: '12px 0 14px' }}>
        {RTABS.map(t => (
          <span key={t} data-testid={`rtab-${t}`} onClick={() => setTab(t)}
                style={{ padding: '7px 12px', fontSize: 12.5, cursor: 'pointer',
                         fontFamily: FONT, fontWeight: tab === t ? 600 : 400,
                         color: tab === t ? P.ink : P.muted,
                         borderBottom: tab === t ? `2px solid ${P.accent}`
                           : '2px solid transparent' }}>
            {t === 'backtest' ? 'Backtest windows'
              : t.charAt(0).toUpperCase() + t.slice(1)}
          </span>
        ))}
      </div>

      {tab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[['run-stat-champion', 'CHAMPION', card?.algorithm || '—',
             `won ${trials.length || '—'} candidate trials`],
            ['run-stat-mape', 'BACKTEST MAPE',
             card ? `${card.metrics.val_mape}%` : '—',
             `${folds.length} rolling windows`],
            ['run-stat-leakage', 'LEAKAGE CHECKS',
             scan.length ? `${scan.length - dropped.length}/${scan.length} ✓` : 'clean',
             `${dropped.length} features dropped`]].map(([tid, k, v, sub]) => (
            <div key={tid} data-testid={tid}
                 style={{ background: '#fff', border: `1px solid ${P.border}`,
                          borderRadius: 10, padding: 16 }}>
              <div style={label}>{k}</div>
              <div style={{ fontSize: 21, fontWeight: 700, color: P.ink,
                            fontFamily: FONT, margin: '6px 0 3px' }}>{v}</div>
              <div style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'backtest' && (
        <div style={{ ...card2, padding: 18 }}>
          <div style={{ ...label, marginBottom: 12 }}>BACKTEST ERROR BY WINDOW</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 150 }}>
            {folds.map((f, i) => (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.muted,
                              marginBottom: 4 }}>
                  {f.mape}%
                </div>
                <div data-testid={`bt-bar-${f.fold ?? i + 1}`}
                     style={{ height: Math.max(8, (f.mape / maxMape) * 110),
                              background: P.accent, borderRadius: '5px 5px 0 0',
                              opacity: 0.85 }} />
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint,
                              marginTop: 5 }}>
                  W{f.fold ?? i + 1}
                </div>
              </div>
            ))}
            {folds.length === 0 && (
              <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
                No backtest folds recorded for this run.
              </span>
            )}
          </div>
        </div>
      )}

      {tab === 'candidates' && (
        <div style={{ ...card2, overflow: 'hidden' }}>
          {trials.map((t, i) => (
            <div key={t.id} data-testid={`trial-row-${t.id}`}
                 style={{ display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 16px', borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint,
                             width: 20 }}>#{i + 1}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600,
                             color: P.ink, width: 160 }}>
                {t.params?.family || 'seasonal-trend'}
              </span>
              <span data-testid="trial-mape"
                    style={{ fontFamily: MONO, fontSize: 11.5, color: P.body }}>
                MAPE {t.mape}%
              </span>
              {card && t.mape === Math.min(...trials.map(x => x.mape)) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                               padding: '0 8px', borderRadius: 999, background: P.greenBg,
                               color: P.green, fontFamily: MONO, fontSize: 8.5,
                               fontWeight: 700, marginLeft: 'auto' }}>
                  WINNER
                </span>
              )}
            </div>
          ))}
          {trials.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: P.faint, fontFamily: FONT }}>
              No trials recorded.
            </div>
          )}
        </div>
      )}

      {tab === 'features' && (
        <div style={{ ...card2, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 10, padding: '10px 16px',
                        borderBottom: `1px solid ${P.border}`, alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: P.ink,
                           fontFamily: FONT }}>Feature manifest</span>
            <span data-testid="features-version"
                  style={{ fontFamily: MONO, fontSize: 10, color: P.muted }}>
              v{manifest?.manifest_version || '—'} · immutable
            </span>
          </div>
          {(manifest?.feature_list || []).map(f => (
            <div key={f.name} data-testid={`feat-row-${f.name}`}
                 style={{ display: 'flex', alignItems: 'center', gap: 12,
                          padding: '7px 16px', borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: P.ink, width: 220, overflow: 'hidden',
                             textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.body }}>{f.dtype}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>{f.source}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'leakage' && (
        <div style={{ ...card2, padding: 16 }}>
          {(!scan || scan.length === 0) && dropped.length === 0 ? (
            <span data-testid="leakage-clear"
                  style={{ fontSize: 12.5, color: P.green, fontFamily: FONT }}>
              No leakage flags — every candidate feature passed the scan.
            </span>
          ) : (
            <>
              {dropped.map(d => (
                <div key={d} data-testid={`leak-row-${d}`}
                     style={{ display: 'flex', alignItems: 'center', gap: 10,
                              padding: '6px 0', borderBottom: `1px solid ${P.borderRow}` }}>
                  <span data-testid="leak-name"
                        style={{ fontFamily: MONO, fontSize: 11.5, color: P.faint,
                                 textDecoration: 'line-through' }}>
                    {d}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                                 padding: '0 8px', borderRadius: 999, background: P.redBg,
                                 color: P.red, fontFamily: MONO, fontSize: 8.5,
                                 fontWeight: 700 }}>
                    DROPPED
                  </span>
                  <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                    leakage risk above the hard threshold
                  </span>
                </div>
              ))}
              {(scan || []).filter(r => !dropped.includes(r.feature)).map(r => (
                <div key={r.feature}
                     style={{ display: 'flex', alignItems: 'center', gap: 10,
                              padding: '6px 0', borderBottom: `1px solid ${P.borderRow}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.ink }}>
                    {r.feature}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                                 padding: '0 8px', borderRadius: 999,
                                 background: r.action === 'HOLD' ? P.amberBg : P.greenBg,
                                 color: r.action === 'HOLD' ? P.amber : P.green,
                                 fontFamily: MONO, fontSize: 8.5, fontWeight: 700 }}>
                    {r.action || 'PASS'}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div data-testid="run-log"
             style={{ background: P.ink, borderRadius: 10, padding: '14px 16px',
                      fontFamily: MONO, fontSize: 11.5, lineHeight: 1.9,
                      color: '#cbd5e1' }}>
          {logLines.map((l, i) => (
            <div key={i} data-testid="log-line">
              <span style={{ color: '#64748b' }}>{stamp(i)}</span>{'  '}{l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
