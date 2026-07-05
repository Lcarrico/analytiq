// R32S1E2-US1 (program R30–R36) — Human Review Queue (`Governance.dc.html`
// #review-queue / ch15 §2): typed tab counts, bulk approve, queue table with
// checkboxes, TYPE pills, colored mono confidence, and real Accept / Edit /
// Reject decisions over the reviews API (every decision audited server-side).
import { useEffect, useState } from 'react';
import { Avatar, Btn, Checkbox, PageHeader, Spinner } from '../components/ui';
import { Forbidden, useRole } from '../components/roles';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const TYPE_PILL = {
  metric: ['CONFLICT', P.purpleBg, P.purple],
  dimension: ['DEF', P.accentSoft, P.accentHover],
  pii: ['PII', P.redBg, P.red],
  bridge: ['BRIDGE', P.cyanBg, P.cyan],
  drift: ['DRIFT', P.amberBg, P.amber],
};

export default function GovernanceReview() {
  const role = useRole();
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('all');
  const [checked, setChecked] = useState({});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  const load = async () => {
    try {
      const latest = await api.governanceLatest();
      const rows = await api.reviewQueueRanked(latest.run_id ?? latest.id);
      setItems(rows);
    } catch { setItems([]); }
  };
  useEffect(() => { load(); }, []);

  if (role !== 'admin') return <Forbidden />;

  const types = [...new Set((items || []).map(i => (i.type || 'metric').toLowerCase()))];
  const shown = (items || []).filter(i =>
    tab === 'all' || (i.type || 'metric').toLowerCase() === tab);

  const decide = async (id, action, body = {}) => {
    try { await api.reviewAction(id, { action, ...body }); } catch { /* noop */ }
    load();
  };
  const bulk = async () => {
    const ids = (items || []).filter(i => checked[i.id]).map(i => i.id);
    for (const id of ids) {
      try { await api.reviewAction(id, { action: 'accept' }); } catch { /* noop */ }
    }
    setChecked({});
    load();
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <PageHeader title="Human review queue"
                  sub="Choose, edit, or reject what the platform inferred — decisions re-validate affected surfaces and land in the audit log." />
      <div data-testid="review-tabs"
           style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        {[['all', 'All'], ...types.map(t => [t, (TYPE_PILL[t] || ['DEF'])[0].charAt(0)
          + (TYPE_PILL[t] || ['DEF'])[0].slice(1).toLowerCase()])].map(([key, label]) => {
          const count = key === 'all' ? (items || []).length
            : (items || []).filter(i => (i.type || 'metric').toLowerCase() === key).length;
          const on = tab === key;
          return (
            <span key={key} onClick={() => setTab(key)}
                  style={{ display: 'inline-flex', alignItems: 'center', height: 30,
                           padding: '0 13px', borderRadius: 999, cursor: 'pointer',
                           background: on ? P.ink : '#fff',
                           border: on ? 'none' : `1px solid ${P.borderStrong}`,
                           color: on ? '#fff' : P.itemInk, fontSize: 12.5,
                           fontWeight: on ? 600 : 500, fontFamily: FONT }}>
              {label} · {count}
            </span>
          );
        })}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn data-testid="bulk-approve" variant="outline" size="sm" onClick={bulk}
               disabled={!Object.values(checked).some(Boolean)}>
            Bulk approve
          </Btn>
          <Btn variant="outline" size="sm" disabled
               title="Assignees arrive with the team surfaces (R36S2)">
            Assign
          </Btn>
        </span>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                    overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '26px 2.4fr 1fr .9fr .9fr 1.4fr',
                      gap: 10, padding: '0 16px', height: 38, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                      letterSpacing: '.06em', color: P.muted }}>
          <span data-testid="review-select-all" style={{ cursor: 'pointer' }}
                onClick={() => {
                  const all = shown.every(i => checked[i.id]);
                  const next = { ...checked };
                  shown.forEach(i => { next[i.id] = !all; });
                  setChecked(next);
                }}>
            <Checkbox checked={shown.length > 0 && shown.every(i => checked[i.id])}
                      onChange={() => {}} />
          </span>
          <span>ITEM</span><span>TYPE</span><span>CONFIDENCE</span><span>ASSIGNEE</span>
          <span>ACTIONS</span>
        </div>
        {items === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
            <Spinner size={22} />
          </div>
        ) : shown.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            Queue is clear — every inference is reviewed.
          </div>
        ) : shown.map(it => {
          const [label, bg, fg] = TYPE_PILL[(it.type || 'metric').toLowerCase()]
            || ['DEF', P.accentSoft, P.accentHover];
          const conf = it.confidence ?? 0;
          return (
            <div key={it.id} data-testid={`review-row-${it.id}`}
                 style={{ display: 'grid',
                          gridTemplateColumns: '26px 2.4fr 1fr .9fr .9fr 1.4fr', gap: 10,
                          padding: '9px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <Checkbox checked={!!checked[it.id]}
                        onChange={v => setChecked(c => ({ ...c, [it.id]: v }))} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink, fontFamily: FONT,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' }}>
                  {it.name ? `"${it.name}"` : 'Inferred definition'} · {it.explore || 'workspace'}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: P.faint,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' }}>
                  {it.definition}
                </div>
              </div>
              <span data-testid="review-type-pill"
                    style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                             padding: '0 8px', borderRadius: 999, background: bg, color: fg,
                             fontFamily: MONO, fontSize: 8.5, fontWeight: 600,
                             letterSpacing: '.05em', justifySelf: 'start' }}>
                {label}
              </span>
              <span data-testid="review-confidence"
                    style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600,
                             color: conf >= 0.85 ? P.green : conf < 0.7 ? P.amber : P.body }}>
                {Number(conf).toFixed(2)}
              </span>
              <Avatar initials="MO" size={22} />
              <span style={{ display: 'flex', gap: 6 }}>
                <button data-testid="review-accept" onClick={() => decide(it.id, 'accept')}
                        style={{ height: 24, padding: '0 10px', borderRadius: 7, border: 'none',
                                 background: P.greenBg, color: P.green, fontSize: 11,
                                 fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
                  Accept
                </button>
                <button data-testid="review-edit"
                        onClick={() => { setEditing(it.id); setDraft(it.definition || ''); }}
                        style={{ height: 24, padding: '0 10px', borderRadius: 7,
                                 border: `1px solid ${P.borderStrong}`, background: '#fff',
                                 color: P.body, fontSize: 11, fontFamily: FONT,
                                 cursor: 'pointer' }}>
                  Edit
                </button>
                <button data-testid="review-reject" onClick={() => decide(it.id, 'reject')}
                        style={{ height: 24, padding: '0 10px', borderRadius: 7,
                                 border: '1px solid #f4c7c7', background: '#fff', color: P.red,
                                 fontSize: 11, fontFamily: FONT, cursor: 'pointer' }}>
                  Reject
                </button>
              </span>
              {editing === it.id && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, paddingTop: 6 }}>
                  <input data-testid="review-edit-input" value={draft}
                         onChange={e => setDraft(e.target.value)}
                         style={{ flex: 1, height: 30, borderRadius: 7, padding: '0 10px',
                                  border: `1px solid ${P.accentBorder}`, fontSize: 12,
                                  fontFamily: MONO, outline: 'none' }} />
                  <Btn size="sm" onClick={() => { decide(it.id, 'edit', { definition: draft });
                                                  setEditing(null); }}>
                    Save
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
