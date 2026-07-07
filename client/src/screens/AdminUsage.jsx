// R36S2E5-US1 (program R30–R36) — usage & cost analytics (`Admin
// Usage.dc.html` frame 01 / ch16). Every number is a live meter: pipeline
// runs and dispatches from their tables, tokens vs the plan pool, request
// compute time from the service log, and cost derived from the metered
// token rate ($8 / 100k — the same rate billing charges). Nothing invented.
import { useEffect, useState } from 'react';
import { PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`,
               borderRadius: 10, padding: 16 };

function fmtMs(ms) {
  if (ms >= 3600e3) return `${(ms / 3600e3).toFixed(1)}h`;
  if (ms >= 60e3) return `${(ms / 60e3).toFixed(1)}m`;
  return `${(ms / 1000).toFixed(1)}s`;
}
const fmtTok = t => t >= 1e6 ? `${(t / 1e6).toFixed(2)}M`
  : t >= 1e3 ? `${Math.round(t / 1e3)}K` : String(t);

export default function AdminUsage() {
  const role = useRole();
  const [d, setD] = useState(null);

  useEffect(() => { api.adminUsage().then(setD).catch(() => setD(false)); }, []);

  if (role !== 'admin') return <Forbidden />;
  if (!d) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }

  const kpis = [
    ['au-kpi-runs', 'PIPELINE RUNS · 30D', d.kpis.pipeline_runs, 'builds through the governed pipeline'],
    ['au-kpi-calls', 'LLM CALLS · 30D', d.kpis.llm_calls, '100% via governed prompts'],
    ['au-kpi-tokens', 'TOKENS', `${d.kpis.tokens_pct}%`,
     `${fmtTok(d.kpis.tokens_used)} of ${fmtTok(d.kpis.included)} plan pool`],
    ['au-kpi-compute', 'REQUEST COMPUTE · 30D', fmtMs(d.kpis.compute_ms),
     `${d.kpis.trainings_7d} training job(s) this week`],
  ];
  const maxBar = Math.max(...d.daily.map(r => r.views + r.builds), 1);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        workspace / admin / usage
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <PageHeader title="Usage & cost"
                    sub="Live meters over the dispatch, run, and service logs — cost derives from the metered token rate." />
        <a data-testid="au-export" href="/api/admin/usage"
           style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 600,
                    color: P.accentHover, textDecoration: 'none', fontFamily: FONT,
                    paddingTop: 6 }}>
          Export
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                    marginBottom: 14 }}>
        {kpis.map(([tid, k, v, sub]) => (
          <div key={tid} data-testid={tid} style={card}>
            <div style={label}>{k}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: P.ink, fontFamily: FONT,
                          margin: '6px 0 2px' }}>
              {v}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>{sub}</div>
          </div>
        ))}
      </div>

      <div data-testid="au-daily" style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: 'flex', marginBottom: 10 }}>
          <span style={label}>ARTIFACT VIEWS & BUILDS · DAILY · 14D</span>
          <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9.5,
                         color: P.faint }}>
            views (light) · builds (dark)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
          {d.daily.map(r => (
            <div key={r.day} data-testid="au-day" title={`${r.day}: ${r.views} views · ${r.builds} builds`}
                 style={{ flex: 1, display: 'flex', flexDirection: 'column',
                          justifyContent: 'flex-end', gap: 1, height: '100%' }}>
              <div style={{ height: Math.max(2, (r.views / maxBar) * 64),
                            background: P.accentSoft, borderRadius: '2px 2px 0 0' }} />
              <div style={{ height: Math.max(2, (r.builds / maxBar) * 64),
                            background: P.accent, borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
        <div data-testid="au-consumers" style={card}>
          <div style={{ ...label, marginBottom: 8 }}>TOP CONSUMERS · TOKENS / CALLS / EST. COST</div>
          {d.consumers.map(c => (
            <div key={c.consumer} data-testid="au-consumer-row"
                 style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr .8fr .7fr',
                          gap: 10, padding: '7px 0', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: P.ink,
                             fontFamily: FONT }}>
                {c.consumer === 'default' ? 'Workspace (all users)' : c.consumer}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: P.body }}>
                {fmtTok(c.tokens)}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: P.faint }}>
                {c.calls} calls
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600,
                             color: P.ink, textAlign: 'right' }}>
                ${c.usd.toFixed(2)}
              </span>
            </div>
          ))}
          {d.consumers.length === 0 && (
            <div style={{ padding: 10, fontSize: 12, color: P.muted, fontFamily: FONT }}>
              No metered calls yet this cycle — dispatches appear here as sessions run.
            </div>
          )}
        </div>

        <div data-testid="au-areas" style={card}>
          <div style={{ ...label, marginBottom: 8 }}>COST BY WORKSPACE AREA</div>
          {d.areas.map(a => (
            <div key={a.area} data-testid="au-area-row"
                 style={{ display: 'flex', gap: 10, padding: '7px 0',
                          alignItems: 'center', borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontSize: 12, color: P.body, fontFamily: FONT }}>
                {a.area.replace(/_/g, ' ')}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11,
                             fontWeight: 600, color: P.ink }}>
                ${a.usd.toFixed(2)}
              </span>
            </div>
          ))}
          {d.areas.length === 0 && (
            <div style={{ padding: 10, fontSize: 12, color: P.muted, fontFamily: FONT }}>
              No cost accrued yet this cycle.
            </div>
          )}
          <div style={{ display: 'flex', paddingTop: 10 }}>
            <span style={{ ...label }}>EST. MONTH TOTAL</span>
            <span data-testid="au-total"
                  style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 13,
                           fontWeight: 700, color: P.ink }}>
              ${d.est_month_usd.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
