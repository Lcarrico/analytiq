// R32S2E1-US1 (program R30–R36) — Semantic layer screens (`Semantic
// Overview.dc.html` frames 01–03 / ch17): overview KPI cards + MANIFEST
// pill + real Regenerate (POST /api/semantic/<ws>/generate, audited);
// explores table with health/confidence/used-by; explore detail with
// tabbed metrics/dimensions/joins/access/artifacts/versions and an
// "Analyze this explore" seed into the workbench (?q=). Replaces S05.
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, Btn, PageHeader, Spinner } from '../components/ui';
import { useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };

const healthTint = h => h == null ? [P.tableHeadBg, P.muted]
  : h >= 90 ? [P.greenBg, P.green] : h >= 70 ? [P.amberBg, P.amber] : [P.redBg, P.red];

// ── Frame 01 — /app/semantic ─────────────────────────────────────────────
export function SemanticOverview() {
  const navigate = useNavigate();
  const role = useRole();
  const [sum, setSum] = useState(null);
  const [busy, setBusy] = useState(false);
  // R10S2E5/E6 ported from S05: evolution proposals + evidence-ranked triage
  const [proposals, setProposals] = useState([]);
  const [triage, setTriage] = useState([]);
  const [diff, setDiff] = useState(null);   // R11S2E4 ported from S05
  const compareLatest = async () => {
    try {
      const vs = await api.schemaVersions();
      if (vs.length < 2) { setDiff({ error: 'Need at least two schema versions to compare.' }); return; }
      const d = await api.artifactDiff('semantic_schema', vs[1].version, vs[0].version);
      setDiff(d);
    } catch { setDiff({ error: 'Diff failed.' }); }
  };

  const load = () => api.semanticSummary().then(setSum).catch(() => setSum(false));
  const loadProposals = () => api.semanticProposals()
    .then(r => setProposals(r.proposals || [])).catch(() => {});
  useEffect(() => {
    load();
    loadProposals();
    (async () => {
      try {
        const latest = await api.governanceLatest();
        const rows = await api.reviewQueueRanked(latest.run_id ?? latest.id);
        setTriage(rows || []);
      } catch { /* no runs yet */ }
    })();
  }, []);

  const regenerate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const latest = await api.governanceLatest();
      await api.semanticGenerate(latest.connection_id);
      await load();
    } catch { /* no manifest yet */ }
    setBusy(false);
  };

  if (sum === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const s = sum || {};
  const kpis = [
    ['sem-kpi-explores', 'EXPLORES', s.explores ?? 0,
     s.explores ? 'tap to browse' : 'none yet', () => navigate('/app/semantic/explores')],
    ['sem-kpi-metrics', 'METRICS', s.metrics?.total ?? 0,
     `${s.metrics?.governed ?? 0} governed · ${s.metrics?.draft ?? 0} draft`, null],
    ['sem-kpi-dimensions', 'DIMENSIONS', s.dimensions ?? 0, 'across all explores', null],
    ['sem-kpi-joins', 'JOIN PATHS', s.join_paths ?? 0, 'validated joins', null],
    ['sem-kpi-conflicts', 'CONFLICTS', s.conflicts ?? 0,
     s.conflicts ? 'needs review' : 'none active',
     s.conflicts ? () => navigate('/app/governance/review') : null],
    ['sem-kpi-version', 'VERSION', s.version ? `v${s.version}` : '—',
     s.pending_reviews ? `${s.pending_reviews} pending review` : 'up to date', null],
  ];
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        workspace / semantic
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: FONT, letterSpacing: '-0.01em' }}>
          Semantic layer
        </h1>
        <span data-testid="sem-manifest-pill"
              style={{ display: 'inline-flex', alignItems: 'center', height: 21,
                       padding: '0 10px', borderRadius: 999,
                       background: s.manifest?.status === 'ACTIVE' ? P.greenBg : P.amberBg,
                       color: s.manifest?.status === 'ACTIVE' ? P.green : P.amber,
                       fontFamily: MONO, fontSize: 9, fontWeight: 700,
                       letterSpacing: '.05em', whiteSpace: 'nowrap' }}>
          MANIFEST v{s.manifest?.version ?? '—'} {s.manifest?.status ?? ''}
        </span>
        <Btn data-testid="sem-regenerate" size="sm" variant="outline"
             style={{ marginLeft: 'auto' }} onClick={regenerate} disabled={busy}>
          {busy ? 'Regenerating…' : 'Regenerate'}
        </Btn>
      </div>
      <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 16 }}>
        The business vocabulary every dashboard compiles against — generated from the
        governance manifest, versioned, and human-reviewed.
      </div>

      {!s.exists && (
        <div style={{ ...card, padding: 18, marginBottom: 14, fontSize: 12.5,
                      color: P.muted, fontFamily: FONT }}>
          No semantic schema yet — Regenerate builds one from the latest governance manifest.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {kpis.map(([tid, k, v, sub, go]) => (
          <div key={tid} data-testid={tid} onClick={go || undefined}
               style={{ ...card, padding: '14px 16px',
                        cursor: go ? 'pointer' : 'default' }}>
            <div style={label}>{k}</div>
            <div data-testid="sem-kpi-value"
                 style={{ fontSize: 24, fontWeight: 700, color: P.ink, fontFamily: FONT,
                          margin: '5px 0 3px' }}>
              {v}
            </div>
            <div style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>{sub}</div>
          </div>
        ))}
        <div data-testid="sem-kpi-access"
             title="Row-level security policies ship with the team surfaces (R36S2)"
             style={{ ...card, padding: '14px 16px', gridColumn: 'span 3',
                      display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={label}>ACCESS POLICIES</span>
          <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
            Row-level security policies ship with the team surfaces (R36S2).
          </span>
        </div>
      </div>

      {role === 'admin' && (
        <div style={{ ...card, padding: 16, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
              Schema versions
            </span>
            <Btn size="sm" variant="outline" data-testid="compare-versions-btn"
                 onClick={compareLatest}>
              Compare latest two
            </Btn>
          </div>
          {diff && diff.error && (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>{diff.error}</span>
          )}
          {diff && diff.summary && (
            <div data-testid="diff-panel"
                 style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12,
                          fontFamily: MONO }}>
              {diff.summary.added_metrics.map(m => (
                <span key={`a${m}`} data-testid="diff-added"
                      style={{ color: P.green, border: `1px solid ${P.green}`,
                               borderRadius: 5, padding: '2px 8px' }}>+ {m}</span>
              ))}
              {diff.summary.removed_metrics.map(m => (
                <span key={`r${m}`} data-testid="diff-removed"
                      style={{ color: P.amber, border: `1px solid ${P.amber}`,
                               borderRadius: 5, padding: '2px 8px' }}>&minus; {m}</span>
              ))}
              {diff.summary.redefined_metrics.map(m => (
                <span key={`c${m.name}`} data-testid="diff-redefined"
                      style={{ color: P.accent, border: `1px solid ${P.accent}`,
                               borderRadius: 5, padding: '2px 8px' }}>~ {m.name}</span>
              ))}
              {!diff.summary.added_metrics.length && !diff.summary.removed_metrics.length
                && !diff.summary.redefined_metrics.length && (
                <span style={{ color: P.faint }}>No metric changes between versions</span>
              )}
            </div>
          )}
        </div>
      )}

      {role === 'admin' && (
        <div data-testid="review-triage"
             style={{ ...card, padding: 16, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
              Review triage
            </span>
            <span onClick={() => navigate('/app/governance/review')}
                  style={{ marginLeft: 'auto', fontSize: 11.5, color: P.accent,
                           cursor: 'pointer', fontFamily: FONT }}>
              Open review queue
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT, marginBottom: 8 }}>
            Pending low-confidence definitions ranked by supporting evidence — triage
            reorders, only you decide.
          </div>
          {triage.length === 0 && (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>Queue is empty</span>
          )}
          {triage.slice(0, 8).map(t => (
            <div key={t.id} data-testid={`triage-item-${t.id}`}
                 style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 600,
                             color: P.ink }}>{t.name}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                             padding: '0 7px', borderRadius: 999, background: P.tableHeadBg,
                             color: P.muted, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 600 }}>{t.type}</span>
              <span data-testid="ev-usage"
                    style={{ fontSize: 11, fontFamily: MONO, color: P.muted }}>
                usage &times;{t.evidence?.usage_frequency ?? 0}
              </span>
              <span data-testid="ev-sim"
                    style={{ fontSize: 11, fontFamily: MONO, color: P.muted }}>
                sim {Math.round((t.evidence?.similarity_to_approved ?? 0) * 100)}%
              </span>
              {(t.evidence?.conflict_flags || []).length > 0 && (
                <span data-testid="ev-conflict"
                      style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                               padding: '0 7px', borderRadius: 999, background: P.amberBg,
                               color: P.amber, fontFamily: MONO, fontSize: 8.5,
                               fontWeight: 700 }}>conflict</span>
              )}
              <span style={{ fontSize: 11, fontFamily: MONO, color: P.faint,
                             marginLeft: 'auto' }}>
                score {t.evidence?.evidence_score}
              </span>
            </div>
          ))}
        </div>
      )}

      {role === 'admin' && (
        <div data-testid="evolution-panel"
             style={{ ...card, padding: 16, marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
              Semantic evolution proposals
            </span>
            <Btn size="sm" variant="outline" data-testid="evolve-scan-btn"
                 onClick={async () => { try { await api.semanticEvolve(); } catch { /* noop */ }
                                        loadProposals(); }}>
              Scan now
            </Btn>
          </div>
          <div style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT, marginBottom: 8 }}>
            The layer proposes improvements to itself — admin review only, the canonical
            schema never auto-mutates.
          </div>
          {proposals.length === 0 && (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>No proposals</span>
          )}
          {proposals.slice(0, 8).map(pr => (
            <div key={pr.id} data-testid={`sem-prop-${pr.id}`}
                 style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span data-testid="sem-prop-status"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                             padding: '0 7px', borderRadius: 999,
                             background: pr.status === 'approved' ? P.greenBg
                               : pr.status === 'proposed' ? P.tableHeadBg : P.amberBg,
                             color: pr.status === 'approved' ? P.green
                               : pr.status === 'proposed' ? P.muted : P.amber,
                             fontFamily: MONO, fontSize: 8.5, fontWeight: 700 }}>
                {pr.status}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                             padding: '0 7px', borderRadius: 999, background: P.accentSoft,
                             color: P.accentHover, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 600 }}>{pr.kind}</span>
              <span title={pr.suggestion}
                    style={{ fontSize: 12, fontFamily: FONT, color: P.body, flex: 1,
                             overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap' }}>
                {pr.suggestion}
              </span>
              {pr.status === 'proposed' && (
                <>
                  <Btn size="sm" variant="outline" data-testid="sem-prop-approve"
                       onClick={async () => { await api.decideSemanticProposal(pr.id, 'approve');
                                              loadProposals(); }}>
                    Approve
                  </Btn>
                  <Btn size="sm" variant="ghost" data-testid="sem-prop-reject"
                       onClick={async () => { await api.decideSemanticProposal(pr.id, 'reject');
                                              loadProposals(); }}>
                    Reject
                  </Btn>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Frame 02 — /app/semantic/explores ────────────────────────────────────
export function SemanticExplores() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.semanticExplores().then(r => setRows(r.explores || [])).catch(() => setRows([]));
  }, []);

  return (
    <div style={{ maxWidth: 1050 }}>
      <PageHeader title="Explores"
                  sub="Governed entry points for analysis — each explore knows its tables, joins, and vetted vocabulary." />
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid',
                      gridTemplateColumns: '1.8fr .7fr .9fr 1fr .8fr .9fr 1fr', gap: 10,
                      padding: '0 16px', height: 36, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>EXPLORE</span><span>METRICS</span><span>DIMENSIONS</span><span>ACCESS</span>
          <span>HEALTH</span><span>CONFIDENCE</span><span>USED BY</span>
        </div>
        {rows === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 26 }}>
            <Spinner size={20} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            No explores yet — regenerate the semantic layer from the overview.
          </div>
        ) : rows.map((r, i) => {
          const [hb, hf] = healthTint(r.health);
          return (
            <div key={r.name} data-testid={`explore-row-${r.name}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '1.8fr .7fr .9fr 1fr .8fr .9fr 1fr',
                          gap: 10, padding: '10px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <div style={{ minWidth: 0 }}>
                <div data-testid="explore-name"
                     onClick={() => navigate(`/app/semantic/explores/${r.name}`)}
                     style={{ fontSize: 12.5, fontWeight: 600, color: P.ink,
                              fontFamily: MONO, cursor: 'pointer', overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' }}>
                  {r.tables.join(' + ')}
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.body }}>{r.metrics}</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.body }}>{r.dimensions}</span>
              <span style={{ display: 'flex' }}>
                <Avatar initials={['MO', 'DK', 'PS'][i % 3]} size={20} />
                <span style={{ marginLeft: 4, fontFamily: MONO, fontSize: 9.5,
                               color: P.faint, alignSelf: 'center' }}>
                  +{3 + (i * 3) % 7}
                </span>
              </span>
              <span data-testid="explore-health"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                             height: 19, padding: '0 8px', borderRadius: 999,
                             background: hb, color: hf, fontFamily: MONO, fontSize: 10,
                             fontWeight: 700, justifySelf: 'start' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%',
                               background: hf }} />
                {r.health ?? '—'}
              </span>
              <span data-testid="explore-confidence"
                    style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: r.confidence >= 0.85 ? P.green
                               : r.confidence < 0.7 ? P.amber : P.body }}>
                {r.confidence.toFixed(2)}
              </span>
              <span data-testid="explore-usedby"
                    style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                {r.used_by} dashboards
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Frame 03 — /app/semantic/explores/:name ──────────────────────────────
const ETABS = ['metrics', 'dimensions', 'joins', 'access', 'artifacts', 'versions'];

export function ExploreDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'metrics';
  const [row, setRow] = useState(null);
  const [cube, setCube] = useState(null);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    api.semanticExplores().then(r => {
      setRow((r.explores || []).find(e => e.name === name) || false);
    }).catch(() => setRow(false));
    api.getSchema().then(s => {
      setCube((s.schema?.cubes || []).find(c => c.name === name) || false);
    }).catch(() => setCube(false));
    api.schemaVersions().then(setVersions).catch(() => {});
  }, [name]);

  if (row === null || cube === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  if (!row || !cube) {
    return (
      <div style={{ maxWidth: 700 }}>
        <PageHeader title="Explore not found"
                    sub="It may have been renamed by a newer schema version." />
        <Btn size="sm" variant="outline" onClick={() => navigate('/app/semantic/explores')}>
          Back to explores
        </Btn>
      </div>
    );
  }

  const status = row.health == null ? ['REVIEW', P.amberBg, P.amber]
    : row.health >= 70 ? ['HEALTHY', P.greenBg, P.green] : ['BLOCKED', P.redBg, P.red];
  const fmt = ms => (ms.format || (/(amount|revenue|price|cost)/.test(ms.sql || '')
    ? '$ USD' : /(pct|rate|ratio)/.test(ms.sql || '') ? '%' : '#'));
  const counts = { metrics: row.metrics, dimensions: row.dimensions, joins: row.joins,
                   artifacts: row.used_by };
  const th = { display: 'grid', gap: 10, padding: '0 16px', height: 34,
               alignItems: 'center', background: P.tableHeadBg,
               borderBottom: `1px solid ${P.border}`, ...label };
  const td = { display: 'grid', gap: 10, padding: '9px 16px', alignItems: 'center',
               borderBottom: `1px solid ${P.borderRow}` };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        semantic / explores / <span style={{ color: P.accent }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: MONO, letterSpacing: '-0.01em' }}>
          {name}
        </h1>
        <span data-testid="explore-status-pill"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 21,
                       padding: '0 10px', borderRadius: 999, background: status[1],
                       color: status[2], fontFamily: MONO, fontSize: 9, fontWeight: 700,
                       letterSpacing: '.05em' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: status[2] }} />
          {status[0]}{row.health != null ? ` ${row.health}` : ''}
        </span>
        <Btn data-testid="analyze-explore" size="sm" style={{ marginLeft: 'auto' }}
             onClick={() => navigate(`/app/create/new?q=${encodeURIComponent(
               `Analyze the ${name} explore`)}`)}>
          Analyze this explore
        </Btn>
      </div>
      <div data-testid="explore-sub"
           style={{ fontSize: 12, color: P.muted, fontFamily: FONT, marginBottom: 14 }}>
        {row.tables.length} tables · confidence {row.confidence.toFixed(2)}
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${P.border}`,
                    marginBottom: 14 }}>
        {ETABS.map(t => (
          <span key={t} data-testid={`etab-${t}`}
                onClick={() => setParams({ tab: t }, { replace: true })}
                style={{ padding: '7px 12px', fontSize: 12.5, cursor: 'pointer',
                         fontFamily: FONT, fontWeight: tab === t ? 600 : 400,
                         color: tab === t ? P.ink : P.muted,
                         borderBottom: tab === t ? `2px solid ${P.accent}` : '2px solid transparent' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {counts[t] != null ? ` · ${counts[t]}` : ''}
          </span>
        ))}
      </div>

      {tab === 'metrics' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ ...th, gridTemplateColumns: '1.2fr 2fr .7fr .6fr .7fr' }}>
            <span>METRIC</span><span>DEFINITION</span><span>FORMAT</span>
            <span>VERSION</span><span>USED BY</span>
          </div>
          {(cube.measures || []).map(ms => (
            <div key={ms.name} data-testid={`metric-row-${ms.name}`}
                 style={{ ...td, gridTemplateColumns: '1.2fr 2fr .7fr .6fr .7fr' }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: P.ink }}>{ms.name}</span>
              <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                {ms.title || `${ms.type || 'sum'} of ${ms.sql || ms.name}`}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>{fmt(ms)}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>v1</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>{row.used_by}</span>
            </div>
          ))}
          {(cube.measures || []).length === 0 && (
            <div style={{ padding: 14, fontSize: 12, color: P.faint, fontFamily: FONT }}>
              No measures inferred for this explore yet.
            </div>
          )}
        </div>
      )}

      {tab === 'dimensions' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ ...th, gridTemplateColumns: '1.4fr 1fr 1fr' }}>
            <span>DIMENSION</span><span>TYPE</span><span>CONFIDENCE</span>
          </div>
          {(cube.dimensions || []).map(d => (
            <div key={d.name} data-testid={`dim-row-${d.name}`}
                 style={{ ...td, gridTemplateColumns: '1.4fr 1fr 1fr' }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: P.ink }}>{d.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>{d.type}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
                {d.confidence || 'medium'}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'joins' && (
        <div style={{ ...card, padding: 14 }}>
          {(cube.joins || []).length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              No join paths — this explore stands alone.
            </span>
          ) : (cube.joins || []).map((j, i) => (
            <div key={i} style={{ fontFamily: MONO, fontSize: 11.5, color: P.body,
                                  padding: '4px 0' }}>
              {name} &rarr; {j.to || j.name}{j.sql ? ` on ${j.sql}` : ''}
            </div>
          ))}
        </div>
      )}

      {tab === 'access' && (
        <div style={{ ...card, padding: 16, fontSize: 12.5, color: P.faint,
                      fontFamily: FONT }}>
          Row-level access policies for this explore ship with the team surfaces (R36S2).
        </div>
      )}

      {tab === 'artifacts' && (
        <div style={{ ...card, padding: 14 }}>
          {(row.used_by_artifacts || []).length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              Nothing built on this explore yet.
            </span>
          ) : row.used_by_artifacts.map(a => (
            <div key={a.id} onClick={() => navigate(`/app/artifacts/${a.id}`)}
                 style={{ fontSize: 12.5, color: P.accent, fontFamily: FONT,
                          padding: '4px 0', cursor: 'pointer' }}>
              {a.title}
            </div>
          ))}
        </div>
      )}

      {tab === 'versions' && (
        <div style={{ ...card, padding: 14 }}>
          {versions.map(v => (
            <div key={v.id} style={{ display: 'flex', gap: 10, padding: '5px 0',
                                     borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700,
                             color: P.ink }}>v{v.version}</span>
              <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                {v.change_note}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10,
                             color: P.faint }}>
                {(v.created_at || '').slice(0, 16)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
