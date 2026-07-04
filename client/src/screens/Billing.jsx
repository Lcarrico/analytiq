// R20S1E1: plan + token metering (PRD §16/Billing board slice).
import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge } from '../components/ui';
import { FONT, MONO, P } from '../tokens';

export default function Billing() {
  const [usage, setUsage] = useState(null);
  useEffect(() => { api.billingUsage().then(setUsage).catch(() => {}); }, []);
  if (!usage) return <div data-testid="billing-page" style={{ fontFamily: FONT }}>Loading…</div>;
  const pct = Math.min(100, usage.cycle.pct);
  return (
    <div data-testid="billing-page" style={{ maxWidth: 860 }}>
      <div style={{ fontSize: 21, fontWeight: 600, fontFamily: FONT, color: P.ink, marginBottom: 12 }}>
        Billing & tokens
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff', padding: 16 }}>
          <div style={{ fontSize: 10.5, fontFamily: MONO, textTransform: 'uppercase', color: P.muted }}>
            Current plan
          </div>
          <div data-testid="plan-name" style={{ fontSize: 24, fontWeight: 700, fontFamily: FONT,
                                                color: P.ink, textTransform: 'capitalize' }}>
            {usage.plan}
          </div>
          <StatusBadge status={usage.thresholds.status === 'ok' ? 'green' : 'amber'}>
            {usage.thresholds.status}
          </StatusBadge>
        </div>
        <div style={{ border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff', padding: 16 }}>
          <div style={{ fontSize: 10.5, fontFamily: MONO, textTransform: 'uppercase', color: P.muted }}>
            Token usage this cycle
          </div>
          <div data-testid="token-meter" style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600,
                                                  color: P.ink, margin: '6px 0' }}>
            {usage.cycle.tokens_used.toLocaleString()} / {usage.cycle.included.toLocaleString()}
          </div>
          <div style={{ height: 8, borderRadius: 4, background: P.grayBg, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? P.red : P.accent }} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: P.muted, marginTop: 4 }}>
            soft alerts at 50 / 75 / 90% · overage $8 per 100K
          </div>
        </div>
      </div>
      <div style={{ border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff',
                    padding: 16, marginTop: 12 }}>
        <div style={{ fontSize: 10.5, fontFamily: MONO, textTransform: 'uppercase', color: P.muted,
                      marginBottom: 8 }}>Consumption by capability</div>
        {usage.by_capability.map(c => (
          <div key={c.capability} style={{ display: 'flex', gap: 10, padding: '4px 0',
                                           fontSize: 12.5, fontFamily: MONO, color: P.body }}>
            <span style={{ width: 200 }}>{c.capability}</span>
            <span>{(c.tokens || 0).toLocaleString()} tokens</span>
            <span style={{ marginLeft: 'auto', color: P.muted }}>{c.calls} calls</span>
          </div>
        ))}
      </div>
    </div>
  );
}
