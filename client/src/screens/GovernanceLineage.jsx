// R32S1E5-US1 (program R30–R36) — Lineage graph (`Governance Lineage.dc.html`
// frame 01 / ch16): dot-grid canvas with kind-typed node cards laid out in
// dependency columns, 6-part legend, zoom / auto-layout controls, click-to-
// select with downstream highlighting, a details panel with IMPACT IF BROKEN,
// and ?node= deep links — all over the live /api/lineage graph.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const KINDS = ['source', 'table', 'metric', 'gold', 'model', 'artifact'];
const KIND_OF = k => k === 'gold_table' ? 'gold' : k;                 // API kind -> legend kind
const KIND_COL = { source: 0, table: 1, metric: 2, gold: 3, model: 3, artifact: 4 };
const KIND_TINT = {
  source: '#64748b', table: P.accent, metric: '#7c3aed',
  gold: '#b45309', model: '#0e7490', artifact: '#15803d',
};
const NODE_W = 172, NODE_H = 52, COL_W = 214, ROW_H = 74, PAD = 24;

export default function GovernanceLineage() {
  const role = useRole();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [graph, setGraph] = useState(null);
  const [sel, setSel] = useState(params.get('node') || null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    (async () => {
      try {
        const latest = await api.governanceLatest();
        const g = await api.getLineage(latest.connection_id);
        setGraph(g);
      } catch { setGraph({ nodes: [], edges: [] }); }
    })();
  }, []);

  const pos = useMemo(() => {
    const rows = {};
    const out = {};
    for (const n of (graph?.nodes || [])) {
      const col = KIND_COL[KIND_OF(n.kind)] ?? 1;
      rows[col] = (rows[col] || 0);
      out[n.id] = { x: PAD + col * COL_W, y: PAD + rows[col] * ROW_H };
      rows[col] += 1;
    }
    return out;
  }, [graph]);

  const downstream = useMemo(() => {
    if (!sel || !graph) return new Set();
    const adj = {};
    for (const e of graph.edges) (adj[e.from] = adj[e.from] || []).push(e.to);
    const seen = new Set();
    const q = [...(adj[sel] || [])];
    while (q.length) {
      const n = q.shift();
      if (seen.has(n)) continue;
      seen.add(n);
      for (const m of adj[n] || []) q.push(m);
    }
    return seen;
  }, [sel, graph]);

  if (role !== 'admin') return <Forbidden />;
  if (!graph) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }

  const byId = Object.fromEntries(graph.nodes.map(n => [n.id, n]));
  const selNode = sel ? byId[sel] : null;
  const select = id => {
    setSel(id);
    if (id) setParams({ node: id }, { replace: true });
    else setParams({}, { replace: true });
  };
  const canvasH = Math.max(...Object.values(pos).map(p => p.y + NODE_H), 200) + PAD;
  const canvasW = PAD + 5 * COL_W;
  const dsCounts = kind =>
    [...downstream].filter(id => KIND_OF(byId[id]?.kind) === kind).length;
  const srcLabel = graph.nodes.find(n => n.kind === 'source')?.label || 'source';

  return (
    <div style={{ maxWidth: 1160 }}>
      <PageHeader title="Lineage graph"
                  sub="Every governed surface traced from source to artifact — select a node to see what depends on it." />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                       border: `1px solid ${P.borderStrong}`, borderRadius: 8,
                       padding: '0 4px', height: 30, background: '#fff' }}>
          <button data-testid="lin-zoom-out" onClick={() => setZoom(z => Math.max(70, z - 15))}
                  style={{ border: 'none', background: 'none', fontSize: 15, cursor: 'pointer',
                           color: P.body, width: 22 }}>
            &minus;
          </button>
          <span data-testid="lin-zoom"
                style={{ fontFamily: MONO, fontSize: 10.5, color: P.body, minWidth: 34,
                         textAlign: 'center' }}>
            {zoom}%
          </span>
          <button data-testid="lin-zoom-in" onClick={() => setZoom(z => Math.min(145, z + 15))}
                  style={{ border: 'none', background: 'none', fontSize: 14, cursor: 'pointer',
                           color: P.body, width: 22 }}>
            +
          </button>
        </span>
        <Btn data-testid="lin-auto-layout" size="sm" variant="outline"
             onClick={() => setZoom(100)}>
          Auto-layout
        </Btn>
        <Btn size="sm" variant="outline" disabled
             title="Graph export ships with the sharing formats (R33S2)">
          Export &darr;
        </Btn>
        <span data-testid="lin-legend"
              style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {KINDS.map(k => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                                   fontSize: 11, color: P.muted, fontFamily: FONT }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%',
                             background: KIND_TINT[k] }} />
              {k}
            </span>
          ))}
        </span>
      </div>

      <div style={{ display: 'grid',
                    gridTemplateColumns: selNode ? '1fr 280px' : '1fr', gap: 14 }}>
        <div style={{ border: `1px solid ${P.border}`, borderRadius: 10, background: '#fff',
                      overflow: 'auto', maxHeight: 560 }}>
          <div style={{ position: 'relative', width: canvasW, height: canvasH,
                        backgroundImage: 'radial-gradient(#dde3ec 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                        ...(zoom !== 100 ? { transform: `scale(${zoom / 100})`,
                                             transformOrigin: 'top left' } : {}) }}
               onClick={() => select(null)}>
            <svg data-testid="lin-edges" width={canvasW} height={canvasH}
                 style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {graph.edges.map((e, i) => {
                const a = pos[e.from], b = pos[e.to];
                if (!a || !b) return null;
                const hot = sel && (e.from === sel || downstream.has(e.from))
                            && (downstream.has(e.to));
                return (
                  <line key={i} x1={a.x + NODE_W} y1={a.y + NODE_H / 2}
                        x2={b.x} y2={b.y + NODE_H / 2}
                        stroke={hot ? P.accent : '#cbd5e1'}
                        strokeWidth={hot ? 1.8 : 1} />
                );
              })}
            </svg>
            {graph.nodes.map(n => {
              const k = KIND_OF(n.kind);
              const p = pos[n.id];
              const isSel = sel === n.id;
              const isDs = downstream.has(n.id);
              return (
                <div key={n.id} data-testid={`lin-node-${n.id}`}
                     data-selected={String(isSel)} data-downstream={String(isDs)}
                     onClick={ev => { ev.stopPropagation(); select(n.id); }}
                     style={{ position: 'absolute', left: p.x, top: p.y, width: NODE_W,
                              height: NODE_H, boxSizing: 'border-box', background: '#fff',
                              border: isSel ? `2px solid ${P.accent}`
                                : isDs ? `1.5px solid ${KIND_TINT[k]}`
                                : `1px solid ${P.borderStrong}`,
                              borderRadius: 9, padding: '7px 10px', cursor: 'pointer',
                              boxShadow: isSel ? '0 4px 14px rgba(37,99,235,.18)'
                                : '0 1px 2px rgba(15,23,42,.05)' }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700,
                                letterSpacing: '.08em', color: KIND_TINT[k],
                                textTransform: 'uppercase' }}>
                    {k}{isSel ? ' · SELECTED' : ''}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: P.ink, fontFamily: FONT,
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap', marginTop: 2 }}>
                    {n.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selNode && (
          <div data-testid="lin-detail"
               style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                        padding: 16, alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: P.ink, fontFamily: FONT,
                             overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap' }}>
                {selNode.label}
              </span>
              <span data-testid="lin-detail-close" onClick={() => select(null)}
                    style={{ marginLeft: 'auto', cursor: 'pointer', color: P.muted,
                             fontSize: 14, lineHeight: 1 }}>
                &#10005;
              </span>
            </div>
            {[
              ['Type', `${KIND_OF(selNode.kind)} · ${KIND_OF(selNode.kind) === 'table' ? srcLabel : 'governed'}`, 'lin-detail-type'],
              ...(selNode.health_score != null
                ? [['Health', `${selNode.health_score} / 100`, 'lin-detail-health']] : []),
              ...(selNode.row_count != null
                ? [['Rows', String(selNode.row_count), null]] : []),
              ['Downstream',
               `${dsCounts('metric')} metrics · ${dsCounts('gold')} gold · ${dsCounts('artifact')} artifacts`,
               null],
              ...(selNode.freshness ? [['Freshness', selNode.freshness, null]] : []),
            ].map(([k, v, tid]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                                    gap: 10, padding: '5px 0',
                                    borderBottom: `1px solid ${P.borderRow}` }}>
                <span style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT }}>{k}</span>
                <span {...(tid ? { 'data-testid': tid } : {})}
                      style={{ fontSize: 11.5, fontFamily: MONO, color: P.body,
                               textAlign: 'right' }}>
                  {v}
                </span>
              </div>
            ))}
            <div data-testid="lin-impact"
                 style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: P.muted,
                          letterSpacing: '.07em', margin: '12px 0 7px' }}>
              IMPACT IF BROKEN
            </div>
            {downstream.size === 0 ? (
              <div style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
                Nothing downstream yet &mdash; safe to modify.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[...downstream].slice(0, 6).map(id => {
                  const n = byId[id];
                  if (!n) return null;
                  const k = KIND_OF(n.kind);
                  const note = k === 'metric'
                    ? `${n.label} → ${dsCounts('artifact')} dashboards`
                    : k === 'gold' ? `${n.label} refresh`
                    : k === 'artifact' ? `${n.label} goes stale`
                    : k === 'model' ? `${n.label} retrains` : n.label;
                  return (
                    <div key={id} style={{ fontSize: 11.5, color: P.body, fontFamily: FONT,
                                           display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%',
                                     background: KIND_TINT[k], flex: 'none' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis',
                                     whiteSpace: 'nowrap' }}>{note}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <Btn data-testid="lin-open-table" size="sm" variant="outline"
                 style={{ marginTop: 14 }}
                 disabled={KIND_OF(selNode.kind) !== 'table'}
                 title={KIND_OF(selNode.kind) === 'table'
                   ? 'Profile, columns, PII and gates for this table'
                   : 'Only table nodes have a table detail'}
                 onClick={() => navigate(`/app/data/tables/latest/${selNode.id}`)}>
              Open table detail &rarr;
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
