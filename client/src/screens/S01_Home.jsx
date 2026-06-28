import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

export default function Screen01() {
  const { nav } = useApp();
  const [artifacts, setArtifacts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.getArtifacts()
      .then(setArtifacts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasData = artifacts.length > 0;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', paddingTop: hasData ? 0 : 72, textAlign: hasData ? 'left' : 'center' }}>
      {!hasData ? (
        // Empty state
        <>
          <div style={{ width: 80, height: 80, background: C.primaryLight, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>📊</div>
          <h1 style={{ margin: '0 0 12px', fontSize: 30, fontWeight: 700, color: C.text, fontFamily: FONT, letterSpacing: '-0.5px' }}>Welcome to AnalytIQ</h1>
          <p style={{ margin: '0 0 6px', fontSize: 16, color: C.textSec, lineHeight: 1.7, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            Ask a question in plain English. Get a backtested, governed, shareable predictive dashboard — no SQL, no Python.
          </p>
          <p style={{ margin: '0 0 36px', fontSize: 13, color: C.textTer }}>No data sources connected yet.</p>
          <Btn size="lg" onClick={() => nav(2)}>Start your first analysis →</Btn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 60, textAlign: 'left' }}>
            {[
              { icon: '🔒', title: 'Credentials stay secure', desc: 'Encrypted at rest and never shared with the LLM layer.' },
              { icon: '✓',  title: 'Walk-forward backtesting', desc: 'Every model validated on held-out time windows before shipping.' },
              { icon: '📤', title: 'Shareable artifacts', desc: 'Self-contained dashboards with full lineage metadata.' },
            ].map((f, i) => (
              <Card key={i} p={16}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, fontFamily: FONT }}>{f.title}</div>
                <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.55, fontFamily: FONT }}>{f.desc}</div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        // Has artifacts — show summary
        <>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: C.text, fontFamily: FONT }}>Welcome back</h1>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: C.textSec }}>
            {loading ? 'Loading...' : `${artifacts.length} artifact${artifacts.length !== 1 ? 's' : ''} in your workspace.`}
          </p>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
            {[
              { label: 'Total artifacts',  value: loading ? '—' : artifacts.length },
              { label: 'Predictive models',value: loading ? '—' : artifacts.filter(a => a.type === 'Predictive').length },
              { label: 'Shared',           value: loading ? '—' : artifacts.filter(a => (a.share_count || 0) > 0).length },
            ].map((s, i) => (
              <Card key={i}>
                <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: MONO }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 4, fontFamily: FONT }}>{s.label}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={() => nav(2)}>+ New analysis</Btn>
            <Btn variant="secondary" onClick={() => nav(10)}>View all artifacts</Btn>
          </div>
        </>
      )}
    </div>
  );
}
