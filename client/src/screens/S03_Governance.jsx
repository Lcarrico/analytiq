import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Steps } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

const GOV_STEPS = [
  { title: 'Cataloging schema',     active: 'Scanning tables and columns across all schemas...', pending: 'Queued' },
  { title: 'Profiling columns',      active: 'Computing null rates, cardinality, distributions...', pending: 'Queued' },
  { title: 'Generating definitions', active: 'Deriving metrics, dimensions, explores from schema...', pending: 'Queued' },
  { title: 'Running health check',   active: 'PK uniqueness · null rate · freshness · PII · row-count...', pending: 'Queued' },
];

export default function Screen03() {
  const { runId, nav } = useApp();
  const [step,    setStep]    = useState(0);
  const [status,  setStatus]  = useState('running');
  const [runData, setRunData] = useState(null);
  const [tables,  setTables]  = useState([]);
  const [dqGates, setDqGates] = useState([]);
  const esRef = useRef(null);

  const missing = !runId;

  useEffect(() => {
    if (!runId) return;

    api.getGovernanceRun(runId).then(run => {
      setStep(run.current_step || 0);
      setStatus(run.status);
      if (run.status === 'done') {
        setRunData(run);
        api.getTables(runId).then(t => setTables(t || [])).catch(() => {});
      }
    }).catch(() => {});

    const es = api.streamGovernance(runId);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      // Typed agent events (dq_gate, agent_complete, human_required)
      if (data.type === 'dq_gate') {
        setDqGates(g => [...g.filter(x => x.table !== data.table), data]);
        return;
      }
      if (data.type) return; // other typed events don't drive the stepper
      if (data.step === undefined) return;
      setStep(data.step ?? 0);
      setStatus(data.status);
      if (data.status === 'done') {
        api.getGovernanceRun(runId).then(run => {
          setRunData(run);
          api.getTables(runId).then(t => setTables(t || [])).catch(() => {});
        }).catch(() => {});
        es.close();
      }
    };

    es.onerror = () => { es.close(); };
    return () => { es.close(); };
  }, [runId]);

  const done = status === 'done';

  // Build real step subtitles once we have data
  const stepsWithDone = GOV_STEPS.map((s, i) => {
    let doneTxt = 'Done';
    if (runData) {
      const tc = runData.tables_count  ?? 0;
      const dc = runData.definitions_count ?? 0;
      const lc = runData.low_confidence_count ?? 0;
      const healthy  = tables.filter(t => t.health_score >= 70).length;
      const flagged  = tables.filter(t => t.health_score >= 40 && t.health_score < 70).length;
      const blocked  = tables.filter(t => t.health_score < 40).length;

      if (i === 0) doneTxt = tc ? `${tc} tables cataloged` : 'Done';
      if (i === 1) doneTxt = 'All columns profiled';
      if (i === 2) doneTxt = dc ? `${dc} definitions generated · ${lc} low-confidence` : 'Done';
      if (i === 3) doneTxt = tables.length
        ? `${healthy} healthy · ${flagged} flagged · ${blocked} blocked`
        : 'Done';
    }
    return { ...s, done: doneTxt };
  });

  const tc = runData?.tables_count        ?? '—';
  const dc = runData?.definitions_count   ?? '—';
  const lc = runData?.low_confidence_count ?? '—';

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
        sub="Scanning your database schema and building the semantic layer."
        badge={done ? { label: 'Complete', v: 'success' } : { label: 'Running', v: 'primary' }}
      />
      <Card>
        <Steps steps={stepsWithDone} current={Math.min(step, GOV_STEPS.length - 1)} />

        {done && (
          <>
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[[String(tc), 'Tables cataloged'], [String(dc), 'Definitions'], [String(lc), 'Need review']].map(([v, l], i) => (
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

        {dqGates.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {dqGates.map(gate => (
              <span key={gate.table} style={{
                fontSize: 11, fontFamily: MONO, padding: '3px 8px', borderRadius: 4,
                background: gate.gate_status === 'PASS' ? '#e8f5ec' : gate.gate_status === 'WARN' ? '#fdf3e2' : '#fdeaea',
                color: gate.gate_status === 'PASS' ? '#1e7d3c' : gate.gate_status === 'WARN' ? '#946300' : '#b3261e',
              }}>
                {gate.table} · {gate.gate_status}
              </span>
            ))}
          </div>
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
