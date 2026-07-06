// R35S2E1-US1 (program R30–R36) — Source detail (`Data Detail.dc.html`
// frame 01 / PRD §8 audit-first): header with status/issues pills and
// scope · role · owner facts, real Sync now (a fresh governance run),
// and nine tabs over live substrate — Health (aggregate KPIs + trend +
// issues), Tables (cataloged rows → table detail), Schema Drift (drift
// alerts), PII (manifest scan, masked), Freshness (SLA posture), Lineage
// (into the graph), Sync Logs (run history), Settings (scope + SLAs).
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const mono = { fontFamily: MONO, fontSize: 11, color: P.body };
const TABS = ['health', 'tables', 'drift', 'pii', 'freshness', 'lineage', 'logs', 'settings'];
const TAB_NAME = { health: 'Health', tables: 'Tables', drift: 'Schema Drift',
                   pii: 'PII', freshness: 'Freshness', lineage: 'Lineage',
                   logs: 'Sync Logs', settings: 'Settings' };

export default function SourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'health';
  const [d, setD] = useState(null);
  const [tables, setTables] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [drift, setDrift] = useState([]);
  const [slas, setSlas] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    try {
      const det = await api.dataSourceDetail(id);
      setD(det);
      if (det.header.run_id) {
        api.getTables(det.header.run_id).then(setTables).catch(() => {});
      }
      api.getManifest(id).then(setManifest).catch(() => {});
      api.getDrift(id).then(setDrift).catch(() => {});
      api.getSlas(id).then(setSlas).catch(() => {});
    } catch { setD(false); }
  };
  useEffect(() => { load(); }, [id]);

  if (d === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  if (!d) {
    return (
      <div style={{ maxWidth: 700 }}>
        <PageHeader title="Source not found" sub="It may have been removed." />
        <Btn size="sm" variant="outline" onClick={() => navigate('/app/data/sources')}>
          Back to sources
        </Btn>
      </div>
    );
  }
  const h = d.header;
  const syncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await api.startGovernance({ connectionId: Number(id) });
      setTimeout(() => { setSyncing(false); load(); }, 2500);
    } catch { setSyncing(false); }
  };
  const piiCols = (manifest?.tables || []).flatMap(t =>
    (t.columns || []).filter(c => c.pii_flags)
      .map(c => ({ table: t.name, ...c })));
  const trendMax = Math.max(...d.trend.map(t => t.health_score || 0), 100);

  return (
    <div style={{ maxWidth: 1050 }}>
      <div onClick={() => navigate('/app/data/sources')}
           style={{ fontSize: 12, color: P.accent, cursor: 'pointer', marginBottom: 10,
                    fontFamily: FONT }}>
        &larr; Data sources
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <h1 data-testid="sd-name"
            style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: FONT }}>
          {h.name}
        </h1>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>
          {h.type}
        </span>
        <span data-testid="sd-status"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 20,
                       padding: '0 10px', borderRadius: 999, background: P.greenBg,
                       color: P.green, fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.green }} />
          {h.status.toUpperCase()}
        </span>
        {h.issues > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                         padding: '0 10px', borderRadius: 999, background: P.amberBg,
                         color: P.amber, fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>
            {h.issues} ISSUES
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn data-testid="sd-sync-now" size="sm" onClick={syncNow} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync now'}
          </Btn>
          <Btn size="sm" variant="outline"
               onClick={() => setParams({ tab: 'settings' }, { replace: true })}>
            Settings
          </Btn>
        </span>
      </div>
      {syncing && (
        <div data-testid="sd-syncing"
             style={{ fontFamily: MONO, fontSize: 10, color: P.accent, marginBottom: 4 }}>
          re-profiling in scope tables&hellip;
        </div>
      )}
      <div data-testid="sd-sub"
           style={{ fontSize: 12, color: P.muted, fontFamily: FONT, marginBottom: 12 }}>
        {h.tables_in_scope} tables in scope &middot; {h.role} role
        {h.owner ? ` · owner ${h.owner}` : ''}
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${P.border}`,
                    marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <span key={t} data-testid={`sdtab-${t}`}
                onClick={() => setParams({ tab: t }, { replace: true })}
                style={{ padding: '7px 11px', fontSize: 12.5, cursor: 'pointer',
                         fontFamily: FONT, fontWeight: tab === t ? 600 : 400,
                         color: tab === t ? P.ink : P.muted,
                         borderBottom: tab === t ? `2px solid ${P.accent}`
                           : '2px solid transparent' }}>
            {TAB_NAME[t]}
          </span>
        ))}
      </div>

      {tab === 'health' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                        marginBottom: 14 }}>
            <div data-testid="sd-kpi-health" style={{ ...card, padding: '13px 15px' }}>
              <div style={label}>HEALTH SCORE</div>
              <div data-testid="sd-kpi-value"
                   style={{ fontSize: 24, fontWeight: 700, color: P.ink,
                            fontFamily: FONT, margin: '5px 0 3px' }}>
                {d.kpis.health.score ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: P.faint, fontFamily: FONT }}>
                {d.kpis.health.delta != null
                  ? `${d.kpis.health.delta >= 0 ? '+' : ''}${d.kpis.health.delta} vs first scan`
                  : 'first scan'}
              </div>
            </div>
            <div data-testid="sd-kpi-tables" style={{ ...card, padding: '13px 15px' }}>
              <div style={label}>TABLES HEALTHY</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: P.ink,
                            fontFamily: FONT, margin: '5px 0 3px' }}>
                {d.kpis.tables_healthy.ok}/{d.kpis.tables_healthy.total}
              </div>
              <div style={{ fontSize: 11, color: P.faint, fontFamily: FONT }}>
                {d.kpis.tables_healthy.warnings} warnings
              </div>
            </div>
            <div data-testid="sd-kpi-fresh" style={{ ...card, padding: '13px 15px' }}>
              <div style={label}>FRESHNESS</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: P.ink,
                            fontFamily: FONT, margin: '5px 0 3px' }}>
                {d.kpis.freshness.label || '—'}
              </div>
              <div style={{ fontSize: 11, fontFamily: FONT,
                            color: d.kpis.freshness.state === 'breached' ? P.red
                              : d.kpis.freshness.state === 'at risk' ? P.amber : P.faint }}>
                {d.kpis.freshness.sla ? `SLA ${d.kpis.freshness.sla} · ` : ''}
                {d.kpis.freshness.state}
              </div>
            </div>
            <div data-testid="sd-kpi-gates" style={{ ...card, padding: '13px 15px' }}>
              <div style={label}>GATES &middot; 7D</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: P.ink,
                            fontFamily: FONT, margin: '5px 0 3px' }}>
                {d.kpis.gates_7d.passed}/{d.kpis.gates_7d.total}
              </div>
              <div style={{ fontSize: 11, color: P.faint, fontFamily: FONT }}>
                {d.kpis.gates_7d.failed} failed
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...label, marginBottom: 10 }}>HEALTH SCORE &middot; HISTORY</div>
              {d.trend.length === 0 ? (
                <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
                  History builds up as syncs run.
                </span>
              ) : (
                <svg width="100%" height="90" viewBox="0 0 300 90">
                  <polyline fill="none" stroke={P.accent} strokeWidth="2"
                            points={d.trend.map((t, i) =>
                              `${10 + (i / Math.max(d.trend.length - 1, 1)) * 280},` +
                              `${82 - ((t.health_score || 0) / trendMax) * 70}`).join(' ')} />
                </svg>
              )}
            </div>
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...label, marginBottom: 8 }}>
                OPEN ISSUES &middot; {d.issues.length}
              </div>
              {d.issues.length === 0 ? (
                <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
                  Nothing open — gates and contracts are quiet.
                </span>
              ) : d.issues.slice(0, 5).map(i_ => (
                <div key={i_.id} style={{ padding: '6px 0',
                                          borderBottom: `1px solid ${P.borderRow}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: P.ink,
                                fontFamily: FONT }}>
                    {i_.subject}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
                    {i_.type} &middot; {(i_.created_at || '').slice(0, 16)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'tables' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .8fr .8fr 1fr 1fr',
                        gap: 10, padding: '0 16px', height: 34, alignItems: 'center',
                        background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                        ...label }}>
            <span>TABLE</span><span>HEALTH</span><span>ROWS</span><span>FRESHNESS</span>
            <span>GATES</span>
          </div>
          {tables.map(t => (
            <div key={t.id} data-testid={`sdt-row-${t.name}`}
                 onClick={() => navigate(`/app/data/tables/${h.run_id}/${t.name}`)}
                 style={{ display: 'grid',
                          gridTemplateColumns: '1.6fr .8fr .8fr 1fr 1fr', gap: 10,
                          padding: '9px 16px', alignItems: 'center', cursor: 'pointer',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: P.ink }}>{t.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 11,
                             color: (t.health_score || 0) >= 90 ? P.green
                               : (t.health_score || 0) >= 70 ? P.body : P.red }}>
                {t.health_score}
              </span>
              <span style={mono}>{t.row_count}</span>
              <span style={mono}>{t.freshness}</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5,
                             color: t.ml_ready ? P.green : P.amber }}>
                {t.ml_ready ? 'ALL PASS' : 'NEEDS REVIEW'}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'drift' && (
        <div style={{ ...card, padding: 16 }}>
          {drift.length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              No schema drift recorded between manifest versions.
            </span>
          ) : drift.map(dr => (
            <div key={dr.id} style={{ padding: '7px 0',
                                      borderBottom: `1px solid ${P.borderRow}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink,
                            fontFamily: FONT }}>{dr.subject}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                {dr.detail?.from_version} &rarr; {dr.detail?.to_version}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'pii' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr',
                        gap: 10, padding: '0 16px', height: 34, alignItems: 'center',
                        background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                        ...label }}>
            <span>TABLE</span><span>COLUMN</span><span>KIND</span><span>ML USE</span>
          </div>
          {piiCols.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: P.faint, fontFamily: FONT }}>
              The scan found no personal data in scope.
            </div>
          ) : piiCols.map(c => (
            <div key={`${c.table}.${c.name}`} data-testid={`pii-row-${c.table}-${c.name}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr', gap: 10,
                          padding: '8px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={mono}>{c.table}</span>
              <span style={{ ...mono, fontWeight: 600, color: P.ink }}>{c.name}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                             padding: '0 8px', borderRadius: 999, background: P.amberBg,
                             color: P.amber, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, justifySelf: 'start' }}>
                {(c.pii_flags?.kind || 'PII').toUpperCase()} &middot; MASKED
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9.5,
                             color: c.allow_ml_use ? P.green : P.red }}>
                {c.allow_ml_use ? 'APPROVED' : 'BLOCKED'}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'freshness' && (
        <div style={{ ...card, padding: 16 }}>
          {slas.length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              No freshness expectations set — add them in the connector wizard or
              the quality rules.
            </span>
          ) : slas.map(s => (
            <div key={s.id} style={{ display: 'flex', gap: 12, padding: '7px 0',
                                     alignItems: 'center',
                                     borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ ...mono, fontWeight: 600, color: P.ink, flex: 1 }}>
                {s.table_name}
              </span>
              <span style={mono}>SLA {s.max_age_hours}h</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                {(tables.find(t => t.name === s.table_name) || {}).freshness || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'lineage' && (
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12.5, color: P.body, fontFamily: FONT,
                        marginBottom: 10 }}>
            Every downstream surface this source feeds is on the workspace lineage
            graph — metrics, gold tables, models, and dashboards.
          </div>
          <Btn data-testid="sd-open-lineage" size="sm" variant="outline"
               onClick={() => navigate('/app/governance/lineage')}>
            Open the lineage graph
          </Btn>
        </div>
      )}

      {tab === 'logs' && (
        <div style={{ ...card, padding: 16 }}>
          {[...d.trend].reverse().slice(0, 10).map((t, i) => (
            <div key={t.id ?? i} data-testid={`log-row-${t.id ?? i}`}
                 style={{ display: 'flex', gap: 12, padding: '6px 0',
                          alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ ...mono, color: P.faint }}>
                {(t.recorded_at || t.created_at || '').slice(0, 16)}
              </span>
              <span style={{ fontSize: 12, color: P.body, fontFamily: FONT }}>
                governance sync &middot; {t.table_name} health {t.health_score}
              </span>
            </div>
          ))}
          {d.trend.length === 0 && d.header.run_id && (
            <div data-testid="log-row-latest"
                 style={{ fontSize: 12, color: P.body, fontFamily: FONT }}>
              governance sync completed &middot; {d.header.tables_in_scope} tables profiled
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ ...card, padding: 16, maxWidth: 560 }}>
          <div style={{ ...label, marginBottom: 6 }}>SCOPE</div>
          <div style={{ fontSize: 12.5, color: P.body, fontFamily: FONT,
                        marginBottom: 12 }}>
            {h.scope ? `${h.scope.length} tables selected: ${h.scope.join(', ')}`
              : 'Full catalog — every discoverable table is profiled.'}
          </div>
          <div style={{ ...label, marginBottom: 6 }}>DANGER ZONE</div>
          <Btn size="sm" variant="outline"
               title="Removes the connection; profiled history stays for audit"
               onClick={async () => {
                 try { await api.deleteConnection(id); navigate('/app/data/sources'); }
                 catch { /* admin only */ }
               }}>
            Disconnect source
          </Btn>
        </div>
      )}
    </div>
  );
}
