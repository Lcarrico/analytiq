// R32S1E6-US1 (program R30–R36) — Pre-aggregation recommendations
// (`Governance Lineage.dc.html` frame 03 / ch16): rollup cards with value
// pills and hit shares over the live query-pattern API, speedup / cost
// estimates, and a monthly cost ceiling. Materialization + persistence of
// dismissals ship with the gold-layer release (R36S1) — affordances are
// disabled with owning titles until then. Speedup/cost figures are
// demo-derived estimates from observed latency (Agent Note in plan).
import { useEffect, useState } from 'react';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const CEILING = 50;

export default function GovernancePreagg() {
  const role = useRole();
  const [recs, setRecs] = useState(null);
  const [hidden, setHidden] = useState({});

  useEffect(() => {
    api.preaggRecs().then(r => setRecs(Array.isArray(r) ? r : []))
      .catch(() => setRecs([]));
  }, []);

  if (role !== 'admin') return <Forbidden />;
  if (recs === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }

  const shown = recs.filter((_, i) => !hidden[i]);
  const total = recs.reduce((s, r) => s + (r.hits || 0), 0) || 1;
  const cost = i => 2 + (i % 4) * 3;                      // demo-derived estimate
  const speedup = r => Math.max(1.5, (r.avg_ms || 20) / 12).toFixed(1);
  const spend = recs.reduce((s, r, i) => s + (hidden[i] ? 0 : cost(i)), 0);

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="Pre-aggregation recommendations"
                  sub="Rollups the platform would materialize based on how dashboards actually query — approved ones serve reads in milliseconds." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
          Recommended rollups
        </span>
        <label title="Auto-materialization ships with the gold-layer release (R36S1)"
               style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7,
                        fontSize: 12, color: P.faint, fontFamily: FONT }}>
          <input type="checkbox" disabled /> Auto-materialize
        </label>
      </div>

      {shown.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                      padding: 20, fontSize: 12.5, color: P.muted, fontFamily: FONT,
                      marginBottom: 14 }}>
          No query patterns observed yet — recommendations appear as dashboards get used.
        </div>
      ) : recs.map((r, i) => {
        if (hidden[i]) return null;
        const share = Math.round((r.hits / total) * 100);
        const [label, bg, fg] = share >= 40 ? ['HIGH VALUE', P.greenBg, P.green]
          : share >= 20 ? ['MEDIUM', P.amberBg, P.amber]
          : ['LOW', P.tableHeadBg, P.muted];
        return (
          <div key={r.suggested_table} data-testid={`preagg-card-${i}`}
               style={{ background: '#fff', border: `1px solid ${P.border}`,
                        borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: P.ink }}>
                {r.suggested_table}
              </span>
              <span data-testid="preagg-value-pill"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                             padding: '0 8px', borderRadius: 999, background: bg, color: fg,
                             fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                             letterSpacing: '.05em' }}>
                {label}
              </span>
              <span data-testid="preagg-hits"
                    style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10.5,
                             color: P.muted }}>
                hits {share}% of queries
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: P.body, fontFamily: FONT, marginBottom: 12 }}>
              {r.reason}
            </div>
            <div style={{ display: 'flex', gap: 22, alignItems: 'flex-end',
                          marginBottom: 12 }}>
              {[['est. speedup', `${speedup(r)}×`, 'preagg-speedup',
                 Math.min(100, speedup(r) * 10)],
                ['est. cost', `$${cost(i)}/mo`, 'preagg-cost',
                 Math.min(100, cost(i) * 8)]].map(([k, v, tid, w]) => (
                <div key={k} style={{ minWidth: 130 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600,
                                letterSpacing: '.07em', color: P.faint, marginBottom: 3 }}>
                    {k.toUpperCase()}
                  </div>
                  <div data-testid={tid}
                       style={{ fontSize: 17, fontWeight: 700, color: P.ink,
                                fontFamily: FONT, marginBottom: 4 }}>
                    {v}
                  </div>
                  <div style={{ height: 4, borderRadius: 999, background: P.tableHeadBg }}>
                    <div style={{ height: 4, borderRadius: 999, width: `${w}%`,
                                  background: k === 'est. cost' ? P.amber : P.green }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn data-testid="preagg-approve" size="sm" disabled
                   title="Materialization ships with the gold-layer release (R36S1)">
                Approve &amp; materialize
              </Btn>
              <Btn data-testid="preagg-dismiss" size="sm" variant="ghost"
                   title="Dismissals are session-local until the gold-layer release (R36S1)"
                   onClick={() => setHidden(h => ({ ...h, [i]: true }))}>
                Dismiss
              </Btn>
            </div>
          </div>
        );
      })}

      <div data-testid="preagg-ceiling"
           style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                    padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
            Monthly cost ceiling
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted, marginTop: 3 }}>
            current spend ${spend}/mo · demo estimate
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
            ${CEILING}
          </div>
          <div style={{ width: 160, height: 5, borderRadius: 999,
                        background: P.tableHeadBg, marginTop: 5 }}>
            <div style={{ height: 5, borderRadius: 999,
                          width: `${Math.min(100, (spend / CEILING) * 100)}%`,
                          background: spend > CEILING ? P.red : P.accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}
