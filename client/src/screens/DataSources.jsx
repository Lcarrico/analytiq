// R35S1E1-US1 (program R30–R36) — Data sources list (`Data Sources.dc.html`
// frame 01 / PRD §8 audit-first): one row per connection over the
// /api/data/sources aggregate — typed kind, status dot pill, health,
// last sync, SLA posture, owner, table + issue counts. Replaces the S02
// list view; the connect flow lives at /app/data/connect (R35S1E2/E3).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Btn, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };

const STATUS_TINT = {
  connected: [P.greenBg, P.green], failing: [P.redBg, P.red],
  static: [P.tableHeadBg, P.muted], active: [P.accentSoft, P.accentHover],
};
const SLA_TINT = { met: P.green, 'at risk': P.amber, breached: P.red, none: P.faint };

export default function DataSources() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.dataSources().then(setData).catch(() => setData({ sources: [], total: 0 }));
  }, []);

  if (data === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const rows = data.sources.filter(s =>
    !q || (s.name || '').toLowerCase().includes(q.toLowerCase())
      || (s.type || '').toLowerCase().includes(q.toLowerCase()));
  const grid = { display: 'grid', gap: 10, alignItems: 'center',
                 gridTemplateColumns: '1.9fr .9fr 1.1fr .6fr 1fr 1.1fr .6fr .6fr .6fr' };

  return (
    <div style={{ maxWidth: 1150 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginBottom: 6 }}>
        workspace / data / sources
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: P.ink,
                     fontFamily: FONT, letterSpacing: '-0.01em' }}>
          Data sources
        </h1>
        <span data-testid="sources-count"
              style={{ display: 'inline-flex', alignItems: 'center', height: 20,
                       padding: '0 8px', borderRadius: 999, background: P.tableHeadBg,
                       color: P.muted, fontFamily: MONO, fontSize: 10.5,
                       fontWeight: 700 }}>
          {data.total}
        </span>
        <input data-testid="sources-filter" value={q} onChange={e => setQ(e.target.value)}
               placeholder="Filter sources…"
               style={{ marginLeft: 'auto', height: 30, width: 220, borderRadius: 8,
                        border: `1px solid ${P.borderStrong}`, padding: '0 11px',
                        fontSize: 12, fontFamily: FONT, outline: 'none' }} />
        <Btn data-testid="add-source" size="sm"
             onClick={() => navigate('/app/data/connect')}>
          + Add source
        </Btn>
      </div>
      <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 14 }}>
        Everything feeding the workspace — read-only connections, watched for
        freshness and health on every sync.
      </div>

      <div style={{ background: '#fff', border: `1px solid ${P.border}`,
                    borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ ...grid, padding: '0 16px', height: 36,
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>CONNECTION</span><span>TYPE</span><span>STATUS</span><span>HEALTH</span>
          <span>LAST SYNC</span><span>SLA</span><span>OWNER</span><span>TABLES</span>
          <span>ISSUES</span>
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            No sources yet — add your first connection.
          </div>
        ) : rows.map((s, i) => {
          const [bg, fg] = STATUS_TINT[s.status] || STATUS_TINT.active;
          return (
            <div key={s.id} data-testid={`src-row-${s.id}`}
                 style={{ ...grid, padding: '10px 16px',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink,
                              fontFamily: FONT, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                  <span style={{ color: P.faint, fontWeight: 400 }}>
                    {' '}&middot; {s.type.charAt(0).toUpperCase() + s.type.slice(1)}
                  </span>
                </div>
              </div>
              <span data-testid="src-kind"
                    style={{ fontFamily: MONO, fontSize: 10.5, color: P.body }}>
                {s.kind}
              </span>
              <span data-testid="src-status"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                             height: 19, padding: '0 9px', borderRadius: 999,
                             background: bg, color: fg, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, letterSpacing: '.05em',
                             justifySelf: 'start' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%',
                               background: fg }} />
                {s.status.toUpperCase()}
              </span>
              <span data-testid="src-health"
                    style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: s.health == null ? P.faint
                               : s.health >= 90 ? P.green
                               : s.health >= 70 ? P.body : P.red }}>
                {s.health ?? '—'}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
                {(s.last_sync || '').slice(0, 16) || '—'}
              </span>
              <span data-testid="src-sla"
                    style={{ fontFamily: MONO, fontSize: 10.5,
                             color: SLA_TINT[s.sla.state] || P.faint }}>
                {s.sla.label ? `${s.sla.label} · ${s.sla.state}` : 'n/a'}
              </span>
              <Avatar initials={(s.owner || 'WS').slice(0, 2).toUpperCase()} size={22} />
              <span data-testid="src-tables"
                    style={{ fontFamily: MONO, fontSize: 11.5, color: P.body }}>
                {s.tables}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11.5,
                             color: s.issues ? P.amber : P.faint }}>
                {s.issues || '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
