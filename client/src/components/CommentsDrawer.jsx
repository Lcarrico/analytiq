// R30S3E6-US1 (program R30–R36) — comments drawer (`Inspector Panels.dc.html`
// #comments-drawer): Open/Resolved pill counts, section-anchor chips, nested
// replies, "Ask AI to apply" (seeds the workbench refine composer — the
// signature action), composer — all over the real R18 comments API.
// "Convert to request" ships disabled until the opportunities write API lands
// (deviation recorded in RELEASE_PLAN Agent Notes).
import { useEffect, useState } from 'react';
import { Avatar, Btn, Drawer, Spinner } from './ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const HUMAN = {
  timeseries_ci: 'Revenue vs forecast', forecast: 'Forecast horizon',
  dimension_breakdown: 'Breakdown by location', feature_importance: 'Forecast drivers',
};
const anchorLabel = (sid) => (sid ? (HUMAN[sid] || sid.replace(/_/g, ' ')) : 'general');
const firstName = (email) => {
  const n = (email || '').split('@')[0].split(/[._-]/)[0];
  return n ? n[0].toUpperCase() + n.slice(1) : '—';
};
function rel(ts) {
  if (!ts) return 'just now';
  const t = new Date(String(ts).includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
  const s = Math.max(0, (Date.now() - t.getTime()) / 1000);
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

export default function CommentsDrawer({ artifact, selectedSection, onClose,
                                         onAskAI, onChanged }) {
  const [comments, setComments] = useState(null);
  const [view, setView] = useState('open');
  const [draft, setDraft] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});

  const load = () => api.getComments(artifact.id)
    .then(list => { setComments(list); onChanged?.(list); })
    .catch(() => setComments([]));
  useEffect(() => { load(); }, [artifact.id]);

  const roots = (comments || []).filter(c => !c.parent_id);
  const replies = (c) => (comments || []).filter(x => x.parent_id === c.id);
  const openRoots = roots.filter(c => !c.resolved);
  const resolvedRoots = roots.filter(c => !!c.resolved);
  const shown = view === 'open' ? openRoots : resolvedRoots;

  const send = async () => {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    await api.postComment(artifact.id, { body: t, section_id: selectedSection || null });
    load();
  };
  const reply = async (c) => {
    const t = (replyDrafts[c.id] || '').trim();
    if (!t) return;
    setReplyDrafts(d => ({ ...d, [c.id]: '' }));
    await api.postComment(artifact.id, { body: t, parent_id: c.id, section_id: c.section_id });
    load();
  };

  const pill = (key, label, count) => (
    <button data-testid={`comments-${key}-pill`} onClick={() => setView(key)}
            style={{ height: 26, padding: '0 12px', borderRadius: 999, cursor: 'pointer',
                     border: view === key ? 'none' : `1px solid ${P.borderStrong}`,
                     background: view === key ? P.ink : '#fff',
                     color: view === key ? '#fff' : P.muted,
                     fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
      {label} · {count}
    </button>
  );

  return (
    <Drawer open onClose={onClose} width={400} title="Comments"
            headerExtra={
              <span data-testid="drawer-close" onClick={onClose}
                    style={{ fontFamily: MONO, fontSize: 10, color: P.faint, cursor: 'pointer' }}>
                close
              </span>
            }>
      <div data-testid="comments-drawer"
           style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
          {pill('open', 'Open', openRoots.length)}
          {pill('resolved', 'Resolved', resolvedRoots.length)}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex',
                      flexDirection: 'column', gap: 10 }}>
          {comments == null ? <Spinner /> : shown.length === 0 ? (
            <span style={{ fontSize: 12.5, fontFamily: FONT, color: P.muted }}>
              {view === 'open' ? 'No open threads — start one below.' : 'Nothing resolved yet.'}
            </span>
          ) : shown.map(c => (
            <div key={c.id} data-testid={`thread-${c.id}`}
                 style={{ border: `1px solid ${P.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span data-testid="thread-anchor"
                      style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                               padding: '0 8px', borderRadius: 999, background: P.accentSoft,
                               color: P.accentHover, fontFamily: MONO, fontSize: 8.5,
                               fontWeight: 600 }}>
                  § {anchorLabel(c.section_id)}
                </span>
                {view === 'open' && (
                  <span data-testid="thread-resolve" title="Resolve thread"
                        onClick={async () => { await api.resolveComment(c.id); load(); }}
                        style={{ marginLeft: 'auto', width: 15, height: 15, borderRadius: 4,
                                 border: `1.5px solid ${P.grayBar}`, cursor: 'pointer',
                                 flexShrink: 0 }} />
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Avatar initials={(c.author || '?').split('@')[0].slice(0, 2).toUpperCase()} size={24} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
                      {firstName(c.author)}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: P.faint }}>
                      {rel(c.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: FONT, color: P.body, marginTop: 2 }}>
                    {c.body}
                  </div>
                </div>
              </div>
              {replies(c).map(r => (
                <div key={r.id} data-testid="comment-reply"
                     style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 33 }}>
                  <Avatar initials={(r.author || '?').split('@')[0].slice(0, 2).toUpperCase()} size={20} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: FONT, color: P.ink }}>
                        {firstName(r.author)}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: P.faint }}>
                        {rel(r.created_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontFamily: FONT, color: P.body }}>{r.body}</div>
                  </div>
                </div>
              ))}
              {view === 'open' && (
                <>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <Btn size="sm" data-testid="ask-ai-apply" onClick={() => onAskAI?.(c.body)}>
                      Ask AI to apply
                    </Btn>
                    <Btn size="sm" variant="outline" disabled
                         title="Lands with the opportunities write API">
                      Convert to request
                    </Btn>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input data-testid="thread-reply-input" value={replyDrafts[c.id] || ''}
                           onChange={e => setReplyDrafts(d => ({ ...d, [c.id]: e.target.value }))}
                           onKeyDown={e => e.key === 'Enter' && reply(c)}
                           placeholder="Reply…"
                           style={{ flex: 1, height: 28, borderRadius: 7, padding: '0 9px',
                                    border: `1px solid ${P.borderStrong}`, fontSize: 12,
                                    fontFamily: FONT, outline: 'none' }} />
                    <button data-testid="thread-reply-send" onClick={() => reply(c)}
                            aria-label="Send reply"
                            style={{ width: 28, height: 28, borderRadius: 7, border: 'none',
                                     background: P.accent, color: '#fff', cursor: 'pointer',
                                     fontSize: 12 }}>»</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, padding: 14, borderTop: `1px solid ${P.border}` }}>
          <input data-testid="comment-composer" value={draft}
                 onChange={e => setDraft(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && send()}
                 placeholder="Comment or @mention…"
                 style={{ flex: 1, height: 32, borderRadius: 8, padding: '0 10px',
                          border: `1px solid ${P.borderStrong}`, fontSize: 12.5,
                          fontFamily: FONT, outline: 'none' }} />
          <button data-testid="comment-send" onClick={send} aria-label="Send comment"
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'none',
                           background: P.accent, color: '#fff', cursor: 'pointer' }}>»</button>
        </div>
      </div>
    </Drawer>
  );
}
