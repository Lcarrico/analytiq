// R34S2E3 — Security page (/security): header + compliance pills, sticky
// "on this page" jump nav, 8 tinted section cards. Per
// docs/specs/mockups/Marketing Security.dc.html — copy is fully specified
// there, no gaps to fill.
import { FONT, MONO, P } from '../tokens';
import MarketingNav from '../components/MarketingNav';
import MarketingFooter from '../components/MarketingFooter';

const PILLS = ['SOC 2 Type II', 'ISO 27001', 'GDPR / CCPA', 'AES-256 at rest · TLS 1.3'];

const SECTIONS = [
  { id: 'sec-llm', label: 'No raw data to LLMs', tint: P.accentSoft,
    title: 'No raw data ever reaches an LLM',
    body: 'Models see schemas, governed definitions, and aggregate result shapes — never row-level data. Answer generation runs on statistical summaries computed inside your warehouse boundary.',
    icon: (
      <>
        <path d="M8 1.5 14 4v4.2c0 3.4-2.5 5.6-6 6.3-3.5-.7-6-2.9-6-6.3V4l6-2.5Z" fill="none" stroke={P.accent} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M5.5 8h5" stroke={P.accent} strokeWidth="1.4" strokeLinecap="round" />
      </>
    ) },
  { id: 'sec-readonly', label: 'Read-only access', tint: P.greenBg,
    title: 'Read-only warehouse access',
    body: 'Connections use a dedicated read-only role you control. AnalytIQ writes gold tables only to its own isolated schema. Nothing in your source data is ever mutated.',
    icon: (
      <>
        <ellipse cx="7.5" cy="3.8" rx="5" ry="2" fill="none" stroke={P.green} strokeWidth="1.4" />
        <path d="M2.5 3.8v7.4c0 1.1 2.2 2 5 2s5-.9 5-2V3.8" fill="none" stroke={P.green} strokeWidth="1.4" />
      </>
    ) },
  { id: 'sec-gates', label: 'Validation gates', tint: P.accentSoft,
    title: 'Deterministic validation gates',
    body: 'Generated SQL must pass safety analysis (read-only, row limits, time filters); results must pass shape and contract checks. Failures repair or halt — nothing unvalidated ships to a dashboard.',
    icon: <path d="m2.5 8 3 3L12.5 4" fill="none" stroke={P.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /> },
  { id: 'sec-pii', label: 'PII detection', tint: P.amberBg,
    title: 'PII detected, masked, human-reviewed',
    body: 'Pattern and semantic detection flags likely PII on ingestion. Flagged columns are masked by default and only unmasked by an explicit steward decision — recorded in the audit log.',
    icon: (
      <>
        <path d="M1.5 7s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4Z" fill="none" stroke={P.amber} strokeWidth="1.3" />
        <path d="m3 12 9-9" stroke={P.amber} strokeWidth="1.3" strokeLinecap="round" />
      </>
    ) },
  { id: 'sec-audit', label: 'Audit logs', tint: P.purpleBg,
    title: 'Every action in the audit log',
    body: 'Builds, approvals, shares, exports, permission changes, secret rotations — queryable, filterable, exportable as CSV/JSON, and streamable to your SIEM on Enterprise.',
    icon: <path d="M2 3h11M2 7.5h11M2 12h7" stroke={P.purple} strokeWidth="1.4" strokeLinecap="round" /> },
  { id: 'sec-rls', label: 'Row-level security', tint: P.cyanBg,
    title: 'Row-level security with a simulator',
    body: 'Policies scope every query — chat, dashboards, embeds, exports. Admins preview any dashboard exactly as a given user would see it before granting access.',
    icon: (
      <>
        <rect x="1.5" y="2" width="12" height="2.4" rx="1.2" fill={P.cyan} />
        <rect x="1.5" y="6.3" width="8" height="2.4" rx="1.2" fill="none" stroke={P.cyan} strokeWidth="1.2" />
        <rect x="1.5" y="10.6" width="12" height="2.4" rx="1.2" fill="none" stroke={P.cyan} strokeWidth="1.2" />
      </>
    ) },
  { id: 'sec-tokens', label: 'Signed embed tokens', tint: P.accentSoft,
    title: 'Signed, expiring share & embed tokens',
    body: 'Every external surface is a scoped signed token: expiration, password, domain allow-list, and permission flags — revocable instantly, individually or all at once.',
    icon: (
      <>
        <circle cx="5.5" cy="7.5" r="3" fill="none" stroke={P.accent} strokeWidth="1.4" />
        <path d="M8.5 7.5H13M11 7.5v2.5" stroke={P.accent} strokeWidth="1.4" strokeLinecap="round" />
      </>
    ) },
  { id: 'sec-scope', label: 'Workspace scoping', tint: P.greenBg,
    title: 'Workspace-scoped everything',
    body: 'Artifacts, gold tables, models, and tokens live inside one workspace boundary. Cross-workspace access is off by default and always explicit.',
    icon: (
      <>
        <rect x="1.5" y="1.5" width="5.4" height="5.4" rx="1.5" fill="none" stroke={P.green} strokeWidth="1.3" />
        <rect x="8.1" y="1.5" width="5.4" height="5.4" rx="1.5" fill="none" stroke={P.green} strokeWidth="1.3" />
        <rect x="1.5" y="8.1" width="5.4" height="5.4" rx="1.5" fill="none" stroke={P.green} strokeWidth="1.3" />
        <rect x="8.1" y="8.1" width="5.4" height="5.4" rx="1.5" fill={P.green} opacity=".25" />
      </>
    ) },
];

export default function MarketingSecurity() {
  return (
    <div data-testid="marketing-security" style={{ minHeight: '100vh', background: '#fff' }}>
      <MarketingNav />

      <div style={{ padding: '56px 64px 30px', display: 'flex', flexDirection: 'column', gap: 16,
                    maxWidth: 1328, margin: '0 auto', width: '100%' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '.14em',
                      color: P.accent }}>SECURITY &amp; GOVERNANCE</span>
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 700, letterSpacing: '-.02em', color: P.ink,
                    maxWidth: 720, fontFamily: FONT }}>
          Built so your data team says yes
        </h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PILLS.map(pill => (
            <span key={pill} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 30,
                        padding: '0 13px', border: `1px solid ${P.border}`, borderRadius: 999,
                        fontFamily: MONO, fontSize: 10.5, color: P.body }}>
              <svg width="11" height="11" viewBox="0 0 12 12">
                <path d="M6 1 10.5 3v3c0 2.6-1.9 4.3-4.5 5C3.4 10.3 1.5 8.6 1.5 6V3L6 1Z" fill="none"
                      stroke={P.green} strokeWidth="1.2" />
              </svg>
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 64px 64px', maxWidth: 1328, margin: '0 auto', width: '100%',
                    display: 'grid', gridTemplateColumns: '250px 1fr', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignSelf: 'flex-start',
                      position: 'sticky', top: 24 }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: P.faint,
                        padding: '8px 12px' }}>ON THIS PAGE</span>
          {SECTIONS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} style={{ padding: '8px 12px', borderRadius: 7, fontSize: 12.5,
                        textDecoration: 'none', fontFamily: FONT,
                        ...(i === 0
                          ? { fontWeight: 600, color: P.accentHover, background: P.accentSoft }
                          : { fontWeight: 500, color: '#47516b' }) }}>
              {s.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SECTIONS.map(s => (
            <div key={s.id} id={s.id} style={{ border: `1px solid ${P.border}`, borderRadius: 12,
                        padding: '22px 26px', display: 'flex', gap: 18 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: s.tint,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 15 15">{s.icon}</svg>
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>{s.title}</span>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: P.muted, fontFamily: FONT }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
