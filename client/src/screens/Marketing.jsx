// R30S1E1 (program R30–R36): marketing landing + pricing — plan data per PRD ch02.
import { Link } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';

const VALUE_CARDS = [
  ['Governed metrics', 'One metric, one definition — everywhere.'],
  ['Predictive models', 'Walk-forward validated, promotion-gated.'],
  ['Shareable artifacts', 'Self-contained dashboards, signed links.'],
  ['No SQL required', 'Ask in plain language; gates do the rest.'],
];
// Plan facts are the PRD ch02 table — exact strings; r30s1_pricing_data.spec.js
// is the regression lock (stays green through the R34S1E4 restyle).
const PLANS = [
  ['Starter', '$0',
   ['3 seats · 1 source', '100K tokens', '5 artifacts'],
   ['Predictive models', 'Public share links']],
  ['Team', '$149',
   ['10 seats · 3 sources', '500K tokens/mo', 'Unlimited artifacts',
    'Predictive models + model cards', 'Public sharing: links only'],
   []],
  ['Business', '$499',
   ['2M tokens/mo · overage $8/100K', 'SSO · RLS · full audit log',
    'Signed embeds + public links', 'Priority support'],
   []],
  ['Enterprise', 'Custom',
   ['Unlimited seats & sources', 'Custom token pools', 'VPC · private link',
    '99.9% SLA · DPA · SOC 2 reports', 'Dedicated success engineer'],
   []],
];

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10,
                  borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center',
                  gap: 18, padding: '0 28px', height: 60 }}>
      <span style={{ fontWeight: 700, fontSize: 16, fontFamily: FONT, color: P.ink }}>
        Analyt<span style={{ color: P.accent }}>IQ</span>
      </span>
      <Link to="/pricing" style={{ fontSize: 13, fontFamily: FONT, color: P.body }}>Pricing</Link>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
        <Link to="/app" style={{ fontSize: 13, fontFamily: FONT, color: P.body,
                                 alignSelf: 'center' }}>Login</Link>
        <Link to="/app" data-testid="start-free"
              style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, background: P.accent,
                       color: '#fff', borderRadius: 8, padding: '8px 14px' }}>Start Free</Link>
      </span>
    </nav>
  );
}

export function Landing() {
  return (
    <div data-testid="marketing-landing" style={{ minHeight: '100vh', background: '#fff' }}>
      <Nav />
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 28px',
                        display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40 }}>
        <div>
          <h1 style={{ fontSize: 40, lineHeight: 1.15, fontFamily: FONT, color: P.ink, margin: 0 }}>
            A business question in.<br />A governed dashboard out.
          </h1>
          <p style={{ fontSize: 16, fontFamily: FONT, color: P.body, margin: '16px 0 24px' }}>
            AnalytIQ plans, validates, models, and assembles — every stage gated, every number
            traceable, zero raw rows to any LLM.
          </p>
          <Link to="/app" style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT,
                                   background: P.accent, color: '#fff', borderRadius: 10,
                                   padding: '12px 20px' }}>Start Free</Link>
          <div style={{ display: 'flex', gap: 16, marginTop: 28, fontFamily: MONO, fontSize: 11,
                        color: P.muted }}>
            <span>4 MIN QUESTION→ARTIFACT</span><span>100% QUERIES VALIDATED</span>
            <span>0 RAW ROWS TO LLM</span>
          </div>
        </div>
        <div style={{ border: `1px solid ${P.border}`, borderRadius: 14, background: P.darkBg,
                      color: P.darkText, fontFamily: MONO, fontSize: 12, padding: 20 }}>
          <div style={{ color: P.darkMuted }}>» forecast net revenue, next 14 days</div>
          <div style={{ marginTop: 8 }}>✓ plan validated · ✓ gold gated · ✓ model promoted</div>
          <div style={{ marginTop: 8, color: '#60a5fa' }}>▂▄▆▅▇▆█ dashboard assembled</div>
        </div>
      </section>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px 72px',
                        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {VALUE_CARDS.map(([title, sub]) => (
          <div key={title} style={{ border: `1px solid ${P.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT, color: P.ink }}>{title}</div>
            <div style={{ fontSize: 12.5, fontFamily: FONT, color: P.muted, marginTop: 6 }}>{sub}</div>
          </div>
        ))}
      </section>
      <footer style={{ borderTop: `1px solid ${P.border}`, padding: '20px 28px',
                       fontFamily: MONO, fontSize: 10.5, color: P.faint }}>
        SOC 2 TYPE II · GDPR · ISO 27001 — Powered by AnalytIQ
      </footer>
    </div>
  );
}

export function Pricing() {
  return (
    <div data-testid="marketing-pricing" style={{ minHeight: '100vh', background: '#fff' }}>
      <Nav />
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 28px' }}>
        <h1 style={{ fontSize: 30, fontFamily: FONT, color: P.ink }}>Pricing</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {PLANS.map(([name, price, feats, excluded], i) => (
            <div key={name} data-testid={`plan-${name.toLowerCase()}`}
                 style={{ border: `1px solid ${i === 2 ? P.accent : P.border}`, borderRadius: 12,
                          padding: 18 }}>
              {i === 2 && <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.accentHover,
                                        textTransform: 'uppercase' }}>most popular</div>}
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: FONT, color: P.ink }}>{name}</div>
              <div style={{ fontSize: 26, fontFamily: MONO, fontWeight: 600, color: P.ink,
                            margin: '6px 0' }}>{price}</div>
              {feats.map(f => (
                <div key={f} style={{ fontSize: 12.5, fontFamily: FONT, color: P.body,
                                      padding: '3px 0' }}>✓ {f}</div>
              ))}
              {excluded.map(f => (
                <div key={f} style={{ fontSize: 12.5, fontFamily: FONT, color: P.faint,
                                      padding: '3px 0' }}>— {f}</div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
