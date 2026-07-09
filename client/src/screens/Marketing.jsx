// R30S1E1 (pricing data lock — do not change plan facts, r30s1_pricing_data.spec.js
// enforces it) · R34S1E1: shared MarketingNav/MarketingFooter chrome · R34S1E2:
// Landing rebuild per docs/specs/mockups/Marketing Landing.dc.html (dark hero +
// live-build preview, BI comparison, value props, use cases, trust strip, CTA band).
// R34S1E4: Pricing restyle (toggle, /mo cards, comparison table, FAQ) — PLANS
// data below is untouched, only its presentation changed.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';

const HERO_STATS = [
  ['4 min', 'question → artifact'],
  ['100%', 'queries validated'],
  ['0', 'raw rows sent to an LLM'],
];

function HeroPreview() {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '100%', background: P.darkPanel, border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 14, boxShadow: '0 24px 60px rgba(2,6,23,.6)', overflow: 'hidden' }}>
        <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px',
                      borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a465c' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a465c' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a465c' }} />
          <span style={{ marginLeft: 10, fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
            analytiq · create
          </span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: '.06em',
                        color: P.codeGreen, background: 'rgba(74,222,128,.1)',
                        border: '1px solid rgba(74,222,128,.25)', borderRadius: 999, padding: '2px 8px' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: P.codeGreen }} />
            LIVE BUILD
          </span>
        </div>
        <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ maxWidth: '78%', background: P.accent, color: '#eef4ff', fontSize: 12.5,
                          lineHeight: 1.45, padding: '9px 13px', borderRadius: '12px 12px 3px 12px' }}>
              Which locations will miss their Q3 revenue target?
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontFamily: MONO,
                        fontSize: 11, color: '#7d8aa3' }}>
            <div><span style={{ color: P.codeGreen }}>✓</span> Validating metrics against semantic layer</div>
            <div><span style={{ color: P.codeGreen }}>✓</span> Planning dashboard · 6 sections</div>
            <div><span style={{ color: P.codeGreen }}>✓</span> Running queries · read-only · 412ms</div>
            <div><span style={{ color: P.darkAccent }}>●</span> Training forecast model
              <span style={{ color: P.darkAccent }}>▌</span></div>
          </div>
          <div style={{ background: '#0b1322', border: '1px solid rgba(255,255,255,.08)',
                        borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ background: '#111c31', border: '1px solid rgba(255,255,255,.07)',
                            borderRadius: 8, padding: '9px 10px' }}>
                <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '.08em', color: P.muted }}>
                  Q3 FORECAST
                </div>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: '#f1f5f9',
                              marginTop: 3 }}>$4.82M</div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.codeRed, marginTop: 2 }}>
                  −6.2% vs target
                </div>
              </div>
              <div style={{ background: '#111c31', border: '1px solid rgba(255,255,255,.07)',
                            borderRadius: 8, padding: '9px 10px' }}>
                <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '.08em', color: P.muted }}>
                  AT-RISK LOCATIONS
                </div>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: '#f1f5f9',
                              marginTop: 3 }}>7 / 42</div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: '#fbbf24', marginTop: 2 }}>
                  3 high severity
                </div>
              </div>
              <div style={{ background: '#111c31', border: '1px solid rgba(255,255,255,.07)',
                            borderRadius: 8, padding: '9px 10px' }}>
                <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '.08em', color: P.muted }}>
                  MODEL MAPE
                </div>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: '#f1f5f9',
                              marginTop: 3 }}>4.1%</div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.codeGreen, marginTop: 2 }}>
                  backtest passed
                </div>
              </div>
            </div>
            <div style={{ background: '#111c31', border: '1px solid rgba(255,255,255,.07)',
                          borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>
                  Revenue vs forecast · weekly
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: P.muted }}>GOLD.REV_WK_V3</span>
              </div>
              <svg viewBox="0 0 520 110" style={{ width: '100%', height: 110, marginTop: 6 }}>
                <line x1="0" y1="88" x2="520" y2="88" stroke="rgba(255,255,255,.08)" />
                <line x1="0" y1="52" x2="520" y2="52" stroke="rgba(255,255,255,.05)" />
                <line x1="0" y1="16" x2="520" y2="16" stroke="rgba(255,255,255,.05)" />
                <polygon points="0,88 0,64 40,60 80,66 120,50 160,54 200,42 240,46 280,34 320,38 320,88"
                         fill="rgba(37,99,235,.18)" />
                <polyline points="0,64 40,60 80,66 120,50 160,54 200,42 240,46 280,34 320,38"
                          fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                <polyline points="320,38 360,40 400,34 440,38 480,30 520,33"
                          fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="5 5" />
                <polyline points="320,38 360,46 400,44 440,52 480,50 520,56"
                          fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="5 5" />
                <circle cx="320" cy="38" r="3.5" fill="#3b82f6" />
                <line x1="320" y1="10" x2="320" y2="88" stroke="rgba(255,255,255,.14)" strokeDasharray="3 4" />
              </svg>
              <div style={{ display: 'flex', gap: 16, fontFamily: MONO, fontSize: 9, color: P.muted }}>
                <span style={{ color: '#3b82f6' }}>— actual</span>
                <span style={{ color: P.darkAccent }}>-- target</span>
                <span style={{ color: P.codeRed }}>-- forecast (at-risk)</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                        border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '9px 12px',
                        fontSize: 12, color: P.muted }}>
            Ask a follow-up…
            <span style={{ marginLeft: 'auto', display: 'inline-flex', width: 22, height: 22,
                          borderRadius: 6, background: P.accent, alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M1 5h7M5 1.5 8.5 5 5 8.5" stroke="#fff" strokeWidth="1.6" fill="none"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div style={{ background: P.darkBg, display: 'grid', gridTemplateColumns: '1.02fr .98fr',
                  gap: 56, padding: '84px 64px 88px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0,
                    background: 'radial-gradient(600px 320px at 78% 18%, rgba(37,99,235,.16), transparent 70%)' }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', gap: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: MONO,
                      fontSize: 11, fontWeight: 600, letterSpacing: '.14em', color: P.darkAccent }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.darkAccent }} />
          CONVERSATIONAL ANALYTICS
        </div>
        <h1 style={{ margin: 0, fontSize: 52, lineHeight: 1.06, fontWeight: 700,
                     letterSpacing: '-.025em', color: '#f8fafc', fontFamily: FONT }}>
          Ask a question.<br />Watch the dashboard<br />build itself.
        </h1>
        <p style={{ margin: 0, maxWidth: 470, fontSize: 16.5, lineHeight: 1.6, color: P.darkMuted,
                    fontFamily: FONT }}>
          AnalytIQ turns plain-English questions into governed, shareable dashboards — validated
          metrics, predictive models, and a full audit trail. No SQL, no backlog.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <Link to="/app" data-testid="hero-start-free"
                style={{ display: 'inline-flex', alignItems: 'center', height: 44, padding: '0 22px',
                         background: P.accent, color: '#fff', fontSize: 14.5, fontWeight: 600,
                         borderRadius: 9, fontFamily: FONT, textDecoration: 'none' }}>
            Start free
          </Link>
          <a href="#landing" style={{ display: 'inline-flex', alignItems: 'center', height: 44,
                     padding: '0 22px', border: '1px solid rgba(255,255,255,.22)', color: P.darkText,
                     fontSize: 14.5, fontWeight: 600, borderRadius: 9, fontFamily: FONT,
                     textDecoration: 'none' }}>
            Book a demo
          </a>
          <Link to="/product" style={{ fontSize: 14, fontWeight: 500, color: P.darkAccent,
                       fontFamily: FONT, textDecoration: 'none' }}>
            View a sample dashboard →
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 26, marginTop: 22, fontFamily: MONO, fontSize: 11.5,
                      color: P.muted }}>
          {HERO_STATS.map(([value, label]) => (
            <span key={label}>
              <span style={{ color: P.darkText, fontWeight: 600 }}>{value}</span> {label}
            </span>
          ))}
        </div>
      </div>
      <HeroPreview />
    </div>
  );
}

const BI_TRADITIONAL = [
  'Weeks of dashboard backlog behind the data team',
  '"Revenue" defined five different ways across tools',
  'Static charts that go stale the week they ship',
  'SQL gatekeeps every follow-up question',
  'Forecasting lives in a separate DS backlog',
];
const BI_ANALYTIQ = [
  'A finished dashboard minutes after the question',
  'One governed semantic layer — every metric defined once',
  'Live artifacts with health scores and freshness SLAs',
  'Plain English in, deterministic validated SQL underneath',
  'Forecasts trained, backtested and promoted automatically',
];

function BiComparison() {
  return (
    <div style={{ padding: '88px 64px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12,
                      alignItems: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '.14em',
                        color: P.accent }}>WHY NOT NORMAL BI?</span>
          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: '-.02em', color: P.ink,
                      fontFamily: FONT }}>
            Dashboards shouldn't take a sprint
          </h2>
          <p style={{ margin: 0, maxWidth: 560, fontSize: 15, lineHeight: 1.6, color: P.muted,
                      fontFamily: FONT }}>
            Traditional BI puts an analyst queue between a question and its answer. AnalytIQ puts a
            governed pipeline there instead.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 44 }}>
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 12, padding: 28, background: '#fafbfc' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: P.muted, fontFamily: FONT }}>Traditional BI</div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
              {BI_TRADITIONAL.map((row, i) => (
                <div key={row} style={{ display: 'flex', gap: 12, padding: '13px 0',
                            borderBottom: i < BI_TRADITIONAL.length - 1 ? `1px solid ${P.borderRow}` : 'none',
                            fontSize: 14, color: P.muted, fontFamily: FONT }}>
                  <span style={{ color: P.grayBar, fontWeight: 700 }}>✕</span>{row}
                </div>
              ))}
            </div>
          </div>
          <div style={{ border: `1px solid ${P.accentBorder}`, borderRadius: 12, padding: 28,
                        background: '#fff', boxShadow: '0 8px 28px rgba(37,99,235,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <rect width="24" height="24" rx="6" fill="#0f172a" />
                <rect x="5.5" y="12" width="3.2" height="6.5" rx="1.2" fill="#60a5fa" />
                <rect x="10.4" y="8.5" width="3.2" height="10" rx="1.2" fill="#3b82f6" />
                <rect x="15.3" y="5" width="3.2" height="13.5" rx="1.2" fill="#2563eb" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 700, color: P.ink, fontFamily: FONT }}>AnalytIQ</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
              {BI_ANALYTIQ.map((row, i) => (
                <div key={row} style={{ display: 'flex', gap: 12, padding: '13px 0',
                            borderBottom: i < BI_ANALYTIQ.length - 1 ? `1px solid ${P.borderRow}` : 'none',
                            fontSize: 14, color: P.body, fontFamily: FONT }}>
                  <span style={{ color: P.green, fontWeight: 700 }}>✓</span>{row}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const VALUE_CARDS = [
  {
    title: 'Governed metrics', tint: P.accentSoft, iconColor: P.accent,
    body: "Every chart resolves to one reviewed definition in the semantic layer — never an LLM's guess.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M8 1.5 14 4v4.2c0 3.4-2.5 5.6-6 6.3-3.5-.7-6-2.9-6-6.3V4l6-2.5Z" fill="none"
              stroke={P.accent} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m5.5 8 1.8 1.8L10.8 6.4" fill="none" stroke={P.accent} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Predictive models', tint: P.purpleBg, iconColor: P.purple,
    body: 'Forecasts and risk scores trained per question, backtested, leakage-checked, and promoted with a model card.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <polyline points="1.5,12.5 5,8.5 8,10.5 14.5,3.5" fill="none" stroke={P.purple} strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="10.5,3.5 14.5,3.5 14.5,7.5" fill="none" stroke={P.purple} strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Shareable artifacts', tint: P.cyanBg, iconColor: P.cyan,
    body: 'Dashboards are versioned artifacts — share links, embeds, exports, all scoped by signed tokens.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="4" cy="8" r="2.2" fill="none" stroke={P.cyan} strokeWidth="1.5" />
        <circle cx="12" cy="3.5" r="2.2" fill="none" stroke={P.cyan} strokeWidth="1.5" />
        <circle cx="12" cy="12.5" r="2.2" fill="none" stroke={P.cyan} strokeWidth="1.5" />
        <path d="M6 7 10 4.5M6 9l4 2.5" stroke={P.cyan} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'No SQL required', tint: P.greenBg, iconColor: P.green,
    body: 'Business users ask in plain English. Admins can always inspect the exact SQL that ran.',
    icon: <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: P.green }}>Aa</span>,
  },
];

function ValueProps() {
  return (
    <div style={{ padding: '76px 64px', background: P.bg, borderTop: `1px solid ${P.border}`,
                  borderBottom: `1px solid ${P.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid',
                    gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
        {VALUE_CARDS.map(card => (
          <div key={card.title} style={{ background: '#fff', border: `1px solid ${P.border}`,
                      borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: card.tint,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {card.icon}
            </span>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
              {card.title}
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: P.muted, fontFamily: FONT }}>
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const USE_CASES = [
  {
    title: 'Revenue Forecast', tag: 'FINANCE · PREDICTIVE',
    quote: '"Where does revenue land this quarter — and what drives the gap?"',
    art: (
      <svg viewBox="0 0 240 56" style={{ width: '100%', height: 56 }}>
        <polygon points="0,52 0,40 30,36 60,42 90,30 120,34 150,24 180,28 180,52" fill="#eff4ff" />
        <polyline points="0,40 30,36 60,42 90,30 120,34 150,24 180,28" fill="none" stroke="#2563eb" strokeWidth="2" />
        <polyline points="180,28 210,22 240,16" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    ),
  },
  {
    title: 'Customer Churn Risk', tag: 'CUSTOMER SUCCESS · PREDICTIVE',
    quote: '"Which accounts are most likely to churn in the next 60 days?"',
    art: (
      <svg viewBox="0 0 240 56" style={{ width: '100%', height: 56 }}>
        <circle cx="28" cy="28" r="20" fill="none" stroke="#eef1f5" strokeWidth="8" />
        <circle cx="28" cy="28" r="20" fill="none" stroke="#dc2626" strokeWidth="8" strokeDasharray="34 92"
                transform="rotate(-90 28 28)" />
        <rect x="66" y="14" width="52" height="7" rx="3.5" fill="#fdeaea" />
        <rect x="66" y="26" width="80" height="7" rx="3.5" fill="#eef1f5" />
        <rect x="66" y="38" width="64" height="7" rx="3.5" fill="#eef1f5" />
        <rect x="160" y="8" width="14" height="40" rx="3" fill="#eef1f5" />
        <rect x="180" y="18" width="14" height="30" rx="3" fill="#fca5a5" />
        <rect x="200" y="26" width="14" height="22" rx="3" fill="#dc2626" />
      </svg>
    ),
  },
  {
    title: 'Operational Risk Monitor', tag: 'OPERATIONS · ANOMALY',
    quote: '"Flag the stores, lines or regions drifting out of tolerance."',
    art: (
      <svg viewBox="0 0 240 56" style={{ width: '100%', height: 56 }}>
        <rect x="2" y="6" width="20" height="20" rx="4" fill="#e8f5ec" />
        <rect x="26" y="6" width="20" height="20" rx="4" fill="#e8f5ec" />
        <rect x="50" y="6" width="20" height="20" rx="4" fill="#fdf3e3" />
        <rect x="74" y="6" width="20" height="20" rx="4" fill="#e8f5ec" />
        <rect x="2" y="30" width="20" height="20" rx="4" fill="#e8f5ec" />
        <rect x="26" y="30" width="20" height="20" rx="4" fill="#fdf3e3" />
        <rect x="50" y="30" width="20" height="20" rx="4" fill="#fdeaea" />
        <rect x="74" y="30" width="20" height="20" rx="4" fill="#e8f5ec" />
        <rect x="106" y="10" width="130" height="8" rx="4" fill="#eef1f5" />
        <rect x="106" y="10" width="88" height="8" rx="4" fill="#d97706" />
        <rect x="106" y="26" width="130" height="8" rx="4" fill="#eef1f5" />
        <rect x="106" y="26" width="52" height="8" rx="4" fill="#2563eb" />
        <rect x="106" y="42" width="130" height="8" rx="4" fill="#eef1f5" />
        <rect x="106" y="42" width="104" height="8" rx="4" fill="#dc2626" />
      </svg>
    ),
  },
  {
    title: 'Sales Pipeline Health', tag: 'SALES · DIAGNOSTIC',
    quote: '"Is Q4 pipeline coverage real — or padded with stale deals?"',
    art: (
      <svg viewBox="0 0 240 56" style={{ width: '100%', height: 56 }}>
        <rect x="4" y="44" width="220" height="8" rx="4" fill="#eff4ff" />
        <rect x="4" y="32" width="180" height="8" rx="4" fill="#dbeafe" />
        <rect x="4" y="20" width="132" height="8" rx="4" fill="#93c5fd" />
        <rect x="4" y="8" width="84" height="8" rx="4" fill="#2563eb" />
      </svg>
    ),
  },
  {
    title: 'Margin Variance', tag: 'FINANCE · VARIANCE',
    quote: '"Which SKUs and suppliers are eating gross margin this month?"',
    art: (
      <svg viewBox="0 0 240 56" style={{ width: '100%', height: 56 }}>
        <rect x="8" y="20" width="18" height="32" rx="3" fill="#cbd5e1" />
        <rect x="34" y="12" width="18" height="40" rx="3" fill="#cbd5e1" />
        <rect x="60" y="26" width="18" height="26" rx="3" fill="#f59e0b" />
        <rect x="86" y="8" width="18" height="44" rx="3" fill="#cbd5e1" />
        <rect x="112" y="30" width="18" height="22" rx="3" fill="#f59e0b" />
        <rect x="138" y="16" width="18" height="36" rx="3" fill="#cbd5e1" />
        <rect x="164" y="22" width="18" height="30" rx="3" fill="#cbd5e1" />
        <rect x="190" y="34" width="18" height="18" rx="3" fill="#dc2626" />
        <line x1="4" y1="24" x2="236" y2="24" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
    ),
  },
  {
    title: 'Inventory Demand Forecast', tag: 'OPERATIONS · PREDICTIVE',
    quote: '"What do we need in each warehouse before the holiday spike?"',
    art: (
      <svg viewBox="0 0 240 56" style={{ width: '100%', height: 56 }}>
        <polyline points="0,44 24,40 48,46 72,34 96,38 120,26 144,32 168,20" fill="none" stroke="#059669" strokeWidth="2" />
        <polyline points="168,20 192,26 216,14 240,18" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" />
        <polygon points="168,10 168,52 240,52 240,10" fill="rgba(5,150,105,.07)" />
        <line x1="168" y1="8" x2="168" y2="52" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 4" />
      </svg>
    ),
  },
];

function UseCases() {
  return (
    <div style={{ padding: '88px 64px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '.14em',
                          color: P.accent }}>USE CASES</span>
            <h2 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: '-.02em', color: P.ink,
                        fontFamily: FONT }}>
              Start from a question they already ask
            </h2>
          </div>
          <Link to="/templates" style={{ fontSize: 14, fontWeight: 600, color: P.accent,
                       fontFamily: FONT, textDecoration: 'none' }}>
            Browse all templates →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 36 }}>
          {USE_CASES.map(uc => (
            <Link key={uc.title} to="/templates" style={{ textDecoration: 'none', border: `1px solid ${P.border}`,
                        borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', gap: 14,
                        background: '#fff' }}>
              {uc.art}
              <div style={{ fontSize: 15, fontWeight: 600, color: P.ink, fontFamily: FONT }}>{uc.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: P.muted, fontFamily: FONT }}>{uc.quote}</div>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.06em', color: P.faint }}>
                {uc.tag}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const TRUST_ITEMS = [
  ['No raw data to LLMs',
    <path key="p" d="M6 1 10.5 3v3c0 2.6-1.9 4.3-4.5 5C3.4 10.3 1.5 8.6 1.5 6V3L6 1Z" fill="none" stroke={P.darkAccent} strokeWidth="1.2" />],
  ['Read-only warehouse access',
    <><rect key="r" x="2" y="5" width="8" height="5.5" rx="1.5" fill="none" stroke={P.darkAccent} strokeWidth="1.2" />
      <path key="p" d="M4 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke={P.darkAccent} strokeWidth="1.2" /></>],
  ['Deterministic validation gates',
    <path key="p" d="m2 6.5 2.5 2.5L10 3.5" fill="none" stroke={P.darkAccent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />],
  ['Row-level security',
    <><rect key="a" x="1.5" y="2" width="9" height="2" rx="1" fill={P.darkAccent} />
      <rect key="b" x="1.5" y="5.5" width="6" height="2" rx="1" fill="none" stroke={P.darkAccent} strokeWidth="1" />
      <rect key="c" x="1.5" y="9" width="9" height="2" rx="1" fill="none" stroke={P.darkAccent} strokeWidth="1" /></>],
  ['Full audit logs',
    <><circle key="a" cx="6" cy="6" r="4.5" fill="none" stroke={P.darkAccent} strokeWidth="1.2" />
      <path key="b" d="M6 3.5V6l1.8 1.2" fill="none" stroke={P.darkAccent} strokeWidth="1.2" strokeLinecap="round" /></>],
];

function TrustStrip() {
  return (
    <div style={{ background: P.darkBg, padding: '26px 64px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 24 }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '.14em',
                      color: P.muted }}>GOVERNED BY DESIGN</span>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', fontFamily: MONO, fontSize: 11.5,
                      color: P.darkMuted }}>
          {TRUST_ITEMS.map(([label, svg]) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <svg width="12" height="12" viewBox="0 0 12 12">{svg}</svg>{label}
            </span>
          ))}
        </div>
        <Link to="/security" style={{ fontSize: 12.5, fontWeight: 600, color: P.darkAccent,
                     fontFamily: FONT, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Security →
        </Link>
      </div>
    </div>
  );
}

function CtaBand() {
  return (
    <div style={{ padding: '96px 64px', background: '#fff', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: P.faint }}>
          $ analytiq create <span style={{ color: P.accent }}>"weekly revenue by region, forecast 8 weeks"</span>
          <span style={{ color: P.accent }}>▌</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 38, fontWeight: 700, letterSpacing: '-.02em', color: P.ink,
                    fontFamily: FONT }}>
          Your next dashboard is a sentence away
        </h2>
        <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
          <Link to="/app" style={{ display: 'inline-flex', alignItems: 'center', height: 46,
                       padding: '0 24px', background: P.accent, color: '#fff', fontSize: 15,
                       fontWeight: 600, borderRadius: 9, fontFamily: FONT, textDecoration: 'none' }}>
            Start free
          </Link>
          <Link to="/product" style={{ display: 'inline-flex', alignItems: 'center', height: 46,
                       padding: '0 24px', border: `1px solid ${P.borderStrong}`, color: P.ink, fontSize: 15,
                       fontWeight: 600, borderRadius: 9, fontFamily: FONT, textDecoration: 'none' }}>
            See how it works
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div data-testid="marketing-landing" style={{ minHeight: '100vh', background: '#fff' }}>
      <MarketingNav />
      <Hero />
      <BiComparison />
      <ValueProps />
      <UseCases />
      <TrustStrip />
      <CtaBand />
      <MarketingFooter />
    </div>
  );
}

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

// Presentation-only metadata, keyed by PLANS index — descriptor/CTA copy is new
// content (not covered by the data lock, which only governs name/price/feats/excluded).
const PLAN_META = [
  { descriptor: 'Try the loop on one dataset.', cta: 'Start free', filled: false },
  { descriptor: 'For teams shipping weekly answers.', cta: 'Start trial', filled: false },
  { descriptor: 'Governance for the whole org.', cta: 'Start trial', filled: true },
  { descriptor: 'Scale, isolation, and guarantees.', cta: 'Talk to sales', filled: true, dark: true },
];

const COMPARE_ROWS = [
  ['Monthly tokens included', ['100K', '500K', '2M', 'custom']],
  ['Predictive models + model cards', ['—', '✓', '✓', '✓']],
  ['SSO (SAML/OIDC) + row-level security', ['—', '—', '✓', '✓']],
  ['Signed public links + embeds', ['—', 'links only', '✓', '✓']],
  ['Audit log export · VPC · SLA', ['—', '—', 'audit only', '✓']],
];

const FAQ_ITEMS = [
  ['What counts as a token?',
    "Tokens meter the AI planning work — understanding questions, planning dashboards, writing narratives. Viewing dashboards, filtering, and scheduled refreshes of existing artifacts don't consume tokens."],
  ['What happens when we hit our token limit?',
    'Overage billing kicks in on plans that support it (Business); Starter and Team pause new AI-planning work until the next cycle or an upgrade.'],
  ['Does my data ever leave my warehouse?',
    'No. AnalytIQ connects read-only and sends the model schemas and aggregate shapes — never raw rows.'],
  ['Can we switch plans or cancel anytime?',
    'Yes, from Billing at any time — changes apply at the start of your next cycle.'],
];

function PriceToggle({ annual, onChange }) {
  // Cosmetic only: PLANS has one price per plan (no separate monthly/annual
  // figures), so toggling never changes a displayed number — there's no
  // annual-pricing data model yet. Matches the mockup's visual state.
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${P.borderStrong}`,
                  borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
      <span onClick={() => onChange(false)} style={{ display: 'inline-flex', alignItems: 'center',
                  height: 34, padding: '0 17px', background: annual ? '#fff' : P.ink,
                  color: annual ? P.muted : '#fff', fontSize: 12.5,
                  fontWeight: annual ? 500 : 600, fontFamily: FONT, cursor: 'pointer' }}>
        Monthly
      </span>
      <span onClick={() => onChange(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                  height: 34, padding: '0 17px', background: annual ? P.ink : '#fff',
                  color: annual ? '#fff' : P.muted, fontSize: 12.5,
                  fontWeight: annual ? 600 : 500, fontFamily: FONT, cursor: 'pointer' }}>
        Annual
        <span style={{ display: 'inline-flex', height: 17, padding: '0 7px', borderRadius: 999,
                      background: P.green, fontFamily: MONO, fontSize: 8.5, fontWeight: 600,
                      alignItems: 'center' }}>−20%</span>
      </span>
    </div>
  );
}

function PlanCard({ name, price, feats, excluded, i }) {
  const meta = PLAN_META[i];
  const isBusiness = i === 2;
  const isDark = !!meta.dark;
  return (
    <div data-testid={`plan-${name.toLowerCase()}`} style={{
      position: 'relative', borderRadius: 13, padding: 24, display: 'flex', flexDirection: 'column',
      gap: 13,
      border: isBusiness ? `2px solid ${P.accent}` : isDark ? `1px solid ${P.darkBg}` : `1px solid ${P.border}`,
      boxShadow: isBusiness ? '0 16px 40px rgba(37,99,235,.12)' : 'none',
      background: isDark ? P.darkBg : '#fff',
    }}>
      {isBusiness && (
        <span style={{ position: 'absolute', top: -11, left: 20, display: 'inline-flex', height: 22,
                      padding: '0 11px', borderRadius: 999, background: P.accent, color: '#fff',
                      fontFamily: MONO, fontSize: 9, fontWeight: 600, alignItems: 'center',
                      letterSpacing: '.06em' }}>
          MOST POPULAR
        </span>
      )}
      <span style={{ fontSize: 15, fontWeight: 600, color: isDark ? '#f1f5f9' : P.ink, fontFamily: FONT }}>
        {name}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: isDark ? '#f1f5f9' : P.ink }}>
          {price}
        </span>
        {price !== 'Custom' && <span style={{ fontSize: 12, color: P.faint }}>/mo</span>}
      </div>
      <span style={{ fontSize: 12, color: isDark ? P.darkMuted : P.muted, lineHeight: 1.5, fontFamily: FONT }}>
        {meta.descriptor}
      </span>
      <Link to={name === 'Enterprise' ? '/' : '/app'} style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 38, borderRadius: 9,
        fontSize: 13, fontWeight: 600, fontFamily: FONT, textDecoration: 'none',
        ...(meta.filled
          ? { background: P.accent, color: '#fff' }
          : { border: `1px solid ${P.borderStrong}`, color: isDark ? '#f1f5f9' : P.ink }),
      }}>
        {meta.cta}
      </Link>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5, fontFamily: FONT,
                    paddingTop: 4 }}>
        {/* r30s1_pricing_data.spec.js asserts the exact text "✓ {f}" / "— {f}" (with a
            real space) and reads this element's own color — a flex `gap` only adds
            visual spacing, not a text character, so the space here must be literal. */}
        {feats.map(f => (
          <div key={f} style={{ color: isDark ? '#cbd5e1' : P.body }}>
            <span style={{ color: isDark ? P.codeGreen : P.green, fontWeight: 700 }}>✓</span> {f}
          </div>
        ))}
        {excluded.map(f => (
          <div key={f} style={{ color: P.faint }}>
            <span style={{ color: P.grayBar, fontWeight: 700 }}>—</span> {f}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareTable() {
  return (
    <div style={{ padding: '14px 64px 40px', maxWidth: 1328, margin: '0 auto', width: '100%' }}>
      <div style={{ border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', padding: '0 22px',
                      height: 42, alignItems: 'center', background: P.tableHeadBg,
                      borderBottom: `1px solid ${P.border}`, fontFamily: MONO, fontSize: 9.5,
                      fontWeight: 600, letterSpacing: '.06em', color: P.muted }}>
          <span>COMPARE</span>
          <span style={{ textAlign: 'center' }}>STARTER</span>
          <span style={{ textAlign: 'center' }}>TEAM</span>
          <span style={{ textAlign: 'center', color: P.accentHover }}>BUSINESS</span>
          <span style={{ textAlign: 'center' }}>ENTERPRISE</span>
        </div>
        {COMPARE_ROWS.map(([label, cells], i) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr',
                      padding: '0 22px', height: 42, alignItems: 'center', fontSize: 12.5, color: P.body,
                      borderBottom: i < COMPARE_ROWS.length - 1 ? `1px solid ${P.rowFaint}` : 'none' }}>
            <span>{label}</span>
            {cells.map((cell, ci) => (
              <span key={ci} style={{
                textAlign: 'center',
                ...(cell === '✓' ? { color: P.green, fontWeight: 700 }
                  : cell === '—' ? { color: P.grayBar, fontWeight: 700 }
                  : { fontFamily: MONO, fontSize: cell.length > 4 ? 10.5 : 11, color: P.muted }),
              }}>
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Faq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div style={{ padding: '24px 64px 64px', maxWidth: 860, margin: '0 auto', width: '100%',
                  display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: P.ink, textAlign: 'center',
                  fontFamily: FONT }}>
        Questions
      </h2>
      {FAQ_ITEMS.map(([q, a], i) => {
        const open = openIndex === i;
        return (
          <div key={q} onClick={() => setOpenIndex(open ? -1 : i)}
               style={{ border: `1px solid ${P.border}`, borderRadius: 10, padding: '15px 18px',
                        display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>{q}</span>
              <svg width="10" height="10" viewBox="0 0 9 9">
                {open
                  ? <path d="m2 3.5 2.5 2.5L7 3.5" fill="none" stroke={P.muted} strokeWidth="1.4" strokeLinecap="round" />
                  : <path d="m3 2 3 2.5L3 7" fill="none" stroke={P.muted} strokeWidth="1.4" strokeLinecap="round" />}
              </svg>
            </div>
            {open && (
              <span style={{ fontSize: 13, lineHeight: 1.6, color: P.muted, fontFamily: FONT }}>{a}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <div data-testid="marketing-pricing" style={{ minHeight: '100vh', background: '#fff' }}>
      <MarketingNav />
      <div style={{ padding: '56px 64px 22px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 700, letterSpacing: '-.02em', color: P.ink,
                    fontFamily: FONT }}>
          Pay for answers, not seats you don't use
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: P.muted, fontFamily: FONT }}>
          Every plan includes governed metrics, validation gates, and read-only connections.
        </p>
        <PriceToggle annual={annual} onChange={setAnnual} />
      </div>
      <div style={{ padding: '26px 64px 30px', maxWidth: 1328, margin: '0 auto', display: 'grid',
                    gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {PLANS.map(([name, price, feats, excluded], i) => (
          <PlanCard key={name} name={name} price={price} feats={feats} excluded={excluded} i={i} />
        ))}
      </div>
      <CompareTable />
      <Faq />
      <MarketingFooter />
    </div>
  );
}
