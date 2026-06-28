import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Steps, Badge } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

const GOV_STEPS = [
  { title: 'Cataloging schema',      active: 'Scanning tables and columns across all schemas...', done: '47 tables cataloged · 2,341 columns',         pending: 'Queued' },
  { title: 'Profiling columns',       active: 'Computing null rates, cardinality, distributions...', done: 'All columns profiled · max null rate 3.1%', pending: 'Queued' },
  { title: 'Generating definitions',  active: 'Deriving metrics, dimensions, explores from schema...', done: '183 definitions generated · 12 low-confidence', pending: 'Queued' },
  { title: 'Running health check',    active: 'PK uniqueness · null rate · freshness · PII · row-count...', done: '44 healthy · 2 flagged · 1 blocked', pending: 'Queued' },
];

export default function Screen03() {
  const { runId, nav } = useApp();
  const [step,   setStep]  = useState(0);
  const [status, setStatus]= useState('running');
  const esRef = useRef(null);

  // If no runId in context (navigated directly), show spinner
  const [missing, setMissing] = useState(!runId);

  useEffect(() => {
    if (!runId) return;

    // Fetch current state
    api.getGovernanceRun(runId).then(run => {
      setStep(run.current_step || 0);
      setStatus(run.status);
    }).catch(() => {});

    // Open SSE stream
    const es = api.streamGovernance(runId);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setStep(data.step ?? 0);
      setStatus(data.status);
    };

    es.onerror = () => { es.close(); };

    return () => { es.close(); };
  }, [runId]);

  const done = status === 'done';

  if (missing) return (
    <div style={{ maxWidth: 560 }}>
      <PageHeader title="Governance run" sub="No active run found. Please connect a data source first." />
      <Btn onClick={() => nav(2)}>← Connect a data source</Btn>
    </div>
  );

  return (
    <div style={{ maxWidth: 560 }}>
      <PageHeader
        title="Governance run"
        sub="Profiling your Snowflake schema and building the semantic layer."
        badge={done ? { label: 'Complete', v: 'success' } : { label: 'Running', v: 'primary' }}
      />
      <Card>
        <Steps steps={GOV_STEPS} current={Math.min(step, GOV_STEPS.length - 1)} />

        {done && (
          <>
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[['47', 'Tables cataloged'], ['183', 'Definitions'], ['12', 'Need review']].map(([v, l], i) => (
                <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: C.bg, borderRadius: 6 }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: MONO }}>{v}</div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 2, fontFamily: FONT }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Btn onClick={() => nav(4)}>View table health →</Btn>
              <Btn variant="secondary" onClick={() => nav(5)}>Skip to semantic review</Btn>
            </div>
          </>
        )}

        {!done && (
          <div style={{ marginTop: 16, padding: '10px 12px', background: C.bg, borderRadius: 6, fontSize: 12, color: C.textSec, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            Governance is running in the background — you can navigate away and come back.
          </div>
        )}
      </Card>
    </div>
  );
}
