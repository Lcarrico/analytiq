// R34S1E1 — shared marketing nav (64px): Logo + 6 links + Log in / Start free.
// Reused by every "full" marketing page (Landing/Product/Pricing/Solutions/
// Templates/Security). Docs has its own distinct 58px nav (R34S2E4) — see
// docs/specs/mockups/Marketing Docs.dc.html — so it is not a variant of this
// component. Mockup ref: docs/specs/mockups/Marketing Landing.dc.html lines 28-46.
import { Link, useLocation } from 'react-router-dom';
import { FONT, P } from '../tokens';
import { Logo } from './icons';

const LINKS = [
  ['Product', '/product'],
  ['Solutions', '/solutions/executives'],
  ['Templates', '/templates'],
  ['Pricing', '/pricing'],
  ['Security', '/security'],
  ['Docs', '/docs'],
];

export default function MarketingNav() {
  const { pathname } = useLocation();
  return (
    <div data-testid="marketing-nav"
         style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 40px', borderBottom: `1px solid ${P.border}`, background: '#fff' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <Logo size={24} />
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 13.5, fontWeight: 500,
                    color: '#47516b', fontFamily: FONT }}>
        {LINKS.map(([label, to]) => {
          const active = pathname === to || (to === '/solutions/executives' && pathname.startsWith('/solutions'));
          const testId = `nav-${label.toLowerCase()}`;
          return active ? (
            <span key={label} data-testid={testId} style={{ color: '#0f172a', fontWeight: 600 }}>{label}</span>
          ) : (
            <Link key={label} to={to} data-testid={testId} style={{ color: 'inherit', textDecoration: 'none' }}>
              {label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link to="/login" data-testid="nav-login"
              style={{ fontSize: 13.5, fontWeight: 500, color: '#47516b', fontFamily: FONT,
                       textDecoration: 'none' }}>
          Log in
        </Link>
        <Link to="/app" data-testid="start-free"
              style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 16px',
                       background: P.accent, color: '#fff', fontSize: 13.5, fontWeight: 600,
                       borderRadius: 8, fontFamily: FONT, textDecoration: 'none' }}>
          Start free
        </Link>
      </div>
    </div>
  );
}
