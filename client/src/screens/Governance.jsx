// R32S1E1-US1 (program R30–R36) — Governance overview (`Governance.dc.html`
// #overview / ch15 §1): H1 + amber items-awaiting pill, clickable KPI cards
// (colored mono counts) linking into the governance areas, and the span-2
// workspace-health trend card with an inline sparkline. Data = the real
// /api/governance/summary aggregate. Admin-gated like the rest of the area.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';

const monoLabel = { fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em',
                    textTransform: 'uppercase', color: P.faint };

export default function Governance() {
  const role = useRole();
  const navigate = useNavigate();
  const [d, setD] = useState(null);

  useEffect(() => {
    fetch('/api/governance/summary').then(r => r.json()).then(setD).catch(() => setD({}));
  }, []);

  if (role !== 'admin') return <Forbidden />;

  const cards = d ? [
    ['blocked', 'TABLES BLOCKED', d.tables_blocked, P.red,
     d.tables_blocked ? 'contract failure' : 'nothing blocked', '/app/governance/rules'],
    ['review', 'REVIEW ITEMS', d.awaiting_review, P.amber,
     `${d.review_high || 0} high priority`, '/app/governance/review'],
    ['pii', 'PII FLAGS', d.pii_flags, P.amber,
     d.pii_flags ? 'masked pending review' : 'none open', '/app/governance/review'],
    ['fresh', 'FRESHNESS BREACHES', d.freshness_breaches, P.red,
     d.freshness_breaches ? 'SLA missed' : 'all within SLA', '/app/governance/rules'],
    ['drift', 'SCHEMA DRIFT', d.schema_drift, P.amber,
     d.schema_drift ? 'needs review' : 'no drift recorded', '/app/governance/review'],
    ['contracts', 'CONTRACT FAILURES · 7D', d.contract_failures_7d, P.muted,
     'all repaired automatically', '/app/governance/rules'],
  ] : [];

  const trend = d?.health_trend || [];
  const spark = trend.length > 1 ? trend : [d?.health_score ?? 0, d?.health_score ?? 0];
  const min = Math.min(...spark), max = Math.max(...spark);
  const pts = spark.map((v, i) =>
    `${(i / (spark.length - 1)) * 180},${34 - ((v - min) / (max - min || 1)) * 26 - 4}`).join(' ');

  return (
    <div style={{ maxWidth: 1100 }}>
      <PageHeader title="Governance"
                  actions={d && d.awaiting_review > 0 ? (
                    <span data-testid="awaiting-pill"
                          style={{ display: 'inline-flex', alignItems: 'center', height: 24,
                                   padding: '0 11px', borderRadius: 999, background: P.amberBg,
                                   color: P.amber, fontFamily: MONO, fontSize: 10,
                                   fontWeight: 600, letterSpacing: '.05em' }}>
                      {d.awaiting_review} ITEMS AWAITING REVIEW
                    </span>
                  ) : null} />
      {d === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <div data-testid="gov-cards"
             style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {cards.map(([key, label, value, color, caption, to]) => (
            <div key={key} data-testid={`gov-card-${key}`} onClick={() => navigate(to)}
                 style={{ border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff',
                          padding: '16px 18px', display: 'flex', flexDirection: 'column',
                          gap: 6, cursor: 'pointer' }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = P.accentBorder; }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; }}>
              <span style={monoLabel}>{label}</span>
              <span data-testid="gov-count"
                    style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600,
                             color: (value || 0) > 0 ? color : P.ink }}>
                {value ?? 0}
              </span>
              <span style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT }}>{caption}</span>
            </div>
          ))}
          <div data-testid="gov-card-health"
               style={{ gridColumn: 'span 2', border: `1px solid ${P.border}`, borderRadius: 10,
                        background: '#fff', padding: '16px 18px', display: 'flex',
                        alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={monoLabel}>WORKSPACE HEALTH TREND</span>
              <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600,
                             color: (d.health_score ?? 0) >= 85 ? P.green : P.amber }}>
                {d.health_score ?? '—'}
              </span>
              <span style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT }}>
                avg across cataloged tables
              </span>
            </div>
            <svg data-testid="gov-trend-spark" viewBox="0 0 180 34"
                 style={{ flex: 1, height: 34 }}>
              <polyline points={pts} fill="none"
                        stroke={(d.health_score ?? 0) >= 85 ? P.green : P.amber}
                        strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
