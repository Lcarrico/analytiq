// R34S1E1 — shared dark 5-column marketing footer + legal bar. The mockup set
// only draws this once (Marketing Landing.dc.html lines 250-297); per the R34
// plan it's treated as common site chrome and rendered on all 7 marketing pages.
import { Link } from 'react-router-dom';
import { FONT, MONO } from '../tokens';
import { Logo } from './icons';

const COLUMNS = [
  ['PRODUCT', [
    ['How it works', '/product'],
    ['Templates', '/templates'],
    ['Pricing', '/pricing'],
    ['Create Workbench', '/app/create/new'],
  ]],
  ['SOLUTIONS', [
    ['For executives', '/solutions/executives'],
    ['For data teams', '/solutions/data-teams'],
    ['For finance', '/solutions/finance'],
    ['For operations', '/solutions/operations'],
  ]],
  ['RESOURCES', [
    ['Documentation', '/docs'],
    ['Quickstart', '/docs'],
    ['Security', '/security'],
    ['Changelog', '/docs'],
  ]],
  ['COMPANY', [
    ['About', '#'],
    ['Careers', '#'],
    ['Contact', '#'],
    ['Legal', '#'],
  ]],
];

export default function MarketingFooter() {
  return (
    <div data-testid="marketing-footer" style={{ background: '#0b1220', padding: '56px 64px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Logo size={22} dark markFill="#1e293b" iqColor="#60a5fa" />
            <p style={{ margin: 0, fontSize: 12.5, fontFamily: FONT, color: '#64748b', maxWidth: 220 }}>
              The conversational analytics workbench. Ask, watch it build, share the artifact.
            </p>
          </div>
          {COLUMNS.map(([heading, links]) => (
            <div key={heading} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '.08em',
                             color: '#475569' }}>
                {heading}
              </span>
              {links.map(([label, to]) => (
                <Link key={label} to={to}
                      style={{ fontSize: 13, fontFamily: FONT, color: '#94a3b8', textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: 44, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.08)',
                      fontFamily: MONO, fontSize: 11, color: '#475569' }}>
          <span>© 2026 AnalytIQ, Inc.</span>
          <span>SOC 2 Type II · GDPR · ISO 27001</span>
        </div>
      </div>
    </div>
  );
}
