import { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context';
import { Badge, Btn, Card, DataTable, PageHeader, Spinner, StatusBadge, ViewToggle } from '../components/ui';
import { Icon } from '../components/icons';   // R21S1E3
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

function MiniChart() {
  return (
    <div style={{ width: 120, height: 68, background: C.primaryLight, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      <svg width={90} height={48} viewBox="0 0 90 48">
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity={0.22} />
            <stop offset="100%" stopColor={C.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <polygon points="0,38 15,28 30,33 45,18 60,23 75,8 90,13 90,48 0,48" fill="url(#mg)" />
        <polyline points="0,38 15,28 30,33 45,18 60,23 75,8 90,13" fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ShareModal({ artifact, onClose }) {
  const [shares,  setShares]  = useState([]);
  const [email,   setEmail]   = useState('');
  const [role,    setRole]    = useState('Viewer');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.getShares(artifact.id)
      .then(setShares)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artifact.id]);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      const s = await api.addShare(artifact.id, { email, role });
      setShares(prev => [...prev, s]);
      setEmail('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (shareId) => {
    try {
      await api.removeShare(artifact.id, shareId);
      setShares(prev => prev.filter(s => s.id !== shareId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.surface, borderRadius: 10, padding: 26, width: 480, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text, fontFamily: FONT }}>Share artifact</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textSec, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: 16, fontSize: 13, color: C.textSec, fontStyle: 'italic', fontFamily: FONT }}>"{artifact.title}"</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, fontFamily: FONT }}>Add workspace member</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="colleague@acme.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: FONT }}
            />
            <select value={role} onChange={e => setRole(e.target.value)}
              style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer', outline: 'none', fontFamily: FONT }}>
              <option>Viewer</option>
              <option>Editor</option>
              <option>Owner</option>
            </select>
            <Btn size="sm" disabled={saving || !email.trim()} onClick={handleAdd}>
              {saving ? '...' : 'Add'}
            </Btn>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner /></div>
        ) : shares.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, fontFamily: FONT }}>Shared with</div>
            {shares.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                <span style={{ fontSize: 13, color: C.text, fontFamily: FONT }}>{s.email}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge xs>{s.role}</Badge>
                  <button onClick={() => handleRemove(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTer, fontSize: 14 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '10px 12px', background: C.bg, borderRadius: 6, fontSize: 12, color: C.textSec, fontFamily: FONT }}>
          Public links and embed tokens are out of scope for v1 — available in Phase 2.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Btn onClick={onClose}>Done</Btn>
        </div>
      </div>
    </div>
  );
}

const CRON_OPTIONS = [
  { label: 'Daily (6 AM)',       cron: '0 6 * * *' },
  { label: 'Weekly (Mon 6 AM)',  cron: '0 6 * * 1' },
  { label: 'Monthly (1st 6 AM)', cron: '0 6 1 * *' },
];

function cronLabel(expr) {
  const m = CRON_OPTIONS.find(o => o.cron === expr);
  return m ? m.label : expr;
}

function ScheduleMenu({ artifact, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  const active = artifact.schedule_enabled && artifact.schedule_cron;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = async (cron) => {
    setSaving(true);
    try {
      if (cron) {
        await api.putSchedule(artifact.id, { cron_expr: cron });
      } else {
        await api.deleteSchedule(artifact.id);
      }
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Btn size="sm" variant={active ? 'primary' : 'outline'} onClick={() => setOpen(!open)}>
        {saving ? '...' : active ? cronLabel(artifact.schedule_cron) : 'Schedule'}
      </Btn>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 190, padding: 4,
        }}>
          {CRON_OPTIONS.map(opt => (
            <div
              key={opt.cron}
              onClick={() => handleSelect(opt.cron)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontFamily: FONT,
                color: artifact.schedule_cron === opt.cron ? C.primary : C.text,
                borderRadius: 6, fontWeight: artifact.schedule_cron === opt.cron ? 600 : 400,
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.primaryLight}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {opt.label}
            </div>
          ))}
          {active && (
            <>
              <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
              <div
                onClick={() => handleSelect(null)}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontFamily: FONT,
                  color: C.error, borderRadius: 6,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.errorBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Turn off
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
  fontSize: 13, fontFamily: FONT, background: C.surface, color: C.text,
  cursor: 'pointer', outline: 'none',
};

const inputStyle = {
  padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
  fontSize: 13, fontFamily: FONT, outline: 'none', width: 240,
};

export default function Screen10() {
  const { update, nav } = useApp();
  const [items,     setItems]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [perPage]                 = useState(20);
  const [loading,   setLoading]   = useState(true);
  const [shareFor,  setShareFor]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [typeFilter,setTypeFilter]= useState('');
  const [dqFilter,  setDqFilter]  = useState('');
  const [sandboxView, setSandboxView] = useState(false);  // R9S2E6
  const [view, setView] = useState('cards');             // R15S2E3
  const debounceRef = useRef(null);

  const [notice, setNotice] = useState('');
  const [provFor, setProvFor] = useState(null);      // R8S1E1: provenance panel toggle
  const [provChain, setProvChain] = useState([]);
  const [provDag, setProvDag] = useState(null);       // R8S2E3: execution graph
  const [explainFor, setExplainFor] = useState(null);  // R11S1E1
  const [explain, setExplain] = useState(null);
  const [health, setHealth] = useState({});            // R11S2E5
  useEffect(() => {
    items.slice(0, 20).forEach(a => {
      if (health[a.id] === undefined) {
        api.artifactHealth(a.id)
          .then(h => setHealth(prev => ({ ...prev, [a.id]: h.score })))
          .catch(() => setHealth(prev => ({ ...prev, [a.id]: null })));
      }
    });
  }, [items]);
  const [replayFor, setReplayFor] = useState(null);    // R11S2E3
  const [replay, setReplay] = useState(null);
  const [oppFor, setOppFor] = useState(null);          // R12S1E1
  const [opps, setOpps] = useState([]);
  const [monFor, setMonFor] = useState(null);          // R12S2E4
  const [mon, setMon] = useState(null);
  const loadOpps = async (id) => {
    const r = await api.opportunities(id);
    setOpps(r.opportunities); setOppFor(id);
  };
  const [ftsHits, setFtsHits] = useState(null);

  const globalSearch = async (q) => {
    if (!q) { setFtsHits(null); return; }
    try { setFtsHits(await api.search(q)); } catch { setFtsHits([]); }
  };

  const makeHealthDashboard = async () => {
    try {
      const art = await api.healthDashboard();
      setNotice(`Workspace health dashboard created (artifact #${art.id}).`);
      fetchArtifacts(search, typeFilter, dqFilter, 1);
    } catch { setNotice('Could not build the health dashboard.'); }
  };

  const fetchArtifacts = useCallback((q, type, dq_status, pg, sandbox = sandboxView) => {
    setLoading(true);
    api.getArtifacts({ q: q || undefined, type: type || undefined, dq_status: dq_status || undefined, page: pg, sandbox })
      .then(res => { setItems(res.items); setTotal(res.total); setPage(res.page); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchArtifacts(search, typeFilter, dqFilter, 1, sandboxView);
  }, [typeFilter, dqFilter, sandboxView]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchArtifacts(search, typeFilter, dqFilter, 1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const goPage = (pg) => fetchArtifacts(search, typeFilter, dqFilter, pg);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const handleDelete = async (id) => {
    if (!confirm('Delete this artifact?')) return;
    await api.deleteArtifact(id).catch(() => {});
    fetchArtifacts(search, typeFilter, dqFilter, page);
  };

  const handleOpen = (art) => {
    update({ artifactId: art.id });
    nav(9);
  };

  return (
    <div>
      <PageHeader
        title="Workspace artifacts"
        sub={loading ? '' : `${total} saved ${total === 1 ? 'analysis' : 'analyses'} · shareable with your team`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <ViewToggle view={view} onChange={setView} />
            <Btn variant="outline" data-testid="roi-report-btn" onClick={async () => {
              try {
                await api.roiReport();
                setNotice('ROI report generated as a native artifact.');
                fetchArtifacts(search, typeFilter, dqFilter, 1);
              } catch { setNotice('ROI report needs analyst access.'); }
            }}>⊙ ROI report</Btn>
            <Btn variant={sandboxView ? 'primary' : 'outline'} data-testid="sandbox-toggle"
                 onClick={() => setSandboxView(!sandboxView)}>⧉ Sandbox</Btn>
            <Btn variant="outline" onClick={makeHealthDashboard}>Health dashboard</Btn>
            <Btn onClick={() => nav(2)}>+ New analysis</Btn>
          </div>
        }
      />

      {notice && (
        <div style={{ marginBottom: 12, padding: '9px 12px', background: '#eef3ff', borderRadius: 6,
                      fontSize: 12, fontFamily: FONT, wordBreak: 'break-all' }}>
          {notice}
          <button onClick={() => setNotice('')} style={{ float: 'right', border: 'none',
                  background: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
        <input placeholder="Deep search (titles + metric names, FTS)…"
               onKeyDown={e => e.key === 'Enter' && globalSearch(e.target.value)}
               style={{ flex: 1, padding: '8px 12px', borderRadius: 6,
                        border: `1px solid ${C.border}`, fontSize: 12, fontFamily: MONO,
                        outline: 'none' }} />
      </div>
      {ftsHits && (
        <div style={{ marginBottom: 12, fontSize: 12, fontFamily: MONO }}>
          {ftsHits.length === 0 ? 'No full-text matches.'
            : ftsHits.map(h => (
                <span key={h.id} style={{ marginRight: 12 }}>
                  <a href={`/api/artifacts/${h.id}/html`} target="_blank" rel="noreferrer"
                     style={{ color: C.primary }}>#{h.id} {h.title}</a>
                </span>
              ))}
          <button onClick={() => setFtsHits(null)} style={{ border: 'none', background: 'none',
                  cursor: 'pointer', color: C.textTer }}>clear</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          <option value="Predictive">Predictive</option>
          <option value="Descriptive">Descriptive</option>
        </select>
        <select value={dqFilter} onChange={e => setDqFilter(e.target.value)} style={selectStyle}>
          <option value="">All DQ statuses</option>
          <option value="pass">Pass</option>
          <option value="warn">Warn</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
          <div style={{ fontSize: 16, color: C.textSec, marginBottom: 20, fontFamily: FONT }}>
            {search || typeFilter || dqFilter ? 'No matching artifacts.' : 'No artifacts yet.'}
          </div>
          {!search && !typeFilter && !dqFilter && <Btn onClick={() => nav(2)}>Start your first analysis →</Btn>}
        </div>
      ) : (
        <>
          {view === 'table' ? (
            <DataTable
              testid="artifacts-table"
              rowKey="id"
              columns={[
                { key: 'title', label: 'Title', sortable: true, width: '2fr' },
                { key: 'type', label: 'Type', width: '110px',
                  render: r => <StatusBadge status={r.type === 'Predictive' ? 'green' : 'gray'}>{r.type}</StatusBadge> },
                { key: 'dq_status', label: 'DQ', width: '100px',
                  render: r => <StatusBadge status={r.dq_status === 'pass' ? 'green' : 'amber'}>{r.dq_status}</StatusBadge> },
                { key: 'mape', label: 'MAPE', sortable: true, mono: true, width: '90px',
                  sortValue: r => r.mape ?? 999 },
                { key: 'owner', label: 'Owner', width: '1fr' },
                { key: 'created_at', label: 'Created', mono: true, width: '150px' },
              ]}
              rows={items}
            />
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(art => (
              <Card key={art.id} data-testid={`artifact-row-${art.id}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <MiniChart />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span onClick={() => handleOpen(art)} style={{ fontWeight: 600, fontSize: 14, color: C.text, cursor: 'pointer', fontFamily: FONT }}>
                        {art.title}
                      </span>
                      <Badge variant={art.type === 'Predictive' ? 'primary' : 'default'} xs>{art.type}</Badge>
                      {!!art.is_sandbox && <Badge variant="warning" xs data-testid="sandbox-badge">sandbox</Badge>}
                      {health[art.id] != null &&
                        <Badge variant={health[art.id] >= 80 ? 'success' : health[art.id] >= 60 ? 'default' : 'warning'} xs
                               data-testid="health-chip" title="Dashboard health: readability · accessibility · redundancy · performance · usefulness (§17.5.5)">
                          {health[art.id]}
                        </Badge>}
                      {art.confidence != null && art.confidence < 0.7 &&
                        <Badge variant="warning" xs data-testid="low-confidence-badge"
                               title="Propagated confidence below 0.7 — rendered, flagged, never hidden (§17.5.2)">
                          confidence {Math.round(art.confidence * 100)}%
                        </Badge>}
                      <StatusBadge status={art.dq_status === 'pass' ? 'green' : 'amber'}>DQ {art.dq_status}</StatusBadge>
                      {art.mape != null && <Badge variant="success" xs>MAPE {art.mape}%</Badge>}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.textTer, fontFamily: FONT }}>
                      <span>{art.owner}</span>
                      <span>{art.created_at ? new Date(art.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Just now'}</span>
                      {(art.share_count || 0) > 0 && <span>Shared with {art.share_count}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <Btn size="sm" variant="secondary" onClick={() => handleOpen(art)}>Open</Btn>
                    <button title="favorite"
                            onClick={async () => { await api.toggleFavorite(art.id); fetchArtifacts(search, typeFilter, dqFilter, page); }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}>
                      <Icon name={art.favorite ? 'StarFill' : 'Star'} size={14} style={{ display: 'inline', color: art.favorite ? '#d97706' : '#94a3b8' }} />
                    </button>
                    <Btn size="sm" variant="outline"   onClick={() => window.open(`/api/artifacts/${art.id}/html`, '_blank')}>Preview</Btn>
                    <Btn size="sm" variant="outline"   onClick={async () => {
                      try {
                        const r = await api.scanInsights(art.id);
                        setNotice(`${r.insights.length} insight(s): ` +
                                  r.insights.map(i => i.summary).join(' · '));
                      } catch { setNotice('Insight scan needs chart data.'); }
                    }}>Insights</Btn>
                    <Btn size="sm" variant="outline"   onClick={async () => {
                      try {
                        const r = await api.createShareLink(art.id, { expires_in_hours: 168 });
                        setNotice(`Public link (7d): ${window.location.origin}${r.url}`);
                      } catch { setNotice('Render the artifact before creating a public link.'); }
                    }}>Link</Btn>
                    <Btn size="sm" variant="outline"   onClick={async () => {
                      const r = await api.createEmbedToken(art.id, { scope: 'read_only', allowed_origins: ['*'] });
                      setNotice(`Embed token (24h): ${r.token.slice(0, 40)}…`);
                    }}>Embed</Btn>
                    <Btn size="sm" variant="outline"   onClick={async () => {
                      const feed = await api.activity(art.id);
                      setNotice('Activity: ' + feed.slice(0, 6).map(e => `${e.kind} by ${e.actor}`).join(' · '));
                    }}>Activity</Btn>
                    {!!art.is_sandbox && (
                      <Btn size="sm" variant="primary" data-testid="promote-btn" onClick={async () => {
                        try {
                          await api.promoteArtifact(art.id);
                          setNotice('Promoted to production — all gates passed.');
                          fetchArtifacts(search, typeFilter, dqFilter, page);
                        } catch (e) {
                          let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch {}
                          setNotice(`️ ${m}`);
                        }
                      }}>Promote</Btn>
                    )}
                    <Btn size="sm" variant="outline" data-testid="monitor-btn" onClick={async () => {
                      if (monFor === art.id) { setMonFor(null); return; }
                      try {
                        const m = await api.monitorArtifact(art.id);
                        setMon(m); setMonFor(art.id);
                      } catch { setNotice('Monitoring needs a completed run.'); }
                    }}>Monitor</Btn>
                    <Btn size="sm" variant="outline" data-testid="opportunities-btn" onClick={async () => {
                      if (oppFor === art.id) { setOppFor(null); return; }
                      try { await loadOpps(art.id); }
                      catch { setNotice('No opportunities recorded.'); }
                    }}>Opportunities</Btn>
                    <Btn size="sm" variant="outline" data-testid="replay-btn" onClick={async () => {
                      if (replayFor === art.id) { setReplayFor(null); return; }
                      try {
                        const rp = await api.pipelineReplay(art.pipeline_run_id);
                        setReplay(rp); setReplayFor(art.id);
                      } catch { setNotice('Replay needs a DAG-executed run.'); }
                    }}>Replay</Btn>
                    <Btn size="sm" variant="outline" data-testid="explain-btn" onClick={async () => {
                      if (explainFor === art.id) { setExplainFor(null); return; }
                      try {
                        const ex = await api.explainArtifact(art.id);
                        setExplain(ex); setExplainFor(art.id);
                      } catch { setNotice('Explain needs a completed pipeline run.'); }
                    }}>Explain</Btn>
                    <Btn size="sm" variant="outline" data-testid="provenance-btn" onClick={async () => {
                      if (provFor === art.id) { setProvFor(null); return; }
                      try {
                        const r = await api.provenance(art.id);
                        setProvChain(r.chain); setProvDag(r.dag); setProvFor(art.id);
                      } catch { setNotice('No provenance recorded for this artifact.'); }
                    }}>Provenance</Btn>
                    <Btn size="sm" variant="outline"   onClick={() => setShareFor(art)}>Share</Btn>
                    <ScheduleMenu artifact={art} onUpdate={() => fetchArtifacts(search, typeFilter, dqFilter, page)} />
                    <Btn size="sm" variant="ghost"     onClick={() => handleDelete(art.id)}>✕</Btn>
                  </div>
                </div>
                {monFor === art.id && mon && (
                  <div data-testid="monitor-panel" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, fontFamily: MONO }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.textSec }}>Model monitoring</span>
                    <Badge variant={mon.importance_drift.drifted ? 'warning' : 'success'} xs data-testid="mon-importance">
                      importance {mon.importance_drift.drifted ? `reordered τ ${mon.importance_drift.kendall_tau}` : 'stable'}
                    </Badge>
                    <Badge variant={mon.input_drift.drifted ? 'warning' : 'success'} xs data-testid="mon-input">
                      inputs {mon.input_drift.drifted ? `PSI ${mon.input_drift.psi}` : 'stable'}
                    </Badge>
                    {mon.triggers.length > 0 &&
                      <span style={{ fontSize: 11, color: C.textTer }}>retrain queued via drift event</span>}
                  </div>
                )}
                {oppFor === art.id && (
                  <div data-testid="opportunities-panel" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', color: C.textSec, marginBottom: 6 }}>
                      Opportunities — suggested next questions, never auto-generated (§17.4.1)
                    </div>
                    {opps.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>None found</span>}
                    {opps.map(o => (
                      <div key={o.id} data-testid={`opp-row-${o.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                        <Badge variant={o.status === 'open' ? 'default' : o.status === 'accepted' ? 'success' : 'warning'} xs
                               data-testid="opp-status">{o.status}</Badge>
                        <Badge variant="primary" xs>{o.kind}</Badge>
                        <span style={{ fontSize: 12, fontFamily: FONT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              title={o.question}>{o.headline}</span>
                        {o.status === 'open' && <>
                          <Btn size="sm" variant="outline" data-testid="opp-accept" onClick={async () => {
                            const r = await api.decideOpportunity(o.id, 'accept');
                            if (r.session_id) setNotice(`Investigation session #${r.session_id} created — confirm it to run.`);
                            loadOpps(art.id);
                          }}>Investigate</Btn>
                          <Btn size="sm" variant="ghost" data-testid="opp-dismiss" onClick={async () => {
                            await api.decideOpportunity(o.id, 'dismiss'); loadOpps(art.id);
                          }}>Dismiss</Btn>
                        </>}
                      </div>
                    ))}
                  </div>
                )}
                {replayFor === art.id && replay && (
                  <div data-testid="replay-drawer" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', color: C.textSec, marginBottom: 6 }}>
                      Replay — run {replay.run_id} (read-only, from the store)
                    </div>
                    {replay.steps.map((s, i) => (
                      <div key={s.node_key} data-testid={`replay-step-${s.node_key}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 11, fontFamily: MONO, color: C.textTer }}>{i + 1}</span>
                        <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 600 }}>{s.node_key}</span>
                        <Badge variant={s.status === 'done' ? 'success' : 'warning'} xs>{s.status}</Badge>
                        {s.cached && <span style={{ fontSize: 11, fontFamily: MONO, color: '#1a7f37' }}>cached · from run {s.prior_run_id}</span>}
                        <span style={{ fontSize: 10, fontFamily: MONO, color: C.textTer, marginLeft: 'auto' }}>
                          {s.gates.map(gt => `${gt.gate}:${gt.status}`).join(' ')}
                        </span>
                      </div>
                    ))}
                    {replay.repair_attempts.length > 0 && (
                      <div data-testid="replay-repairs" style={{ marginTop: 6, fontSize: 11, fontFamily: MONO, color: C.textSec }}>
                        Repair attempts: {replay.repair_attempts.map(a => `cycle ${a.cycle} [${a.failed_checks.join(',')}] ${a.resolved ? '→ resolved' : '→ failed'}`).join(' · ')}
                      </div>
                    )}
                  </div>
                )}
                {explainFor === art.id && explain && (
                  <div data-testid="explain-panel" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 12, fontFamily: FONT, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', color: C.textSec }}>Lineage</div>
                      <div style={{ fontFamily: MONO, fontSize: 11 }}>run {explain.lineage.run_id} · gold: {explain.lineage.gold_tables.join(', ') || '—'}</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: C.textTer }}>
                        {explain.lineage.provenance_chain.map(c => c.artifact_type).join(' → ')}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', color: C.textSec, marginTop: 8 }}>Generated SQL</div>
                      <pre style={{ fontSize: 10, fontFamily: MONO, background: C.bg, padding: 8, borderRadius: 4, overflow: 'auto', maxHeight: 80 }}>
                        {explain.sql.ddl || explain.sql.gold_read_example || 'n/a'}
                      </pre>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', color: C.textSec }}>Field bindings</div>
                      <div style={{ fontFamily: MONO, fontSize: 11 }}>
                        format: {explain.field_bindings.metric_format || 'n/a'} · {explain.field_bindings.panels.map(p => `${p.panel}:${p.mark}`).join(' · ')}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', color: C.textSec, marginTop: 8 }}>Model</div>
                      {explain.model ? (
                        <div style={{ fontFamily: MONO, fontSize: 11 }}>
                          {explain.model.algorithm} · gates {Object.entries(explain.model.gates).map(([k, v]) => `${k}:${v}`).join(' ')}
                        </div>
                      ) : <div style={{ fontSize: 11, color: C.textTer }}>Descriptive artifact — no model</div>}
                    </div>
                  </div>
                )}
                {provFor === art.id && (
                  <div data-testid="uas-provenance" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: MONO, textTransform: 'uppercase' }}>Provenance</span>
                    {provChain.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>No UAS chain recorded</span>}
                    {provChain.map((n, i) => (
                      <span key={n.artifact_uid} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {i > 0 && <span style={{ color: C.textTer, fontSize: 11 }}>→</span>}
                        <span title={`${n.content_hash.slice(0, 12)}… · ${n.created_by_agent}`}
                              style={{ fontSize: 11, fontFamily: MONO, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 7px', color: C.text }}>
                          {n.artifact_type} <span style={{ color: C.textTer }}>v{n.version}</span>
                        </span>
                      </span>
                    ))}
                    {provDag && (
                      <div data-testid="dag-panel" style={{ width: '100%', marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, fontFamily: MONO, textTransform: 'uppercase' }}>Execution graph</span>
                        {provDag.nodes.map((n, i) => (
                          <span key={n.node_key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {i > 0 && <span style={{ color: C.textTer, fontSize: 11 }}>→</span>}
                            <span data-testid={`dag-node-${n.node_key}`}
                                  title={`${n.content_hash.slice(0, 12)}… · ${n.status}`}
                                  style={{ fontSize: 11, fontFamily: MONO, borderRadius: 4, padding: '2px 7px',
                                           border: `1px solid ${n.status === 'done' ? C.border : '#e2b007'}`,
                                           background: n.cached ? '#eefaf0' : C.bg, color: C.text }}>
                              {n.node_key}
                              {!!n.cached && <span data-testid="dag-node-cached" style={{ marginLeft: 5, color: '#1a7f37', fontWeight: 700 }}>cached</span>}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <Btn size="sm" variant="outline" disabled={page <= 1} onClick={() => goPage(page - 1)}>Previous</Btn>
              <span style={{ fontSize: 13, color: C.textSec, fontFamily: FONT }}>Page {page} of {totalPages}</span>
              <Btn size="sm" variant="outline" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>Next</Btn>
            </div>
          )}
        </>
      )}

      {shareFor && (
        <ShareModal artifact={shareFor} onClose={() => setShareFor(null)} />
      )}
    </div>
  );
}
