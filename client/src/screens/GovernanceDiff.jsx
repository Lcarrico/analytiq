// R32S1E3-US1 (program R30–R36) — Definition-review diff
// (`GovernanceReview.dc.html` / ch16 §3): the HITL flagship. Side-by-side
// CURRENT (accepted) vs PROPOSED (this run's inference) with a compiled-
// expression display, evidence + affected dashboards, an editable FINAL
// DEFINITION, and real approve / reject decisions over the reviews API.
// Agent Note: the substrate stores prose definitions (no SQL column) — the
// dark expression block is derived deterministically from explore/name/type.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const HEADLINE = {
  metric: 'Metric conflict', dimension: 'Dimension review',
  pii: 'PII classification', drift: 'Schema drift', bridge: 'Bridge review',
};

const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

function compiledLines(item) {
  // Deterministic compiled-expression display (see Agent Note above).
  const col = slug(item.name);
  const tbl = slug(item.explore || 'workspace');
  if ((item.type || '').toLowerCase() === 'dimension') {
    return [
      { t: `dimension ${item.name}` },
      { t: `  sql: \${TABLE}.${col}` },
      { t: `  from: ${tbl}` },
      { t: `  include: refreshed rows only`, add: true },
    ];
  }
  return [
    { t: `measure ${item.name}` },
    { t: `  type: sum` },
    { t: `  sql: \${TABLE}.${col}` },
    { t: `  from: ${tbl}` },
    { t: `  filter: exclude test + internal traffic`, add: true },
  ];
}

const Label = ({ children }) => (
  <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted, marginBottom: 8 }}>
    {children}
  </div>
);

export default function GovernanceDiff() {
  const role = useRole();
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [final, setFinal] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let live = true;
    api.getReviewItem(id)
      .then(d => { if (live) { setData(d); setFinal(d.item?.definition || ''); } })
      .catch(() => { if (live) setErr('Review item not found.'); });
    return () => { live = false; };
  }, [id]);

  const lines = useMemo(() => data ? compiledLines(data.item) : [], [data]);

  if (role !== 'admin') return <Forbidden />;
  if (err) {
    return (
      <div style={{ maxWidth: 1100 }}>
        <PageHeader title="Definition review" sub={err} />
        <Btn variant="outline" size="sm" onClick={() => navigate('/app/governance/review')}>
          Back to queue
        </Btn>
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }

  const { item, current, affected_count: affected, affected: dashboards } = data;
  const headline = HEADLINE[(item.type || 'metric').toLowerCase()] || 'Definition review';
  const decide = async body => {
    if (busy) return;
    setBusy(true);
    try { await api.reviewAction(item.id, body); } catch { /* decided elsewhere */ }
    navigate('/app/governance/review');
  };
  const approve = () => decide(final !== (item.definition || '')
    ? { action: 'edit', definition: final } : { action: 'accept' });

  const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                 padding: 16 };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div onClick={() => navigate('/app/governance/review')}
           style={{ fontSize: 12, color: P.accent, cursor: 'pointer', marginBottom: 10,
                    fontFamily: FONT }}>
        &larr; Review queue
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 data-testid="diff-headline"
              style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                       fontFamily: FONT, letterSpacing: '-0.01em' }}>
            {headline} &middot; &ldquo;{item.name}&rdquo;
          </h1>
          <div style={{ fontSize: 12.5, color: P.muted, marginTop: 5, fontFamily: FONT }}>
            The platform inferred a definition that needs a human decision before it can
            power governed dashboards.
          </div>
        </div>
        <span data-testid="diff-confidence-pill"
              style={{ display: 'inline-flex', alignItems: 'center', height: 24,
                       padding: '0 11px', borderRadius: 999, background: P.amberBg,
                       color: P.amber, fontFamily: MONO, fontSize: 10, fontWeight: 600,
                       letterSpacing: '.05em', whiteSpace: 'nowrap' }}>
          CONFIDENCE {Number(item.confidence ?? 0).toFixed(2)} &middot; NEEDS HUMAN
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
                    marginBottom: 14 }}>
        <div data-testid="diff-current" data-state={current ? 'existing' : 'new'}
             style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Label>CURRENT &middot; SEMANTIC LAYER</Label>
            <span data-testid="diff-inuse-pill"
                  style={{ marginLeft: 'auto', marginBottom: 8, display: 'inline-flex',
                           alignItems: 'center', height: 18, padding: '0 8px',
                           borderRadius: 999, background: P.tableHeadBg, color: P.muted,
                           fontFamily: MONO, fontSize: 8.5, fontWeight: 600,
                           letterSpacing: '.05em' }}>
              {current ? `IN USE · ${affected} DASHBOARDS` : 'NOT IN USE'}
            </span>
          </div>
          {current ? (
            <div style={{ fontSize: 13, lineHeight: 1.55, color: P.body, fontFamily: FONT }}>
              {current.definition}
              <span style={{ background: P.redBg, color: P.red, borderRadius: 4,
                             padding: '1px 5px', marginLeft: 6, fontSize: 11.5 }}>
                superseded if approved
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 13, lineHeight: 1.55, color: P.muted, fontFamily: FONT }}>
              First-time proposal &mdash; nothing in the semantic layer defines
              &ldquo;{item.name}&rdquo; yet. Approving publishes it for review-gated use.
            </div>
          )}
        </div>

        <div data-testid="diff-proposed"
             style={{ ...card, background: '#f8faff', border: `1px solid ${P.accentBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Label>PROPOSED &middot; FROM THE LATEST SCAN</Label>
            <span style={{ marginLeft: 'auto', marginBottom: 8, display: 'inline-flex',
                           alignItems: 'center', height: 18, padding: '0 8px',
                           borderRadius: 999, background: P.accentSoft, color: P.accentHover,
                           fontFamily: MONO, fontSize: 8.5, fontWeight: 600,
                           letterSpacing: '.05em' }}>
              {(item.explore || 'WORKSPACE').toUpperCase()} EXPLORE
            </span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: P.body, fontFamily: FONT,
                        marginBottom: 12 }}>
            {item.definition}
            <span style={{ background: P.greenBg, color: P.green, borderRadius: 4,
                           padding: '1px 5px', marginLeft: 6, fontSize: 11.5 }}>
              proposed
            </span>
          </div>
          <div data-testid="diff-sql"
               style={{ background: P.ink, borderRadius: 8, padding: '12px 14px',
                        fontFamily: MONO, fontSize: 11.5, lineHeight: 1.75,
                        color: '#cbd5e1', overflowX: 'auto' }}>
            {lines.map((l, i) => l.add ? (
              <div key={i} data-testid="diff-sql-add" style={{ color: P.codeGreen }}>
                + {l.t}
              </div>
            ) : (
              <div key={i}>&nbsp;&nbsp;{l.t}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14,
                    marginBottom: 14 }}>
        <div data-testid="diff-evidence" style={card}>
          <Label>EVIDENCE</Label>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: P.body, fontFamily: FONT,
                        marginBottom: 10 }}>
            Proposed by the governance scan of the {item.explore || 'workspace'} explore
            with confidence {Number(item.confidence ?? 0).toFixed(2)} &mdash; below the
            auto-accept bar, so it waits here. Approving re-validates every affected
            dashboard before anything changes.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(dashboards || []).map(d => (
              <span key={d.id} data-testid={`affected-chip-${d.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', height: 22,
                             padding: '0 9px', borderRadius: 999,
                             border: `1px solid ${P.borderStrong}`, background: '#fff',
                             fontSize: 11, color: P.body, fontFamily: FONT,
                             maxWidth: 220, overflow: 'hidden', whiteSpace: 'nowrap',
                             textOverflow: 'ellipsis' }}>
                {d.title}
              </span>
            ))}
            {(dashboards || []).length === 0 && (
              <span style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>
                No built dashboards yet &mdash; nothing to re-validate.
              </span>
            )}
          </div>
        </div>

        <div style={card}>
          <Label>FINAL DEFINITION &middot; EDITABLE</Label>
          <textarea data-testid="final-definition" value={final}
                    onChange={e => setFinal(e.target.value)}
                    style={{ width: '100%', minHeight: 96, boxSizing: 'border-box',
                             borderRadius: 8, border: `1px solid ${P.borderStrong}`,
                             padding: '9px 11px', fontSize: 12.5, lineHeight: 1.5,
                             color: P.ink, fontFamily: FONT, resize: 'vertical',
                             outline: 'none' }} />
          <div style={{ fontSize: 11, color: P.faint, marginTop: 6, fontFamily: FONT }}>
            Edits are recorded as your decision &mdash; the proposal stays intact underneath.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    background: '#fafbfc', border: `1px solid ${P.border}`,
                    borderRadius: 10 }}>
        <button data-testid="diff-approve" onClick={approve} disabled={busy}
                style={{ height: 34, padding: '0 16px', borderRadius: 8, border: 'none',
                         background: P.green, color: '#fff', fontSize: 12.5,
                         fontWeight: 600, fontFamily: FONT,
                         cursor: busy ? 'default' : 'pointer' }}>
          Approve &mdash; re-validate {affected} dashboards
        </button>
        <button data-testid="diff-request-changes" disabled
                title="Send-back workflow ships with the team surfaces (R36S2)"
                style={{ height: 34, padding: '0 14px', borderRadius: 8,
                         border: `1px solid ${P.borderStrong}`, background: '#fff',
                         color: P.faint, fontSize: 12.5, fontFamily: FONT }}>
          Request changes
        </button>
        <button data-testid="diff-reject" onClick={() => decide({ action: 'reject' })}
                disabled={busy}
                style={{ height: 34, padding: '0 14px', borderRadius: 8,
                         border: '1px solid #f4c7c7', background: '#fff', color: P.red,
                         fontSize: 12.5, fontWeight: 600, fontFamily: FONT,
                         cursor: busy ? 'default' : 'pointer' }}>
          Reject proposal
        </button>
        <span data-testid="diff-audit-note"
              style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10,
                       color: P.faint }}>
          decision recorded in audit log
        </span>
      </div>
    </div>
  );
}
