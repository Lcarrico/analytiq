// R34S2E4 — Docs page (/docs): standalone slim docs nav (58px, distinct from
// MarketingNav), 3-col layout (nav tree · Quickstart article · "on this page"
// rail). Per docs/specs/mockups/Marketing Docs.dc.html. Only the Quickstart
// article has real content in the mockup; other nav-tree topics render as
// inactive placeholders, following App.jsx's PLACEHOLDERS precedent, rather
// than fabricating articles the mockup never wrote.
import { Link } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';
import { Logo } from '../components/icons';

const NAV_TREE = [
  ['GET STARTED', [
    ['Quickstart', true],
    ['Connect Snowflake', false],
    ['Upload CSV / XLSX', false],
    ['Build your first dashboard', false],
    ['Share a dashboard', false],
  ]],
  ['CONCEPTS', [
    ['Health scores', false],
    ['Semantic layer', false],
    ['Gold tables & contracts', false],
    ['Predictive model basics', false],
  ]],
  ['ADMINISTRATION', [
    ['Roles & permissions', false],
    ['Security guide', false],
    ['Tokens & billing', false],
  ]],
];

const ON_THIS_PAGE = [
  ['d-connect', 'Pick your data'],
  ['d-ask', 'Ask a question'],
  ['d-approve', 'Approve the plan'],
  ['d-share', 'Refine and share'],
];

function DocsNav() {
  return (
    <div style={{ height: 58, display: 'flex', alignItems: 'center', gap: 20, padding: '0 32px',
                  borderBottom: `1px solid ${P.border}` }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <Logo size={22} withWordmark={false} />
        <span style={{ fontSize: 14.5, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
          Analyt<span style={{ color: P.accent }}>IQ</span>{' '}
          <span style={{ fontWeight: 500, color: P.faint }}>Docs</span>
        </span>
      </Link>
      <div style={{ width: 380, height: 34, display: 'flex', alignItems: 'center', gap: 9,
                    padding: '0 13px', border: `1px solid ${P.borderStrong}`, borderRadius: 8,
                    color: P.faint, fontSize: 12.5, fontFamily: FONT }}>
        <svg width="12" height="12" viewBox="0 0 13 13">
          <circle cx="5.5" cy="5.5" r="4" fill="none" stroke={P.faint} strokeWidth="1.4" />
          <path d="m8.5 8.5 3 3" stroke={P.faint} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Search docs…
        <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, border: `1px solid ${P.border}`,
                      borderRadius: 5, padding: '1px 6px' }}>⌘K</span>
      </div>
      <div style={{ flex: 1 }} />
      <Link to="/" style={{ fontSize: 13, fontWeight: 500, color: '#47516b', fontFamily: FONT,
                   textDecoration: 'none' }}>
        analytiq.app ↗
      </Link>
      <Link to="/app" style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 15px',
                   background: P.accent, color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 8,
                   fontFamily: FONT, textDecoration: 'none' }}>
        Start free
      </Link>
    </div>
  );
}

function NavTree() {
  return (
    <div style={{ borderRight: `1px solid ${P.border}`, padding: '24px 18px', display: 'flex',
                  flexDirection: 'column', gap: 2, background: '#fbfcfd' }}>
      {NAV_TREE.map(([heading, items]) => (
        <div key={heading} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: P.faint,
                        padding: '14px 12px 6px' }}>{heading}</span>
          {items.map(([label, active]) => (
            <span key={label} style={{ padding: '7px 12px', borderRadius: 7, fontSize: 12.5,
                        fontFamily: FONT,
                        ...(active
                          ? { background: '#e8effc', color: P.accentHover, fontWeight: 600 }
                          : { color: P.faint, cursor: 'default' }) }}>
              {label}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function OnThisPage() {
  return (
    <div style={{ borderLeft: `1px solid ${P.border}`, padding: '36px 22px', display: 'flex',
                  flexDirection: 'column', gap: 8, alignSelf: 'flex-start' }}>
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', color: P.faint }}>
        ON THIS PAGE
      </span>
      {ON_THIS_PAGE.map(([id, label], i) => (
        <a key={id} href={`#${id}`} style={{ fontSize: 12, textDecoration: 'none', paddingLeft: 10,
                    fontFamily: FONT,
                    ...(i === 0
                      ? { color: P.accentHover, fontWeight: 600, borderLeft: `2px solid ${P.accent}` }
                      : { color: P.muted, borderLeft: '2px solid transparent' }) }}>
          {label}
        </a>
      ))}
    </div>
  );
}

export default function MarketingDocs() {
  return (
    <div data-testid="marketing-docs" style={{ minHeight: '100vh', background: '#fff' }}>
      <DocsNav />
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 220px' }}>
        <NavTree />

        <div style={{ padding: '36px 56px', display: 'flex', flexDirection: 'column', gap: 18,
                      maxWidth: 820 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>DOCS / GET STARTED / QUICKSTART</span>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-.02em', color: P.ink,
                      fontFamily: FONT }}>
            Quickstart: question → dashboard in 4 minutes
          </h1>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: P.body, fontFamily: FONT }}>
            This guide walks the whole loop once: connect data, ask a question, approve a plan, and
            share the result. You'll use the sample retail dataset — nothing to configure.
          </p>

          <h2 id="d-connect" style={{ margin: '14px 0 0', fontSize: 19, fontWeight: 600, color: P.ink,
                    fontFamily: FONT }}>1 · Pick your data</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: P.body, fontFamily: FONT }}>
            On first run, choose <strong style={{ fontWeight: 600 }}>Use sample data</strong>. AnalytIQ
            profiles the tables and shows a health preview — row counts, null rates, PII flags — before
            anything is analyzed.
          </p>
          <div style={{ background: P.darkBg, borderRadius: 10, padding: '14px 16px', fontFamily: MONO,
                      fontSize: 11, lineHeight: 1.75, color: '#93c5fd' }}>
            ✓ 8 tables profiled · health 94/100<br />
            ✓ 2 PII columns masked pending review<br />
            → safe to analyze
          </div>

          <h2 id="d-ask" style={{ margin: '14px 0 0', fontSize: 19, fontWeight: 600, color: P.ink,
                    fontFamily: FONT }}>2 · Ask a question</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: P.body, fontFamily: FONT }}>
            Type into the Create workbench:{' '}
            <span style={{ fontFamily: MONO, fontSize: 12.5, background: P.grayBg, borderRadius: 5,
                        padding: '2px 7px' }}>
              Which locations will miss their Q3 revenue target?
            </span>{' '}
            If the agent needs a definition (what counts as "miss"?), it asks once, with tappable options.
          </p>

          <h2 id="d-approve" style={{ margin: '14px 0 0', fontSize: 19, fontWeight: 600, color: P.ink,
                    fontFamily: FONT }}>3 · Approve the plan</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: P.body, fontFamily: FONT }}>
            Review goal, metrics, sources, and access limits in the plan card, then hit{' '}
            <strong style={{ fontWeight: 600 }}>Approve &amp; Build</strong>. The nine-stage pipeline
            streams progress — every gate visible.
          </p>
          <div style={{ border: `1px solid ${P.amberBorder}`, background: P.amberBg, borderRadius: 10,
                      padding: '12px 16px', display: 'flex', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 15 15" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M7.5 2 14 13H1L7.5 2Z" fill="none" stroke={P.amber} strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M7.5 6.2v3M7.5 11v.1" stroke={P.amber} strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, lineHeight: 1.6, color: P.amberDark, fontFamily: FONT }}>
              <strong style={{ fontWeight: 600 }}>Note:</strong> masked PII columns are excluded
              automatically. Results are unaffected unless the question needs those fields — then a
              steward is pinged.
            </span>
          </div>

          <h2 id="d-share" style={{ margin: '14px 0 0', fontSize: 19, fontWeight: 600, color: P.ink,
                    fontFamily: FONT }}>4 · Refine and share</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: P.body, fontFamily: FONT }}>
            Ask follow-ups in chat, edit sections directly on the canvas, then{' '}
            <strong style={{ fontWeight: 600 }}>Share</strong> — workspace access or a signed public
            link with expiration and password.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Link to="/app/create/new" style={{ display: 'inline-flex', alignItems: 'center', height: 38,
                        padding: '0 16px', background: P.accent, borderRadius: 8, color: '#fff',
                        fontSize: 13, fontWeight: 600, fontFamily: FONT, textDecoration: 'none' }}>
              Open the workbench
            </Link>
            <Link to="/security" style={{ display: 'inline-flex', alignItems: 'center', height: 38,
                        padding: '0 15px', border: `1px solid ${P.borderStrong}`, borderRadius: 8,
                        color: P.ink, fontSize: 13, fontWeight: 600, fontFamily: FONT,
                        textDecoration: 'none' }}>
              Security model
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${P.borderRow}`,
                      paddingTop: 16, marginTop: 10 }}>
            <span style={{ fontSize: 12.5, color: P.faint, fontFamily: FONT }}>
              Was this helpful?{' '}
              <span style={{ color: P.accent, fontWeight: 600, cursor: 'pointer' }}>Yes</span> ·{' '}
              <span style={{ color: P.accent, fontWeight: 600, cursor: 'pointer' }}>No</span>
            </span>
            <span style={{ fontSize: 12.5, color: P.accent, fontWeight: 600, cursor: 'default',
                        fontFamily: FONT }}>
              Next: Connect Snowflake →
            </span>
          </div>
        </div>

        <OnThisPage />
      </div>
    </div>
  );
}
