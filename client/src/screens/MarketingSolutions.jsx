// R34S2E1 — Solutions template (/solutions/:persona), one shared template
// covering 6 persona routes. Per docs/specs/mockups/Marketing Solutions.dc.html
// (only the "Executives" tab is fully specified there — the other 5 personas'
// copy below is extrapolated to match its structure/tone, per plan sign-off).
import { Link, useParams } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';

const PERSONAS = [
  {
    slug: 'executives', tab: 'Executives', eyebrow: 'FOR EXECUTIVES',
    headline: 'Answers before the meeting, not after the sprint',
    sub: "Ask the question you'd ask your analyst. Get a governed dashboard with a forecast and a plain-English narrative — in minutes, with an audit trail your data team trusts.",
    digestTitle: 'Monday 8am digest',
    digest: [
      'Q3 tracks at ', ['mono', '$4.82M'], ' (−6.2% vs target). Gap concentrates in ',
      ['red', 'Northeast'], '; West over-delivers ', ['green', '+3.9%'],
      '. Reallocating promo spend could close ≈40% of the gap.',
    ],
    pills: ['GOVERNED', 'MAPE 4.1%'],
    starting: [
      ['Exec Weekly Revenue', 'Trend + forecast + one narrative paragraph.'],
      ['Board Pack KPIs', 'The 8 numbers the board asks about, always fresh.'],
      ['Risk & Exceptions Brief', "What broke, what's drifting, who owns it."],
    ],
    quote: "I stopped asking for decks. I ask AnalytIQ on Sunday night and walk into Monday's exec meeting with the answer — and the receipts.",
    initials: 'RM', name: 'Rosa Martínez', role: 'COO · national retail chain',
  },
  {
    slug: 'data-teams', tab: 'Data teams', eyebrow: 'FOR DATA TEAMS',
    headline: 'Answer the fifth follow-up question without opening a ticket',
    sub: 'Business users ask in plain English against your governed semantic layer — the same metrics, the same joins, the same PII rules you already enforce. Every query is inspectable SQL.',
    digestTitle: 'Weekly governance digest',
    digest: [
      'Ingest scanned ', ['mono', '128 columns'], ' · ', ['green', '2 PII columns'],
      ' masked automatically. ', ['red', '1 join blocked'],
      ' pending steward review — no query touched the warehouse until it cleared.',
    ],
    pills: ['0 RAW ROWS TO LLM', 'READ-ONLY'],
    starting: [
      ['Semantic Layer Health', 'Coverage, staleness, and definition conflicts at a glance.'],
      ['Query Audit Trail', 'Every generated query, who asked, what ran.'],
      ['Definition Review Queue', 'Low-confidence metrics, ranked by evidence.'],
    ],
    quote: "We stopped being the bottleneck. Every 'quick question' used to cost us an hour; now it's self-service against definitions we already reviewed.",
    initials: 'PS', name: 'Priya Shah', role: 'Head of Data Platform · mid-market SaaS',
  },
  {
    slug: 'operations', tab: 'Operations', eyebrow: 'FOR OPERATIONS',
    headline: "Know what's drifting before it's a fire drill",
    sub: 'Monitor every site, line, and SKU against baseline automatically — get one alert when something moves out of tolerance, not a dashboard you have to remember to check.',
    digestTitle: 'Operations watch digest',
    digest: [
      ['mono', '3 sites'], ' drifting outside tolerance this week, led by ',
      ['red', 'Plant 4'], ' (−11% throughput). ', ['green', '39 sites'],
      ' tracking within band — no action needed.',
    ],
    pills: ['ANOMALY WATCH', '3 FLAGGED'],
    starting: [
      ['Operational Risk Monitor', 'Heatmap of drift across sites and lines.'],
      ['Anomaly Watchlist', 'Baseline-aware spikes on any metric.'],
      ['SLA Breach Tracker', 'Which shipments or tickets will miss SLA next.'],
    ],
    quote: "We used to find out about a line going sideways from a customer complaint. Now we get the ping before it's a headline.",
    initials: 'DK', name: 'Devon Kim', role: 'VP Operations · consumer logistics',
  },
  {
    slug: 'finance', tab: 'Finance', eyebrow: 'FOR FINANCE',
    headline: 'Close the gap between the forecast and the fire drill',
    sub: "Reconcile variance, track margin drivers, and get a forecast that's backtested and leakage-checked — not a spreadsheet built the night before the board meeting.",
    digestTitle: 'Monthly close digest',
    digest: [
      'Gross margin tracks ', ['mono', '38.4%'], ', down ', ['red', '1.2pt'],
      ' vs plan — driven by 3 SKUs and 2 suppliers. Forecast reconciles to GL within ',
      ['green', '0.3%'], '.',
    ],
    pills: ['RECONCILED', 'MAPE 3.8%'],
    starting: [
      ['Revenue Forecast', 'Where revenue lands this quarter, and why.'],
      ['Margin Variance', 'SKU and supplier drivers of gross margin leaks.'],
      ['Budget vs Actuals', 'Every line, reconciled to the GL automatically.'],
    ],
    quote: "The forecast used to be a debate about whose spreadsheet was right. Now it's one governed number, and everyone starts from the same place.",
    initials: 'AT', name: 'Ana Torres', role: 'VP Finance · specialty retail',
  },
  {
    slug: 'sales', tab: 'Sales', eyebrow: 'FOR SALES',
    headline: 'Real pipeline coverage, not a hopeful roll-up',
    sub: "See which deals are actually moving, which are stale, and whether this quarter's coverage number would survive an audit — updated automatically, not the night before forecast call.",
    digestTitle: 'Pipeline digest',
    digest: [
      'Coverage sits at ', ['mono', '2.1x'], ', but ', ['red', '$1.4M'],
      ' is stale (no activity 21+ days). Adjusted coverage: ', ['green', '1.6x'], '.',
    ],
    pills: ['STALE-DEAL FLAGGED', 'AUTO-REFRESHED'],
    starting: [
      ['Sales Pipeline Health', 'Coverage, stage velocity, stale-deal flags.'],
      ['Rep Performance', 'Quota attainment and trend, one view per rep.'],
      ['Deal Velocity', 'How long deals actually sit in each stage.'],
    ],
    quote: "Forecast call used to start with an argument about the number. Now it starts with what we're going to do about it.",
    initials: 'JM', name: 'Jordan Meyers', role: 'VP Sales · B2B software',
  },
  {
    slug: 'customer-success', tab: 'Customer success', eyebrow: 'FOR CUSTOMER SUCCESS',
    headline: 'See the churn risk before the renewal call',
    sub: 'Score every account by real usage and support signals, not a gut feeling — and get the one narrative sentence you need before you pick up the phone.',
    digestTitle: 'Renewal risk digest',
    digest: [
      ['mono', '12 accounts'], ' crossed into ', ['red', 'high churn risk'],
      ' this week, mostly driven by usage decline. ', ['green', '3 expansion'],
      ' candidates identified from the same signal set.',
    ],
    pills: ['SCORED WEEKLY', 'USAGE + SUPPORT'],
    starting: [
      ['Customer Churn Risk', 'Score accounts by 60-day churn probability.'],
      ['Account Health Score', 'Usage, support, and sentiment in one number.'],
      ['Expansion Opportunity Finder', 'Accounts showing real expansion signal.'],
    ],
    quote: "I used to walk into renewal calls guessing. Now I know which accounts need a save plan a month before the call, not during it.",
    initials: 'LC', name: 'Lena Choi', role: 'Director of Customer Success · vertical SaaS',
  },
];

function DigestSpan({ part }) {
  if (typeof part === 'string') return part;
  const [kind, text] = part;
  const color = kind === 'mono' ? '#f1f5f9' : kind === 'red' ? '#f87171' : '#4ade80';
  return <span style={kind === 'mono' ? { fontFamily: MONO, color } : { color }}>{text}</span>;
}

function DigestCard({ persona }) {
  return (
    <div style={{ background: P.darkBg, borderRadius: 14, padding: 20, display: 'flex',
                  flexDirection: 'column', gap: 11, boxShadow: '0 20px 50px rgba(2,6,23,.35)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: P.darkText, fontFamily: FONT }}>
          {persona.digestTitle}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: P.muted }}>auto-generated</span>
      </div>
      <span style={{ fontSize: 12.5, lineHeight: 1.65, color: P.darkMuted, fontFamily: FONT }}>
        {persona.digest.map((part, i) => <DigestSpan key={i} part={part} />)}
      </span>
      <svg viewBox="0 0 440 84" style={{ width: '100%', height: 84 }}>
        <polyline points="0,62 40,56 80,60 120,48 160,52 200,42 240,46 270,38" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
        <polyline points="270,38 310,40 350,46 390,42 440,50" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="6 5" />
        <polyline points="0,54 110,46 220,36 330,28 440,22" fill="none" stroke="#64748b" strokeWidth="1.6" strokeDasharray="4 5" />
        <line x1="270" y1="12" x2="270" y2="74" stroke="rgba(255,255,255,.15)" strokeDasharray="3 4" />
      </svg>
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ display: 'inline-flex', height: 20, padding: '0 9px', borderRadius: 999,
                      background: 'rgba(74,222,128,.12)', color: P.codeGreen, fontFamily: MONO,
                      fontSize: 8.5, fontWeight: 600, alignItems: 'center',
                      border: '1px solid rgba(74,222,128,.25)' }}>{persona.pills[0]}</span>
        <span style={{ display: 'inline-flex', height: 20, padding: '0 9px', borderRadius: 999,
                      background: 'rgba(96,165,250,.12)', color: P.darkAccent, fontFamily: MONO,
                      fontSize: 8.5, fontWeight: 600, alignItems: 'center',
                      border: '1px solid rgba(96,165,250,.25)' }}>{persona.pills[1]}</span>
      </div>
    </div>
  );
}

const FEATURE_CALLOUTS = [
  { title: 'Present mode', tint: P.accentSoft,
    body: 'Full-screen sections with auto-generated speaker notes.',
    icon: <path d="M3 2.2v7.6L10 6 3 2.2Z" fill={P.accent} /> },
  { title: 'Alerts that matter', tint: P.redBg,
    body: 'One Slack ping when a region drifts off target — not fifty.',
    icon: <path d="M7.5 2a4 4 0 0 1 4 4v2.5l1 2H2.5l1-2V6a4 4 0 0 1 4-4Z" fill="none" stroke={P.red} strokeWidth="1.4" strokeLinejoin="round" /> },
  { title: 'Numbers that reconcile', tint: P.greenBg,
    body: 'Every figure traces to one governed definition. No dueling decks.',
    icon: <path d="M7.5 1.5 12.5 3.5v3.7c0 3-2.1 4.8-5 5.8-2.9-1-5-2.8-5-5.8V3.5l5-2Z" fill="none" stroke={P.green} strokeWidth="1.4" strokeLinejoin="round" /> },
];

export default function MarketingSolutions() {
  const { persona: personaSlug } = useParams();
  const persona = PERSONAS.find(p => p.slug === personaSlug) || PERSONAS[0];

  return (
    <div data-testid="marketing-solutions" style={{ minHeight: '100vh', background: '#fff' }}>
      <MarketingNav />

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '22px 40px 0' }}>
        {PERSONAS.map(p => (
          <Link key={p.slug} to={`/solutions/${p.slug}`} data-testid={`persona-tab-${p.slug}`} style={{
            display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 15px', borderRadius: 999,
            fontSize: 12.5, textDecoration: 'none', fontFamily: FONT,
            ...(p.slug === persona.slug
              ? { background: P.ink, color: '#fff', fontWeight: 600 }
              : { border: `1px solid ${P.borderStrong}`, color: '#47516b', fontWeight: 500 }),
          }}>
            {p.tab}
          </Link>
        ))}
      </div>

      <div style={{ padding: '52px 64px 60px', display: 'grid', gridTemplateColumns: '1.05fr .95fr',
                    gap: 56, alignItems: 'center', maxWidth: 1328, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '.14em',
                        color: P.accent }}>{persona.eyebrow}</span>
          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.12,
                      color: P.ink, fontFamily: FONT }}>{persona.headline}</h1>
          <p style={{ margin: 0, maxWidth: 480, fontSize: 15, lineHeight: 1.65, color: P.muted,
                     fontFamily: FONT }}>{persona.sub}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <Link to="/app" style={{ display: 'inline-flex', alignItems: 'center', height: 42,
                        padding: '0 20px', background: P.accent, borderRadius: 9, color: '#fff',
                        fontSize: 13.5, fontWeight: 600, fontFamily: FONT, textDecoration: 'none' }}>
              Start free
            </Link>
            <Link to="/product" style={{ display: 'inline-flex', alignItems: 'center', height: 42,
                        padding: '0 19px', border: `1px solid ${P.borderStrong}`, borderRadius: 9,
                        color: P.ink, fontSize: 13.5, fontWeight: 600, fontFamily: FONT,
                        textDecoration: 'none' }}>
              See present mode
            </Link>
          </div>
        </div>
        <DigestCard persona={persona} />
      </div>

      <div style={{ padding: '0 64px 56px', maxWidth: 1328, margin: '0 auto', display: 'flex',
                    flexDirection: 'column', gap: 20 }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '.12em',
                      color: P.faint }}>STARTING POINTS FOR {persona.tab.toUpperCase()}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
          {persona.starting.map(([title, body]) => (
            <Link key={title} to="/templates" style={{ textDecoration: 'none', border: `1px solid ${P.border}`,
                        borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: P.bg, borderBottom: `1px solid ${P.borderRow}`, padding: 14 }}>
                <svg viewBox="0 0 360 66" style={{ width: '100%', height: 66 }}>
                  <polygon points="0,58 0,44 60,40 120,46 180,32 240,36 240,58" fill="rgba(37,99,235,.09)" />
                  <polyline points="0,44 60,40 120,46 180,32 240,36" fill="none" stroke={P.accent} strokeWidth="2" />
                  <polyline points="240,36 300,30 360,34" fill="none" stroke={P.accent} strokeWidth="2" strokeDasharray="5 4" />
                  <line x1="240" y1="10" x2="240" y2="58" stroke={P.grayBar} strokeDasharray="3 4" />
                </svg>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: P.ink, fontFamily: FONT }}>{title}</span>
                <span style={{ fontSize: 12, lineHeight: 1.5, color: P.muted, fontFamily: FONT }}>{body}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ padding: '56px 64px', background: P.darkBg }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: 22, color: P.accent }}>"</span>
          <p style={{ margin: 0, fontSize: 21, lineHeight: 1.55, fontWeight: 500, color: P.darkText,
                     fontFamily: FONT }}>{persona.quote}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: P.purple, color: '#fff',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                          fontWeight: 700, fontFamily: FONT }}>{persona.initials}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', fontFamily: FONT }}>{persona.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.muted }}>{persona.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '56px 64px', maxWidth: 1328, margin: '0 auto', display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
        {FEATURE_CALLOUTS.map(c => (
          <div key={c.title} style={{ display: 'flex', flexDirection: 'column', gap: 9,
                      border: `1px solid ${P.border}`, borderRadius: 12, padding: 20 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: c.tint,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 15 15">{c.icon}</svg>
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>{c.title}</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: P.muted, fontFamily: FONT }}>{c.body}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '60px 64px', background: P.bg, borderTop: `1px solid ${P.border}`,
                    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', color: P.ink,
                    fontFamily: FONT }}>
          Bring one real question. That's the demo.
        </h2>
        <div style={{ display: 'flex', gap: 13 }}>
          <Link to="/app" style={{ display: 'inline-flex', alignItems: 'center', height: 44,
                       padding: '0 22px', background: P.accent, borderRadius: 9, color: '#fff',
                       fontSize: 14, fontWeight: 600, fontFamily: FONT, textDecoration: 'none' }}>
            Start free
          </Link>
          <a href="#solutions" style={{ display: 'inline-flex', alignItems: 'center', height: 44,
                     padding: '0 21px', border: `1px solid ${P.borderStrong}`, borderRadius: 9,
                     color: P.ink, fontSize: 14, fontWeight: 600, fontFamily: FONT,
                     textDecoration: 'none' }}>
            Book a demo
          </a>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
