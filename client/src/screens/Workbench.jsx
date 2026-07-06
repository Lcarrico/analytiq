// R16S1E1: Create Workbench — the PRD flagship. Start state → chat planning
// turn (clarification chips, §7.4) → inline plan-confirmation card (§7.5,
// incl. ACCESS disclosure) → Approve & Build. Three-column layout arrives
// fully in E2/E3 (canvas + inspector); this story owns chat + plan + kickoff.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, auth } from '../api';
import { Avatar, Btn, StatusBadge } from '../components/ui';
import ShareModal from '../components/ShareModal';   // R30S3E4 canonical
import VersionsPanel from '../components/VersionsPanel';   // R30S3E5
import CommentsDrawer from '../components/CommentsDrawer';   // R30S3E6
import BuildCanvas from '../components/BuildCanvas';
import { Logo } from '../components/icons';
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
    <div style={{ display: 'flex', justifyContent: user ? 'flex-end' : 'flex-start',
                  gap: 8, marginBottom: 10 }}>
      {!user && (
        <span data-testid="agent-tile"
              style={{ width: 24, height: 24, borderRadius: '4px 8px 8px 8px', background: P.ink,
                       display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                       flexShrink: 0, marginTop: 2 }}>
          <Logo size={13} withWordmark={false} dark />
        </span>
      )}
      <div style={{ maxWidth: '86%', padding: '10px 14px', fontSize: 13.5, fontFamily: FONT,
                    lineHeight: 1.5, borderRadius: user ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    background: user ? P.accent : '#fff', color: user ? '#fff' : P.body,
                    border: user ? 'none' : `1px solid ${P.border}` }}>
        {children}
      </div>
    </div>
  );
}

function PencilGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12">
      <path d="M8.6 1.6 10.4 3.4 4 9.8 1.8 10.2 2.2 8 8.6 1.6Z" fill="none"
            stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function PlanCard({ plan, onApprove, onEdit, onCancel, busy, approved }) {
  // R30S2E2 — frame rows: Dimensions from the grain, Forecast when predictive,
  // Sources from explores_used over the demo source.
  const dims = (plan.grain || 'Location · Day').split('·').map(s => s.trim().toLowerCase()).join(', ');
  const rows = [
    ['Goal', plan.analytic_goal || `${plan.intent} analysis of ${plan.target_metric}`],
    ['Metric', plan.target_metric, 'chip'],
    ['Dimensions', dims],
    ['Grain', plan.grain],
    ['Time range', plan.date_range ? `${plan.date_range.start || 'rolling'} → ${plan.date_range.end || 'now'}` : 'trailing 12 months'],
    ['Forecast', plan.prediction_horizon ? `${plan.prediction_horizon}-day horizon · backtested` : 'not requested'],
    ['Sources', ['sample_retail', ...(plan.explores_used || [])].join(' · ')],
    ['Output', plan.output_type || 'forecast_dashboard'],
    ['Access', plan.access_limitations ? plan.access_limitations.note : 'No PII restrictions apply to this plan'],
  ];
  return (
    <div data-testid="plan-card" style={{ border: `1px solid ${P.accentBorder}`, borderRadius: 10,
                                          background: P.accentSoft, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
          Review your plan
        </span>
        {approved && (
          <span data-testid="plan-approved">
            <StatusBadge status="green">APPROVED</StatusBadge>
          </span>
        )}
      </div>
      {rows.map(([k, v, kind]) => (
        <div key={k} style={{ display: 'flex', gap: 10, padding: '4px 0', fontSize: 13,
                              fontFamily: FONT, alignItems: 'baseline' }}>
          <span style={{ width: 92, flexShrink: 0, color: P.muted, fontFamily: MONO, fontSize: 11,
                         textTransform: 'uppercase', paddingTop: 1 }}>{k}</span>
          {kind === 'chip' ? (
            <span data-testid="plan-metric-chip"
                  style={{ fontFamily: MONO, fontSize: 11, color: P.accentHover }}>{String(v)}</span>
          ) : (
            <span style={{ color: P.ink, minWidth: 0 }}>{String(v)}</span>
          )}
          <span data-testid="plan-row-edit" title={`Edit ${k.toLowerCase()}`}
                onClick={() => onEdit && onEdit(k)}
                style={{ marginLeft: 'auto', color: P.faint, cursor: 'pointer',
                         display: 'inline-flex', flexShrink: 0 }}>
            <PencilGlyph />
          </span>
        </div>
      ))}
      {(plan.metrics || []).length > 0 && (
        <div data-testid="plan-metrics"
             style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${P.accentBorder}` }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700,
                        letterSpacing: '.06em', color: P.muted, marginBottom: 6 }}>
            METRIC CHECKLIST · {plan.metrics.filter(m => m.resolved).length} resolved
            · {plan.metrics.filter(m => !m.resolved).length} to resolve
          </div>
          {plan.metrics.map(m => (
            <div key={m.id} data-testid={`pm-row-${m.id}`}
                 style={{ display: 'flex', gap: 8, alignItems: 'center',
                          padding: '3px 0', fontSize: 12.5, fontFamily: FONT }}>
              <span style={{ color: P.ink, fontWeight: 600 }}>{m.label}</span>
              <span data-testid="pm-role"
                    style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                             color: P.accentHover, background: '#fff',
                             border: `1px solid ${P.accentBorder}`,
                             borderRadius: 8, padding: '1px 7px' }}>
                {(m.role || '').toUpperCase()}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
                {m.format}{m.dependencies ? ` · ← ${m.dependencies.join(' + ')}` : ''}
              </span>
              {m.resolved ? (
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9.5,
                               color: P.green, fontWeight: 700 }}>✓</span>
              ) : (
                <span data-testid="pm-unresolved" title={m.reason || 'Unresolved'}
                      style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 8.5,
                               fontWeight: 700, color: P.amber, background: P.amberBg,
                               borderRadius: 8, padding: '2px 7px', cursor: 'help' }}>
                  UNRESOLVED
                </span>
              )}
            </div>
          ))}
          {(plan.components_intent || []).length > 0 && (
            <div data-testid="plan-components"
                 style={{ fontFamily: MONO, fontSize: 10, color: P.muted, marginTop: 8 }}>
              {plan.components_intent.length} component(s) proposed ·{' '}
              {[...new Set(plan.components_intent.map(c => c.type))].join(' · ')}
            </div>
          )}
        </div>
      )}
      {!approved && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <Btn size="sm" data-testid="approve-build" disabled={busy} onClick={onApprove}>
            {busy ? 'Starting…' : 'Approve & Build'}
          </Btn>
          <Btn size="sm" variant="outline" data-testid="plan-edit" onClick={() => onEdit && onEdit()}>
            Edit plan
          </Btn>
          <span data-testid="plan-cancel" onClick={onCancel}
                style={{ marginLeft: 'auto', fontSize: 12.5, fontFamily: FONT, color: P.muted,
                         cursor: 'pointer' }}>Cancel</span>
        </div>
      )}
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
  const [trust, setTrust] = useState(null);   // R37S1E1: evidence-derived
  const [runId, setRunId] = useState(null);
  const [runStatus, setRunStatus] = useState(null);
  const [artifact, setArtifact] = useState(null);   // R16S2E3
  // R30S2E4 — canvas selection state lifted so the inspector edits it too
  const [selectedSection, setSelectedSection] = useState(null);
  const [vsTarget, setVsTarget] = useState({});
  const [layout, setLayout] = useState(null);
  const bottomRef = useRef(null);
  const pendingQ = useRef(null);                 // original ambiguous question
  const doneNotified = useRef(false);            // R30S2E2 done-state once
  const msgsRef = useRef([]);
  const [params] = useSearchParams();            // R22S1E1-US2 hero seed
  const seeded = useRef(false);
  // R30S2E1 — session topbar state: last-save stamp ticks; share modal
  const [lastSaved, setLastSaved] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);   // R30S3E5
  const [commentsOpen, setCommentsOpen] = useState(false);    // R30S3E6
  const [comments, setComments] = useState([]);
  const [warm, setWarm] = useState(null);              // R30S3E7 ← S06 warm start
  useEffect(() => { api.warmStart().then(setWarm).catch(() => {}); }, []);
  useEffect(() => {
    if (!artifact) return;
    api.getComments(artifact.id).then(setComments).catch(() => {});
  }, [artifact?.id]);
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick(n => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); msgsRef.current = msgs; }, [msgs]);

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
        if (r.status === 'done' || r.status === 'failed') {
          clearInterval(t);
          if (r.status === 'done' && !doneNotified.current) {
            doneNotified.current = true;
            setLastSaved(Date.now());
            const metric = msgsRef.current.find(m => m.plan)?.plan?.target_metric || 'your metric';
            setMsgs(m => [...m, {
              role: 'ai',
              summary: metric,
              followups: [`Why is ${metric} below target?`, 'Add a promo overlay',
                          'Which locations drive the gap?'],
            }]);
          }
        }
      } catch { /* keep polling */ }
    }, 300);
    return () => clearInterval(t);
  }, [runId]);

  const plan = async (message) => {
    setBusy(true);
    setMsgs(m => [...m, { role: 'user', text: message }]);
    try {
      const p = await api.planSession({ message });
      if (p.trust) setTrust(p.trust);   // R37S1E1
      setLastSaved(Date.now());                      // R30S2E1 autosave stamp
      if (p.needs_clarification) {
        pendingQ.current = message;
        setMsgs(m => [...m, { role: 'ai', text: p.question || 'Quick check —',
                              chips: p.options || [], conf: p.intent_confidence }]);
      } else {
        pendingQ.current = null;
        let sid = sessionId;
        if (!sid) {
          // R38S2E2 (F-03): no forced horizon — descriptive plans carry none
          const sess = await api.createSession({ metric: p.target_metric, horizon: p.prediction_horizon ?? null });
          sid = sess.id;
          navigate(`/app/create/${sid}`, { replace: true });
        }
        // R30S2E2 — mono status lines under the ask (frame): sources matched,
        // metric resolved against the governed layer.
        const nSrc = 1 + (p.explores_used?.length || 0);
        const status = [
          `matched ${nSrc} source${nSrc === 1 ? '' : 's'} · sample_retail${(p.explores_used || []).map(e => `, ${e}`).join('')}`,
          `resolved metric · ${p.target_metric} (governed)`,
        ];
        if (p.assumptions?.length) {
          // R30S3E7 (from S06/R10S2E4): expert-mode defaults surfaced inline
          status.push(`Assumptions: ${p.assumptions.join('; ')}.`);
        }
        const msgId = Date.now() + Math.random();
        const planMsg = { id: msgId, role: 'ai', plan: p, sid, status, related: [], reuse: [] };
        setMsgs(m => [...m, planMsg]);
        // R30S3E7 (from S06/R10S1E2+R10S2E7): KG neighbors + prior validated
        // plans — map by id: the two fetches race and identity-mapping loses
        // the second update (root-caused)
        api.kgRelated(p.target_metric)
          .then(r => setMsgs(m => m.map(x => x.id === msgId ? { ...x, related: r.related || [] } : x)))
          .catch(() => {});
        api.reuseCandidates(p.target_metric)
          .then(r => setMsgs(m => m.map(x => x.id === msgId ? { ...x, reuse: r.candidates || [] } : x)))
          .catch(() => {});
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
        prediction_horizon: p.prediction_horizon ?? null,   /* R38S2E2: never forced */
        explores_used: p.explores_used || [],
        semantic_layer_version: p.semantic_layer_version || '1.0.0',
        governance_manifest_version: p.governance_manifest_version || '1.0.0',
      });
      const run = await api.startPipeline({ sessionId: planMsg.sid });
      setRunId(run.runId);
      setRunStatus('running');
      setLastSaved(Date.now());
      setMsgs(m => m.map(x => x === planMsg ? { ...x, approved: true } : x)
                    .concat({ role: 'ai', text: 'Plan approved — building your dashboard now.' }));
    } catch (e) {
      let msg = e.message; try { msg = JSON.parse(e.message)?.error || msg; } catch { /* raw */ }
      setMsgs(m => [...m, { role: 'ai', text: `Build blocked: ${msg}` }]);
    } finally { setBusy(false); }
  };

  const started = msgs.length > 0 || sessionId;

  // R30S2E1 — session topbar derivations
  const firstQ = msgs.find(m => m.role === 'user')?.text;
  const wbTitle = firstQ ? (firstQ.length > 52 ? `${firstQ.slice(0, 52)}…` : firstQ) : 'New analysis';
  const metric = msgs.find(m => m.plan)?.plan?.target_metric;
  const savedAgo = lastSaved == null ? null
    : Math.round((Date.now() - lastSaved) / 1000) < 20 ? 'autosaved just now'
    : `autosaved ${Math.round((Date.now() - lastSaved) / 60000) || 1}m ago`;
  const user = auth.user();

  return (
    <div style={{ margin: '-28px -32px', height: '100vh', display: 'flex',
                  flexDirection: 'column', minHeight: 0 }}>
      {/* ── 56px session topbar (Create Workbench frame; Reconciliation (e)) ── */}
      <div data-testid="session-topbar"
           style={{ height: 56, flexShrink: 0, background: '#fff',
                    borderBottom: `1px solid ${P.border}`, display: 'flex',
                    alignItems: 'center', gap: 12, padding: '0 20px' }}>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span data-testid="wb-title"
                style={{ fontSize: 13.5, fontWeight: 600, color: P.ink, fontFamily: FONT,
                         whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                         maxWidth: 420 }}>{wbTitle}</span>
          <span data-testid="wb-session-meta"
                style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
            session · {sessionId || 'new'}{metric ? ` · ${metric}` : ''}
          </span>
        </div>
        {started && trust?.governed && (
          <span data-testid="wb-governed"
                title={`Bound to semantic schema v${trust.schema_version} · manifest ${trust.manifest_version}`}>
            <StatusBadge status="green">GOVERNED</StatusBadge>
          </span>
        )}
        {started && trust && !trust.governed && (
          <span data-testid="wb-ungoverned"
                title="No governed semantic schema yet — run governance on a data source to bind plans to catalog definitions.">
            <StatusBadge status="amber">UNGOVERNED</StatusBadge>
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {savedAgo && (
            <span data-testid="wb-autosaved"
                  style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>{savedAgo}</span>
          )}
          <Btn data-testid="wb-versions" variant="outline" size="sm" disabled={!artifact}
               title={artifact ? 'Version history' : 'Versions unlock once the build completes'}
               onClick={() => artifact && setVersionsOpen(true)}>
            Versions
          </Btn>
          <Btn data-testid="wb-share" size="sm" disabled={!artifact}
               title={artifact ? 'Share this artifact' : 'Share unlocks once the build completes'}
               onClick={() => artifact && setShareOpen(true)}>
            Share
          </Btn>
          <span data-testid="wb-avatar">
            <Avatar initials={(user?.email || 'analyst@acme.com').split('@')[0].slice(0, 2).toUpperCase()}
                    size={30} />
          </span>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 18, padding: 18 }}>
      {/* chat column */}
      <div style={{ width: started ? 340 : '100%', display: 'flex', flexDirection: 'column',
                    transition: 'width .15s' }}>
        {!started && (
          <div data-testid="workbench-start" style={{ maxWidth: 720, margin: '48px auto 0', width: '100%' }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT, color: P.ink,
                          textAlign: 'center' }}>What do you want to understand?</div>
            <div style={{ fontSize: 13, fontFamily: FONT, color: P.muted, textAlign: 'center',
                          margin: '6px 0 22px' }}>
              Ask a business question — the pipeline plans, validates, and builds a governed dashboard.
            </div>
            {warm?.has_history && (
              <div data-testid="warm-start-hints"
                   style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
                            justifyContent: 'center', margin: '0 0 14px', fontSize: 11,
                            fontFamily: MONO, color: P.muted }}>
                <span>From your history:</span>
                {(warm.likely_intents || []).slice(0, 2).map(li => (
                  <span key={li.intent} style={{ border: `1px solid ${P.border}`, borderRadius: 10,
                                                 padding: '2px 8px' }}>{li.intent} ×{li.count}</span>
                ))}
                {(warm.recent_metrics || []).slice(0, 3).map(m2 => (
                  <span key={m2} style={{ color: P.faint }}>{m2}</span>
                ))}
              </div>
            )}
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
                {m.summary && (
                  <Bubble role="ai">
                    Build complete — the <strong>{m.summary}</strong> dashboard is assembled,
                    gated, and saved. Refine it below or jump into a follow-up.
                  </Bubble>
                )}
                {m.status && (
                  <div data-testid="chat-status-lines"
                       style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted,
                                margin: '0 0 10px 32px', display: 'flex',
                                flexDirection: 'column', gap: 3 }}>
                    {m.status.map(s => (
                      <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="9" height="9" viewBox="0 0 9 9">
                          <path d="m1.5 4.5 2 2 4-4.5" fill="none" stroke={P.green}
                                strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {m.followups && (
                  <div data-testid="followup-chips"
                       style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '2px 0 10px 32px' }}>
                    {m.followups.map(f => (
                      <button key={f} onClick={() => plan(f)}
                              style={{ border: `1px solid ${P.accentBorder}`, background: '#fff',
                                       color: P.accentHover, borderRadius: 14, padding: '5px 12px',
                                       fontSize: 12.5, fontFamily: FONT, cursor: 'pointer' }}>
                        {f}
                      </button>
                    ))}
                  </div>
                )}
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
                    <button data-testid="chip-not-sure" onClick={() => pickChip(m.chips[0])}
                            style={{ border: `1px dashed ${P.borderStrong}`, background: '#fff',
                                     color: P.muted, borderRadius: 14, padding: '5px 12px',
                                     fontSize: 12.5, fontFamily: FONT, cursor: 'pointer' }}>
                      Not sure
                    </button>
                    <button data-testid="chip-recommended" onClick={() => pickChip(m.chips[0])}
                            style={{ border: 'none', background: P.accent, color: '#fff',
                                     borderRadius: 14, padding: '5px 12px', fontSize: 12.5,
                                     fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
                      Use recommended
                    </button>
                    {m.conf != null && (
                      <span data-testid="confidence-chip"
                            style={{ fontSize: 10.5, fontFamily: MONO, color: P.muted,
                                     alignSelf: 'center', display: 'inline-flex',
                                     alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: 3, background: P.amber }} />
                        confidence {m.conf} — worth confirming
                      </span>
                    )}
                  </div>
                )}
                {m.reuse?.length > 0 && (
                  <div data-testid="reuse-candidates"
                       style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
                                margin: '2px 0 8px 32px' }}>
                    <span style={{ fontSize: 10.5, color: P.faint, fontFamily: MONO }}>
                      Start from a prior analysis:
                    </span>
                    {m.reuse.slice(0, 3).map(cand => (
                      <span key={cand.plan_uid} title={`similarity ${cand.similarity}`}
                            style={{ fontSize: 10.5, fontFamily: MONO, border: `1px solid ${P.accentBorder}`,
                                     borderRadius: 10, padding: '2px 8px', color: P.accentHover }}>
                        {cand.payload.metric} · {Math.round(cand.similarity * 100)}%
                      </span>
                    ))}
                  </div>
                )}
                {m.related?.length > 0 && (
                  <div data-testid="kg-related"
                       style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
                                margin: '2px 0 8px 32px' }}>
                    <span style={{ fontSize: 10.5, color: P.faint, fontFamily: MONO }}>Related:</span>
                    {m.related.map(r2 => (
                      <span key={r2.metric} style={{ fontSize: 10.5, fontFamily: MONO,
                                                     border: `1px solid ${P.border}`, borderRadius: 10,
                                                     padding: '2px 8px', color: P.muted }}>
                        {r2.metric}
                      </span>
                    ))}
                  </div>
                )}
                {m.plan && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span data-testid="agent-tile"
                          style={{ width: 24, height: 24, borderRadius: '4px 8px 8px 8px',
                                   background: P.ink, display: 'inline-flex', alignItems: 'center',
                                   justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Logo size={13} withWordmark={false} dark />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <PlanCard plan={m.plan} busy={busy} approved={m.approved}
                                onApprove={() => approve(m)}
                                onEdit={(row) => setInput(row
                                  ? `Change the ${row.toLowerCase()} — `
                                  : (msgs.find(x => x.role === 'user')?.text || ''))}
                                onCancel={() => setMsgs(list => list.filter(x => x !== m))} />
                    </div>
                  </div>
                )}
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
                 placeholder={doneNotified.current || artifact
                   ? 'Ask a follow-up or refine…' : 'Ask a business question…'}
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
                         onArtifact={setArtifact}
                         selected={selectedSection} setSelected={setSelectedSection}
                         vsTarget={vsTarget} setVsTarget={setVsTarget}
                         layout={layout} setLayout={setLayout}
                         comments={comments} setComments={setComments}
                         onOpenComments={() => setCommentsOpen(true)} />
          ) : (
            <div style={{ flex: 1, border: `1px dashed ${P.borderStrong}`, borderRadius: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: P.faint, fontFamily: MONO, fontSize: 12 }}>
              approve the plan to start the build
            </div>
          )}
        </div>
      )}
      {artifact && (
        <Inspector artifact={artifact} runId={runId}
                   selected={selectedSection} layout={layout} setLayout={setLayout}
                   vsTarget={vsTarget} setVsTarget={setVsTarget}
                   metric={msgs.find(m => m.plan)?.plan?.target_metric}
                   grain={msgs.find(m => m.plan)?.plan?.grain} />
      )}
      </div>
      {shareOpen && artifact && (
        <ShareModal artifact={artifact} onClose={() => setShareOpen(false)} />
      )}
      {versionsOpen && artifact && (
        <VersionsPanel artifact={artifact} onClose={() => setVersionsOpen(false)} />
      )}
      {commentsOpen && artifact && (
        <CommentsDrawer artifact={artifact} selectedSection={selectedSection}
                        onChanged={setComments}
                        onAskAI={(t) => { setCommentsOpen(false);
                                          setInput(`Apply this feedback: ${t}`); }}
                        onClose={() => setCommentsOpen(false)} />
      )}
    </div>
  );
}
