// R19S1E1: branded public viewer — slim header (logo, title, freshness,
// expiry note), iframe'd artifact, powered-by footer. No app shell.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';

export default function PublicViewer() {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    fetch(`/api/public/${token}/meta`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setMeta)
      .catch(s => setErr(s === 410 ? 'expired' : 'unknown'));
  }, [token]);

  if (err) {
    return (
      <div data-testid="viewer-error" style={{ maxWidth: 480, margin: '120px auto',
                                               textAlign: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: 34, fontFamily: MONO, fontWeight: 700, color: P.ink }}>
          {err === 'expired' ? '410' : '404'}
        </div>
        <div style={{ fontSize: 14, color: P.body, marginTop: 8 }}>
          {err === 'expired' ? 'This share link has expired.' : 'This link is not valid.'}
        </div>
      </div>
    );
  }
  return (
    <div data-testid="public-viewer" style={{ minHeight: '100vh', background: P.bg,
                                              display: 'flex', flexDirection: 'column' }}>
      <header style={{ height: 52, background: '#fff', borderBottom: `1px solid ${P.border}`,
                       display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: '#0f172a' }} />
        <span style={{ fontWeight: 700, fontSize: 14, fontFamily: FONT, color: P.ink }}>
          Analyt<span style={{ color: P.accent }}>IQ</span>
        </span>
        <span data-testid="viewer-title"
              style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT, color: P.body }}>
          {meta?.title || '…'}
        </span>
        {meta && (
          <span data-testid="freshness-badge"
                style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, fontWeight: 600,
                         textTransform: 'uppercase', color: P.amber, background: P.amberBg,
                         borderRadius: 10, padding: '3px 8px' }}>
            data {meta.freshness_hours ?? 0}h old
          </span>
        )}
        <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>read-only</span>
      </header>
      <iframe data-testid="viewer-frame" title="artifact" src={`/api/public/${token}`}
              style={{ flex: 1, border: 'none', width: '100%' }} />
      <footer style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                       fontFamily: MONO, fontSize: 10, color: P.faint,
                       borderTop: `1px solid ${P.border}`, background: '#fff' }}>
        Powered by AnalytIQ
      </footer>
    </div>
  );
}
