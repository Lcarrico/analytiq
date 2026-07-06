// R15S2E4: role-aware rendering. Role resolves from the logged-in user;
import ErrorState from './ErrorState';
import { useEffect, useState } from 'react';
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

// R36S3E2: technical detail is toggle-gated app-wide (Settings →
// Preferences). Admins default on; non-admins never see the blocks.
export function useTechDetail() {
  const [on, setOn] = useState(localStorage.getItem('aiq_tech_detail') !== 'off');
  useEffect(() => {
    const sync = () => setOn(localStorage.getItem('aiq_tech_detail') !== 'off');
    window.addEventListener('aiq-prefs', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('aiq-prefs', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return on;
}

export function AdminOnly({ children, label = 'Administrator access required' }) {
  const role = useRole();
  const detail = useTechDetail();
  if (ADMIN_ROLES.includes(role) && !detail) {
    return (
      <div data-testid="admin-only-notice"
           style={{ border: `1px dashed ${P.borderStrong}`, borderRadius: 10,
                    padding: 16, fontSize: 12, fontFamily: FONT, color: P.muted }}>
        Technical detail is off — enable it in Settings → Preferences.
      </div>
    );
  }
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
  // R33S2E4: renders the shared error template (403 badge text preserved)
  return (
    <div data-testid="forbidden-page">
      <ErrorState kind="forbidden" />
    </div>
  );
}
