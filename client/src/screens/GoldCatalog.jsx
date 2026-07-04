// R17S1E1: workspace-wide gold catalog (PRD §13 first slice).
import { useEffect, useState } from 'react';
import { api } from '../api';
import { DataTable, StatusBadge } from '../components/ui';
import { FONT, P } from '../tokens';

export default function GoldCatalog() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.goldCatalog().then(r => setRows(r.tables)).catch(() => {}); }, []);
  return (
    <div data-testid="gold-catalog" style={{ maxWidth: 980 }}>
      <div style={{ fontSize: 21, fontWeight: 600, fontFamily: FONT, color: P.ink, marginBottom: 4 }}>
        Gold Tables
      </div>
      <div style={{ fontSize: 12.5, fontFamily: FONT, color: P.muted, marginBottom: 16 }}>
        Immutable analytical outputs per run — every table carries its gate status and lineage.
      </div>
      <DataTable
        testid="gold-table"
        rowKey="key"
        columns={[
          { key: 'table', label: 'Table', sortable: true, mono: true, width: '1.4fr' },
          { key: 'metric', label: 'Metric', width: '1.2fr' },
          { key: 'run_id', label: 'Run', mono: true, width: '80px' },
          { key: 'row_count', label: 'Rows', sortable: true, mono: true, width: '90px',
            sortValue: r => r.row_count },
          { key: 'gate_status', label: 'Gates', width: '110px',
            render: r => <StatusBadge status={r.gate_status === 'PASS' ? 'green' : 'amber'}>{r.gate_status}</StatusBadge> },
          { key: 'mape', label: 'MAPE', mono: true, width: '80px' },
        ]}
        rows={rows.map(r => ({ ...r, key: `${r.table}-${r.run_id}` }))}
      />
    </div>
  );
}
