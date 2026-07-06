// R35S2E2-US1 (program R30–R36) — Table detail (`Data Detail.dc.html`
// frame 02 / PRD §8 audit-first): crumb + health pill + profile facts,
// EDITABLE business definition (audited PATCH), health-trend spark,
// manifest columns with null rates / semantic types / masked PII pills,
// freshness vs SLA, downstream chips, quality-gate row. Deep-linked from
// the source detail's Tables tab and the lineage graph.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const mono = { fontFamily: MONO, fontSize: 11, color: P.body };
const GATE_NAME = { pk_gate: 'PK UNIQUE', null_gate: 'NULLS', freshness_gate: 'FRESHNESS',
                    pii_gate: 'PII', row_min_gate: 'ROW COUNT' };

export default function TableDetail() {
  const { runId, name } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const load = () => api.tableDetail(runId, name).then(setD).catch(() => setD(false));
  useEffect(() => { load(); }, [runId, name]);

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
        <PageHeader title="Table not found" sub="It may be outside this run's scope." />
        <Btn size="sm" variant="outline" onClick={() => navigate('/app/data/sources')}>
          Back to sources
        </Btn>
      </div>
    );
  }
  const saveDef = async () => {
    try {
      await api.patchTableDetail(runId, name, { description: draft });
      setEditing(false);
      load();
    } catch { /* role gated */ }
  };
  const trendMax = Math.max(...(d.trend || []).map(t => t.health_score || 0), 100);
  const semanticOf = c => {
    if (c.name.endsWith('_id')) {
      return c.name === `${d.name.replace(/^dim_|^fact_/, '')}_id`
        ? 'primary key' : 'foreign key';
    }
    if ((c.semantic_type || '') === 'date' || /(_at$|^day$|date)/.test(c.name)) {
      return 'event time';
    }
    return c.semantic_type || 'attribute';
  };

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        <span onClick={() => navigate(`/app/data/sources/${d.connection_id}`)}
              style={{ color: P.accent, cursor: 'pointer' }}>
          data / source {d.connection_id}
        </span>
        {' '}/ {d.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <h1 data-testid="td-name"
            style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: MONO }}>
          {d.name}
        </h1>
        <span data-testid="td-health-pill"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 20,
                       padding: '0 10px', borderRadius: 999,
                       background: (d.health_score || 0) >= 70 ? P.greenBg : P.redBg,
                       color: (d.health_score || 0) >= 70 ? P.green : P.red,
                       fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
                         background: 'currentColor' }} />
          {(d.health_score || 0) >= 70 ? 'HEALTHY' : 'AT RISK'} {d.health_score}
        </span>
        {!d.ml_ready && (
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                         padding: '0 10px', borderRadius: 999, background: P.amberBg,
                         color: P.amber, fontFamily: MONO, fontSize: 9,
                         fontWeight: 700 }}>
            NEEDS REVIEW
          </span>
        )}
      </div>
      <div data-testid="td-sub"
           style={{ fontSize: 12, color: P.muted, fontFamily: FONT, marginBottom: 14 }}>
        {d.row_count} rows &middot; {d.columns.length} columns
        {d.schema ? ` · schema ${d.schema}` : ''}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14,
                    marginBottom: 14 }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8,
                        marginBottom: 7 }}>
            <span style={label}>BUSINESS DEFINITION</span>
            {!editing && (
              <span data-testid="td-def-edit"
                    onClick={() => { setEditing(true); setDraft(d.description || ''); }}
                    style={{ marginLeft: 'auto', fontSize: 11, color: P.accent,
                             cursor: 'pointer', fontFamily: FONT }}>
                editable
              </span>
            )}
          </div>
          {editing ? (
            <>
              <textarea data-testid="td-def-input" value={draft}
                        onChange={e => setDraft(e.target.value)}
                        style={{ width: '100%', minHeight: 70, boxSizing: 'border-box',
                                 borderRadius: 8, border: `1px solid ${P.accentBorder}`,
                                 padding: '8px 11px', fontSize: 12.5, lineHeight: 1.5,
                                 fontFamily: FONT, resize: 'vertical',
                                 outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Btn data-testid="td-def-save" size="sm" onClick={saveDef}>Save</Btn>
                <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Btn>
              </div>
            </>
          ) : (
            <div data-testid="td-definition"
                 style={{ fontSize: 13, lineHeight: 1.6, color: d.description
                   ? P.body : P.faint, fontFamily: FONT }}>
              {d.description
                || 'No definition yet — say what one row means so analysts trust it.'}
            </div>
          )}
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ ...label, marginBottom: 8 }}>HEALTH TREND</div>
          {(d.trend || []).length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              History builds with each sync.
            </span>
          ) : (
            <svg width="100%" height="60" viewBox="0 0 260 60">
              <polyline fill="none" stroke={P.accent} strokeWidth="2"
                        points={d.trend.map((t, i) =>
                          `${6 + (i / Math.max(d.trend.length - 1, 1)) * 248},` +
                          `${54 - ((t.health_score || 0) / trendMax) * 46}`).join(' ')} />
            </svg>
          )}
          <div data-testid="td-freshness"
               style={{ fontFamily: MONO, fontSize: 10.5, color: P.body, marginTop: 8 }}>
            {d.freshness || '—'}
            {d.sla ? ` · SLA ${d.sla.max_age_hours}h · ${d.sla.state}` : ''}
          </div>
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr 1.2fr 1.2fr',
                      gap: 10, padding: '0 16px', height: 34, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>COLUMN</span><span>NULL RATE</span><span>SEMANTIC TYPE</span>
          <span>PII RISK</span>
        </div>
        {d.columns.map(c => (
          <div key={c.name} data-testid={`tdcol-${c.name}`}
               style={{ display: 'grid',
                        gridTemplateColumns: '1.4fr .8fr 1.2fr 1.2fr', gap: 10,
                        padding: '8px 16px', alignItems: 'center',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span style={{ ...mono, fontWeight: 600, color: P.ink }}>{c.name}</span>
            <span data-testid="td-null" style={mono}>
              {c.null_pct != null ? `${c.null_pct}%` : '0%'}
            </span>
            <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
              {semanticOf(c)}
            </span>
            {c.pii_flags ? (
              <span data-testid="td-pii"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                             padding: '0 8px', borderRadius: 999, background: P.redBg,
                             color: P.red, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, justifySelf: 'start' }}>
                HIGH &middot; MASKED
              </span>
            ) : (
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>none</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ ...label, marginBottom: 8 }}>DOWNSTREAM</div>
          {(d.downstream || []).length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              Nothing built on this table yet.
            </span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {d.downstream.map(x => (
                <span key={x.id} onClick={() => navigate(`/app/artifacts/${x.id}`)}
                      style={{ display: 'inline-flex', alignItems: 'center', height: 24,
                               padding: '0 11px', borderRadius: 999,
                               border: `1px solid ${P.borderStrong}`, background: '#fff',
                               fontSize: 11.5, color: P.body, fontFamily: FONT,
                               cursor: 'pointer' }}>
                  {x.title}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ ...label, marginBottom: 8 }}>QUALITY GATES</div>
          <div data-testid="td-gates"
               style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(d.gates).map(([g, v]) => {
              const ok = v === 'pass';
              return (
                <span key={g}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                               height: 22, padding: '0 10px', borderRadius: 999,
                               background: ok ? P.greenBg : P.amberBg,
                               color: ok ? P.green : P.amber, fontFamily: MONO,
                               fontSize: 9.5, fontWeight: 700 }}>
                  {GATE_NAME[g]} {ok ? '✓' : '!'}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
