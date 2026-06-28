import { useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

export default function Screen07() {
  const { connectionId, runId, selectedMetric, update, nav } = useApp();
  const [busy, setBusy] = useState(false);

  const metric    = selectedMetric || 'Net Revenue';
  const grain     = 'Location · Day';
  const horizon   = 14;
  const trainStart= '2023-01-01';
  const trainEnd  = '2023-12-31';

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const session = await api.createSession({
        connectionId: connectionId || null,
        runId: runId || null,
        metric, grain, horizon, training_start: trainStart, training_end: trainEnd,
      });
      update({ sessionId: session.id });

      // Start pipeline immediately
      const { runId: pipelineRunId } = await api.startPipeline({ sessionId: session.id });
      update({ pipelineRunId });
      nav(8);
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <PageHeader title="Confirm analysis spec" sub="Review before the pipeline runs. You can go back and adjust any parameter." />
      <Card>
        {/* Plain-English summary */}
        <div style={{ padding: 16, background: C.primaryLight, borderRadius: 8, borderLeft: `4px solid ${C.primary}`, marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text, lineHeight: 1.65, fontFamily: FONT }}>
            Predict <strong>{metric}</strong> per <strong>{grain.split(' · ')[0]}</strong> for the next{' '}
            <strong>{horizon} days</strong>, trained on{' '}
            <strong>Jan 1 – Dec 31, 2023</strong> historical data.
          </div>
        </div>

        {/* Parameter grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Target metric',   value: metric,                 icon: '📊' },
            { label: 'Grain',           value: grain,                  icon: '⬡'  },
            { label: 'Horizon',         value: `${horizon} days`,      icon: '📅' },
            { label: 'Training window', value: 'Jan – Dec 2023',       icon: '📈' },
            { label: 'Model family',    value: 'XGBoost (MVP v1)',      icon: '🤖' },
            { label: 'Validation',      value: 'Walk-forward · 5 folds',icon: '✓' },
          ].map((it, i) => (
            <div key={i} style={{ padding: '12px 14px', background: C.bg, borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: C.textTer, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: MONO }}>{it.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{it.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: MONO }}>{it.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div style={{ marginTop: 16, padding: '10px 12px', background: C.warningBg, borderRadius: 6, fontSize: 12, color: C.warning, display: 'flex', gap: 6, fontFamily: FONT }}>
          ⚠️ If fewer than 500 training rows exist at this grain, the pipeline will halt and prompt you to widen the date range.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => nav(6)}>← Adjust</Btn>
          <Btn disabled={busy} onClick={handleConfirm}>
            {busy ? 'Starting pipeline...' : 'Confirm & run pipeline →'}
          </Btn>
        </div>

        <p style={{ margin: '10px 0 0', fontSize: 12, color: C.textTer, fontFamily: FONT }}>
          The pipeline does not advance until you explicitly confirm here.
        </p>
      </Card>
    </div>
  );
}
