// R36S1E1-US1 (program R30–R36) — Gold table detail (`Gold Contracts.dc.html`
// frame 02): IMMUTABLE header + facts, seven tabs over real substrate —
// Overview, Schema (PRAGMA), Quality gates (humanized dq_json), Lineage
// (graph deep link), Artifacts, Feature manifest (viewer link), Query
// contracts (per-run panel contracts, R36S1E2 deepens them).
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const mono = { fontFamily: MONO, fontSize: 11, color: P.body };
const GTABS = ['overview', 'schema', 'gates', 'lineage', 'artifacts', 'manifest', 'contracts'];
const GT_NAME = { overview: 'Overview', schema: 'Schema', gates: 'Quality gates',
                  lineage: 'Lineage', artifacts: 'Artifacts',
                  manifest: 'Feature manifest', contracts: 'Query contracts' };

export default function GoldDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const [d, setD] = useState(null);
  const [contracts, setContracts] = useState(null);

  useEffect(() => {
    api.goldTableDetail(id).then(setD).catch(() => setD(false));
  }, [id]);
  useEffect(() => {
    if (d?.pipeline_run_id) {
      api.pipelineContracts(d.pipeline_run_id).then(setContracts).catch(() => {});
    }
  }, [d]);

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
        <PageHeader title="Gold table not found" sub="It may belong to a cleaned-up session." />
        <Btn size="sm" variant="outline" onClick={() => navigate('/app/gold')}>
          Back to gold tables
        </Btn>
      </div>
    );
  }
  const allPass = d.gate_list.every(g => g.status === 'PASS');

  return (
    <div style={{ maxWidth: 960 }}>
      <div onClick={() => navigate('/app/gold')}
           style={{ fontSize: 12, color: P.accent, cursor: 'pointer', marginBottom: 10,
                    fontFamily: FONT }}>
        &larr; Gold tables
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <h1 data-testid="gd-name"
            style={{ margin: 0, fontSize: 20, fontWeight: 700, color: P.ink,
                     fontFamily: MONO, textTransform: 'uppercase' }}>
          GOLD.{d.table_name}
        </h1>
        <span data-testid="gd-pill"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 10px', borderRadius: 999,
                       background: allPass ? P.greenBg : P.amberBg,
                       color: allPass ? P.green : P.amber, fontFamily: MONO,
                       fontSize: 9, fontWeight: 700, letterSpacing: '.05em' }}>
          IMMUTABLE &middot; GATES {allPass ? '✓' : '!'}
        </span>
        <Btn size="sm" variant="outline" style={{ marginLeft: 'auto' }} disabled
             title="Warehouse passthrough queries ship with live warehouse connections">
          Query in warehouse
        </Btn>
      </div>
      <div data-testid="gd-sub"
           style={{ fontSize: 12, color: P.muted, fontFamily: FONT, marginBottom: 12 }}>
        session s-{d.session_id} &middot; grain {d.grain || '—'} &middot;{' '}
        {(d.row_count ?? 0).toLocaleString('en-US')} rows &middot; created{' '}
        {(d.created_at || '').slice(0, 16)}
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${P.border}`,
                    marginBottom: 14, flexWrap: 'wrap' }}>
        {GTABS.map(t => (
          <span key={t} data-testid={`gdtab-${t}`}
                onClick={() => setParams({ tab: t }, { replace: true })}
                style={{ padding: '7px 11px', fontSize: 12.5, cursor: 'pointer',
                         fontFamily: FONT, fontWeight: tab === t ? 600 : 400,
                         color: tab === t ? P.ink : P.muted,
                         borderBottom: tab === t ? `2px solid ${P.accent}`
                           : '2px solid transparent' }}>
            {GT_NAME[t]}
          </span>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ ...card, padding: 16, maxWidth: 620 }}>
          {[['TABLE', d.table_name], ['VERSION', `v${d.version} · immutable`],
            ['STATUS', d.status], ['GRAIN', d.grain || '—'],
            ['ROWS', (d.row_count ?? 0).toLocaleString('en-US')],
            ['GOVERNANCE MANIFEST', d.manifest_version || '—']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, padding: '6px 0',
                                  borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ ...label, width: 180, flex: 'none' }}>{k}</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: P.body }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'schema' && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10,
                        padding: '0 16px', height: 34, alignItems: 'center',
                        background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                        ...label }}>
            <span>COLUMN</span><span>TYPE</span>
          </div>
          {d.columns.map(c => (
            <div key={c.name} data-testid={`gdcol-${c.name}`}
                 style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10,
                          padding: '8px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ ...mono, fontWeight: 600, color: P.ink }}>{c.name}</span>
              <span style={mono}>{c.type}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'gates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.gate_list.map(g => (
            <div key={g.name} data-testid={`gdgate-${g.name.replace(/\s+/g, '-')}`}
                 style={{ ...card, padding: '12px 16px', display: 'flex',
                          alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: P.ink,
                             fontFamily: FONT, width: 200, flex: 'none' }}>
                {g.name}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 19,
                             padding: '0 9px', borderRadius: 999,
                             background: g.status === 'PASS' ? P.greenBg : P.amberBg,
                             color: g.status === 'PASS' ? P.green : P.amber,
                             fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>
                {g.status}
              </span>
              <span style={{ fontSize: 12, color: P.body, fontFamily: FONT }}>
                {g.note}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'lineage' && (
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 12.5, color: P.body, fontFamily: FONT,
                        marginBottom: 10 }}>
            This table sits between its source facts and every dashboard built on it.
          </div>
          <Btn data-testid="gd-open-lineage" size="sm" variant="outline"
               onClick={() => navigate(`/app/governance/lineage?node=${
                 encodeURIComponent(`gold:${d.id}`)}`)}>
            Open in the lineage graph
          </Btn>
        </div>
      )}

      {tab === 'artifacts' && (
        <div style={{ ...card, padding: 16 }}>
          {(d.artifacts || []).length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              Nothing built on this table yet.
            </span>
          ) : d.artifacts.map(a => (
            <div key={a.id} onClick={() => navigate(`/app/artifacts/${a.id}`)}
                 style={{ fontSize: 12.5, color: P.accent, fontFamily: FONT,
                          padding: '4px 0', cursor: 'pointer' }}>
              {a.title}
            </div>
          ))}
        </div>
      )}

      {tab === 'manifest' && (
        <div style={{ ...card, padding: 16 }}>
          {d.feature_manifest ? (
            <>
              <div style={{ fontSize: 12.5, color: P.body, fontFamily: FONT,
                            marginBottom: 10 }}>
                v{d.feature_manifest.version} &middot;{' '}
                {d.feature_manifest.features} features &middot; immutable
              </div>
              <Btn data-testid="gd-open-manifest" size="sm" variant="outline"
                   onClick={() => navigate(`/app/models/features/${d.feature_manifest.id}`)}>
                Open the feature manifest
              </Btn>
            </>
          ) : (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              No feature manifest — enrichment hasn&rsquo;t run for this session.
            </span>
          )}
        </div>
      )}

      {tab === 'contracts' && (
        <div style={{ ...card, padding: 16 }}>
          {!contracts ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              Query contracts appear once a dashboard build runs on this table.
            </span>
          ) : (contracts.contracts || contracts.panels || []).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center',
                                  padding: '7px 0',
                                  borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ ...mono, fontWeight: 600, color: P.ink, width: 160 }}>
                {c.panel || c.component || `panel ${i + 1}`}
              </span>
              <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                {c.expected_shape || c.shape || 'validated shape'}
              </span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex',
                             alignItems: 'center', height: 17, padding: '0 8px',
                             borderRadius: 999,
                             background: (c.status || 'VALID').includes('VALID')
                               || c.status === 'PASS' ? P.greenBg : P.amberBg,
                             color: (c.status || 'VALID').includes('VALID')
                               || c.status === 'PASS' ? P.green : P.amber,
                             fontFamily: MONO, fontSize: 8.5, fontWeight: 700 }}>
                {c.status || 'VALID ✓'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
