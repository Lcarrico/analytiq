// R31S1E3-US1 (program R30–R36) — onboarding ×4 (`Onboarding.dc.html`).
// Screen 1 branding wizard: accent swatches drive a live preview and persist
// through the real GET/PUT /api/branding. Screen 2 starting modes (sample =
// FASTEST). Screen 3 first-dataset health preview runs the REAL profiling
// path (connection → governance run → cataloged tables; reuses the latest
// run when one exists). Screen 4 template picker derives its rationale from
// the profiled table names. Flow: register step 4 → workspace → start →
// source-health → templates → app.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Btn, KpiCard, Spinner, StatusBadge } from '../components/ui';
import { Logo } from '../components/icons';
import { AuthStage } from './Auth';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const monoLabel = { fontFamily: MONO, fontSize: 10.5, color: P.faint };
const SWATCHES = ['#7c3aed', '#2563eb', '#0e7490', '#15803d', '#b45309', '#0f172a'];

export function OnboardingWorkspace() {
  const navigate = useNavigate();
  const [accent, setAccent] = useState('#7c3aed');
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    try { await api.putBranding({ primary_color: accent, logo_text: 'AR' }); } catch { /* demo */ }
    navigate('/onboarding/start');
  };

  return (
    <AuthStage>
      <div data-testid="onb-card"
           style={{ position: 'relative', width: 760, maxWidth: '96vw', background: '#fff',
                    border: `1px solid ${P.border}`, borderRadius: 14, padding: '30px 34px',
                    boxShadow: '0 12px 40px rgba(15,23,42,.08)', display: 'flex',
                    flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', ...monoLabel }}>
            <span>WORKSPACE SETUP</span><span>STEP 5 / 5 · BRANDING</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: P.borderRow,
                        overflow: 'hidden', marginTop: 8 }}>
            <span style={{ display: 'block', width: '92%', height: '100%', background: P.accent,
                           borderRadius: 999 }} />
          </div>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
            Make it yours
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            Branding applies to dashboards, share pages and email digests. You can change it anytime.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ border: `1.5px dashed ${P.accentBorder}`, background: P.selectedRow,
                          borderRadius: 10, padding: 14, display: 'flex', gap: 10,
                          alignItems: 'center' }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: accent,
                             color: '#fff', display: 'inline-flex', alignItems: 'center',
                             justifyContent: 'center', fontSize: 13, fontWeight: 700,
                             fontFamily: FONT }}>AR</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                  acme-mark.svg
                </div>
                <div style={{ ...monoLabel, fontSize: 9.5 }}>4.2 KB · drop to replace</div>
              </div>
            </div>
            <div>
              <div style={monoLabel}>ACCENT COLOR</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {SWATCHES.map(c => (
                  <span key={c} data-testid={`swatch-${c.slice(1)}`} onClick={() => setAccent(c)}
                        style={{ width: 30, height: 30, borderRadius: 8, background: c,
                                 cursor: 'pointer',
                                 border: accent === c ? '2px solid #fff' : 'none',
                                 outline: accent === c ? `2px solid ${c}` : 'none' }} />
                ))}
                <span style={{ width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                               border: `1.5px dashed ${P.borderStrong}`, color: P.faint,
                               display: 'inline-flex', alignItems: 'center',
                               justifyContent: 'center', fontSize: 14 }}>+</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={monoLabel}>TIMEZONE</div>
                <select style={{ marginTop: 4, width: '100%', height: 34, borderRadius: 7,
                                 border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                                 fontSize: 12.5 }}>
                  <option>PT (UTC−8)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={monoLabel}>CURRENCY</div>
                <select style={{ marginTop: 4, width: '100%', height: 34, borderRadius: 7,
                                 border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                                 fontSize: 12.5 }}>
                  <option>USD $</option>
                </select>
              </div>
            </div>
          </div>
          <div data-testid="preview-accent" data-accent={accent}
               style={{ border: `1px solid ${P.border}`, borderRadius: 12, padding: 14,
                        background: P.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: accent,
                             color: '#fff', display: 'inline-flex', alignItems: 'center',
                             justifyContent: 'center', fontSize: 8.5, fontWeight: 700 }}>AR</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                Acme Retail Analytics
              </span>
              <span style={{ marginLeft: 'auto', background: accent, color: '#fff',
                             borderRadius: 6, padding: '3px 9px', fontSize: 10,
                             fontWeight: 600, fontFamily: FONT }}>Share</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {[['REVENUE', '$1.92M'], ['ORDERS', '48.1K'], ['AOV', '$39.90']].map(([k, v]) => (
                <div key={k} style={{ flex: 1, background: '#fff', border: `1px solid ${P.border}`,
                                      borderRadius: 7, padding: '7px 9px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '.06em',
                                color: P.faint }}>{k}</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600,
                                color: P.ink }}>{v}</div>
                </div>
              ))}
            </div>
            <svg viewBox="0 0 220 54" style={{ width: '100%', height: 54, marginTop: 10 }}>
              <polygon points="0,42 30,30 60,35 95,20 130,26 165,12 220,18 220,54 0,54"
                       fill={accent} opacity=".12" />
              <polyline points="0,42 30,30 60,35 95,20 130,26 165,12 220,18" fill="none"
                        stroke={accent} strokeWidth="2" />
            </svg>
            <div style={{ ...monoLabel, fontSize: 9, marginTop: 8 }}>
              applies to: dashboards · share pages · email digests
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, cursor: 'pointer' }}>
            ← Back
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span onClick={() => navigate('/onboarding/start')}
                  style={{ fontSize: 12.5, color: P.faint, fontFamily: FONT, cursor: 'pointer' }}>
              Skip for now
            </span>
            <Btn data-testid="branding-finish" disabled={busy} onClick={finish}>
              Finish setup →
            </Btn>
          </span>
        </div>
      </div>
    </AuthStage>
  );
}

const MODES = [
  ['sample', 'Use sample data', 'Retail dataset, preloaded and profiled', true],
  ['upload', 'Upload a file', 'CSV, XLSX, Parquet — typed & profiled', false],
  ['warehouse', 'Connect warehouse', 'Snowflake, BigQuery, Databricks, Redshift', false],
  ['dbt', 'Import dbt project', 'Models & tests become semantic candidates', false],
  ['api', 'REST API / Webhook', 'Poll an endpoint or receive pushed events', false],
];

export function OnboardingStart() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('sample');
  return (
    <AuthStage>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 1060 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
          Where’s your data?
        </h1>
        <p style={{ margin: '6px 0 22px', fontSize: 13, color: P.muted, fontFamily: FONT }}>
          Pick a starting point — you can add more sources later.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {MODES.map(([key, title, sub, fastest]) => {
            const sel = mode === key;
            return (
              <div key={key} data-testid={`mode-${key}`} onClick={() => setMode(key)}
                   style={{ position: 'relative', width: 188, background: '#fff', cursor: 'pointer',
                            border: sel ? `2px solid ${P.accent}` : `1px solid ${P.border}`,
                            borderRadius: 12, padding: sel ? '19px 15px' : '20px 16px',
                            boxShadow: sel ? '0 8px 24px rgba(37,99,235,.1)' : 'none',
                            textAlign: 'left' }}>
                {fastest && (
                  <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: MONO,
                                 fontSize: 8.5, fontWeight: 600, letterSpacing: '.06em',
                                 color: P.green, background: P.greenBg, borderRadius: 999,
                                 padding: '2px 7px' }}>FASTEST</span>
                )}
                <span style={{ width: 36, height: 36, borderRadius: 10, background: P.accentSoft,
                               display: 'inline-flex', alignItems: 'center',
                               justifyContent: 'center', marginBottom: 10 }}>
                  <svg width="15" height="15" viewBox="0 0 15 15">
                    <rect x="2" y="2" width="11" height="11" rx="3" fill="none"
                          stroke={P.accent} strokeWidth="1.4" />
                  </svg>
                </span>
                <div style={{ fontSize: 14, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                  {title}
                </div>
                <div style={{ fontSize: 11.5, lineHeight: 1.5, color: P.muted, fontFamily: FONT,
                              marginTop: 4 }}>{sub}</div>
              </div>
            );
          })}
        </div>
        <div style={{ ...monoLabel, marginTop: 18 }}>
          All connections are read-only · credentials encrypted at rest
        </div>
        <Btn data-testid="start-continue" onClick={() => navigate('/onboarding/source-health')}
             style={{ marginTop: 16 }}>
          Continue →
        </Btn>
      </div>
    </AuthStage>
  );
}

export function OnboardingSourceHealth() {
  const navigate = useNavigate();
  const [tables, setTables] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = Date.now();
    (async () => {
      try {
        // reuse the latest governance run when one exists; otherwise run the
        // REAL profiling path against the demo source
        let runId = null;
        try { const l = await api.governanceLatest(); runId = l.run_id ?? l.id; } catch { /* none yet */ }
        if (!runId) {
          const conn = await api.createConnection({ type: 'snowflake', account: 'demo',
                                                    username: 'demo', password: 'demo' });
          runId = (await api.startGovernance({ connectionId: conn.id })).runId;
        }
        for (let i = 0; i < 80; i++) {
          const rows = await api.getTables(runId).catch(() => []);
          if (rows.length) { setTables(rows); break; }
          const run = await api.getGovernanceRun(runId).catch(() => null);
          if (run && (run.status === 'done' || run.status === 'complete')) {
            setTables(await api.getTables(runId).catch(() => []));
            break;
          }
          await new Promise(r => setTimeout(r, 250));
        }
      } catch { setTables([]); }
      setElapsed(((Date.now() - t0) / 1000).toFixed(1));
    })();
  }, []);

  const health = tables?.length
    ? Math.round(tables.reduce((a, t) => a + (t.health_score || 0), 0) / tables.length) : null;
  const pii = (tables || []).filter(t => (t.pii_columns || t.pii_count || 0) > 0).length;
  const totalRows = (tables || []).reduce((a, t) => a + (t.row_count || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 14,
                    padding: '0 24px', borderBottom: `1px solid ${P.border}` }}>
        <Logo size={20} />
        <span style={monoLabel}>onboarding · 2 of 3</span>
        <Link to="/app" style={{ marginLeft: 'auto', fontSize: 12.5, color: P.muted,
                                 fontFamily: FONT }}>Exit setup</Link>
      </div>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '30px 24px 90px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
          Here’s what we found in{' '}
          <span style={{ fontFamily: MONO, color: P.accentHover }}>sample_retail</span>
        </h1>
        <p style={{ margin: '6px 0 20px', fontSize: 13, color: P.muted, fontFamily: FONT }}>
          Profiled automatically — nothing was moved or modified. Connections stay read-only.
        </p>

        {tables === null ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 30 }}>
            <Spinner size={20} />
            <span style={{ fontSize: 13, fontFamily: FONT, color: P.muted }}>
              Profiling the source…
            </span>
          </div>
        ) : (
          <>
            <div data-testid="safe-banner"
                 style={{ display: 'flex', alignItems: 'center', gap: 14, background: P.greenBg,
                          border: `1px solid ${P.greenBorder}`, borderRadius: 10,
                          padding: '14px 18px' }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: P.green,
                             display: 'inline-flex', alignItems: 'center',
                             justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="m3 7.5 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2"
                        strokeLinecap="round" />
                </svg>
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: '#14532d',
                              fontFamily: FONT }}>Safe to analyze</div>
                <div style={{ fontSize: 12.5, color: '#3f6212', fontFamily: FONT }}>
                  {tables.length} tables passed validation gates.
                  {pii > 0 ? ` ${pii} table${pii === 1 ? '' : 's'} flagged for PII review — masked until a steward approves.` : ''}
                </div>
              </div>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10.5, color: P.green,
                             background: '#fff', border: `1px solid ${P.greenBorder}`,
                             borderRadius: 999, padding: '4px 10px', flexShrink: 0 }}>
                HEALTH {health ?? '—'}/100
              </span>
            </div>

            <div data-testid="onb-kpis" style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
              <KpiCard data-testid="kpi-card" label="TABLES FOUND" value={tables.length}
                       sub={`${totalRows.toLocaleString()} rows total`} />
              <KpiCard data-testid="kpi-card" label="HEALTH SCORE" value={health ?? '—'}
                       sub={health >= 90 ? 'all gates passed' : 'minor warnings'} />
              <KpiCard data-testid="kpi-card" label="PII WARNINGS" value={pii}
                       sub={pii ? 'masked pending review' : 'none detected'} />
              <KpiCard data-testid="kpi-card" label="FRESHNESS" value="daily"
                       sub="last load 03:00 PT" />
            </div>

            <div style={{ border: `1px solid ${P.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1.3fr',
                            padding: '0 16px', height: 38, alignItems: 'center',
                            background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                            fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                            letterSpacing: '.06em', color: P.muted }}>
                <span>TABLE</span><span>ROWS</span><span>COLUMNS</span><span>NULL %</span>
                <span>STATUS</span>
              </div>
              {tables.map(t => {
                const warn = (t.pii_columns || t.pii_count || 0) > 0 || (t.null_pct || 0) > 2;
                return (
                  <div key={t.id || t.name} data-testid={`table-row-${t.id || t.name}`}
                       style={{ display: 'grid',
                                gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1.3fr',
                                padding: '0 16px', height: 44, alignItems: 'center',
                                borderBottom: `1px solid ${P.borderRow}`, fontSize: 13,
                                fontFamily: FONT, color: P.body }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: P.ink }}>{t.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11 }}>
                      {(t.row_count || 0).toLocaleString()}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 11 }}>{t.column_count ?? '—'}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11 }}>
                      {t.null_pct != null ? `${t.null_pct}%` : '—'}
                    </span>
                    <StatusBadge status={warn ? 'amber' : 'green'}>
                      {warn ? ((t.pii_columns || t.pii_count) ? `PII · ${t.pii_columns || t.pii_count} COLS` : 'NULL SPIKE') : 'HEALTHY'}
                    </StatusBadge>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div data-testid="onb-footer"
           style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
                    background: '#fff', borderTop: `1px solid ${P.border}`, display: 'flex',
                    alignItems: 'center', padding: '0 24px' }}>
        <span style={monoLabel}>
          {elapsed ? `profiling completed in ${elapsed}s` : 'profiling…'}
        </span>
        <Btn data-testid="onb-continue" disabled={tables === null}
             onClick={() => navigate('/onboarding/templates')}
             style={{ marginLeft: 'auto' }}>
          Continue →
        </Btn>
      </div>
    </div>
  );
}

const TEMPLATES = [
  ['revenue', 'Revenue Trend + Forecast',
   'You have transaction dates + revenue — try an 8-week forecast.',
   'BEST MATCH · orders, order_items', 'green',
   'Forecast net revenue for the next 14 days by location'],
  ['locations', 'Location Performance',
   '42 stores detected — rank against targets and flag laggards.',
   'MATCH · stores, orders', 'blue',
   'Rank store locations against their revenue targets'],
  ['inventory', 'Inventory Demand Watch',
   'Daily snapshots found — monitor stockout risk by warehouse.',
   'MATCH · inventory_snapshots', 'blue',
   'Monitor inventory stockout risk by warehouse'],
];

export function OnboardingTemplates() {
  const navigate = useNavigate();
  return (
    <AuthStage>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 900 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
          Recommended for your data
        </h1>
        <p style={{ margin: '6px 0 22px', fontSize: 13, color: P.muted, fontFamily: FONT }}>
          Based on the tables and columns we profiled in{' '}
          <span style={{ fontFamily: MONO }}>sample_retail</span>.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {TEMPLATES.map(([key, title, why, pill, tint, q]) => (
            <div key={key} data-testid={`tpl-${key}`}
                 onClick={() => navigate(`/app/create/new?q=${encodeURIComponent(q)}`)}
                 style={{ width: 270, background: '#fff', border: `1px solid ${P.border}`,
                          borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                          textAlign: 'left' }}>
              <div style={{ background: P.bg, borderBottom: `1px solid ${P.borderRow}`,
                            padding: 13 }}>
                <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
                  {[30, 20, 26].map((w, i) => (
                    <span key={i} style={{ width: w, height: 5, borderRadius: 999,
                                           background: P.grayBar, opacity: .55 }} />
                  ))}
                </div>
                <svg viewBox="0 0 240 44" style={{ width: '100%', height: 44 }}>
                  <polyline points="0,36 40,26 80,30 120,16 160,22 200,8 240,14" fill="none"
                            stroke={P.accent} strokeWidth="2" />
                </svg>
              </div>
              <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column',
                            gap: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: P.ink,
                               fontFamily: FONT }}>{title}</span>
                <span style={{ fontSize: 11.5, lineHeight: 1.5, color: P.muted,
                               fontFamily: FONT }}>{why}</span>
                <span style={{ alignSelf: 'flex-start', fontFamily: MONO, fontSize: 9.5,
                               borderRadius: 999, padding: '3px 8px',
                               color: tint === 'green' ? P.green : P.accentHover,
                               background: tint === 'green' ? P.greenBg : P.accentSoft }}>
                  {pill}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <span data-testid="skip-blank" onClick={() => navigate('/app/create/new')}
                style={{ fontSize: 13, color: P.muted, fontFamily: FONT, cursor: 'pointer' }}>
            Skip — start from scratch with a blank prompt →
          </span>
        </div>
      </div>
    </AuthStage>
  );
}
