import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, GateDot, HealthBar, Badge, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

export default function Screen04() {
  const { runId, nav } = useApp();
  const [tables,  setTables]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [sort,    setSort]    = useState({ col: 'health_score', asc: false });

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      setError('No governance run found. Complete the connection and governance steps first.');
      return;
    }
    api.getTables(runId)
      .then(rows => {
        setTables(rows);
        if (rows.length === 0) setError('No tables cataloged for this run yet.');
      })
      .catch(err => setError(err?.message || 'Failed to load tables.'))
      .finally(() => setLoading(false));
  }, [runId]);

  const sorted = [...tables].sort((a, b) => {
    const v = sort.asc ? 1 : -1;
    if (a[sort.col] < b[sort.col]) return -v;
    if (a[sort.col] > b[sort.col]) return v;
    return 0;
  });

  const healthy = tables.filter(t => t.health_score >= 90).length;
  const flagged = tables.filter(t => t.health_score >= 60 && t.health_score < 90).length;
  const blocked = tables.filter(t => t.health_score < 60).length;

  const TH = ({ label, col }) => (
    <th
      onClick={() => setSort(s => ({ col, asc: s.col === col ? !s.asc : false }))}
      style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
    >
      {label} {sort.col === col ? (sort.asc ? 'up' : 'down') : ''}
    </th>
  );

  return (
    <div>
      <PageHeader
        title="Table health"
        sub={tables.length > 0
          ? `${tables.length} tables cataloged - ${healthy} healthy - ${flagged} flagged - ${blocked} blocked from ML`
          : 'Table health overview'}
        action={<Btn onClick={() => nav(5)} disabled={tables.length === 0}>Review semantic layer</Btn>}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={32} />
        </div>
      ) : error ? (
        <Card>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>error</div>
            <div style={{ fontSize: 14, color: C.error, fontFamily: FONT }}>{error}</div>
          </div>
        </Card>
      ) : (
        <Card p={0}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                  <TH label="Table"     col="name" />
                  <TH label="Schema"    col="schema_name" />
                  <TH label="Health"    col="health_score" />
                  <TH label="Freshness" col="freshness" />
                  <TH label="Rows"      col="row_count" />
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PK</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Null</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fresh</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PII</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rows Min</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ML-ready</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}`, background: r.health_score < 60 ? '#fff8f8' : 'transparent' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 500, color: C.text, fontFamily: MONO, fontSize: 12 }}>{r.name}</td>
                    <td style={{ padding: '11px 14px', color: C.textTer, fontSize: 11 }}>{r.schema_name}</td>
                    <td style={{ padding: '11px 14px' }}><HealthBar v={r.health_score} /></td>
                    <td style={{ padding: '11px 14px', color: C.textSec, fontSize: 12, whiteSpace: 'nowrap' }}>{r.freshness}</td>
                    <td style={{ padding: '11px 14px', fontFamily: MONO, fontSize: 12 }}>{r.row_count}</td>
                    {[r.pk_gate, r.null_gate, r.freshness_gate, r.pii_gate, r.row_min_gate].map((g, j) => (
                      <td key={j} style={{ padding: '11px 14px' }}><GateDot s={g} /></td>
                    ))}
                    <td style={{ padding: '11px 14px' }}>
                      <Badge variant={r.ml_ready ? 'success' : 'default'} xs>{r.ml_ready ? 'Ready' : 'Desc only'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
