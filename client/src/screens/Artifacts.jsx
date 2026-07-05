// R30S1E2-US1 (program R30–R36) — Artifacts Library `Artifacts Library.dc.html`
// Frame 01: 220px filter rail (FILTERS + FOLDERS), header "Artifacts {n}" +
// single filter input + Cards/Table toggle + "+ New dashboard", 3-col card
// grid, dashed ghost tile. Every inline action row is replaced by ⋯ menus.
// Reconciliation (d) ruling (PRD §8 open item, resolved 2026-07-04): ROI
// report lives in the per-artifact ⋯ menu; Sandbox view + Health dashboard
// proved workspace-level (api.roiReport()/healthDashboard() take no artifact,
// sandbox flips the whole list) → header-level ⋯ menu. "Deep search … FTS"
// input removed (PRD §5.1 leak ledger). Legacy R8–R12 affordances (provenance,
// replay, explain, monitor, opportunities, promote, schedule, share) migrate
// into the ⋯ menu with their original testids; their result panels render
// inside the owning card. Table view carries the R15S2 DataTable until
// R30S1E3 rebuilds its columns.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context';
import { Avatar, Badge, Btn, Checkbox, DataTable, PageHeader, Spinner,
         StatusBadge, ViewToggle } from '../components/ui';
import ShareModalV2 from '../components/ShareModal';   // R30S3E4 canonical
import { FONT, MONO, P } from '../tokens';
import { api, auth } from '../api';

const CRON_OPTIONS = [
  { label: 'Schedule daily (6 AM)',       cron: '0 6 * * *' },
  { label: 'Schedule weekly (Mon 6 AM)',  cron: '0 6 * * 1' },
  { label: 'Schedule monthly (1st 6 AM)', cron: '0 6 1 * *' },
];

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

// Folder taxonomy (frame FOLDERS list); counts derive from loaded titles.
const FOLDERS = [
  ['revenue',    'Revenue',    /revenue|forecast/i],
  ['operations', 'Operations', /ops|operational|inventory|risk|health/i],
  ['customer',   'Customer',   /churn|customer/i],
  ['finance',    'Finance',    /margin|finance|roi/i],
];

function ThumbSvg() {
  return (
    <svg viewBox="0 0 240 58" style={{ width: '100%', height: 58, display: 'block' }}>
      <polygon points="0,44 30,34 60,38 90,24 120,29 150,15 180,20 210,10 240,16 240,58 0,58"
               fill={P.accentSoft} />
      <polyline points="0,44 30,34 60,38 90,24 120,29 150,15 180,20 210,10 240,16"
                fill="none" stroke={P.accent} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuItem({ children, onClick, testid, danger, mono }) {
  return (
    <button data-testid={testid} onClick={onClick}
            style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none',
                     background: 'none', cursor: 'pointer', padding: '7px 12px',
                     fontSize: 12, fontFamily: mono ? MONO : FONT,
                     color: danger ? P.red : P.body, borderRadius: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = P.selectedRow; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      {children}
    </button>
  );
}

// (interim ShareModal removed — canonical modal lives in components/ShareModal.jsx, R30S3E4)

const pillStyle = (bg, fg) => ({
  display: 'inline-flex', alignItems: 'center', height: 17, padding: '0 8px',
  borderRadius: 999, background: bg, color: fg, fontFamily: MONO, fontSize: 9,
  fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', flexShrink: 0,
});

export default function Artifacts() {
  const { update, nav } = useApp();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const view = sp.get('view') === 'table' ? 'table' : 'cards';

  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [perPage]             = useState(20);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [sandboxView, setSandboxView] = useState(false);
  const [rail, setRail] = useState({ mine: false, shared: false, predictive: false,
                                     warnings: false, public: false, review: false });
  const [folder,  setFolder]  = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [wsMenu,  setWsMenu]  = useState(false);
  const [notice,  setNotice]  = useState('');
  const [shareFor, setShareFor] = useState(null);
  const debounceRef = useRef(null);

  // legacy affordance panels (R8–R12) — testids preserved
  const [health, setHealth] = useState({});
  const [provFor, setProvFor] = useState(null);
  const [provChain, setProvChain] = useState([]);
  const [provDag, setProvDag] = useState(null);
  const [explainFor, setExplainFor] = useState(null);
  const [explain, setExplain] = useState(null);
  const [replayFor, setReplayFor] = useState(null);
  const [replay, setReplay] = useState(null);
  const [oppFor, setOppFor] = useState(null);
  const [opps, setOpps] = useState([]);
  const [monFor, setMonFor] = useState(null);
  const [mon, setMon] = useState(null);

  const fetchArtifacts = useCallback((query, pg, sandbox) => {
    setLoading(true);
    api.getArtifacts({ q: query || undefined, page: pg, sandbox })
      .then(res => { setItems(res.items); setTotal(res.total); setPage(res.page); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchArtifacts(q, 1, sandboxView); }, [sandboxView]);
  const firstQ = useRef(true);
  useEffect(() => {
    // the sandboxView effect owns the initial fetch — a duplicate mount fetch
    // re-blanked the grid and raced computed-style reads (root-caused flake,
    // R30S1E2-US1)
    if (firstQ.current) { firstQ.current = false; return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchArtifacts(q, 1, sandboxView), 250);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  useEffect(() => {
    // one batched commit — per-artifact setState caused a re-render storm that
    // raced computed-style reads (root-caused flake, R30S1E2-US1)
    const missing = items.slice(0, 20).filter(a => health[a.id] === undefined);
    if (!missing.length) return;
    Promise.all(missing.map(a =>
      api.artifactHealth(a.id).then(h => [a.id, h.score]).catch(() => [a.id, null]),
    )).then(entries => setHealth(prev => ({ ...prev, ...Object.fromEntries(entries) })));
  }, [items]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-menu-root]')) { setMenuFor(null); setWsMenu(false); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const me = auth.user()?.email;
  const predicates = {
    mine:       a => !me || a.owner === me,
    shared:     a => (a.share_count || 0) > 0,
    predictive: a => a.type === 'Predictive',
    warnings:   a => a.dq_status !== 'pass',
    // public-link state is not in the list payload yet — lands with the
    // canonical share modal (R30S3E4); until then only explicit flags match.
    public:     a => a.has_public_link === true || a.has_public_link === 1,
    review:     a => a.dq_status === 'warn' || (a.confidence != null && a.confidence < 0.7),
  };
  const folderDef = FOLDERS.find(([key]) => key === folder);
  const visible = items
    .filter(a => Object.entries(rail).every(([k, on]) => !on || predicates[k](a)))
    .filter(a => !folderDef || folderDef[2].test(a.title || ''));

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const goPage = (pg) => fetchArtifacts(q, pg, sandboxView);
  const refresh = () => fetchArtifacts(q, page, sandboxView);

  // R30S1E4: the library opens the dedicated detail surface
  const openArtifact = (a) => { update({ artifactId: a.id }); navigate(`/app/artifacts/${a.id}`); };
  const loadOpps = async (id) => {
    const r = await api.opportunities(id);
    setOpps(r.opportunities); setOppFor(id);
  };

  const roiReport = async () => {
    try {
      await api.roiReport();
      setNotice('ROI report generated as a native artifact.');
      fetchArtifacts(q, 1, sandboxView);
    } catch { setNotice('ROI report needs analyst access.'); }
  };
  const makeHealthDashboard = async () => {
    try {
      const art = await api.healthDashboard();
      setNotice(`Workspace health dashboard created (artifact #${art.id}).`);
      fetchArtifacts(q, 1, sandboxView);
    } catch { setNotice('Could not build the health dashboard.'); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this artifact?')) return;
    await api.deleteArtifact(id).catch(() => {});
    refresh();
  };

  const healthChip = (a) => {
    const score = health[a.id];
    if (a.dq_status === 'warn') return ['amber', '1 WARNING'];
    if ((score != null && score < 60) || (a.confidence != null && a.confidence < 0.7)) {
      return ['red', 'NEEDS REVIEW'];
    }
    return ['green', 'HEALTHY'];
  };

  const cardMenu = (a) => (
    <div data-testid="card-menu" data-menu-root
         onClick={e => e.stopPropagation()}
         style={{ position: 'absolute', top: 40, right: 10, zIndex: 60, width: 210,
                  maxHeight: 320, overflowY: 'auto', background: '#fff',
                  border: `1px solid ${P.border}`, borderRadius: 8, padding: 4,
                  boxShadow: '0 12px 32px rgba(15,23,42,.16)' }}>
      <MenuItem onClick={() => { setMenuFor(null); openArtifact(a); }}>Open</MenuItem>
      <MenuItem onClick={() => { setMenuFor(null); window.open(`/api/artifacts/${a.id}/html`, '_blank'); }}>
        Preview
      </MenuItem>
      <MenuItem onClick={async () => { setMenuFor(null); await api.toggleFavorite(a.id); refresh(); }}>
        {a.favorite ? 'Unfavorite' : 'Favorite'}
      </MenuItem>
      <MenuItem onClick={async () => {
        setMenuFor(null);
        try {
          const r = await api.scanInsights(a.id);
          setNotice(`${r.insights.length} insight(s): ` + r.insights.map(i => i.summary).join(' · '));
        } catch { setNotice('Insight scan needs chart data.'); }
      }}>Insights</MenuItem>
      <MenuItem onClick={async () => {
        setMenuFor(null);
        try {
          const r = await api.createShareLink(a.id, { expires_in_hours: 168 });
          setNotice(`Public link (7d): ${window.location.origin}${r.url}`);
        } catch { setNotice('Render the artifact before creating a public link.'); }
      }}>Public link</MenuItem>
      <MenuItem onClick={async () => {
        setMenuFor(null);
        const r = await api.createEmbedToken(a.id, { scope: 'read_only', allowed_origins: ['*'] });
        setNotice(`Embed token (24h): ${r.token.slice(0, 40)}…`);
      }}>Embed token</MenuItem>
      <MenuItem onClick={async () => {
        setMenuFor(null);
        const feed = await api.activity(a.id);
        setNotice('Activity: ' + feed.slice(0, 6).map(e => `${e.kind} by ${e.actor}`).join(' · '));
      }}>Activity</MenuItem>
      <MenuItem testid="roi-report-btn" onClick={() => { setMenuFor(null); roiReport(); }}>
        ROI report
      </MenuItem>
      <MenuItem onClick={() => { setMenuFor(null); setShareFor(a); }}>Share</MenuItem>
      {CRON_OPTIONS.map(opt => (
        <MenuItem key={opt.cron} onClick={async () => {
          setMenuFor(null);
          try { await api.putSchedule(a.id, { cron_expr: opt.cron }); refresh(); } catch { /* noop */ }
        }}>{a.schedule_cron === opt.cron ? `${opt.label} · on` : opt.label}</MenuItem>
      ))}
      {!!(a.schedule_enabled && a.schedule_cron) && (
        <MenuItem onClick={async () => {
          setMenuFor(null);
          try { await api.deleteSchedule(a.id); refresh(); } catch { /* noop */ }
        }}>Schedule off</MenuItem>
      )}
      <MenuItem testid="monitor-btn" onClick={async () => {
        setMenuFor(null);
        if (monFor === a.id) { setMonFor(null); return; }
        try { const m = await api.monitorArtifact(a.id); setMon(m); setMonFor(a.id); }
        catch { setNotice('Monitoring needs a completed run.'); }
      }}>Monitor</MenuItem>
      <MenuItem testid="opportunities-btn" onClick={async () => {
        setMenuFor(null);
        if (oppFor === a.id) { setOppFor(null); return; }
        try { await loadOpps(a.id); } catch { setNotice('No opportunities recorded.'); }
      }}>Opportunities</MenuItem>
      <MenuItem testid="replay-btn" onClick={async () => {
        setMenuFor(null);
        if (replayFor === a.id) { setReplayFor(null); return; }
        try { const rp = await api.pipelineReplay(a.pipeline_run_id); setReplay(rp); setReplayFor(a.id); }
        catch { setNotice('Replay needs a DAG-executed run.'); }
      }}>Replay</MenuItem>
      <MenuItem testid="explain-btn" onClick={async () => {
        setMenuFor(null);
        if (explainFor === a.id) { setExplainFor(null); return; }
        try { const ex = await api.explainArtifact(a.id); setExplain(ex); setExplainFor(a.id); }
        catch { setNotice('Explain needs a completed pipeline run.'); }
      }}>Explain</MenuItem>
      <MenuItem testid="provenance-btn" onClick={async () => {
        setMenuFor(null);
        if (provFor === a.id) { setProvFor(null); return; }
        try {
          const r = await api.provenance(a.id);
          setProvChain(r.chain); setProvDag(r.dag); setProvFor(a.id);
        } catch { setNotice('No provenance recorded for this artifact.'); }
      }}>Provenance</MenuItem>
      {!!a.is_sandbox && (
        <MenuItem testid="promote-btn" onClick={async () => {
          setMenuFor(null);
          try {
            await api.promoteArtifact(a.id);
            setNotice('Promoted to production — all gates passed.');
            refresh();
          } catch (e) {
            let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* noop */ }
            setNotice(m);
          }
        }}>Promote</MenuItem>
      )}
      <MenuItem danger onClick={() => { setMenuFor(null); handleDelete(a.id); }}>Delete</MenuItem>
    </div>
  );

  return (
    <div style={{ display: 'flex', margin: '-28px -32px', minHeight: 'calc(100vh - 64px)',
                  alignItems: 'stretch' }}>
      {/* ── 220px filter rail (Frame 01) ── */}
      <aside data-testid="artifacts-rail"
             style={{ width: 220, boxSizing: 'border-box', flexShrink: 0, background: '#fff',
                      borderRight: `1px solid ${P.border}`, padding: '22px 18px',
                      display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.1em', color: P.faint }}>
          FILTERS
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[['mine', 'Created by me'], ['shared', 'Shared with me'], ['predictive', 'Predictive'],
            ['warnings', 'Has warnings'], ['public', 'Public links'], ['review', 'Needs review']]
            .map(([key, label]) => (
              <Checkbox key={key} testid={`rail-filter-${key}`} label={label}
                        checked={rail[key]}
                        onChange={v => setRail(r => ({ ...r, [key]: v }))} />
            ))}
        </div>
        <div data-testid="rail-divider" style={{ height: 1, background: P.borderRow }} />
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.1em', color: P.faint }}>
          FOLDERS
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12.5 }}>
          {FOLDERS.map(([key, label, re]) => {
            const active = folder === key;
            return (
              <div key={key} data-testid={`rail-folder-${key}`}
                   onClick={() => setFolder(active ? null : key)}
                   style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer',
                            fontFamily: FONT, color: active ? P.accentHover : P.body,
                            fontWeight: active ? 600 : 400 }}>
                {label}
                <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
                  {items.filter(a => re.test(a.title || '')).length}
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── main column ── */}
      <div data-testid="artifacts-main"
           style={{ flex: 1, padding: '24px 28px', boxSizing: 'border-box', minWidth: 0 }}>
        <PageHeader
          title="Artifacts"
          count={<span data-testid="artifacts-count">{total}</span>}
          actions={
            <>
              <div style={{ position: 'relative' }}>
                <input placeholder="Filter by name, tag, owner…" value={q}
                       onChange={e => setQ(e.target.value)}
                       style={{ width: 260, height: 34, boxSizing: 'border-box',
                                padding: '0 12px', border: `1px solid ${P.borderStrong}`,
                                borderRadius: 8, fontSize: 12.5, fontFamily: FONT,
                                color: P.ink, outline: 'none', background: '#fff' }} />
              </div>
              <ViewToggle view={view}
                          onChange={v => setSp(v === 'table' ? { view: 'table' } : {}, { replace: true })} />
              <span data-menu-root style={{ position: 'relative' }}>
                <button data-testid="workspace-menu-trigger" aria-label="Workspace actions"
                        onClick={() => setWsMenu(o => !o)}
                        style={{ height: 34, width: 34, border: `1px solid ${P.borderStrong}`,
                                 borderRadius: 8, background: '#fff', cursor: 'pointer',
                                 fontSize: 16, color: P.muted, lineHeight: 1 }}>⋯</button>
                {wsMenu && (
                  <div data-testid="workspace-menu" onClick={e => e.stopPropagation()}
                       style={{ position: 'absolute', top: 38, right: 0, zIndex: 60, width: 200,
                                background: '#fff', border: `1px solid ${P.border}`,
                                borderRadius: 8, padding: 4,
                                boxShadow: '0 12px 32px rgba(15,23,42,.16)' }}>
                    <MenuItem testid="sandbox-toggle"
                              onClick={() => { setWsMenu(false); setSandboxView(v => !v); }}>
                      {sandboxView ? 'Sandbox view · on' : 'Sandbox view'}
                    </MenuItem>
                    <MenuItem testid="health-dashboard-btn"
                              onClick={() => { setWsMenu(false); makeHealthDashboard(); }}>
                      Health dashboard
                    </MenuItem>
                  </div>
                )}
              </span>
              <Btn data-testid="new-dashboard-btn" onClick={() => navigate('/app/create/new')}>
                + New dashboard
              </Btn>
            </>
          }
        />

        {notice && (
          <div data-testid="library-notice"
               style={{ marginBottom: 12, padding: '9px 12px', background: P.accentSoft,
                        border: `1px solid ${P.accentBorder}`, borderRadius: 8, fontSize: 12,
                        fontFamily: FONT, color: P.body, wordBreak: 'break-all' }}>
            {notice}
            <button onClick={() => setNotice('')} aria-label="Dismiss notice"
                    style={{ float: 'right', border: 'none', background: 'none',
                             cursor: 'pointer', color: P.muted }}>×</button>
          </div>
        )}

        {loading && items.length === 0 ? (
          /* full spinner only before first data — background refetches keep
             the grid mounted (no detach mid-read, no flash) R30S1E2-US1 */
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
        ) : view === 'table' ? (
          /* R30S1E3-US1 — Frame 02 exact columns; ⋯ reuses the card menu */
          <DataTable
            testid="artifacts-table"
            rowKey="id"
            rowH={46}
            onRowClick={openArtifact}
            columns={[
              { key: 'title', label: 'Title', sortable: true, width: '2fr',
                render: r => <span style={{ fontWeight: 600, color: P.ink }}>{r.title}</span> },
              { key: 'owner', label: 'Owner', width: '.9fr',
                render: r => (
                  <span data-testid="owner-cell"
                        style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Avatar data-testid="avatar" initials={initials(r.owner)} size={22} />
                    {firstName(r.owner)}
                  </span>
                ) },
              { key: 'type', label: 'Type', width: '.9fr',
                render: r => (
                  <span data-testid="type-cell"
                        style={{ fontFamily: MONO, fontSize: 10.5,
                                 color: r.type === 'Predictive' ? P.purple : P.accentHover }}>
                    {r.type === 'Predictive' ? 'predictive' : 'dashboard'}
                  </span>
                ) },
              { key: 'health', label: 'Data health', width: '1fr',
                render: r => {
                  const s = health[r.id];
                  return (
                    <span data-testid="health-cell">
                      <StatusBadge status={s == null ? 'gray' : s >= 90 ? 'green' : s >= 70 ? 'amber' : 'red'}>
                        {s == null ? '—' : s}
                      </StatusBadge>
                    </span>
                  );
                } },
              { key: 'created_at', label: 'Last refreshed', width: '1fr',
                render: r => (
                  <span data-testid="refreshed-cell"
                        style={{ fontFamily: MONO, fontSize: 11 }}>{rel(r.created_at)}</span>
                ) },
              { key: 'share', label: 'Share', width: '.9fr',
                render: r => (
                  <span data-testid="share-cell"
                        style={{ fontFamily: MONO, fontSize: 10.5,
                                 color: r.has_public_link ? P.cyan : P.muted }}>
                    {r.has_public_link ? 'public link'
                      : (r.share_count || 0) > 0 ? 'workspace' : 'private'}
                  </span>
                ) },
              { key: 'tags', label: 'Tags', width: '1fr',
                render: r => (
                  <span data-testid="tags-cell" style={{ display: 'flex', gap: 4 }}>
                    {(r.tags || []).slice(0, 3).map(t => (
                      <span key={t}
                            style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                                     padding: '0 7px', borderRadius: 5, background: P.grayBg,
                                     color: P.itemInk, fontFamily: MONO, fontSize: 9 }}>{t}</span>
                    ))}
                  </span>
                ) },
              { key: 'menu', label: '', width: '44px',
                render: r => (
                  <span data-menu-root
                        style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
                        onClick={e => e.stopPropagation()}>
                    <button data-testid="card-menu-trigger" aria-label="More actions"
                            onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer',
                                     fontSize: 15, color: P.faint, lineHeight: 1 }}>⋯</button>
                    {menuFor === r.id && cardMenu(r)}
                  </span>
                ) },
            ]}
            rows={visible}
          />
        ) : (
          <>
            {visible.length === 0 && (
              <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 12 }}>
                {q || Object.values(rail).some(Boolean) || folder
                  ? 'No matching artifacts.' : 'No artifacts yet — start from a question.'}
              </div>
            )}
            <div data-testid="artifacts-grid"
                 style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {visible.map(a => {
                const [tint, label] = healthChip(a);
                return (
                  <div key={a.id} data-testid={`artifact-row-${a.id}`}
                       onClick={() => openArtifact(a)}
                       style={{ background: '#fff', border: `1px solid ${P.border}`,
                                borderRadius: 11, cursor: 'pointer', position: 'relative',
                                display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div data-testid="card-thumb"
                         style={{ background: P.bg, borderBottom: `1px solid ${P.borderRow}`,
                                  padding: 14, borderRadius: '11px 11px 0 0' }}>
                      <div data-testid="thumb-skeleton"
                           style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        {[34, 22, 28].map((w, i) => (
                          <span key={i} style={{ width: w, height: 5, borderRadius: 999,
                                                 background: P.grayBar, opacity: .55 }} />
                        ))}
                      </div>
                      <ThumbSvg />
                    </div>
                    <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column',
                                  gap: 8, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span data-testid="card-title"
                              style={{ fontSize: 13.5, fontWeight: 600, color: P.ink,
                                       fontFamily: FONT, flex: 1, overflow: 'hidden',
                                       textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.title}
                        </span>
                        <span data-menu-root style={{ position: 'relative', flexShrink: 0 }}>
                          <button data-testid="card-menu-trigger" aria-label="More actions"
                                  onClick={e => { e.stopPropagation(); setMenuFor(menuFor === a.id ? null : a.id); }}
                                  style={{ border: 'none', background: 'none', cursor: 'pointer',
                                           fontSize: 15, color: P.faint, padding: '0 2px',
                                           lineHeight: 1 }}>⋯</button>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span data-testid="type-pill"
                              style={a.type === 'Predictive'
                                ? pillStyle(P.purpleBg, P.purple)
                                : pillStyle(P.accentSoft, P.accentHover)}>
                          {a.type === 'Predictive' ? 'PREDICTIVE' : 'DASHBOARD'}
                        </span>
                        <span data-testid="health-chip">
                          <StatusBadge status={tint}>{label}</StatusBadge>
                        </span>
                        {!!a.is_sandbox && <Badge tint="amber" xs data-testid="sandbox-badge">sandbox</Badge>}
                        {a.confidence != null && a.confidence < 0.7 && (
                          <Badge tint="amber" xs data-testid="low-confidence-badge">
                            confidence {Math.round(a.confidence * 100)}%
                          </Badge>
                        )}
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span data-testid="card-owner">
                            <Avatar initials={initials(a.owner)} size={20} />
                          </span>
                          <span data-testid="card-age"
                                style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
                            {rel(a.created_at)}
                          </span>
                        </span>
                      </div>
                      {menuFor === a.id && cardMenu(a)}
                      {(monFor === a.id || oppFor === a.id || replayFor === a.id ||
                        explainFor === a.id || provFor === a.id) && (
                        <div onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
                          {monFor === a.id && mon && (
                            <div data-testid="monitor-panel"
                                 style={{ marginTop: 4, paddingTop: 10, borderTop: `1px solid ${P.border}`,
                                          display: 'flex', gap: 10, alignItems: 'center', fontSize: 12,
                                          fontFamily: MONO, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                                             color: P.muted }}>Model monitoring</span>
                              <Badge tint={mon.importance_drift.drifted ? 'amber' : 'green'} xs data-testid="mon-importance">
                                importance {mon.importance_drift.drifted ? `reordered τ ${mon.importance_drift.kendall_tau}` : 'stable'}
                              </Badge>
                              <Badge tint={mon.input_drift.drifted ? 'amber' : 'green'} xs data-testid="mon-input">
                                inputs {mon.input_drift.drifted ? `PSI ${mon.input_drift.psi}` : 'stable'}
                              </Badge>
                              {mon.triggers.length > 0 && (
                                <span style={{ fontSize: 11, color: P.faint }}>retrain queued via drift event</span>
                              )}
                            </div>
                          )}
                          {oppFor === a.id && (
                            <div data-testid="opportunities-panel"
                                 style={{ marginTop: 4, paddingTop: 10, borderTop: `1px solid ${P.border}` }}>
                              <div style={{ fontSize: 10, fontWeight: 600, fontFamily: MONO,
                                            textTransform: 'uppercase', color: P.muted, marginBottom: 6 }}>
                                Opportunities — suggested next questions
                              </div>
                              {opps.length === 0 && (
                                <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>None found</span>
                              )}
                              {opps.map(o => (
                                <div key={o.id} data-testid={`opp-row-${o.id}`}
                                     style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0',
                                              borderBottom: `1px solid ${P.borderRow}` }}>
                                  <Badge tint={o.status === 'open' ? 'gray' : o.status === 'accepted' ? 'green' : 'amber'}
                                         xs data-testid="opp-status">{o.status}</Badge>
                                  <Badge tint="blue" xs>{o.kind}</Badge>
                                  <span style={{ fontSize: 12, fontFamily: FONT, flex: 1, overflow: 'hidden',
                                                 textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        title={o.question}>{o.headline}</span>
                                  {o.status === 'open' && (
                                    <>
                                      <Btn size="sm" variant="outline" data-testid="opp-accept" onClick={async () => {
                                        const r = await api.decideOpportunity(o.id, 'accept');
                                        if (r.session_id) setNotice(`Investigation session #${r.session_id} created — confirm it to run.`);
                                        loadOpps(a.id);
                                      }}>Investigate</Btn>
                                      <Btn size="sm" variant="ghost" data-testid="opp-dismiss" onClick={async () => {
                                        await api.decideOpportunity(o.id, 'dismiss'); loadOpps(a.id);
                                      }}>Dismiss</Btn>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {replayFor === a.id && replay && (
                            <div data-testid="replay-drawer"
                                 style={{ marginTop: 4, paddingTop: 10, borderTop: `1px solid ${P.border}` }}>
                              <div style={{ fontSize: 10, fontWeight: 600, fontFamily: MONO,
                                            textTransform: 'uppercase', color: P.muted, marginBottom: 6 }}>
                                Replay — run {replay.run_id} (read-only, from the store)
                              </div>
                              {replay.steps.map((s, i) => (
                                <div key={s.node_key} data-testid={`replay-step-${s.node_key}`}
                                     style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0',
                                              borderBottom: `1px solid ${P.borderRow}` }}>
                                  <span style={{ fontSize: 11, fontFamily: MONO, color: P.faint }}>{i + 1}</span>
                                  <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 600 }}>{s.node_key}</span>
                                  <Badge tint={s.status === 'done' ? 'green' : 'amber'} xs>{s.status}</Badge>
                                  {s.cached && (
                                    <span style={{ fontSize: 11, fontFamily: MONO, color: P.green }}>
                                      cached · from run {s.prior_run_id}
                                    </span>
                                  )}
                                  <span style={{ fontSize: 10, fontFamily: MONO, color: P.faint, marginLeft: 'auto' }}>
                                    {s.gates.map(gt => `${gt.gate}:${gt.status}`).join(' ')}
                                  </span>
                                </div>
                              ))}
                              {replay.repair_attempts.length > 0 && (
                                <div data-testid="replay-repairs"
                                     style={{ marginTop: 6, fontSize: 11, fontFamily: MONO, color: P.muted }}>
                                  Repair attempts: {replay.repair_attempts.map(at => `cycle ${at.cycle} [${at.failed_checks.join(',')}] ${at.resolved ? 'resolved' : 'failed'}`).join(' · ')}
                                </div>
                              )}
                            </div>
                          )}
                          {explainFor === a.id && explain && (
                            <div data-testid="explain-panel"
                                 style={{ marginTop: 4, paddingTop: 10, borderTop: `1px solid ${P.border}`,
                                          fontSize: 12, fontFamily: FONT, display: 'grid',
                                          gridTemplateColumns: '1fr', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, fontFamily: MONO,
                                              textTransform: 'uppercase', color: P.muted }}>Lineage</div>
                                <div style={{ fontFamily: MONO, fontSize: 11 }}>
                                  run {explain.lineage.run_id} · gold: {explain.lineage.gold_tables.join(', ') || '—'}
                                </div>
                                <div style={{ fontFamily: MONO, fontSize: 11, color: P.faint }}>
                                  {explain.lineage.provenance_chain.map(c => c.artifact_type).join(' · ')}
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 600, fontFamily: MONO,
                                              textTransform: 'uppercase', color: P.muted, marginTop: 8 }}>
                                  Generated SQL
                                </div>
                                <pre style={{ fontSize: 10, fontFamily: MONO, background: P.bg, padding: 8,
                                              borderRadius: 4, overflow: 'auto', maxHeight: 80 }}>
                                  {explain.sql.ddl || explain.sql.gold_read_example || 'n/a'}
                                </pre>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, fontFamily: MONO,
                                              textTransform: 'uppercase', color: P.muted }}>Field bindings</div>
                                <div style={{ fontFamily: MONO, fontSize: 11 }}>
                                  format: {explain.field_bindings.metric_format || 'n/a'} · {explain.field_bindings.panels.map(pn => `${pn.panel}:${pn.mark}`).join(' · ')}
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 600, fontFamily: MONO,
                                              textTransform: 'uppercase', color: P.muted, marginTop: 8 }}>Model</div>
                                {explain.model ? (
                                  <div style={{ fontFamily: MONO, fontSize: 11 }}>
                                    {explain.model.algorithm} · gates {Object.entries(explain.model.gates).map(([k, v]) => `${k}:${v}`).join(' ')}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11, color: P.faint }}>Descriptive artifact — no model</div>
                                )}
                              </div>
                            </div>
                          )}
                          {provFor === a.id && (
                            <div data-testid="uas-provenance"
                                 style={{ marginTop: 4, paddingTop: 10, borderTop: `1px solid ${P.border}`,
                                          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: P.muted, fontFamily: MONO,
                                             textTransform: 'uppercase' }}>Provenance</span>
                              {provChain.length === 0 && (
                                <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
                                  No UAS chain recorded
                                </span>
                              )}
                              {provChain.map((n, i) => (
                                <span key={n.artifact_uid} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {i > 0 && <span style={{ color: P.faint, fontSize: 11 }}>·</span>}
                                  <span title={`${n.content_hash.slice(0, 12)}… · ${n.created_by_agent}`}
                                        style={{ fontSize: 11, fontFamily: MONO, background: P.bg,
                                                 border: `1px solid ${P.border}`, borderRadius: 4,
                                                 padding: '2px 7px', color: P.body }}>
                                    {n.artifact_type} <span style={{ color: P.faint }}>v{n.version}</span>
                                  </span>
                                </span>
                              ))}
                              {provDag && (
                                <div data-testid="dag-panel"
                                     style={{ width: '100%', marginTop: 8, display: 'flex', gap: 8,
                                              flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: 10, fontWeight: 600, color: P.muted, fontFamily: MONO,
                                                 textTransform: 'uppercase' }}>Execution graph</span>
                                  {provDag.nodes.map((n, i) => (
                                    <span key={n.node_key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      {i > 0 && <span style={{ color: P.faint, fontSize: 11 }}>·</span>}
                                      <span data-testid={`dag-node-${n.node_key}`}
                                            title={`${n.content_hash.slice(0, 12)}… · ${n.status}`}
                                            style={{ fontSize: 11, fontFamily: MONO, borderRadius: 4,
                                                     padding: '2px 7px',
                                                     border: `1px solid ${n.status === 'done' ? P.border : P.amberBorder}`,
                                                     background: n.cached ? P.greenBg : P.bg, color: P.body }}>
                                        {n.node_key}
                                        {!!n.cached && (
                                          <span data-testid="dag-node-cached"
                                                style={{ marginLeft: 5, color: P.green, fontWeight: 700 }}>
                                            cached
                                          </span>
                                        )}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div data-testid="ghost-tile" onClick={() => navigate('/app/create/new')}
                   style={{ border: `1.5px dashed ${P.borderStrong}`, borderRadius: 11,
                            minHeight: 180, cursor: 'pointer', display: 'flex',
                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 10, background: 'transparent' }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: P.accentSoft,
                               display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M7 2v10M2 7h10" stroke={P.accent} strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: P.body, fontFamily: FONT }}>
                  New dashboard from a question
                </span>
              </div>
            </div>
          </>
        )}

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <Btn size="sm" variant="outline" disabled={page <= 1} onClick={() => goPage(page - 1)}>Previous</Btn>
            <span style={{ fontSize: 13, color: P.muted, fontFamily: FONT }}>Page {page} of {totalPages}</span>
            <Btn size="sm" variant="outline" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>Next</Btn>
          </div>
        )}
      </div>

      {shareFor && <ShareModalV2 artifact={shareFor} onClose={() => setShareFor(null)} />}
    </div>
  );
}
