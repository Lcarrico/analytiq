import { useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

export default function Screen07() {
  const { connectionId, runId, selectedMetric, update, nav } = useApp();
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState(null);
  const [needsReview, setNeedsReview] = useState(false);

  const metric     = selectedMetric;
  const grain      = 'Location - Day';
  const horizon    = 14;
  const trainStart = '2023-01-01';
  const trainEnd   = '2023-12-31';

  if (!metric) {
    return (
      <div style={{ maxWidth: 620 }}>
        <PageHeader title="Confirm analysis spec" sub="Review before the pipeline runs." />
        <Card>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: C.error, fontFamily: FONT, marginBottom: 16 }}>
              No metric selected. Go back and choose one.
            </div>
            <Btn variant="secondary" onClick={() => nav(6)}>Back to analysis</Btn>
          </div>
        </Card>
      </div>
    );
  }

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await api.createSession({
        connectionId: connectionId || null,
        runId: runId || null,
        metric, grain, horizon, training_start: trainStart, training_end: trainEnd,
      });
      update({ sessionId: session.id });

      const { runId: pipelineRunId } = await api.startPipeline({ sessionId: session.id });
      update({ pipelineRunId });
      nav(8);
    } catch (err) {
      // 409 human_review_required → guide the user to the review queue (S05)
      let msg = err?.message || 'Failed to start pipeline.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error === 'human_review_required') {
          setNeedsReview(true);
          msg = parsed.message || 'Low-confidence definitions need review before training.';
        } else if (parsed?.error) {
          msg = parsed.error;
        }
      } catch {}
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <PageHeader title="Confirm analysis spec" sub="Review before the pipeline runs. You can go back and adjust any parameter." />
      <Card>
        <div style={{ padding: 16, background: C.primaryLight, borderRadius: 8, borderLeft: `4px solid ${C.primary}`, marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: C.text, lineHeight: 1.65, fontFamily: FONT }}>
            Predict <strong>{metric}</strong> per <strong>Location</strong> for the next{' '}
            <strong>{horizon} days</strong>, trained on{' '}
            <strong>Jan 1 - Dec 31, 2023</strong> historical data.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Target metric',   value: metric             },
            { label: 'Grain',           value: grain              },
            { label: 'Horizon',         value: `${horizon} days`  },
            { label: 'Training window', value: 'Jan - Dec 2023'   },
            { label: 'Model family',    value: 'XGBoost (MVP v1)' },
            { label: 'Validation',      value: 'Walk-forward, 5 folds' },
          ].map((it, i) => (
            <div key={i} style={{ padding: '12px 14px', background: C.bg, borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: C.textTer, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: MONO }}>{it.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: MONO }}>{it.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: '10px 12px', background: C.warningBg, borderRadius: 6, fontSize: 12, color: C.warning, fontFamily: FONT }}>
          If fewer than 500 training rows exist at this grain, the pipeline will halt.
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff0f0', borderRadius: 6, fontSize: 12, color: C.error, fontFamily: FONT }}>
            {error}
            {needsReview && (
              <div style={{ marginTop: 8 }}>
                <Btn size="sm" variant="secondary" onClick={() => nav(5)}>Review definitions →</Btn>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Btn variant="secondary" onClick={() => nav(6)}>Adjust</Btn>
          <Btn disabled={busy} onClick={handleConfirm}>
            {busy ? 'Starting pipeline...' : 'Confirm & run pipeline'}
          </Btn>
        </div>

        <p style={{ margin: '10px 0 0', fontSize: 12, color: C.textTer, fontFamily: FONT }}>
          The pipeline does not advance until you explicitly confirm here.
        </p>
      </Card>
    </div>
  );
}
