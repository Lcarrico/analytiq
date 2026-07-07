// R34S1E3 — Product page (/product), new: header, sticky 5-step anchor
// stepper, 5 alternating stage sections, dark CTA band. Per
// docs/specs/mockups/Marketing Product.dc.html and
// specs/prd-package/.../03 - Product Page (MISSING ENTIRELY).md.
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';

const STEPS = [
  ['stage-understand', 'Understand'],
  ['stage-validate', 'Validate metrics'],
  ['stage-build', 'Build gold data'],
  ['stage-train', 'Train & backtest'],
  ['stage-ship', 'Assemble & share'],
];

function Stepper() {
  return (
    <div style={{ padding: '26px 64px 56px', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'flex-start' }}>
        {STEPS.map(([id, label], i) => (
          <Fragment key={id}>
            <a href={`#${id}`} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                       alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span style={{
                width: 34, height: 34, borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontFamily: MONO, fontSize: 12, fontWeight: 600,
                ...(i === 0
                  ? { background: P.accent, color: '#fff' }
                  : { border: `2px solid ${P.accentBorder}`, background: '#f8faff', color: P.accentHover }),
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: i === 0 ? 600 : 500,
                            color: i === 0 ? P.ink : '#47516b', textAlign: 'center', fontFamily: FONT }}>
                {label}
              </span>
            </a>
            {i < STEPS.length - 1 && (
              <span style={{ flex: 1, height: 2, background: P.border, marginTop: 16 }} />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function PlanReviewVisual() {
  return (
    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: 18,
                  display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 12px 32px rgba(15,23,42,.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ background: P.accent, color: '#eef4ff', fontSize: 12, padding: '8px 12px',
                      borderRadius: '11px 11px 3px 11px' }}>
          Which locations will miss their Q3 revenue target?
        </span>
      </div>
      <div style={{ border: `1px solid ${P.accentBorder}`, borderRadius: 9, padding: '11px 13px',
                    display: 'flex', flexDirection: 'column', gap: 6, background: '#f8faff' }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>Review your plan</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, lineHeight: 1.8, color: P.muted }}>
          GOAL{'    '}flag locations &gt;5% below target<br />
          METRICS{' '}net_revenue · target_gap_pct<br />
          SOURCES{' '}sample_retail + q3_targets.xlsx
        </span>
        <div style={{ display: 'flex', gap: 7 }}>
          <span style={{ display: 'inline-flex', height: 24, padding: '0 10px', background: P.accent,
                        borderRadius: 6, color: '#fff', fontSize: 10, fontWeight: 600, alignItems: 'center' }}>
            Approve &amp; Build
          </span>
          <span style={{ display: 'inline-flex', height: 24, padding: '0 9px', border: `1px solid ${P.borderStrong}`,
                        borderRadius: 6, color: P.body, fontSize: 10, fontWeight: 600, alignItems: 'center' }}>
            Edit
          </span>
        </div>
      </div>
    </div>
  );
}

function ValidateVisual() {
  return (
    <div style={{ background: P.darkBg, borderRadius: 12, padding: '18px 20px', display: 'flex',
                  flexDirection: 'column', gap: 7, fontFamily: MONO, fontSize: 11, lineHeight: 1.75,
                  color: P.darkMuted, boxShadow: '0 12px 32px rgba(15,23,42,.12)' }}>
      <span><span style={{ color: P.codeGreen }}>✓</span> metric net_revenue → governed definition v4</span>
      <span><span style={{ color: P.codeGreen }}>✓</span> join orders → stores · n:1 · inflation ×1.0</span>
      <span><span style={{ color: P.codeRed }}>✕</span> join orders → promotions · m:n <span style={{ color: P.codeRed }}>BLOCKED</span></span>
      <span style={{ paddingLeft: 16, color: P.muted }}>→ bridge table recommended · queued for steward</span>
      <span><span style={{ color: P.codeGreen }}>✓</span> 2 PII columns masked · customers.email, zip4</span>
      <span><span style={{ color: P.codeGreen }}>✓</span> SQL validated · read-only · row limit 5,000</span>
    </div>
  );
}

function BuildVisual() {
  return (
    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: 18,
                  display: 'flex', flexDirection: 'column', gap: 9, boxShadow: '0 12px 32px rgba(15,23,42,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 10, color: P.body }}>
        <span style={{ border: `1px solid ${P.border}`, borderRadius: 6, padding: '5px 9px', background: '#fafbfc' }}>orders</span>
        <span style={{ color: P.faint }}>+</span>
        <span style={{ border: `1px solid ${P.border}`, borderRadius: 6, padding: '5px 9px', background: '#fafbfc' }}>targets</span>
        <span style={{ color: P.faint }}>→</span>
        <span style={{ border: `1px solid ${P.amberBorder}`, borderRadius: 6, padding: '5px 9px',
                      background: P.amberBg, color: P.amber, fontWeight: 600 }}>GOLD.REV_LOC_WK_V1</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['ROW BAND ✓', 'GRAIN UNIQUE ✓', 'RECONCILES GL ✓', 'NULL CONTRACT ✓'].map(g => (
          <span key={g} style={{ display: 'inline-flex', height: 21, padding: '0 9px', borderRadius: 999,
                      background: P.greenBg, color: P.green, fontFamily: MONO, fontSize: 9, fontWeight: 600,
                      alignItems: 'center' }}>{g}</span>
        ))}
      </div>
      <svg viewBox="0 0 480 70" style={{ width: '100%', height: 70 }}>
        <rect x="0" y="26" width="480" height="20" rx="5" fill="#f1f5f9" />
        <rect x="0" y="26" width="316" height="20" rx="5" fill={P.accent} opacity=".16" />
        <text x="10" y="40" fontFamily="IBM Plex Mono" fontSize="10" fill={P.body}>3,486 / 3,600 expected rows</text>
        <text x="360" y="40" fontFamily="IBM Plex Mono" fontSize="10" fill={P.green}>within band ✓</text>
      </svg>
    </div>
  );
}

const CANDIDATES = [
  ['LightGBM', 34, P.green, '4.1%', P.green, 600, P.ink],
  ['XGBoost', 40, '#93c5fd', '4.6%', P.muted, 400, P.muted],
  ['Prophet', 52, P.grayBar, '5.8%', P.muted, 400, P.muted],
];

function PredictVisual() {
  return (
    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: 18,
                  display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 12px 32px rgba(15,23,42,.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 10, color: P.muted }}>
        <span>candidate leaderboard · 5-window backtest</span>
        <span style={{ color: P.green }}>leakage 14/14 ✓</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {CANDIDATES.map(([name, pct, barColor, score, scoreColor, weight, nameColor]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 70, fontFamily: MONO, fontSize: 10, color: nameColor, fontWeight: weight }}>{name}</span>
            <div style={{ flex: 1, height: 13, borderRadius: 3, background: '#eef1f5', overflow: 'hidden' }}>
              <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: barColor }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, color: scoreColor }}>{score}</span>
          </div>
        ))}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
        promotion gate: beat incumbent by ≥0.5pt on ≥3 windows ✓ · model card generated
      </span>
    </div>
  );
}

function ShipVisual() {
  return (
    <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 12, padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 9, boxShadow: '0 12px 32px rgba(15,23,42,.06)' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#fafbfc', border: `1px solid ${P.borderRow}`, borderRadius: 8, padding: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: P.faint }}>Q3 FORECAST</div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: P.ink, marginTop: 2 }}>$4.82M</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: P.red, marginTop: 2 }}>−6.2% vs target</div>
        </div>
        <div style={{ flex: 1, background: '#fafbfc', border: `1px solid ${P.borderRow}`, borderRadius: 8, padding: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: P.faint }}>AT-RISK</div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: P.amber, marginTop: 2 }}>7 / 42</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: P.muted, marginTop: 2 }}>3 high</div>
        </div>
        <div style={{ flex: 1, background: '#fafbfc', border: `1px solid ${P.borderRow}`, borderRadius: 8, padding: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 8, color: P.faint }}>HEALTH</div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: P.green, marginTop: 2 }}>96</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: P.muted, marginTop: 2 }}>v14</div>
        </div>
      </div>
      <svg viewBox="0 0 480 90" style={{ width: '100%', height: 90 }}>
        <polygon points="300,44 340,40 380,46 420,42 460,50 480,48 480,74 460,68 420,64 380,58 340,60 300,54"
                 fill="rgba(37,99,235,.08)" />
        <polyline points="0,66 40,60 80,64 120,52 160,56 200,46 240,50 280,40 300,44"
                  fill="none" stroke={P.accent} strokeWidth="2.2" />
        <polyline points="300,44 340,46 380,52 420,48 460,58 480,56"
                  fill="none" stroke={P.accent} strokeWidth="2.2" strokeDasharray="5 5" />
        <line x1="300" y1="18" x2="300" y2="80" stroke={P.grayBar} strokeDasharray="3 4" />
      </svg>
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ display: 'inline-flex', height: 20, padding: '0 9px', borderRadius: 999,
                      background: P.greenBg, color: P.green, fontFamily: MONO, fontSize: 8.5, fontWeight: 600,
                      alignItems: 'center' }}>● HEALTHY</span>
        <span style={{ display: 'inline-flex', height: 20, padding: '0 9px', borderRadius: 999,
                      background: P.accentSoft, color: P.accentHover, fontFamily: MONO, fontSize: 8.5,
                      fontWeight: 600, alignItems: 'center' }}>SIGNED LINK</span>
        <span style={{ display: 'inline-flex', height: 20, padding: '0 9px', borderRadius: 999,
                      background: P.purpleBg, color: P.purple, fontFamily: MONO, fontSize: 8.5, fontWeight: 600,
                      alignItems: 'center' }}>MODEL CARD</span>
      </div>
    </div>
  );
}

const STAGES = [
  {
    id: 'stage-understand', bg: P.bg, reverse: false, eyebrow: 'STAGE 1 · UNDERSTAND',
    heading: 'Your question becomes a reviewable plan',
    body: "AnalytIQ resolves your words against the semantic layer — governed metrics, known dimensions, allowed joins. When it isn't sure, it asks one crisp question instead of guessing. You approve the plan before anything runs.",
    footnote: 'no raw data touches the LLM · plan is auditable JSON',
    visual: <PlanReviewVisual />,
  },
  {
    id: 'stage-validate', bg: '#fff', reverse: true, eyebrow: 'STAGE 2 · VALIDATE',
    heading: 'Deterministic gates, not vibes',
    body: 'Every metric resolves to one reviewed definition. Dangerous joins are blocked, PII is masked, and generated SQL must pass safety checks before it can touch your warehouse — read-only, always.',
    link: ['/security', 'Security & governance model →'],
    visual: <ValidateVisual />,
  },
  {
    id: 'stage-build', bg: P.bg, reverse: false, eyebrow: 'STAGE 3 · BUILD',
    heading: 'An immutable gold table per answer',
    body: 'Each dashboard is fed by a versioned, contract-checked gold table at exactly the right grain. Row counts, reconciliation, and null contracts are enforced — if a gate fails, the build repairs or stops. No silent bad data.',
    footnote: 'GOLD.REV_LOC_WK_V1 · 3,486 rows · gates 6/6 ✓',
    visual: <BuildVisual />,
  },
  {
    id: 'stage-train', bg: '#fff', reverse: true, eyebrow: 'STAGE 4 · PREDICT',
    heading: 'Forecasts earn their place',
    body: 'When your question needs a prediction, candidates compete on rolling backtests with automatic leakage checks. A champion is promoted only when it beats the incumbent — and ships with a model card anyone can read.',
    visual: <PredictVisual />,
  },
  {
    id: 'stage-ship', bg: P.bg, reverse: false, eyebrow: 'STAGE 5 · SHIP',
    heading: 'A living artifact, not a screenshot',
    body: 'The result is a versioned dashboard with health scores, narrative insight, and a full audit trail. Refine it in chat, edit it directly, or share it with signed, expiring links and embeds.',
    ctas: [['/app/create/new', 'See the workbench', true], ['/share', 'Sharing views', false]],
    visual: <ShipVisual />,
  },
];

function Stage({ stage }) {
  const text = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '.12em',
                    color: P.accent }}>{stage.eyebrow}</span>
      <h2 style={{ margin: 0, fontSize: 27, fontWeight: 700, letterSpacing: '-.015em', color: P.ink,
                  fontFamily: FONT }}>{stage.heading}</h2>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: P.muted, fontFamily: FONT }}>
        {stage.body}
      </p>
      {stage.footnote && (
        <span style={{ fontFamily: MONO, fontSize: 11, color: P.faint }}>{stage.footnote}</span>
      )}
      {stage.link && (
        <Link to={stage.link[0]} style={{ fontSize: 13.5, fontWeight: 600, color: P.accent,
                     fontFamily: FONT, textDecoration: 'none' }}>{stage.link[1]}</Link>
      )}
      {stage.ctas && (
        <div style={{ display: 'flex', gap: 12 }}>
          {stage.ctas.map(([to, label, primary]) => (
            <Link key={label} to={to} style={{ display: 'inline-flex', alignItems: 'center', height: 40,
                        padding: primary ? '0 18px' : '0 17px',
                        background: primary ? P.accent : 'transparent',
                        border: primary ? 'none' : `1px solid ${P.borderStrong}`,
                        borderRadius: 8, color: primary ? '#fff' : P.ink, fontSize: 13, fontWeight: 600,
                        fontFamily: FONT, textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <div id={stage.id} style={{ padding: '34px 64px', background: stage.bg,
                borderTop: stage.bg === P.bg ? `1px solid ${P.border}` : 'none' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid',
                  gridTemplateColumns: stage.reverse ? '1.1fr 1fr' : '1fr 1.1fr', gap: 56, alignItems: 'center' }}>
        {stage.reverse ? <>{stage.visual}{text}</> : <>{text}{stage.visual}</>}
      </div>
    </div>
  );
}

export default function MarketingProduct() {
  return (
    <div data-testid="marketing-product" style={{ minHeight: '100vh', background: '#fff' }}>
      <MarketingNav />
      <div style={{ padding: '68px 64px 28px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '.14em',
                      color: P.accent }}>HOW IT WORKS</span>
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 700, letterSpacing: '-.02em', color: P.ink,
                    fontFamily: FONT }}>A governed pipeline, not a chatbot</h1>
        <p style={{ margin: 0, maxWidth: 620, fontSize: 15.5, lineHeight: 1.6, color: P.muted,
                    fontFamily: FONT }}>
          Every question runs through nine deterministic stages. The LLM plans; validated SQL and
          gates do the work. Click a stage to jump to it.
        </p>
      </div>
      <Stepper />
      {STAGES.map(stage => <Stage key={stage.id} stage={stage} />)}
      <div style={{ padding: '72px 64px', background: P.darkBg, textAlign: 'center', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-.02em', color: '#f8fafc',
                    fontFamily: FONT }}>
          Watch it build your first dashboard
        </h2>
        <div style={{ display: 'flex', gap: 14 }}>
          <Link to="/app" style={{ display: 'inline-flex', alignItems: 'center', height: 44,
                       padding: '0 22px', background: P.accent, color: '#fff', fontSize: 14,
                       fontWeight: 600, borderRadius: 9, fontFamily: FONT, textDecoration: 'none' }}>
            Start free
          </Link>
          <Link to="/templates" style={{ display: 'inline-flex', alignItems: 'center', height: 44,
                       padding: '0 22px', border: '1px solid rgba(255,255,255,.22)', color: P.darkText,
                       fontSize: 14, fontWeight: 600, borderRadius: 9, fontFamily: FONT,
                       textDecoration: 'none' }}>
            Browse templates
          </Link>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
