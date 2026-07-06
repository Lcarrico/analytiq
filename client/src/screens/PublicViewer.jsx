// R33S2E1-US1 (program R30–R36) — branded public viewer (`Artifact
// Sharing.dc.html` frames 01–02 / ch14): workspace-brand bar, expiry note
// + owner mailto, viewer filter bar (range slicing is real, client-side
// over the token-gated public chart data; regional slicing owned by R35),
// KPI grid + recent-actuals bars above the artifact frame, Powered-by
// footer, and the designed expired-token card. No app shell.
// (Upgrades the R19S1E1 viewer — its testids are preserved.)
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';

const label = { fontFamily: MONO, fontSize: 9, fontWeight: 700,
                letterSpacing: '.07em', color: P.muted };

function BrandBar({ brand }) {
  const name = brand?.logo_text || 'AnalytIQ';
  const color = brand?.primary_color || P.accent;
  return (
    <div data-testid="viewer-brand"
         style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 24, height: 24, borderRadius: 6, background: color,
                     color: '#fff', display: 'inline-flex', alignItems: 'center',
                     justifyContent: 'center', fontFamily: FONT, fontSize: 10.5,
                     fontWeight: 700 }}>
        {name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
      </span>
      <span style={{ fontWeight: 700, fontSize: 14, fontFamily: FONT, color: P.ink }}>
        {name}
      </span>
    </div>
  );
}

export default function PublicViewer() {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);
  const [brand, setBrand] = useState(null);
  const [chart, setChart] = useState(null);
  const [err, setErr] = useState(null);
  const [range, setRange] = useState('30');

  useEffect(() => {
    fetch(`/api/public/${token}/meta`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setMeta)
      .catch(s => setErr(s === 410 ? 'expired' : 'unknown'));
    fetch('/api/branding').then(r => r.json()).then(setBrand).catch(() => {});
    fetch(`/api/public/${token}/chart`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setChart)
      .catch(() => {});
  }, [token]);

  const expired = err === 'expired'
    || (meta?.expires_at && meta.expires_at.replace(' ', 'T') <= new Date().toISOString());

  const view = useMemo(() => {
    const rows = chart?.rows || [];
    const actuals = rows.filter(r => !r.is_forecast);
    const windowed = range === 'all' ? actuals : actuals.slice(-Number(range));
    const avg = windowed.length
      ? Math.round(windowed.reduce((s, r) => s + (r.actual || 0), 0) / windowed.length)
      : 0;
    return { windowed, avg, recent: actuals.slice(-7) };
  }, [chart, range]);

  if (err === 'unknown') {
    return (
      <div data-testid="viewer-error"
           style={{ maxWidth: 480, margin: '120px auto', textAlign: 'center',
                    fontFamily: FONT }}>
        <div style={{ fontSize: 34, fontFamily: MONO, fontWeight: 700, color: P.ink }}>
          404
        </div>
        <div style={{ fontSize: 14, color: P.body, marginTop: 8 }}>
          This link is not valid.
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div style={{ minHeight: '100vh', background: P.bg, fontFamily: FONT }}>
        <header style={{ height: 52, background: '#fff',
                         borderBottom: `1px solid ${P.border}`, display: 'flex',
                         alignItems: 'center', padding: '0 20px' }}>
          <BrandBar brand={brand} />
        </header>
        <div data-testid="viewer-expired"
             style={{ maxWidth: 460, margin: '110px auto', textAlign: 'center',
                      background: '#fff', border: `1px solid ${P.border}`,
                      borderRadius: 12, padding: '34px 30px' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: P.ink }}>
            This share link has expired
          </div>
          <div style={{ fontSize: 12.5, color: P.body, lineHeight: 1.6, marginTop: 10 }}>
            The link to <strong>{meta?.title || 'this dashboard'}</strong>
            {meta?.expires_at ? ` expired on ${meta.expires_at.slice(0, 10)},` : ''} or
            was revoked by the workspace owner.
          </div>
          {meta?.owner_email ? (
            <a data-testid="request-new-link" href={`mailto:${meta.owner_email}`}
               style={{ display: 'inline-flex', alignItems: 'center', height: 32,
                        padding: '0 16px', borderRadius: 8, background: P.ink,
                        color: '#fff', fontSize: 12.5, fontWeight: 600,
                        textDecoration: 'none', marginTop: 16 }}>
              Request a new link
            </a>
          ) : (
            <div style={{ fontSize: 11.5, color: P.faint, marginTop: 14 }}>
              Ask the person who shared this for a fresh link.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="public-viewer"
         style={{ minHeight: '100vh', background: P.bg, display: 'flex',
                  flexDirection: 'column' }}>
      <header style={{ background: '#fff', borderBottom: `1px solid ${P.border}`,
                       display: 'flex', alignItems: 'center', gap: 14,
                       padding: '10px 20px', flexWrap: 'wrap' }}>
        <BrandBar brand={brand} />
        <span data-testid="viewer-title"
              style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT, color: P.body }}>
          {meta?.title || '…'}
        </span>
        {meta && (
          <span data-testid="freshness-badge"
                style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600,
                         textTransform: 'uppercase', color: P.amber,
                         background: P.amberBg, borderRadius: 10, padding: '3px 8px' }}>
            data {meta.freshness_hours ?? 0}h old
          </span>
        )}
        <span data-testid="viewer-expiry"
              style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10,
                       color: P.faint }}>
          read-only &middot; expires {meta?.expires_at
            ? meta.expires_at.slice(0, 10) : 'never'}
        </span>
        {meta?.owner_email && (
          <a data-testid="request-access" href={`mailto:${meta.owner_email}`}
             style={{ display: 'inline-flex', alignItems: 'center', height: 28,
                      padding: '0 12px', borderRadius: 7,
                      border: `1px solid ${P.borderStrong}`, background: '#fff',
                      color: P.body, fontSize: 11.5, fontWeight: 600,
                      textDecoration: 'none', fontFamily: FONT }}>
            Request access
          </a>
        )}
      </header>

      <div data-testid="viewer-filters"
           style={{ display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 20px', background: '#fff',
                    borderBottom: `1px solid ${P.border}` }}>
        <span style={label}>FILTERS</span>
        <select data-testid="viewer-range" value={range}
                onChange={e => setRange(e.target.value)}
                style={{ height: 26, borderRadius: 7, fontSize: 11.5,
                         border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                         padding: '0 6px', background: '#fff' }}>
          <option value="30">last 30 days</option>
          <option value="60">last 60 days</option>
          <option value="all">all history</option>
        </select>
        <select data-testid="viewer-region" disabled
                title="Regional slicing arrives with gold dimensional queries (R35)"
                style={{ height: 26, borderRadius: 7, fontSize: 11.5,
                         border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                         padding: '0 6px', background: P.tableHeadBg, color: P.faint }}>
          <option>region: all</option>
        </select>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
          viewer filters permitted &middot; no editing
        </span>
      </div>

      {chart && (
        <div style={{ display: 'flex', gap: 12, padding: '14px 20px 0',
                      flexWrap: 'wrap' }}>
          {[['viewer-kpi-avg', `AVG ACTUAL · ${range === 'all' ? 'ALL' : `${range}D`}`,
             view.avg.toLocaleString('en-US')],
            ['viewer-kpi-forecast', 'FORECAST AVG',
             Math.round(chart.kpis.forecast14Avg).toLocaleString('en-US')],
            ['viewer-kpi-mape', 'BACKTEST MAPE', `${chart.kpis.mape}%`]]
            .map(([tid, k, v]) => (
            <div key={tid} data-testid={tid}
                 style={{ flex: 1, minWidth: 150, background: '#fff',
                          border: `1px solid ${P.border}`, borderRadius: 10,
                          padding: '11px 14px' }}>
              <div style={label}>{k}</div>
              <div data-testid="vk-value"
                   style={{ fontSize: 20, fontWeight: 700, color: P.ink,
                            fontFamily: FONT, marginTop: 4 }}>
                {v}
              </div>
            </div>
          ))}
          <div style={{ flex: 1.2, minWidth: 190, background: '#fff',
                        border: `1px solid ${P.border}`, borderRadius: 10,
                        padding: '11px 14px' }}>
            <div style={label}>RECENT DAILY ACTUALS</div>
            <div data-testid="viewer-bars"
                 style={{ display: 'flex', alignItems: 'flex-end', gap: 5,
                          height: 34, marginTop: 6 }}>
              {view.recent.map((r, i) => {
                const max = Math.max(...view.recent.map(x => x.actual || 0), 1);
                return (
                  <div key={i} data-testid={`vbar-${i}`}
                       style={{ flex: 1,
                                height: Math.max(3, ((r.actual || 0) / max) * 34),
                                background: brand?.primary_color || P.accent,
                                opacity: 0.8, borderRadius: '3px 3px 0 0' }} />
                );
              })}
            </div>
          </div>
        </div>
      )}

      <iframe data-testid="viewer-frame" title="artifact" src={`/api/public/${token}`}
              style={{ flex: 1, border: 'none', width: '100%', minHeight: 380,
                       marginTop: 12 }} />
      <footer data-testid="viewer-footer"
              style={{ height: 34, display: 'flex', alignItems: 'center',
                       justifyContent: 'center', fontFamily: MONO, fontSize: 10,
                       color: P.faint, borderTop: `1px solid ${P.border}`,
                       background: '#fff' }}>
        Powered by AnalytIQ
      </footer>
    </div>
  );
}
