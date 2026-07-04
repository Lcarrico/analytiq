import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Badge, Sparkline } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

const H = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase',
                letterSpacing: '0.06em', fontFamily: MONO, margin: '18px 0 8px' }}>{children}</div>
);
const input = { padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                fontSize: 12, fontFamily: MONO, outline: 'none' };
const gateColor = s => s === 'PASS' ? '#1e7d3c' : s === 'WARN' ? '#946300' : '#b3261e';

export default function Screen13() {
  const { connectionId, nav } = useApp();
  const [versions, setVersions] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [history, setHistory]   = useState([]);
  const [drift, setDrift]       = useState([]);
  const [lineage, setLineage]   = useState(null);
  const [tests, setTests]       = useState([]);
  const [msg, setMsg]           = useState('');
  const [forms, setForms]       = useState({
    threshold: 70, slaTable: '', slaHours: 24,
    contractTable: '', contractCols: '', testTable: '', testExpr: '',
  });
  const F = (k, v) => setForms(f => ({ ...f, [k]: v }));

  const load = (version) => {
    if (!connectionId) return;
    api.manifestVersions(connectionId).then(setVersions).catch(() => setVersions([]));
    api.getManifest(connectionId, version).then(setManifest).catch(() => setManifest(null));
    api.healthHistory(connectionId).then(setHistory).catch(() => {});
    api.getDrift(connectionId).then(setDrift).catch(() => {});
    api.getLineage(connectionId).then(setLineage).catch(() => {});
    api.getDqTests(connectionId).then(setTests).catch(() => {});
  };
  useEffect(() => load(), [connectionId]);

  const act = (fn, ok) => async () => {
    setMsg('');
    try { await fn(); setMsg(ok); load(); }
    catch (e) { let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch {}
                setMsg(`️ ${m}`); }
  };

  if (!connectionId) return (
    <div style={{ maxWidth: 620 }}>
      <PageHeader title="Governance ops" sub="Connect a data source and run governance first." />
      <Btn onClick={() => nav(2)}>← Data sources</Btn>
    </div>
  );

  const seriesFor = (table) => history.filter(h => h.table_name === table)
                                      .map(h => h.health_score);

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="Governance ops"
                  sub="Manifest versions, PII approvals, SLAs, contracts, custom tests, drift and lineage." />
      {msg && <div style={{ fontSize: 12, marginBottom: 10, fontFamily: FONT }}>{msg}</div>}

      <Card>
        <H>Manifest {manifest ? `· v${manifest.manifest_version}` : ''}</H>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select style={input} onChange={e => load(e.target.value || undefined)}>
            <option value="">latest</option>
            {versions.map(v => <option key={v.id} value={v.version}>v{v.version}</option>)}
          </select>
          {versions.length > 1 && (
            <Btn size="sm" variant="outline"
                 onClick={act(() => api.rollbackManifest(connectionId, versions[versions.length - 1].version),
                              'Rolled back (new immutable version created).')}>
              Roll back to v{versions[versions.length - 1]?.version}
            </Btn>
          )}
          {manifest && (
            <Badge variant={manifest.dq_gate_status === 'PASS' ? 'success' : 'default'} xs>
              DQ {manifest.dq_gate_status}
            </Badge>
          )}
        </div>

        {manifest && manifest.tables.map(t => (
          <div key={t.name} style={{ display: 'flex', gap: 12, alignItems: 'center',
                                     padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ width: 150, fontSize: 12, fontFamily: MONO, fontWeight: 600 }}>{t.name}</span>
            <span style={{ fontSize: 11, color: gateColor(t.dq_gate_status), fontFamily: MONO }}>
              {t.dq_gate_status}
            </span>
            <span style={{ width: 90 }}>
              <Sparkline data={seriesFor(t.name)} w={80} h={18} />
            </span>
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.textSec }}>
              health {t.health_score}
            </span>
            {(t.columns || []).filter(c => c.pii_flags && !c.allow_ml_use).map(c => (
              <Btn key={c.name} size="sm" variant="outline"
                   onClick={act(() => api.approvePii(connectionId,
                     { columns: [{ table: t.name, column: c.name }],
                       justification: 'approved from UI' }),
                     `PII on ${t.name}.${c.name} approved for ML.`)}>
                Approve PII: {c.name}
              </Btn>
            ))}
            {(t.contract_violations || []).length > 0 && (
              <Badge variant="default" xs>contract </Badge>
            )}
          </div>
        ))}

        <H>Configuration</H>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...input, width: 90 }} type="number" value={forms.threshold}
                 onChange={e => F('threshold', +e.target.value)} />
          <Btn size="sm" onClick={act(() => api.setThreshold(
            { connectionId, min_health: forms.threshold }), 'Health threshold set.')}>
            Set health threshold
          </Btn>
          <input style={{ ...input, width: 130 }} placeholder="table" value={forms.slaTable}
                 onChange={e => F('slaTable', e.target.value)} />
          <input style={{ ...input, width: 70 }} type="number" value={forms.slaHours}
                 onChange={e => F('slaHours', +e.target.value)} />
          <Btn size="sm" onClick={act(() => api.setSla(
            { connectionId, table: forms.slaTable, max_age_hours: forms.slaHours }),
            'Freshness SLA saved.')}>Set SLA (h)</Btn>
          <input style={{ ...input, width: 130 }} placeholder="table" value={forms.contractTable}
                 onChange={e => F('contractTable', e.target.value)} />
          <input style={{ ...input, width: 200 }} placeholder="required cols, comma-sep"
                 value={forms.contractCols} onChange={e => F('contractCols', e.target.value)} />
          <Btn size="sm" onClick={act(() => api.setContract(
            { connectionId, table: forms.contractTable,
              required_columns: forms.contractCols.split(',').map(s => s.trim()).filter(Boolean) }),
            'Data contract saved — enforced on the next governance run.')}>Set contract</Btn>
        </div>

        <H>Custom DQ tests</H>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input style={{ ...input, width: 150 }} placeholder="physical table"
                 value={forms.testTable} onChange={e => F('testTable', e.target.value)} />
          <input style={{ ...input, width: 240 }} placeholder="amount > 0 · col IS NOT NULL"
                 value={forms.testExpr} onChange={e => F('testExpr', e.target.value)} />
          <Btn size="sm" onClick={act(() => api.createDqTest(
            { connectionId, table: forms.testTable, expression: forms.testExpr }),
            'Test compiled and saved.')}>Add test</Btn>
          <Btn size="sm" variant="outline"
               onClick={act(() => api.runDqTests(connectionId), 'Tests executed.')}>Run all</Btn>
        </div>
        {tests.map(t => (
          <div key={t.id} style={{ fontSize: 12, fontFamily: MONO, padding: '4px 0' }}>
            {t.table_name} · {t.expression} —{' '}
            <span style={{ color: t.last_status === 'PASS' ? '#1e7d3c' : '#b3261e' }}>
              {t.last_status || 'not run'}
            </span>
            {t.last_violations != null && ` (${t.last_violations} violations)`}
          </div>
        ))}

        <H>Drift</H>
        {drift.map(d => (
          <div key={d.id} style={{ fontSize: 12, fontFamily: MONO, padding: '3px 0' }}>
            {d.subject} · {d.detail.from_version} → {d.detail.to_version}
            {d.detail.removed_tables?.length > 0 && ` · removed: ${d.detail.removed_tables.join(', ')}`}
          </div>
        ))}
        {!drift.length && <div style={{ fontSize: 12, color: C.textTer }}>No schema drift recorded.</div>}

        <H>Lineage</H>
        {lineage && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {lineage.edges.map((e, i) => (
              <span key={i} style={{ fontSize: 11, fontFamily: MONO, background: C.bg,
                                     borderRadius: 4, padding: '3px 8px' }}>
                {e.from} → {e.to}{e.on ? ` (${e.on})` : ''} · {e.kind}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
