import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, GateDot, HealthBar, Badge, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

// Fallback demo data when there's no runId in context
const FALLBACK_TABLES = [
  { name:'fact_revenue',   schema_name:'CORE',    health_score:98, freshness:'2h ago',  row_count:'4.2M',  pk_gate:'pass',null_gate:'pass',freshness_gate:'pass',pii_gate:'pass',row_min_gate:'pass',ml_ready:1 },
  { name:'dim_location',   schema_name:'CORE',    health_score:94, freshness:'6h ago',  row_count:'12.8K', pk_gate:'pass',null_gate:'pass',freshness_gate:'pass',pii_gate:'pass',row_min_gate:'pass',ml_ready:1 },
  { name:'fact_sessions',  schema_name:'CORE',    health_score:87, freshness:'1h ago',  row_count:'2.1M',  pk_gate:'pass',null_gate:'warn',freshness_gate:'pass',pii_gate:'pass',row_min_gate:'pass',ml_ready:1 },
  { name:'dim_customer',   schema_name:'CORE',    health_score:71, freshness:'3d ago',  row_count:'84.2K', pk_gate:'pass',null_gate:'warn',freshness_gate:'warn',pii_gate:'flag',row_min_gate:'pass',ml_ready:0 },
  { name:'staging_events', schema_name:'STAGING', health_score:90, freshness:'30m ago', row_count:'890K',  pk_gate:'warn',null_gate:'pass',freshness_gate:'pass',pii_gate:'pass',row_min_gate:'pass',ml_ready:1 },
  { name:'raw_clickstream',schema_name:'RAW',     health_score:44, freshness:'12d ago', row_count:'124',   pk_gate:'fail',null_gate:'warn',freshness_gate:'fail',pii_gate:'pass',row_min_gate:'fail',ml_ready:0 },
];

export default function Screen04() {
  const { runId, nav } = useApp();
  const [tables,  setTables]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState({ col: 'health_score', asc: false });

  useEffect(() => {
    if (!runId) {
      // Use seeded demo data from the DB's first governance run
      api.getTables(1)
        .then(rows => setTables(rows.length ? rows : FALLBACK_TABLES))
        .catch(() => setTables(FALLBACK_TABLES))
        .finally(() => setLoading(false));
      return;
    }
    api.getTables(runId)
      .then(rows => setTables(rows.length ? rows : FALLBACK_TABLES))
      .catch(() => setTables(FALLBACK_TABLES))
      .finally(() => setLoading(false));
  }, [runId]);

  const sorted = [...tables].sort((a, b) => {
    const v = sort.asc ? 1 : -1;
    if (a[sort.col] < b[sort.col]) return -v;
    if (a[sort.col] > b[sort.col]) return v;
    return 0;
  });

  const healthy  = tables.filter(t => t.health_score >= 90).length;
  const flagged  = tables.filter(t => t.health_score >= 60 && t.health_score < 90).length;
  const blocked  = tables.filter(t => t.health_score < 60).length;

  const TH = ({ label, col }) => (
    <th
      onClick={() => setSort(s => ({ col, asc: s.col === col ? !s.asc : false }))}
      style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
    >
      {label} {sort.col === col ? (sort.asc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div>
      <PageHeader
        title="Table health"
        sub={`${tables.length} tables cataloged · ${healthy} healthy · ${flagged} flagged · ${blocked} blocked from ML`}
        action={<Btn onClick={() => nav(5)}>Review semantic layer →</Btn>}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={32} />
        </div>
      ) : (
        <Card p={0}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                  <TH label="Table"    col="name" />
                  <TH label="Schema"   col="schema_name" />
                  <TH label="Health"   col="health_score" />
                  <TH label="Freshness"col="freshness" />
                  <TH label="Rows"     col="row_count" />
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PK</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Null</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fresh</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>PII</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rows≥Min</th>
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
