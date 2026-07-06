// R36S1E1-US1 (program R30–R36) — Gold tables (`Gold Contracts.dc.html`
// frame 01 / PRD §8 audit-first): modeler gold rows with grain, version,
// gate tallies and linked surfaces over /api/gold/tables; the legacy
// per-run outputs (R17S1) keep their own section below.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Spinner, StatusBadge } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };

export default function GoldCatalog() {
  const navigate = useNavigate();
  const [gold, setGold] = useState(null);
  const [legacy, setLegacy] = useState([]);

  useEffect(() => {
    api.goldTablesList().then(r => setGold(r.tables || [])).catch(() => setGold([]));
    api.goldCatalog().then(r => setLegacy(r.tables || [])).catch(() => {});
  }, []);

  const grid = { display: 'grid', gap: 10, alignItems: 'center',
                 gridTemplateColumns: '1.7fr .8fr 1fr .5fr .9fr 1fr 1.6fr' };

  return (
    <div data-testid="gold-catalog" style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: FONT, letterSpacing: '-0.01em' }}>
          Gold tables
        </h1>
        <span data-testid="gold-count"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 8px', borderRadius: 999, background: P.tableHeadBg,
                       color: P.muted, fontFamily: MONO, fontSize: 10.5,
                       fontWeight: 700 }}>
          {gold ? gold.length : '…'}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 14 }}>
        Immutable per session &middot; versioned &middot; every table carries its gates
        and lineage.
      </div>

      <div style={{ ...card, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ ...grid, padding: '0 16px', height: 36,
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>GOLD TABLE</span><span>SESSION</span><span>GRAIN</span><span>VER</span>
          <span>ROWS</span><span>STATUS</span><span>LINKED</span>
        </div>
        {gold === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spinner size={20} />
          </div>
        ) : gold.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            No gold tables yet — the data modeler writes one per confirmed analysis.
          </div>
        ) : gold.map(g => (
          <div key={g.id} data-testid={`gold-row-${g.id}`}
               style={{ ...grid, padding: '10px 16px',
                        borderBottom: `1px solid ${P.borderRow}` }}>
            <span data-testid="gold-name" onClick={() => navigate(`/app/gold/${g.id}`)}
                  style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700,
                           color: P.ink, cursor: 'pointer', overflow: 'hidden',
                           textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                           textTransform: 'uppercase' }}>
              {g.table_name}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: P.faint }}>
              {g.session_code}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>
              {g.grain || '—'}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>
              v{g.version}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: P.body }}>
              {(g.row_count ?? 0).toLocaleString('en-US')}
            </span>
            <span data-testid="gold-gates"
                  style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                           padding: '0 8px', borderRadius: 999,
                           background: g.gates.warn ? P.amberBg : P.greenBg,
                           color: g.gates.warn ? P.amber : P.green, fontFamily: MONO,
                           fontSize: 8.5, fontWeight: 700, justifySelf: 'start',
                           whiteSpace: 'nowrap' }}>
              GATES {g.gates.passed}/{g.gates.total} {g.gates.warn ? '!' : '✓'}
            </span>
            <span style={{ fontSize: 11, color: P.body, fontFamily: FONT,
                           overflow: 'hidden', textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap' }}>
              {(g.linked || []).join(' · ') || '—'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ ...label, marginBottom: 8 }}>RUN OUTPUTS (PREDICTIONS &amp; FORECASTS)</div>
      <DataTable
        testid="gold-table"
        rowKey="key"
        columns={[
          { key: 'table', name: 'Table' },
          { key: 'metric', name: 'Metric' },
          { key: 'run_id', name: 'Run' },
          { key: 'row_count', name: 'Rows' },
          { key: 'gate', name: 'Gates',
            render: r => <StatusBadge status={r.gate_status === 'PASS' ? 'green' : 'amber'}>{r.gate_status}</StatusBadge> },
        ]}
        rows={legacy.map((r, i) => ({ key: i, ...r,
          gate: r.gate_status }))}
      />
    </div>
  );
}
