// R33S2E4-US1 (program R30–R36) — the error-page template (`Errors.dc.html`
// / ch14): eight designed states, one consistent layout — mono badge,
// title, plain-language explanation, exactly one action. Wired into the
// real 404 (NotFound) and 403 (Forbidden) surfaces; the viewer's expired
// card shares the same voice. Browse all eight at /app/__errors.
import { useNavigate } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';

export const ERROR_STATES = {
  not_found: {
    badge: '404', title: 'Page not found',
    copy: "This route doesn't exist — it may have been renamed or removed.",
    action: 'Go home', to: '/app',
  },
  forbidden: {
    badge: '403 · No access', title: 'Your role can’t view this',
    copy: 'Ask a workspace admin for access if you need this area.',
    action: 'Contact admin', to: '/app/team',
  },
  token_expired: {
    badge: 'Token expired', title: 'This share link is no longer active',
    copy: 'It expired or was revoked by its owner.',
    action: 'Request new link', to: null,
  },
  workspace_not_found: {
    badge: 'Workspace not found', title: 'This workspace is gone',
    copy: 'It was deleted, or you were removed from it.',
    action: 'Switch workspace', to: '/login',
  },
  artifact_unavailable: {
    badge: 'Artifact unavailable', title: 'This dashboard can’t be opened',
    copy: 'It was archived, or the data behind it was rolled back.',
    action: 'Open library', to: '/app/artifacts',
  },
  pipeline_failed: {
    badge: 'Pipeline failed', title: 'The build stopped safely',
    copy: 'A stage failed twice after repair. Your data was not modified.',
    action: 'Open the run', to: '/app/create/new',
  },
  connector_failed: {
    badge: 'Connector failed', title: 'A source stopped delivering',
    copy: 'Recent payloads were rejected — the schema no longer matches.',
    action: 'Open connector', to: '/app/data/sources',
  },
  access_denied: {
    badge: 'Data access denied', title: 'Nothing visible on this data',
    copy: 'A row-level security policy filters every row for your account.',
    action: 'Request access', to: '/app/team',
  },
};

export default function ErrorState({ kind = 'not_found', detail, onAction, compact }) {
  const navigate = useNavigate();
  const s = ERROR_STATES[kind] || ERROR_STATES.not_found;
  const act = () => (onAction ? onAction() : s.to && navigate(s.to));
  return (
    <div data-testid={`error-${kind}`}
         style={{ maxWidth: 480, margin: compact ? 0 : '96px auto',
                  textAlign: 'center', background: '#fff',
                  border: `1px solid ${P.border}`, borderRadius: 12,
                  padding: '32px 28px', fontFamily: FONT }}>
      <div data-testid="error-badge"
           style={{ display: 'inline-flex', alignItems: 'center', height: 22,
                    padding: '0 11px', borderRadius: 999, background: P.tableHeadBg,
                    color: P.muted, fontFamily: MONO, fontSize: 10.5,
                    fontWeight: 700, letterSpacing: '.05em' }}>
        {s.badge}
      </div>
      <div data-testid="error-title"
           style={{ fontSize: 16.5, fontWeight: 700, color: P.ink, marginTop: 12 }}>
        {s.title}
      </div>
      <div style={{ fontSize: 12.5, color: P.body, lineHeight: 1.6, marginTop: 7 }}>
        {s.copy}
      </div>
      {detail && (
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginTop: 8 }}>
          {detail}
        </div>
      )}
      <button data-testid="error-action" onClick={act}
              style={{ marginTop: 18, height: 32, padding: '0 16px', borderRadius: 8,
                       border: 'none', background: P.ink, color: '#fff', fontSize: 12.5,
                       fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
        {s.action}
      </button>
    </div>
  );
}

// internal gallery (like /app/__kit) — every state on one board
export function ErrorGallery() {
  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: P.ink, fontFamily: FONT,
                    marginBottom: 4 }}>
        Error states
      </div>
      <div style={{ fontSize: 12, color: P.muted, fontFamily: FONT, marginBottom: 16 }}>
        Eight designed states, one template — internal reference board.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {Object.keys(ERROR_STATES).map(k => <ErrorState key={k} kind={k} compact />)}
      </div>
    </div>
  );
}
