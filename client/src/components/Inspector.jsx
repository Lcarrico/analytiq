// R16S2E3: workbench inspector — six tabs composing the platform's existing
// backends (design bindings, gates, pipeline audit, insights, sharing, UAS
// versions). Per-component contracts land in the Data tab with R17.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, Tabs } from './ui';
import { FONT, MONO, P } from '../tokens';

const TABS = ['Design', 'Data', 'Pipeline', 'Insights', 'Share', 'Versions'];

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12.5, fontFamily: FONT }}>
      <span style={{ width: 90, flexShrink: 0, fontFamily: MONO, fontSize: 10.5,
                     textTransform: 'uppercase', color: P.muted, paddingTop: 1 }}>{k}</span>
      <span style={{ color: P.body, minWidth: 0, overflowWrap: 'anywhere' }}>{v}</span>
    </div>
  );
}

export default function Inspector({ artifact, runId }) {
  const [tab, setTab] = useState('Design');
  const [explain, setExplain] = useState(null);
  const [steps, setSteps] = useState([]);
  const [dag, setDag] = useState(null);
  const [insights, setInsights] = useState([]);
  const [shareUrl, setShareUrl] = useState(null);
  const [versions, setVersions] = useState([]);
  const [prov, setProv] = useState([]);
  const [contracts, setContracts] = useState(null);   // R17S1E1

  useEffect(() => {
    if (!artifact) return;
    api.explainArtifact(artifact.id).then(setExplain).catch(() => {});
    api.provenance(artifact.id).then(r => {
      setProv(r.chain || []);
      setDag(r.dag || null);
    }).catch(() => {});
  }, [artifact?.id]);
  useEffect(() => {
    if (!runId) return;
    api.pipelineSteps(runId).then(setSteps).catch(() => {});
    api.pipelineContracts(runId).then(setContracts).catch(() => {});
  }, [runId]);

  if (!artifact) return null;

  const gates = (dag?.edges || []).map(e => `${e.gate_name}:${e.gate_status}`);

  return (
    <div data-testid="inspector"
         style={{ width: 360, flexShrink: 0, borderLeft: `1px solid ${P.border}`,
                  paddingLeft: 14, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12 }}>
        {tab === 'Design' && (
          <div>
            {(explain?.field_bindings?.panels || []).map(p => (
              <div key={p.panel} style={{ border: `1px solid ${P.border}`, borderRadius: 8,
                                          padding: 10, marginBottom: 8 }}>
                <Row k="Section" v={p.panel} />
                <Row k="Mark" v={p.mark} />
                <Row k="Format" v={explain.field_bindings.metric_format || 'number'} />
              </div>
            ))}
            <div style={{ fontSize: 12, fontFamily: FONT, color: P.muted, marginTop: 6 }}>
              <strong style={{ color: P.body }}>Why this chart?</strong> Time-series intent maps
              to line marks; forecasts add a CI band; categorical breakdowns use bars —
              chart-type rules from the dashboard-plan grammar (§5.3).
            </div>
          </div>
        )}
        {tab === 'Data' && (
          <div>
            {(contracts?.data_contracts || []).map(dc => (
              <div key={dc.component_id} data-testid={`contract-${dc.component_id}`}
                   style={{ border: `1px solid ${P.border}`, borderRadius: 8, padding: 10,
                            marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: P.ink }}>
                    {dc.component_id}
                  </span>
                  <StatusBadge status={dc.empty_result ? 'amber' : 'green'}>
                    {dc.empty_result ? 'empty' : 'contract ✓'}
                  </StatusBadge>
                </div>
                <Row k="Rows" v={String(dc.row_count)} />
                <Row k="Columns" v={dc.actual_columns.map(c => c.name).join(', ')} />
                {Object.entries(dc.numeric_ranges).slice(0, 2).map(([col, r]) => (
                  <Row key={col} k={col} v={`${r.min} – ${r.max} (μ ${r.mean})`} />
                ))}
              </div>
            ))}
            <div style={{ fontSize: 11, fontFamily: MONO, textTransform: 'uppercase',
                          color: P.muted, margin: '10px 0 4px' }}>Gate results</div>
            {gates.map(g => (
              <div key={g} style={{ fontFamily: MONO, fontSize: 11.5, padding: '2px 0',
                                    color: g.endsWith('PASS') ? P.green : P.red }}>{g}</div>
            ))}
          </div>
        )}
        {tab === 'Pipeline' && (
          <div>
            {steps.map(s => (
              <div key={s.id} style={{ border: `1px solid ${P.border}`, borderRadius: 8,
                                       padding: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 11, fontFamily: MONO, color: P.muted, marginTop: 2 }}>
                  step {s.step} · {s.node_key}
                </div>
              </div>
            ))}
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
              {gates.join(' ')}
            </div>
          </div>
        )}
        {tab === 'Insights' && (
          <div>
            <button data-testid="insight-scan-btn"
                    onClick={() => api.scanInsights(artifact.id)
                      .then(r => setInsights(r.insights || [])).catch(() => {})}
                    style={{ height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                             border: `1px solid ${P.accentBorder}`, background: P.accentSoft,
                             color: P.accentHover, fontSize: 12, fontWeight: 600,
                             fontFamily: FONT, marginBottom: 10 }}>
              Scan for insights
            </button>
            {insights.map(i => (
              <div key={i.id} data-testid={`insight-row-${i.id}`}
                   style={{ border: `1px solid ${P.border}`, borderRadius: 8, padding: 10,
                            marginBottom: 8 }}>
                <StatusBadge status={i.kind === 'anomaly' ? 'amber' : 'gray'}>{i.kind}</StatusBadge>
                <div style={{ fontSize: 12.5, fontFamily: FONT, color: P.body, marginTop: 6 }}>
                  {i.summary}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'Share' && (
          <div>
            <button data-testid="make-share-link"
                    onClick={() => api.createShareLink(artifact.id, { expires_in_hours: 168 })
                      .then(r => setShareUrl(r.url)).catch(() => setShareUrl('failed'))}
                    style={{ height: 30, padding: '0 12px', borderRadius: 8, cursor: 'pointer',
                             border: `1px solid ${P.accentBorder}`, background: P.accentSoft,
                             color: P.accentHover, fontSize: 12, fontWeight: 600,
                             fontFamily: FONT, marginBottom: 10 }}>
              Create public link (7d)
            </button>
            {shareUrl && (
              <div data-testid="share-link-url"
                   style={{ fontFamily: MONO, fontSize: 11, color: P.body,
                            overflowWrap: 'anywhere' }}>{shareUrl}</div>
            )}
          </div>
        )}
        {tab === 'Versions' && (
          <div>
            {prov.map(c => (
              <div key={c.artifact_uid || c.content_hash}
                   style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0',
                            borderBottom: `1px solid ${P.borderRow}` }}>
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.body }}>
                  {c.artifact_type}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: P.muted }}>v{c.version}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint, marginLeft: 'auto' }}>
                  {(c.content_hash || '').slice(0, 8)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
