import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Steps, Badge, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

const PIPE_STEPS = [
  { title: 'Building feature table',   active: 'Joining sources, computing lags, rolling windows...',    done: 'Gold table: 12,847 rows · 34 features · grain verified',          pending: 'Queued' },
  { title: 'Training model',           active: 'XGBoost training on 70% split (Jan–Sep 2023)...',         done: 'Model trained · val MAPE 8.9% · passed promotion gate',            pending: 'Queued' },
  { title: 'Walk-forward backtesting', active: 'Running 5 expanding windows across Oct–Dec 2023...',      done: 'Folds: 7.4 · 8.1 · 9.8 · 8.3 · 7.9% MAPE · no overfit detected', pending: 'Queued' },
  { title: 'Generating dashboard',     active: 'Writing predictions to gold layer, building artifact...', done: 'Dashboard artifact generated · 47 KB · self-contained HTML',       pending: 'Queued' },
];

export default function Screen08() {
  const { pipelineRunId, selectedMetric, update, nav } = useApp();
  const [steps, setSteps] = useState([]);
  const [step,    setStep]    = useState(0);
  const [status,  setStatus]  = useState('running');
  const [log,     setLog]     = useState([]);
  const [saving,  setSaving]  = useState(false);
  const logRef = useRef(null);
  const esRef  = useRef(null);

  const missing = !pipelineRunId;

  useEffect(() => {
    if (!pipelineRunId) return;

    // Get initial state
    api.getPipelineRun(pipelineRunId).then(run => {
      setStep(run.current_step || 0);
      setStatus(run.status);
      setLog(run.log_entries || []);
    }).catch(() => {});

    // SSE stream
    const es = api.streamPipeline(pipelineRunId);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setStep(data.step ?? 0);
      setStatus(data.status);
      if (data.log) setLog(data.log);
    };

    es.onerror = () => { es.close(); };

    const t = setInterval(() => {
      api.pipelineSteps(pipelineRunId).then(setSteps).catch(() => {});
    }, 1200);
    api.pipelineSteps(pipelineRunId).then(setSteps).catch(() => {});
    return () => { es.close(); clearInterval(t); };
  }, [pipelineRunId]);

  const flagStep = (step) => {
    const reason = 'flagged from pipeline audit panel';
    api.flagStep(pipelineRunId, step, reason)
      .then(() => api.pipelineSteps(pipelineRunId).then(setSteps))
      .catch(() => {});
  };

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const done = status === 'done';

  const handleSave = async () => {
    setSaving(true);
    try {
      const artifact = await api.createArtifact({
        title:          `${selectedMetric || 'Net Revenue'} by Location — 14-Day Forecast`,
        type:           'Predictive',
        mape:           8.9,
        owner:          'analyst@acme.com',
        dq_status:      'pass',
        pipeline_run_id: pipelineRunId,
      });
      update({ artifactId: artifact.id });
      nav(9);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  if (missing) return (
    <div style={{ maxWidth: 560 }}>
      <PageHeader title="Pipeline execution" sub="No active pipeline run. Please confirm a spec first." />
      <Btn onClick={() => nav(7)}>← Confirm spec</Btn>
    </div>
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader
        title="Pipeline execution"
        sub="Building features, training model, backtesting, generating dashboard."
        badge={done ? { label: 'Complete', v: 'success' } : { label: 'Running', v: 'primary' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Steps */}
        <Card>
          <Steps steps={PIPE_STEPS} current={Math.min(step, PIPE_STEPS.length - 1)} />
          {done && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[['12,847', 'Rows'], ['34', 'Features'], ['8.9%', 'MAPE']].map(([v, l], i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '10px 6px', background: C.bg, borderRadius: 6 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: MONO }}>{v}</div>
                    <div style={{ fontSize: 10, color: C.textSec, marginTop: 2, fontFamily: FONT }}>{l}</div>
                  </div>
                ))}
              </div>
              <Btn full disabled={saving} onClick={handleSave}>
                {saving ? 'Saving artifact...' : 'Save & view dashboard →'}
              </Btn>
            </div>
          )}
        </Card>

        {/* Live log */}
        <Card p={0}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: done ? C.success : C.primary, display: 'inline-block', animation: done ? 'none' : 'pulse 1s ease-in-out infinite' }} />
            Live log
          </div>
          <div ref={logRef} style={{ padding: 14, height: 344, overflowY: 'auto', fontFamily: MONO, fontSize: 11, color: C.textSec, lineHeight: 1.75 }}>
            {log.map((l, i) => (
              <div key={i} style={{
                color: l.includes('✓ PASS') ? C.success
                     : l.includes('FAIL')   ? C.error
                     : l.includes('DONE')   ? C.primary
                     : l.includes('WARN')   ? C.warning
                     : undefined,
              }}>{l}</div>
            ))}
            {!done && log.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textTer }}>
                <Spinner size={14} /> Waiting for first step...
              </div>
            )}
          </div>
        </Card>
      </div>
      {steps.length > 0 && (
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase',
                        letterSpacing: '0.06em', fontFamily: MONO, marginBottom: 8 }}>
            Pipeline audit trail
          </div>
          {steps.map(st => (
            <div key={st.step} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
                  {st.step}. {st.label}
                </span>
                {st.flagged ? (
                  <Badge variant="default" xs>flagged</Badge>
                ) : (
                  <button onClick={() => flagStep(st.step)}
                          style={{ fontSize: 10, border: `1px solid ${C.border}`, background: 'none',
                                   borderRadius: 4, cursor: 'pointer', color: C.textSec }}>
                    flag for review
                  </button>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.textSec, fontFamily: FONT, marginTop: 2 }}>
                {st.description}
              </div>
              <div style={{ fontSize: 10, color: C.textTer, fontFamily: MONO, marginTop: 2 }}>
                in: {st.input_schema.join(' · ')} → out: {st.output_schema.join(' · ')}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
