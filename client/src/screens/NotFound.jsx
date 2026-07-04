// R15S1E1: 404 per the Errors board — mono route, back-to-home CTA.
import { Link, useLocation } from 'react-router-dom';
import { C, FONT, MONO } from '../tokens';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div data-testid="notfound-page" style={{ maxWidth: 520, margin: '96px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 44, fontWeight: 700, fontFamily: MONO, color: C.text }}>404</div>
      <div style={{ fontSize: 15, fontFamily: FONT, color: C.textSec, margin: '8px 0 4px' }}>
        This page doesn't exist.
      </div>
      <div style={{ fontSize: 12, fontFamily: MONO, color: C.textTer, marginBottom: 20 }}>{pathname}</div>
      <Link to="/app" style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: '#2563eb' }}>
        ← Back to home
      </Link>
    </div>
  );
}
