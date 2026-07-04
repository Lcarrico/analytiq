// R16S1E1: Create Workbench — the PRD flagship. Start state → chat planning
// turn (clarification chips, §7.4) → inline plan-confirmation card (§7.5,
// incl. ACCESS disclosure) → Approve & Build. Three-column layout arrives
// fully in E2/E3 (canvas + inspector); this story owns chat + plan + kickoff.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Btn, StatusBadge } from '../components/ui';
import BuildCanvas from '../components/BuildCanvas';
import Inspector from '../components/Inspector';
import { FONT, MONO, P } from '../tokens';

const EXAMPLES = [
  { kind: 'FORECAST', text: 'Forecast net revenue for the next 14 days by location' },
  { kind: 'PREDICTIVE', text: 'Predict customer churn risk for the next 30 days' },
  { kind: 'VARIANCE', text: 'Explain the variance in average ticket versus last month' },
  { kind: 'ANOMALY', text: 'Monitor daily revenue for anomalies by store' },
];

function Bubble({ role, children }) {
  const user = role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: user ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div style={{ maxWidth: '86%', padding: '10px 14px', fontSize: 13.5, fontFamily: FONT,
                    lineHeight: 1.5, borderRadius: user ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    background: user ? P.accent : '#fff', color: user ? '#fff' : P.body,
                    border: user ? 'none' : `1px solid ${P.border}` }}>
        {children}
      </div>
    </div>
  );
}

function PlanCard({ plan, onApprove, busy }) {
  const rows = [
    ['Goal', plan.analytic_goal || `${plan.intent} analysis of ${plan.target_metric}`],
    ['Metric', plan.target_metric],
    ['Grain', plan.grain],
    ['Time range', plan.date_range ? `${plan.date_range.start || 'rolling'} → ${plan.date_range.end || 'now'}` : 'trailing 12 months'],
    ['Output', plan.output_type || 'forecast_dashboard'],
    ['Horizon', plan.prediction_horizon ? `${plan.prediction_horizon} days` : '—'],
    ['Access', plan.access_limitations ? plan.access_limitations.note : 'No PII restrictions apply to this plan'],
  ];
  return (
    <div data-testid="plan-card" style={{ border: `1px solid ${P.accentBorder}`, borderRadius: 10,
                                          background: P.accentSoft, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '.05em',
                    color: P.accentHover, marginBottom: 8 }}>Proposed plan</div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: 13, fontFamily: FONT }}>
          <span style={{ width: 92, flexShrink: 0, color: P.muted, fontFamily: MONO, fontSize: 11,
                         textTransform: 'uppercase', paddingTop: 1 }}>{k}</span>
          <span style={{ color: P.ink }}>{String(v)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn size="sm" data-testid="approve-build" disabled={busy} onClick={onApprove}>
          {busy ? 'Starting…' : 'Approve & Build'}
        </Btn>
      </div>
    </div>
  );
}

export default function Workbench() {
  const { sessionId: rawSessionId } = useParams();
  const sessionId = rawSessionId === 'new' ? null : rawSessionId;
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState([]);          // {role, text?, plan?, chips?, conf?}
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [runId, setRunId] = useState(null);
  const [runStatus, setRunStatus] = useState(null);
  const [artifact, setArtifact] = useState(null);   // R16S2E3
  const bottomRef = useRef(null);
  const pendingQ = useRef(null);                 // original ambiguous question
  const [params] = useSearchParams();            // R22S1E1-US2 hero seed
  const seeded = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  // R22S1E1-US2 — a home-hero question arrives as ?q=…; feed it into the
  // planning turn exactly once, as if the user had typed it here.
  useEffect(() => {
    const seed = params.get('q');
    if (seed && !seeded.current && !sessionId && msgs.length === 0) {
      seeded.current = true;
      plan(seed);
    }
  }, []);   // mount-only by design: the seed fires exactly once

  useEffect(() => {
    if (!runId) return;
    const t = setInterval(async () => {
      try {
        const r = await api.getPipelineRun(runId);
        setRunStatus(r.status);
        if (r.status === 'done' || r.status === 'failed') clearInterval(t);
      } catch { /* keep polling */ }
    }, 300);
    return () => clearInterval(t);
  }, [runId]);

  const plan = async (message) => {
    setBusy(true);
    setMsgs(m => [...m, { role: 'user', text: message }]);
    try {
      const p = await api.planSession({ message });
      if (p.needs_clarification) {
        pendingQ.current = message;
        setMsgs(m => [...m, { role: 'ai', text: p.question || 'Quick check —',
                              chips: p.options || [], conf: p.intent_confidence }]);
      } else {
        pendingQ.current = null;
        let sid = sessionId;
        if (!sid) {
          const sess = await api.createSession({ metric: p.target_metric, horizon: p.prediction_horizon || 14 });
          sid = sess.id;
          navigate(`/app/create/${sid}`, { replace: true });
        }
        setMsgs(m => [...m, { role: 'ai', plan: p, sid }]);
      }
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Planning failed — try rephrasing the question.' }]);
    } finally { setBusy(false); }
  };

  const send = () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput('');
    plan(t);
  };

  const pickChip = (opt) => {
    // §7.4: answering the clarifying question folds the choice into the ask
    const base = pendingQ.current || 'Analyze';
    plan(`${base} — specifically: ${opt}`);
  };

  const approve = async (planMsg) => {
    setBusy(true);
    try {
      const p = planMsg.plan;
      await api.confirmSpec(planMsg.sid, {
        intent: p.intent || 'predictive', intent_confidence: p.intent_confidence || 0.9,
        analytic_goal: p.analytic_goal || `Workbench: ${p.target_metric}`,
        target_metric: p.target_metric, feature_candidates: p.feature_candidates || [],
        date_range: p.date_range || { start: '2023-01-01', end: '2023-12-31' },
        grain: p.grain || 'Location · Day', output_type: p.output_type || 'forecast_dashboard',
        prediction_horizon: p.prediction_horizon || 14, explores_used: p.explores_used || [],
        semantic_layer_version: p.semantic_layer_version || '1.0.0',
        governance_manifest_version: p.governance_manifest_version || '1.0.0',
      });
      const run = await api.startPipeline({ sessionId: planMsg.sid });
      setRunId(run.runId);
      setRunStatus('running');
      setMsgs(m => [...m, { role: 'ai', text: 'Plan approved — building your dashboard now.' }]);
    } catch (e) {
      let msg = e.message; try { msg = JSON.parse(e.message)?.error || msg; } catch { /* raw */ }
      setMsgs(m => [...m, { role: 'ai', text: `Build blocked: ${msg}` }]);
    } finally { setBusy(false); }
  };

  const started = msgs.length > 0 || sessionId;

  return (
    <div style={{ display: 'flex', gap: 18, height: 'calc(100vh - 150px)' }}>
      {/* chat column */}
      <div style={{ width: started ? 420 : '100%', display: 'flex', flexDirection: 'column',
                    transition: 'width .15s' }}>
        {!started && (
          <div data-testid="workbench-start" style={{ maxWidth: 720, margin: '48px auto 0', width: '100%' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: P.ink,
                          textAlign: 'center' }}>What do you want to understand?</div>
            <div style={{ fontSize: 13, fontFamily: FONT, color: P.muted, textAlign: 'center',
                          margin: '6px 0 22px' }}>
              Ask a business question — the pipeline plans, validates, and builds a governed dashboard.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
              {EXAMPLES.map(ex => (
                <button key={ex.kind} onClick={() => { setInput(ex.text); }}
                        style={{ textAlign: 'left', padding: 14, borderRadius: 10, cursor: 'pointer',
                                 border: `1px solid ${P.border}`, background: '#fff' }}>
                  <div style={{ fontSize: 10, fontFamily: MONO, fontWeight: 600, color: P.accentHover,
                                letterSpacing: '.05em', marginBottom: 6 }}>{ex.kind}</div>
                  <div style={{ fontSize: 13, fontFamily: FONT, color: P.body }}>{ex.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {started && (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
            {msgs.map((m, i) => (
              <div key={i}>
                {m.text && <Bubble role={m.role}>{m.text}</Bubble>}
                {m.chips && (
                  <div data-testid="clarify-chips" style={{ display: 'flex', gap: 6, flexWrap: 'wrap',
                                                            margin: '2px 0 10px' }}>
                    {m.chips.map(opt => (
                      <button key={opt} onClick={() => pickChip(opt)}
                              style={{ border: `1px solid ${P.accentBorder}`, background: '#fff',
                                       color: P.accentHover, borderRadius: 14, padding: '5px 12px',
                                       fontSize: 12.5, fontFamily: FONT, cursor: 'pointer' }}>
                        {opt}
                      </button>
                    ))}
                    {m.conf != null && (
                      <span data-testid="confidence-chip"
                            style={{ fontSize: 11, fontFamily: MONO, color: P.muted,
                                     alignSelf: 'center' }}>
                        confidence {m.conf}
                      </span>
                    )}
                  </div>
                )}
                {m.plan && <PlanCard plan={m.plan} busy={busy} onApprove={() => approve(m)} />}
              </div>
            ))}
            {runStatus && (
              <div data-testid="build-state" style={{ border: `1px solid ${P.border}`, borderRadius: 10,
                                                      background: '#fff', padding: 12, fontSize: 13,
                                                      fontFamily: FONT, color: P.body }}>
                <StatusBadge status={runStatus === 'done' ? 'green' : runStatus === 'failed' ? 'red' : 'amber'}>
                  {runStatus}
                </StatusBadge>
                <span style={{ marginLeft: 8 }}>
                  {runStatus === 'done' ? 'Build complete.' :
                   runStatus === 'failed' ? 'Build failed — see pipeline detail.' :
                   'Building your governed dashboard…'}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, paddingTop: 10,
                      maxWidth: started ? 'none' : 720,
                      margin: started ? 0 : '0 auto', width: started ? 'auto' : '100%' }}>
          <input data-testid="workbench-input" value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && send()}
                 placeholder="Ask a business question…"
                 style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${P.borderStrong}`,
                          padding: '0 14px', fontSize: 13.5, fontFamily: FONT, outline: 'none' }} />
          <Btn data-testid="workbench-send" onClick={send} disabled={busy}>⏎ Build</Btn>
        </div>
      </div>

      {/* canvas + inspector columns arrive with R16S1E2 / R16S2E3 */}
      {started && (
        <div data-testid="workbench-canvas" style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          {runId ? (
            <BuildCanvas runId={runId}
                         sessionMetric={msgs.find(m => m.plan)?.plan?.target_metric}
                         onArtifact={setArtifact} />
          ) : (
            <div style={{ flex: 1, border: `1px dashed ${P.borderStrong}`, borderRadius: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: P.faint, fontFamily: MONO, fontSize: 12 }}>
              approve the plan to start the build
            </div>
          )}
        </div>
      )}
      {artifact && <Inspector artifact={artifact} runId={runId} />}
    </div>
  );
}
