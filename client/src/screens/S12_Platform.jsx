import { useEffect, useState } from 'react';
import { Btn, Card, PageHeader, Badge } from '../components/ui';
import { AdminOnly } from '../components/roles';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

const H = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase',
                letterSpacing: '0.06em', fontFamily: MONO, margin: '18px 0 8px' }}>{children}</div>
);
const Row = ({ cols }) => (
  <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: MONO,
                padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
    {cols.map((c, i) => <span key={i} style={{ flex: i === 0 ? 2 : 1, overflow: 'hidden',
                                               textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>)}
  </div>
);
const input = { padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                fontSize: 12, fontFamily: MONO, outline: 'none' };

export default function Screen12() {
  const [status, setStatus]   = useState(null);
  const [jobs, setJobs]       = useState([]);
  const [logs, setLogs]       = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [outbox, setOutbox]   = useState([]);
  const [alerts, setAlerts]   = useState([]);
  const [cache, setCache]     = useState(null);   // R8S1E2
  const [disp, setDisp]       = useState(null);   // R9S1E1
  const [events, setEvents]   = useState([]);     // R9S1E3
  const [meta, setMeta]       = useState(null);   // R9S2E4
  const [consults, setConsults] = useState([]);   // R9S2E5
  const [optims, setOptims]   = useState([]);     // R9S2E7
  const [feedback, setFeedback] = useState([]);   // R12S1E2
  const [signals, setSignals] = useState([]);     // R12S2E3
  const [brand, setBrand]     = useState({ primary_color: '#4f7cff', logo_text: '', font_family: '' });
  const [msg, setMsg]         = useState('');

  const load = () => {
    api.platformStatus().then(setStatus).catch(() => {});
    api.platformJobs().then(setJobs).catch(() => {});
    api.platformLogs(15).then(setLogs).catch(() => {});
    api.platformMetrics().then(setMetrics).catch(() => {});
    api.platformOutbox().then(setOutbox).catch(() => {});
    api.getAlerts().then(setAlerts).catch(() => {});
    api.platformCache().then(setCache).catch(() => {});
    api.platformDispatches().then(setDisp).catch(() => {});
    api.platformEvents().then(r => setEvents(r.events)).catch(() => {});
    api.metaDecisions().then(setMeta).catch(() => {});
    api.agentConsultations().then(r => setConsults(r.consultations)).catch(() => {});
    api.optimizations().then(r => setOptims(r.proposals)).catch(() => {});
    api.platformFeedback().then(r => setFeedback(r.types)).catch(() => {});
    api.platformSignals().then(r => setSignals(r.signals)).catch(() => {});
    api.getBranding().then(b => b && b.workspace_id && setBrand({
      primary_color: b.primary_color || '#4f7cff',
      logo_text: b.logo_text || '', font_family: b.font_family || '' })).catch(() => {});
  };
  useEffect(() => { load(); }, []);   // PAR-2 unmount-crash fix

  const saveBrand = async () => {
    setMsg('');
    try { await api.putBranding(brand); setMsg('Branding saved — applied to new renders.'); }
    catch (e) { let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch {}
                setMsg(`️ ${m}`); }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <PageHeader title="Platform" sub="Managed-tool integrations with automatic local fallbacks — zero external keys required." />

      <AdminOnly>

      <Card>
        <H>Service modes</H>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {status && Object.entries(status).map(([svc, v]) => (
            <div key={svc} style={{ padding: '10px 12px', background: C.bg, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT }}>{svc}</div>
              <Badge variant={v.fallback_active ? 'default' : 'success'} xs>{v.mode}</Badge>
            </div>
          ))}
        </div>

        <H>Latency</H>
        {metrics && (
          <div style={{ fontSize: 12, fontFamily: MONO }}>
            {metrics.requests} requests · P50 {metrics.latency_ms.p50}ms · P95 {metrics.latency_ms.p95}ms
          </div>
        )}

        <H>Jobs</H>
        {jobs.slice(0, 8).map(j => <Row key={j.id} cols={[j.kind, j.status, j.created_at]} />)}
        {!jobs.length && <div style={{ fontSize: 12, color: C.textTer }}>No background jobs yet.</div>}

        <H>Recent requests</H>
        {logs.slice(0, 8).map(l => <Row key={l.id}
          cols={[`${l.method} ${l.path}`, l.status, `${l.duration_ms}ms`]} />)}

        <H>Email outbox</H>
        {outbox.slice(0, 6).map(o => <Row key={o.id} cols={[o.subject, o.recipient, o.status]} />)}
        {!outbox.length && <div style={{ fontSize: 12, color: C.textTer }}>Outbox empty.</div>}

        <H>Alerts</H>
        {alerts.slice(0, 8).map(a => <Row key={a.id} cols={[a.subject, a.type, a.created_at]} />)}
        {!alerts.length && <div style={{ fontSize: 12, color: C.textTer }}>No alerts.</div>}

        <H>Workspace branding</H>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input style={{ ...input, width: 110 }} value={brand.primary_color}
                 onChange={e => setBrand(b => ({ ...b, primary_color: e.target.value }))}
                 placeholder="#4f7cff" />
          <input style={{ ...input, width: 180 }} value={brand.logo_text}
                 onChange={e => setBrand(b => ({ ...b, logo_text: e.target.value }))}
                 placeholder="Logo text" />
          <input style={{ ...input, width: 180 }} value={brand.font_family}
                 onChange={e => setBrand(b => ({ ...b, font_family: e.target.value }))}
                 placeholder="Font family" />
          <Btn size="sm" onClick={saveBrand}>Save</Btn>
          <Btn size="sm" variant="ghost" onClick={load}>↻ Refresh</Btn>
        </div>
        {msg && <div style={{ fontSize: 12, marginTop: 8, fontFamily: FONT }}>{msg}</div>}
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="cache-panel">
        <H>Caching hierarchy</H>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Independent layers keyed by governance + semantic versions — a version bump invalidates only its dependents. (§17.7.3)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {cache && Object.entries(cache.layers).map(([layer, s]) => (
            <div key={layer} style={{ padding: '10px 12px', background: C.bg, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT }}>{layer}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO }}>{Math.round(s.hit_rate * 100)}%</div>
              <div style={{ fontSize: 10, color: C.textTer, fontFamily: MONO }}>
                {s.hits}h / {s.misses}m · {s.entries} entries
              </div>
            </div>
          ))}
          {!cache && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>Loading…</span>}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="dispatch-panel">
        <H>Cost-aware dispatches</H>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Ladder: cache → template → small model → frontier model. Only novel work reaches the frontier. (§17.2.2)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {['cache', 'template', 'small_model', 'frontier_model'].map(tier => (
            <div key={tier} style={{ padding: '10px 12px', background: C.bg, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT }}>{tier}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO }}>
                {(disp && disp.by_tier[tier]) || 0}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: C.textSec, fontFamily: MONO }}>
          {disp ? `${disp.count} dispatches · est. cost $${disp.est_cost_total}` : 'est. cost —'}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="events-panel">
        <H>Platform events</H>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Data, schema, drift, and business events trigger targeted recompute without a user turn. (§17.2.4)
        </div>
        {events.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>No events yet</span>}
        {events.slice(0, 8).map(ev => (
          <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
            <Badge variant={ev.status === 'processed' ? 'success' : 'default'} xs>{ev.status}</Badge>
            <span style={{ fontSize: 12, fontFamily: MONO }}>{ev.event_type}</span>
            <span style={{ fontSize: 11, color: C.textTer, fontFamily: MONO, marginLeft: 'auto' }}>{ev.created_at}</span>
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="meta-panel">
        <H>Meta-orchestrator</H>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Deterministic arbitration, systemic-failure triage, queue reprioritization. Human checkpoints are never skippable. (§17.2.7)
        </div>
        <div style={{ marginBottom: 8 }}>
          <Btn size="sm" variant="outline" data-testid="reprioritize-btn" onClick={async () => {
            await api.metaReprioritize();
            api.metaDecisions().then(setMeta).catch(() => {});
          }}>Run reprioritization sweep</Btn>
        </div>
        {meta && meta.alerts.map(a => (
          <div key={`a${a.id}`} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
            <Badge variant="warning" xs>alert</Badge>
            <span style={{ fontSize: 12, fontFamily: FONT }}>{a.subject}</span>
          </div>
        ))}
        {meta && meta.decisions.slice(0, 6).map(d => (
          <div key={`d${d.id}`} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
            <Badge variant="default" xs>{d.kind}</Badge>
            <span style={{ fontSize: 12, fontFamily: MONO }}>{d.rule}</span>
            <span style={{ fontSize: 11, color: C.textTer, fontFamily: MONO, marginLeft: 'auto' }}>{d.created_at}</span>
          </div>
        ))}
        {meta && !meta.decisions.length && !meta.alerts.length &&
          <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>No decisions yet</span>}
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="consultations-panel">
        <H>Agent consultations</H>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Agents consult each other mid-task instead of failing into repair cycles — never a hidden side channel. (§17.2.3)
        </div>
        {consults.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>No consultations yet</span>}
        {consults.slice(0, 6).map(cn => (
          <div key={cn.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, fontFamily: MONO }}>{cn.from_agent}</span>
            <span style={{ color: C.textTer, fontSize: 11 }}>→</span>
            <span style={{ fontSize: 12, fontFamily: MONO }}>{cn.to_agent}</span>
            <Badge variant="default" xs>{(cn.question && cn.question.kind) || 'question'}</Badge>
            <span style={{ fontSize: 11, color: C.textTer, fontFamily: MONO, marginLeft: 'auto' }}>
              {cn.run_id ? `run ${cn.run_id}` : ''}
            </span>
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="optimizations-panel">
        <H>Optimization proposals</H>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Autonomous analysis of query telemetry and cache stats — proposals only, never auto-applied. (§17.2.9)
        </div>
        <div style={{ marginBottom: 8 }}>
          <Btn size="sm" variant="outline" data-testid="optimize-scan-btn" onClick={async () => {
            await api.runOptimizeScan();
            api.optimizations().then(r => setOptims(r.proposals)).catch(() => {});
          }}>Run analysis now</Btn>
        </div>
        {optims.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>No proposals</span>}
        {optims.slice(0, 6).map(p => (
          <div key={p.id} data-testid={`optim-row-${p.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
            <Badge variant={p.status === 'proposed' ? 'default' : p.status === 'approved' ? 'success' : 'warning'} xs
                   data-testid="optim-status">{p.status}</Badge>
            <span style={{ fontSize: 11, fontFamily: MONO }}>{p.kind}</span>
            <span style={{ fontSize: 12, fontFamily: FONT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={p.recommendation}>{p.recommendation}</span>
            {p.status === 'proposed' && <>
              <Btn size="sm" variant="outline" data-testid="optim-approve" onClick={async () => {
                await api.decideOptimization(p.id, 'approve');
                api.optimizations().then(r => setOptims(r.proposals)).catch(() => {});
              }}>Approve</Btn>
              <Btn size="sm" variant="ghost" data-testid="optim-reject" onClick={async () => {
                await api.decideOptimization(p.id, 'reject');
                api.optimizations().then(r => setOptims(r.proposals)).catch(() => {});
              }}>Reject</Btn>
            </>}
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="feedback-panel">
        <H>Recommendation feedback</H>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Which suggestion types are earning trust — dismissal is a first-class signal. (§17.4.3)
        </div>
        {feedback.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>No decisions recorded yet</span>}
        {feedback.map(t => (
          <div key={t.rec_type} data-testid={`fb-${t.rec_type}`} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 600 }}>{t.rec_type}</span>
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.textSec }}>
              ✓{t.accepted} ✕{t.dismissed} ·{t.ignored}
            </span>
            <span style={{ fontSize: 13, fontFamily: MONO, fontWeight: 700, marginLeft: 'auto' }}>
              {Math.round(t.acceptance_rate * 100)}%
            </span>
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="signals-panel">
        <H>Self-improvement signals</H>
        <div style={{ margin: '4px 0 8px' }}>
          <Btn size="sm" variant="outline" data-testid="observability-report-btn" onClick={async () => {
            await api.observabilityReport();
            setMsg('Observability report generated as a native artifact.');
          }}>Generate observability artifact</Btn>
        </div>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Mined from usage telemetry, routed to their consumers with an audited delivery trail. (§17.4.2)
        </div>
        <div style={{ marginBottom: 8 }}>
          <Btn size="sm" variant="outline" data-testid="mine-signals-btn" onClick={async () => {
            await api.selfImprove();
            api.platformSignals().then(r => setSignals(r.signals)).catch(() => {});
          }}>Mine signals now</Btn>
        </div>
        {signals.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>No signals yet</span>}
        {signals.slice(0, 8).map(s => (
          <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
            <Badge variant="default" xs>{s.signal_kind}</Badge>
            <span style={{ fontSize: 12, fontFamily: MONO }}>{s.subject}</span>
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.textTer, marginLeft: 'auto' }}>→ {s.consumer}</span>
          </div>
        ))}
      </Card>
      </AdminOnly>
    </div>
  );
}
