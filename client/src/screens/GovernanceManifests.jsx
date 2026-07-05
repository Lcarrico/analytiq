// R32S1E6-US1 (program R30–R36) — Manifest versions (`Governance
// Lineage.dc.html` frame 02 / ch16): version table with status pills,
// expandable +ADD / ~MOD / −DEL structural diffs computed server-side,
// Approve routing into the review queue while items are pending, and a
// real immutable Rollback (audited). Replaces the S13 manifest strip.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const STATUS_TINT = {
  'REVIEW REQUIRED': [P.amberBg, P.amber],
  ACTIVE: [P.greenBg, P.green],
  SUPERSEDED: [P.tableHeadBg, P.muted],
};

const Chip = ({ kind, children }) => {
  const [bg, fg] = kind === 'add' ? [P.greenBg, P.green]
    : kind === 'mod' ? [P.amberBg, P.amber] : [P.redBg, P.red];
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 0' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                     padding: '0 7px', borderRadius: 5, background: bg, color: fg,
                     fontFamily: MONO, fontSize: 9, fontWeight: 700, flex: 'none' }}>
        {kind === 'add' ? '+ ADD' : kind === 'mod' ? '~ MOD' : '− DEL'}
      </span>
      <span style={{ fontSize: 12, color: P.body, fontFamily: FONT }}>{children}</span>
    </div>
  );
};

export default function GovernanceManifests() {
  const role = useRole();
  const navigate = useNavigate();
  const [cid, setCid] = useState(null);
  const [versions, setVersions] = useState(null);
  const [open, setOpen] = useState(null);

  const load = async connId => {
    try { setVersions(await api.manifestVersionsDiffs(connId)); }
    catch { setVersions([]); }
  };
  useEffect(() => {
    (async () => {
      try {
        const latest = await api.governanceLatest();
        setCid(latest.connection_id);
        if (latest.connection_id) await load(latest.connection_id);
        else setVersions([]);
      } catch { setVersions([]); }
    })();
  }, []);

  if (role !== 'admin') return <Forbidden />;

  const rollback = async v => {
    try { await api.rollbackManifest(cid, v); await load(cid); }
    catch { /* keep view */ }
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader title="Manifest versions"
                  sub="Every governance scan is an immutable version — approve what changed, or roll back without losing history." />
      <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                    overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1.2fr 1.2fr 1.4fr 90px',
                      gap: 10, padding: '0 16px', height: 36, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                      letterSpacing: '.06em', color: P.muted }}>
          <span>VERSION</span><span>GENERATED</span><span>STATUS</span>
          <span>CHANGES</span><span />
        </div>
        {versions === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
            <Spinner size={20} />
          </div>
        ) : versions.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            No manifests yet — run governance on a connection first.
          </div>
        ) : versions.map((v, i) => {
          const [bg, fg] = STATUS_TINT[v.status] || STATUS_TINT.SUPERSEDED;
          const ch = v.changes || { added: [], modified: [], removed: [] };
          const nStruct = ch.added.length + ch.removed.length;
          const isOpen = open === v.version;
          return (
            <div key={v.id} data-testid={`mv-row-${v.version}`}
                 style={{ borderBottom: `1px solid ${P.borderRow}` }}>
              <div style={{ display: 'grid',
                            gridTemplateColumns: '90px 1.2fr 1.2fr 1.4fr 90px', gap: 10,
                            padding: '10px 16px', alignItems: 'center' }}>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700,
                               color: P.ink }}>
                  v{v.version}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
                  {(v.created_at || '').slice(0, 16)}
                </span>
                <span data-testid="mv-status"
                      style={{ display: 'inline-flex', alignItems: 'center', height: 19,
                               padding: '0 9px', borderRadius: 999, background: bg,
                               color: fg, fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                               letterSpacing: '.05em', justifySelf: 'start',
                               whiteSpace: 'nowrap' }}>
                  {v.status}
                </span>
                <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                  {i === versions.length - 1 ? 'first scan'
                    : `${nStruct} schema · ${ch.modified.length} modified`}
                </span>
                <span data-testid="mv-expand" onClick={() => setOpen(isOpen ? null : v.version)}
                      style={{ fontSize: 11.5, color: P.accent, cursor: 'pointer',
                               fontFamily: FONT, justifySelf: 'end' }}>
                  {isOpen ? 'collapse' : 'expand'}
                </span>
              </div>
              {isOpen && (
                <div data-testid={`mv-diff-${v.version}`}
                     style={{ padding: '4px 16px 14px', background: '#fafbfc' }}>
                  {ch.added.map(t => <Chip key={`a${t}`} kind="add">table {t}</Chip>)}
                  {ch.modified.map(m => (
                    <Chip key={`m${m.table}`} kind="mod">{m.table} — {m.reason}</Chip>
                  ))}
                  {ch.removed.map(t => <Chip key={`d${t}`} kind="del">table {t}</Chip>)}
                  {ch.added.length + ch.modified.length + ch.removed.length === 0 && (
                    <div style={{ fontSize: 12, color: P.faint, fontFamily: FONT,
                                  padding: '4px 0 8px' }}>
                      {i === versions.length - 1
                        ? 'First manifest version — nothing to compare against.'
                        : `No structural changes vs v${versions[i + 1].version}.`}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {i === 0 ? (
                      v.status === 'REVIEW REQUIRED' ? (
                        <Btn data-testid="mv-approve" size="sm"
                             title="Approving requires deciding the pending review items"
                             onClick={() => navigate('/app/governance/review')}>
                          Approve v{v.version}
                        </Btn>
                      ) : (
                        <span style={{ fontSize: 11.5, color: P.green, fontFamily: FONT,
                                       fontWeight: 600 }}>
                          Active — nothing awaiting review.
                        </span>
                      )
                    ) : (
                      <Btn data-testid="mv-rollback" size="sm" variant="outline"
                           onClick={() => rollback(v.version)}>
                        Rollback to v{v.version}
                      </Btn>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
