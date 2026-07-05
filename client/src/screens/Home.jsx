// R22S1E1 — Workspace Home, exact build of App Home.dc.html #home (Frame 01):
// greeting row, hero prompt bar, 8 live widgets over /api/home/summary.
// Supersedes the legacy S01 wizard landing (Appendix B retirement).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { FONT, MONO, P, T } from '../tokens';
import { Icon } from '../components/icons';
import { Badge, Btn, Card, Donut, PageHeader, ProgressBar, SectionLabel, Sparkline } from '../components/ui';

const SEV_TINT = { HIGH: 'red', MED: 'amber', LOW: 'gray' };
const CHIP_TINT = { DEF: 'blue', PII: 'purple', DRIFT: 'amber' };

function WidgetTitle({ children, link, onLink }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: P.ink }}>{children}</span>
      {link && (
        <a onClick={onLink}
           style={{ fontSize: 12, fontWeight: 500, fontFamily: FONT, color: P.accent,
                    cursor: 'pointer' }}>{link}</a>
      )}
    </div>
  );
}

function fmtTokens(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n ?? 0);
}

export default function Home() {
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { api.homeSummary().then(setD).catch(() => setD({})); }, []);

  const ask = () => {
    const t = q.trim();
    if (t) navigate(`/app/create/new?q=${encodeURIComponent(t)}`);
  };

  return (
    <div>
      <PageHeader crumb="acme-retail / home" title={d?.greeting || 'Good morning,'}
                  actions={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <a data-testid="home-activity-link" href="/app/activity"
                         style={{ fontSize: 12, fontWeight: 600, color: P.accentHover,
                                  fontFamily: FONT }}>
                        View all activity →
                      </a>
                      <span data-testid="home-date"
                            style={{ fontFamily: MONO, fontSize: 12, color: P.muted }}>
                        {d?.date_line || ''}
                      </span>
                    </span>} />

      {/* hero prompt bar — the signature element */}
      <div data-testid="hero-prompt"
           style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
                    border: `1px solid ${P.accentBorder}`, borderRadius: 12,
                    padding: '8px 8px 8px 18px', marginBottom: 22,
                    boxShadow: '0 6px 24px rgba(37,99,235,.07)' }}>
        <Icon name="Sparkle" size={16} style={{ color: P.accent }} />
        <input data-testid="hero-input" value={q} onChange={e => setQ(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && ask()}
               placeholder='Ask a business question — "Which locations will miss their Q3 revenue target?"'
               style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14.5,
                        fontFamily: FONT, color: P.ink, background: 'transparent' }} />
        <span data-testid="hero-keycap"
              style={{ fontFamily: MONO, fontSize: 10, color: P.muted, background: P.bg,
                       border: `1px solid ${P.border}`, borderRadius: 6, padding: '4px 7px',
                       whiteSpace: 'nowrap' }}>⏎ build</span>
        <Btn data-testid="hero-create" size="lg" onClick={ask}>Create</Btn>
      </div>

      {/* 8-widget grid */}
      <div data-testid="home-widgets"
           style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>

        <Card style={{ gridColumn: 'span 2' }} data-testid="home-widget-recents">
          <WidgetTitle link="View library →" onLink={() => navigate('/app/artifacts')}>
            Recent artifacts
          </WidgetTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {(d?.recents || []).map(a => (
              <div key={a.id} onClick={() => navigate('/app/artifacts')}
                   style={{ border: `1px solid ${P.border}`, borderRadius: 9, padding: 12,
                            cursor: 'pointer' }}>
                <div style={{ background: P.bg, borderRadius: 6, padding: '8px 10px', marginBottom: 9 }}>
                  <Sparkline data={[5, 7, 6, 9, 8, 11, 10, 13]} w={120} h={26} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FONT, color: P.ink,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.title}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              marginTop: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                                 color: a.health === 'healthy' ? P.green : P.amber }}>
                    ● {a.health === 'healthy' ? 'HEALTHY' : 'WARNINGS'}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>{a.age}</span>
                </div>
              </div>
            ))}
            {!(d?.recents || []).length && (
              <span style={{ fontSize: 12, color: P.muted, fontFamily: FONT }}>No artifacts yet</span>
            )}
          </div>
        </Card>

        <Card data-testid="home-widget-health">
          <WidgetTitle link="Details →" onLink={() => navigate('/app/governance')}>Data health</WidgetTitle>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span data-testid="home-health-donut"
                  data-tint={(d?.health?.score ?? 0) >= 85 ? 'green' : 'amber'}>
              <Donut value={d?.health?.score ?? 0} label={d?.health?.score ?? '—'} sub="/ 100"
                     color={(d?.health?.score ?? 0) >= 85 ? P.green : P.amber} />
            </span>
            <div style={{ flex: 1 }}>
              {(d?.health?.rows || []).map(r => {
                // R31S2E2: problem rows read amber, healthy rows green
                const warn = /drift|pii|flag|stale|breach/i.test(r.label)
                  && !/^0\b/.test(String(r.value));
                return (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between',
                                              padding: '3px 0' }}>
                    <span style={{ fontSize: 12, fontFamily: FONT, color: P.body }}>{r.label}</span>
                    <span data-testid="health-value" data-state={warn ? 'warn' : 'ok'}
                          style={{ fontFamily: MONO, fontSize: 11.5,
                                   color: warn ? P.amber : P.green }}>{r.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card data-testid="home-widget-runs">
          <WidgetTitle link={undefined}>Active pipeline runs</WidgetTitle>
          {(d?.runs || []).map(r => (
            <div key={r.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
                {r.title}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: P.muted, margin: '3px 0 5px' }}>
                stage {r.stage}/{r.total}
              </div>
              <ProgressBar value={r.stage} max={r.total} h={5} />
            </div>
          ))}
          {!(d?.runs || []).length && (
            <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>No runs in flight</span>
          )}
        </Card>

        <Card data-testid="home-widget-alerts">
          <WidgetTitle link="All alerts →" onLink={() => navigate('/app/alerts')}>Alerts firing</WidgetTitle>
          {(d?.alerts || []).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <Badge tint={SEV_TINT[a.severity] || 'gray'} xs>{a.severity}</Badge>
              <span style={{ flex: 1, fontSize: 12, fontFamily: FONT, color: P.body,
                             whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {a.message}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>{a.age}</span>
            </div>
          ))}
          {!(d?.alerts || []).length && (
            <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>Quiet — nothing firing</span>
          )}
        </Card>

        <Card data-testid="home-widget-review">
          {/* R31S2E2 (frame): amber count in the header, dot bullets, link at
              the BOTTOM */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
              Awaiting review
            </span>
            <span data-testid="review-count"
                  style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 18, fontWeight: 600,
                           color: P.amber }}>
              {d?.review?.count ?? (d?.review?.items || []).length}
            </span>
          </div>
          {(d?.review?.items || []).map(it => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <span data-testid="review-dot"
                    style={{ width: 7, height: 7, borderRadius: 4, flexShrink: 0,
                             background: it.chip === 'PII' ? P.red
                               : it.chip === 'DRIFT' ? P.amber : P.purple }} />
              <span style={{ flex: 1, fontSize: 12, fontFamily: FONT, color: P.body,
                             whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {it.label}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: P.faint }}>{it.chip}</span>
            </div>
          ))}
          {!(d?.review?.items || []).length && (
            <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>Queue is clear</span>
          )}
          <a data-testid="review-bottom-link" onClick={() => navigate('/app/governance')}
             style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 600,
                      color: P.accentHover, fontFamily: FONT, cursor: 'pointer' }}>
            Open review queue →
          </a>
        </Card>

        <Card data-testid="home-widget-suggested">
          <WidgetTitle>Suggested analyses</WidgetTitle>
          {(d?.suggested || []).map(sug => (
            <div key={sug.id}
                 onClick={() => navigate(`/app/create/new?q=${encodeURIComponent(sug.prompt)}`)}
                 style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0',
                          cursor: 'pointer' }}>
              <span style={{ color: P.accent, fontWeight: 700 }}>+</span>
              <span style={{ fontSize: 12.5, fontFamily: FONT, color: P.body }}>{sug.prompt}</span>
            </div>
          ))}
          {!(d?.suggested || []).length && (
            <span style={{ fontSize: 12, color: P.muted, fontFamily: FONT }}>
              Suggestions appear as the platform learns your data
            </span>
          )}
        </Card>

        <Card data-testid="home-widget-viewed">
          <WidgetTitle>Recently viewed</WidgetTitle>
          {(d?.recently_viewed || []).map((v, vi) => (
            <div key={v.id} onClick={() => navigate('/app/artifacts')}
                 style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                          cursor: 'pointer' }}>
              <svg data-testid="viewed-thumb" width="34" height="16" viewBox="0 0 34 16"
                   style={{ flexShrink: 0 }}>
                {vi % 2 === 0
                  ? <polyline points="1,13 9,7 17,10 25,4 33,7" fill="none" stroke={P.accent}
                              strokeWidth="1.4" />
                  : <g>{[2, 9, 16, 23, 30].map((x, i2) => (
                      <rect key={x} x={x} y={13 - (i2 % 3) * 4 - 3} width="3.5"
                            height={(i2 % 3) * 4 + 3} fill={P.grayBar} rx="1" />))}</g>}
              </svg>
              <span style={{ flex: 1, fontSize: 12.5, fontFamily: FONT, color: P.body,
                             whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {v.title}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>{v.age}</span>
            </div>
          ))}
          {!(d?.recently_viewed || []).length && (
            <span style={{ fontSize: 12, color: P.muted, fontFamily: FONT }}>Nothing viewed yet</span>
          )}
        </Card>

        {d?.usage && (
          <Card data-testid="home-widget-usage">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
                Usage & cost
              </span>
              <Badge tint="gray" xs>ADMIN</Badge>
            </div>
            <div style={{ ...T.kpi, color: P.ink }}>{fmtTokens(d.usage.tokens_used)}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline',
                          margin: '3px 0 8px' }}>
              <span style={{ fontSize: 12, color: P.muted, fontFamily: FONT }}>
                tokens this week · {d.usage.pct}% of plan
              </span>
              {d.usage.wow_delta != null && (
                <span data-testid="usage-wow"
                      style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600,
                               color: d.usage.wow_delta <= 0 ? P.green : P.amber }}>
                  {d.usage.wow_delta > 0 ? '+' : ''}{d.usage.wow_delta}% w/w
                </span>
              )}
            </div>
            <svg data-testid="usage-bars" width="120" height="26" viewBox="0 0 120 26"
                 style={{ display: 'block', marginBottom: 8 }}>
              {(d.usage.daily || [0, 0, 0, 0, 0, 0, 0]).map((v, i) => {
                const max = Math.max(1, ...(d.usage.daily || [1]));
                const h = Math.max(2, Math.round((v / max) * 22));
                return <rect key={i} x={i * 17 + 2} y={24 - h} width="11" height={h}
                             rx="2" fill={i === 6 ? P.accent : P.grayBar} />;
              })}
            </svg>
            <a onClick={() => navigate('/app/billing/usage')}
               style={{ fontSize: 12, fontWeight: 500, fontFamily: FONT, color: P.accent,
                        cursor: 'pointer' }}>Usage & limits →</a>
          </Card>
        )}
      </div>
    </div>
  );
}
