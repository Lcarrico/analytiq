// R30S1E4-US1 (program R30–R36) — Artifact Detail `Artifacts Library.dc.html`
// Frame 03: header block (mono breadcrumb, editable title w/ rename-on-hover
// affordance persisting via PATCH /api/artifacts/:id, health/type/version
// pills, owner · refresh meta, Open-in-workbench / Duplicate / Export / Share
// actions), 8-tab strip routed via ?tab=. The Dashboard tab renders KPIs and
// two chart sections ONLY — the model / gate / lineage internals that S09
// leaked onto the main view (MODEL ID · FEATURE MANIFEST · DQ GATE STATUS ·
// SOURCE LINEAGE · "CENTERPIECE") render on their own tabs, fed by the same
// existing APIs. Share opens the interim modal (canonical modal = R30S3E4).
// Agent note: the mockup's second section is "Target gap by region" — the
// chart_data substrate has no regional dimension, so the diverging bars are
// derived per WEEK from the same rows (signed mono deltas kept); revisit when
// gold dimensional queries reach this surface.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Avatar, Badge, Btn, Card, KpiCard, Spinner, StatusBadge, Tabs } from '../components/ui';
import { ShareModal } from './Artifacts';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const TABS = ['Dashboard', 'Insights', 'Pipeline', 'Lineage', 'Model',
              'Versions', 'Sharing', 'Activity'];

function rel(ts) {
  if (!ts) return 'just now';
  const t = new Date(String(ts).includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
  const s = Math.max(0, (Date.now() - t.getTime()) / 1000);
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
const initials = (email) => (email || '?').split('@')[0].slice(0, 2).toUpperCase();
const firstName = (email) => {
  const n = (email || '').split('@')[0].split(/[._-]/)[0];
  return n ? n[0].toUpperCase() + n.slice(1) : '—';
};
const FOLDERS = [
  ['revenue', /revenue|forecast/i], ['operations', /ops|operational|inventory|risk|health/i],
  ['customer', /churn|customer/i], ['finance', /margin|finance|roi/i],
];
const folderOf = (title) => (FOLDERS.find(([, re]) => re.test(title || '')) || ['all'])[0];
const slugOf = (title) => (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const monoLabel = { fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em',
                    textTransform: 'uppercase', color: P.faint };

export default function ArtifactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const tabParam = (sp.get('tab') || 'dashboard').toLowerCase();
  const active = TABS.find(t => t.toLowerCase() === tabParam) || 'Dashboard';

  const [art, setArt] = useState(null);
  const [chart, setChart] = useState(null);
  const [health, setHealth] = useState(null);
  const [explain, setExplain] = useState(null);
  const [insights, setInsights] = useState(null);
  const [shares, setShares] = useState(null);
  const [feed, setFeed] = useState(null);
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    setArt(null); setChart(null); setHealth(null); setExplain(null);
    setInsights(null); setShares(null); setFeed(null);
    api.getArtifact(id).then(setArt).catch(() => setMissing(true));
    api.getChartData(id).then(setChart).catch(() => setChart({ rows: [], kpis: null }));
    api.artifactHealth(id).then(h => setHealth(h.score)).catch(() => setHealth(null));
    api.explainArtifact(id).then(setExplain).catch(() => setExplain(false));
  }, [id]);

  useEffect(() => {
    if (active === 'Insights' && insights === null) {
      api.scanInsights(id).then(r => setInsights(r.insights)).catch(() => setInsights([]));
    }
    if (active === 'Sharing' && shares === null) {
      api.getShares(id).then(setShares).catch(() => setShares([]));
    }
    if (active === 'Activity' && feed === null) {
      api.activity(id).then(setFeed).catch(() => setFeed([]));
    }
  }, [active, id]);

  const rename = async (title) => {
    setEditing(false);
    const t = title.trim();
    if (!t || !art || t === art.title) return;
    try { setArt(await api.renameArtifact(id, t)); } catch { /* keep old title */ }
  };

  const openWorkbench = async () => {
    try {
      const run = await api.getPipelineRun(art.pipeline_run_id);
      if (run?.session_id) navigate(`/app/create/${run.session_id}`);
    } catch { /* no run — stay */ }
  };

  const duplicate = async () => {
    try {
      const copy = await api.duplicateArtifact(id);
      if (copy?.id) navigate(`/app/artifacts/${copy.id}`);
    } catch { /* noop */ }
  };

  if (missing) {
    return <div style={{ fontFamily: FONT, color: P.muted, fontSize: 13 }}>Artifact not found.</div>;
  }
  if (!art) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={28} /></div>;
  }

  const rows = chart?.rows || [];
  const kpis = chart?.kpis;
  const forecastStart = rows.find(r => r.is_forecast)?.date;
  // weekly signed gap (see Agent note in the header comment)
  const weeks = [];
  rows.filter(r => r.actual != null && r.predicted != null).forEach(r => {
    const w = Math.floor(r.day_index / 7);
    (weeks[w] = weeks[w] || { week: `W${w + 1}`, gap: 0 }).gap += (r.actual - r.predicted);
  });
  const gapData = weeks.filter(Boolean).map(w => ({ ...w, gap: Math.round(w.gap) }));

  const healthTint = health == null ? 'gray' : health >= 90 ? 'green' : health >= 70 ? 'amber' : 'red';

  const tabPanel = {
    Dashboard: (
      <>
        <div data-testid="detail-kpis" style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <KpiCard data-testid="kpi-card" label="AVG DAILY ACTUAL"
                   value={kpis ? `$${kpis.avgActual.toLocaleString()}` : '—'} sub="trailing 30d" />
          <KpiCard data-testid="kpi-card" label="MODEL ACCURACY"
                   value={kpis ? `${kpis.mape}%` : '—'} sub="walk-forward MAPE" />
          <KpiCard data-testid="kpi-card" label="14-DAY FORECAST AVG"
                   value={kpis ? `$${kpis.forecast14Avg.toLocaleString()}` : '—'} sub="95% CI band" />
          <KpiCard data-testid="kpi-card" label="HEALTH"
                   value={health == null ? '—' : health} sub={health == null ? 'scoring…' : health >= 90 ? 'all gates passed' : health >= 70 ? 'minor warnings' : 'needs review'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
          <Card data-testid="section-trend">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                Revenue vs forecast · daily
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                actual — · forecast -- · 95% CI band
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={rows} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dtCi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={P.accent} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={P.accent} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={P.borderRow} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: P.faint, fontFamily: MONO }}
                       tickLine={false} axisLine={false} interval={13} />
                <YAxis tick={{ fontSize: 9.5, fill: P.faint, fontFamily: MONO }}
                       tickLine={false} axisLine={false}
                       tickFormatter={v => `$${Math.round(v / 100) / 10}K`} />
                <Tooltip contentStyle={{ fontFamily: MONO, fontSize: 11 }} />
                {forecastStart && (
                  <ReferenceLine x={forecastStart} stroke={P.accent} strokeDasharray="5 3" />
                )}
                <Area type="monotone" dataKey="ci_high" stroke="none" fill="url(#dtCi)" />
                <Area type="monotone" dataKey="ci_low" stroke="none" fill="#fff" />
                <Line type="monotone" dataKey="predicted" stroke={P.accent}
                      strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="actual" stroke={P.ink} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Card data-testid="section-gap">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                Forecast gap by week
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>actual − forecast</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={gapData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.borderRow} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 9.5, fill: P.faint, fontFamily: MONO }}
                       tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9.5, fill: P.faint, fontFamily: MONO }}
                       tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontFamily: MONO, fontSize: 11 }} />
                <ReferenceLine y={0} stroke={P.borderStrong} />
                <Bar dataKey="gap" radius={[3, 3, 0, 0]}>
                  {gapData.map(w => (
                    <Cell key={w.week} fill={w.gap < 0 ? P.red : P.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </>
    ),
    Insights: (
      <div data-testid="tab-insights" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights === null ? <Spinner /> : insights.length === 0 ? (
          <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            No insights detected for this artifact yet.
          </span>
        ) : insights.map((i, n) => (
          <Card key={n} p={14}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Badge tint={i.kind === 'anomaly' ? 'red' : i.kind === 'trend' ? 'blue' : 'purple'} xs>
                {(i.kind || 'insight').replace(/_/g, ' ')}
              </Badge>
              <span style={{ fontSize: 12.5, fontFamily: FONT, color: P.body }}>{i.summary}</span>
            </div>
          </Card>
        ))}
      </div>
    ),
    Pipeline: (
      <div data-testid="tab-pipeline" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={monoLabel}>Run & gates</div>
        {explain === null ? <Spinner /> : explain === false ? (
          <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>No pipeline run recorded.</span>
        ) : (
          <Card p={16}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: P.body }}>
                run {explain.lineage.run_id}
              </span>
              <StatusBadge status={art.dq_status === 'pass' ? 'green' : 'amber'}>
                {art.dq_status === 'pass' ? 'ALL GATES PASSED' : 'DQ WARNINGS'}
              </StatusBadge>
              {explain.model && Object.entries(explain.model.gates || {}).map(([k, v]) => (
                <Badge key={k} tint={String(v).toLowerCase().includes('pass') ? 'green' : 'amber'} xs>
                  {k.replace(/_/g, ' ')} · {String(v)}
                </Badge>
              ))}
            </div>
            <div style={{ ...monoLabel, marginTop: 14 }}>Generated SQL · admin only</div>
            <pre style={{ fontFamily: MONO, fontSize: 10, background: P.darkBg, color: P.codeBlue,
                          padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 140 }}>
              {explain.sql.ddl || explain.sql.gold_read_example || 'n/a'}
            </pre>
          </Card>
        )}
      </div>
    ),
    Lineage: (
      <div data-testid="tab-lineage" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={monoLabel}>Source lineage</div>
        {explain === null ? <Spinner /> : explain === false ? (
          <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>No lineage recorded.</span>
        ) : (
          <Card p={16}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {(explain.lineage.gold_tables.length
                ? explain.lineage.gold_tables : ['(no gold tables)']).map(t => (
                <span key={t} style={{ fontFamily: MONO, fontSize: 10.5, background: '#fdf9ef',
                                       border: `1px solid ${P.amberBorder}`, color: P.amber,
                                       borderRadius: 6, padding: '3px 8px' }}>{t}</span>
              ))}
            </div>
            <div style={{ ...monoLabel, marginTop: 14 }}>Provenance chain</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {explain.lineage.provenance_chain.map((c, i) => (
                <span key={i} style={{ fontFamily: MONO, fontSize: 10.5, background: P.bg,
                                       border: `1px solid ${P.border}`, borderRadius: 6,
                                       padding: '3px 8px', color: P.body }}>
                  {c.artifact_type} v{c.version}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT, marginTop: 12 }}>
              Full interactive graph lands with governance lineage (R32S1E5).
            </div>
          </Card>
        )}
      </div>
    ),
    Model: (
      <div data-testid="tab-model" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={monoLabel}>Model</div>
        {explain === null ? <Spinner /> : (explain === false || !explain.model) ? (
          <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            Descriptive artifact — no model attached.
          </span>
        ) : (
          <Card p={16}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: P.purple }}>
                {explain.model.algorithm}
              </span>
              {art.mape != null && <Badge tint="green" xs>MAPE {art.mape}%</Badge>}
              {Object.entries(explain.model.gates || {}).map(([k, v]) => (
                <Badge key={k} tint={String(v).toLowerCase().includes('pass') ? 'green' : 'amber'} xs>
                  {k.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT, marginTop: 12 }}>
              The full model card (importance, SHAP, backtest windows) lands with R33S1E3.
            </div>
          </Card>
        )}
      </div>
    ),
    Versions: (
      <div data-testid="tab-versions" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={monoLabel}>Version history</div>
        <Card p={16}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Avatar initials={initials(art.owner)} size={24} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
              v1 · current
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>{rel(art.created_at)}</span>
          </div>
          <div style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT, marginTop: 10 }}>
            The full version timeline (dependency chips, restore, compare) lands with the
            workbench Versions panel (R30S3E5).
          </div>
        </Card>
      </div>
    ),
    Sharing: (
      <div data-testid="tab-sharing" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={monoLabel}>Shared with</div>
          <Btn size="sm" variant="outline" onClick={() => setShareOpen(true)}>Manage sharing</Btn>
        </div>
        <Card p={16}>
          {shares === null ? <Spinner /> : shares.length === 0 ? (
            <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
              Private — only you. Signed public links arrive with the share modal (R30S3E4).
            </span>
          ) : shares.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between',
                                     padding: '7px 0', borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontSize: 12.5, fontFamily: FONT, color: P.body }}>{s.email}</span>
              <Badge xs>{s.role}</Badge>
            </div>
          ))}
        </Card>
      </div>
    ),
    Activity: (
      <div data-testid="tab-activity" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={monoLabel}>Recent activity</div>
        <Card p={16}>
          {feed === null ? <Spinner /> : feed.length === 0 ? (
            <span style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT }}>No activity yet.</span>
          ) : feed.slice(0, 12).map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center',
                                  padding: '7px 0', borderBottom: `1px solid ${P.borderRow}` }}>
              <Avatar initials={initials(e.actor)} size={22} />
              <span style={{ fontSize: 12.5, fontFamily: FONT, color: P.body }}>
                <strong style={{ color: P.ink, fontWeight: 600 }}>{firstName(e.actor)}</strong> {e.kind}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: P.faint }}>
                {rel(e.at || e.created_at)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    ),
  }[active];

  return (
    <div>
      {/* ── header block (Frame 03) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div data-testid="detail-crumb"
               style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
            artifacts / {folderOf(art.title)} / <span style={{ color: P.body }}>{slugOf(art.title)}</span>
          </div>
          {editing ? (
            <input data-testid="detail-title-input" ref={titleRef} defaultValue={art.title} autoFocus
                   onBlur={e => rename(e.target.value)}
                   onKeyDown={e => {
                     if (e.key === 'Enter') rename(e.target.value);
                     if (e.key === 'Escape') setEditing(false);
                   }}
                   style={{ fontSize: 20, fontWeight: 600, fontFamily: FONT, color: P.ink,
                            border: `1px solid ${P.accentBorder}`, borderRadius: 6,
                            padding: '2px 8px', outline: 'none', minWidth: 340 }} />
          ) : (
            <h1 data-testid="detail-title" onClick={() => setEditing(true)}
                onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
                title="Click to rename"
                style={{ margin: 0, fontSize: 20, fontWeight: 600, color: P.ink, fontFamily: FONT,
                         cursor: 'text', display: 'inline-block',
                         borderBottom: `1px dashed ${hover ? P.accentBorder : 'transparent'}` }}>
              {art.title}
            </h1>
          )}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span data-testid="detail-health-pill">
              <StatusBadge status={healthTint}>
                {health == null ? 'SCORING' : `${health >= 90 ? 'HEALTHY' : health >= 70 ? 'WARNINGS' : 'NEEDS REVIEW'} ${health}`}
              </StatusBadge>
            </span>
            <span data-testid="detail-type-pill"
                  style={{ display: 'inline-flex', alignItems: 'center', height: 17, padding: '0 8px',
                           borderRadius: 999, fontFamily: MONO, fontSize: 9, fontWeight: 600,
                           letterSpacing: '.05em',
                           background: art.type === 'Predictive' ? P.purpleBg : P.accentSoft,
                           color: art.type === 'Predictive' ? P.purple : P.accentHover }}>
              {art.type === 'Predictive' ? 'PREDICTIVE' : 'DASHBOARD'}
            </span>
            <span data-testid="detail-version-pill"
                  style={{ display: 'inline-flex', alignItems: 'center', height: 17, padding: '0 8px',
                           borderRadius: 999, fontFamily: MONO, fontSize: 9, fontWeight: 600,
                           background: P.accentSoft, color: P.accentHover }}>
              v1
            </span>
          </div>
          <div data-testid="detail-meta"
               style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <Avatar initials={initials(art.owner)} size={22} />
            <span style={{ fontSize: 12.5, fontFamily: FONT, color: P.body }}>{firstName(art.owner)}</span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>
              · refreshed {rel(art.created_at)}
              {art.schedule_cron ? ` · scheduled` : ''}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Btn data-testid="detail-open-workbench" variant="outline" size="sm"
               disabled={!art.pipeline_run_id} onClick={openWorkbench}>Open in workbench</Btn>
          <Btn data-testid="detail-duplicate" variant="outline" size="sm" onClick={duplicate}>Duplicate</Btn>
          <Btn data-testid="detail-export" variant="outline" size="sm"
               onClick={() => window.open(`/api/artifacts/${id}/export?format=html`, '_blank')}>Export</Btn>
          <Btn data-testid="detail-share" size="sm" onClick={() => setShareOpen(true)}>Share</Btn>
        </div>
      </div>

      {/* ── 8-tab strip, routed via ?tab= ── */}
      <div data-testid="detail-tabs" style={{ marginBottom: 18 }}>
        <Tabs tabs={TABS} active={active}
              onChange={t => setSp(t === 'Dashboard' ? {} : { tab: t.toLowerCase() }, { replace: true })} />
      </div>

      {tabPanel}

      {shareOpen && <ShareModal artifact={art} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
