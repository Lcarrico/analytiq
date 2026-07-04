// R15S2E4: role-aware rendering. Role resolves from the logged-in user;
// the legacy dev default (no login) is admin, matching the backend's
// header-trust behavior.
import { auth } from '../api';
import { FONT, MONO, P } from '../tokens';

export function useRole() {
  const user = auth.user();
  return (user && user.role) || 'admin';
}

export const ADMIN_ROLES = ['admin'];
export const ANALYST_ROLES = ['admin', 'analyst'];

export function AdminOnly({ children, label = 'Administrator access required' }) {
  const role = useRole();
  if (ADMIN_ROLES.includes(role)) {
    return (
      <div data-testid="admin-only-block"
           style={{ border: `1px solid ${P.darkBorder}`, borderRadius: 10,
                    background: P.darkBg, padding: 14, color: P.darkText }}>
        <div style={{ fontSize: 10, fontFamily: MONO, textTransform: 'uppercase',
                      letterSpacing: '.05em', color: P.darkMuted, marginBottom: 8 }}>
          admin only
        </div>
        {children}
      </div>
    );
  }
  return (
    <div data-testid="admin-only-notice"
         style={{ border: `1px dashed ${P.borderStrong}`, borderRadius: 10,
                  padding: 16, fontSize: 12, fontFamily: FONT, color: P.muted }}>
      {label}
    </div>
  );
}

export function Forbidden() {
  return (
    <div data-testid="forbidden-page" style={{ maxWidth: 520, margin: '96px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 44, fontWeight: 700, fontFamily: MONO, color: P.ink }}>403</div>
      <div style={{ fontSize: 14, fontFamily: FONT, color: P.body, margin: '8px 0 4px' }}>
        You don't have access to this area.
      </div>
      <div style={{ fontSize: 12, fontFamily: FONT, color: P.muted }}>
        Ask a workspace admin to raise your role if you need it.
      </div>
    </div>
  );
}
