// R36S2E1-US1 (program R30–R36) — Comments inbox (`Collaboration.dc.html`
// frame 01): tab pills over the real inbox endpoint, rich rows (author
// avatar, §-anchor chip, body, artifact link), inline resolve.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };

export default function CommentsInbox() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('open');
  const [rows, setRows] = useState(null);
  const [counts, setCounts] = useState({});

  const load = async (t = tab) => {
    try {
      const d = await api.commentsInbox(t);
      setRows(d.comments || []);
      const [o, r_] = await Promise.all([
        api.commentsInbox('open'), api.commentsInbox('resolved')]);
      setCounts({ open: (o.comments || []).length,
                  resolved: (r_.comments || []).length });
    } catch { setRows([]); }
  };
  useEffect(() => { load(tab); }, [tab]);

  return (
    <div style={{ maxWidth: 820 }}>
      <PageHeader title="Comments"
                  sub="Every open thread across the workspace — jump to the section it anchors, or resolve it right here." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['open', 'Open'], ['resolved', 'Resolved'], ['mentioned', 'Mentioned me']]
          .map(([key, name]) => {
            const on = tab === key;
            return (
              <span key={key} data-testid={`ci-pill-${key}`} onClick={() => setTab(key)}
                    style={{ display: 'inline-flex', alignItems: 'center', height: 28,
                             padding: '0 12px', borderRadius: 999, cursor: 'pointer',
                             background: on ? P.ink : '#fff',
                             border: on ? 'none' : `1px solid ${P.borderStrong}`,
                             color: on ? '#fff' : P.itemInk, fontSize: 12,
                             fontWeight: on ? 600 : 500, fontFamily: FONT }}>
                {name}{counts[key] != null ? ` · ${counts[key]}` : ''}
              </span>
            );
          })}
      </div>

      {rows === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner size={22} />
        </div>
      ) : rows.length === 0 ? (
        <div style={{ ...card, padding: 18, fontSize: 12.5, color: P.muted,
                      fontFamily: FONT }}>
          Nothing here — this tab is clear.
        </div>
      ) : rows.map(c => (
        <div key={c.id} data-testid={`ci-row-${c.id}`}
             style={{ ...card, padding: '13px 16px', marginBottom: 10, display: 'flex',
                      gap: 12 }}>
          <Avatar initials={(c.author || 'WS').slice(0, 2).toUpperCase()} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink,
                             fontFamily: FONT }}>
                {c.author || 'workspace'}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint }}>
                {(c.created_at || '').slice(5, 16)}
              </span>
              {c.section_id && (
                <span data-testid="ci-anchor"
                      style={{ display: 'inline-flex', alignItems: 'center', height: 16,
                               padding: '0 7px', borderRadius: 999,
                               background: P.accentSoft, color: P.accentHover,
                               fontFamily: MONO, fontSize: 8.5, fontWeight: 600 }}>
                  {c.section_id}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: P.body, fontFamily: FONT,
                          margin: '4px 0 6px', lineHeight: 1.5 }}>
              {c.body}
            </div>
            <span data-testid="ci-artifact-link"
                  onClick={() => navigate(`/app/artifacts/${c.artifact_id}`)}
                  style={{ fontSize: 11.5, color: P.accent, cursor: 'pointer',
                           fontFamily: FONT }}>
              Open the dashboard
            </span>
          </div>
          {!c.resolved && (
            <span data-testid="ci-resolve"
                  onClick={async () => { try { await api.resolveComment(c.id); } catch { /* gated */ }
                                         load(); }}
                  style={{ fontSize: 11.5, color: P.green, cursor: 'pointer',
                           fontFamily: FONT, alignSelf: 'flex-start' }}>
              Resolve
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
