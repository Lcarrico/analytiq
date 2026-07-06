// R33S1E1-US1 (program R30–R36) — Models overview (`Models.dc.html` frame 01
// / ch18): crumb + 6 live KPI cards + model table with typed status pills
// (CHAMPION / CHALLENGER / TRAINING / RUN FAILED / ARCHIVED) and per-state
// actions over /api/models/overview. Retrain = the real one-click retrain
// (archives champion, queues a run); Evaluate = real challenger evaluation;
// Card / View logs deep-link the model card (R33S1E3) and run detail
// (R33S1E2) routes. Replaces S14 — its deep ops rehome to E2/E4.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };

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
