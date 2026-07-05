// R31S2E1-US1 (program R30–R36) — Recent Activity (`App Home.dc.html` frame
// 02): the workspace's typed audit feed. Pills filter server-side via
// /api/activity?kind=; Load more follows the cursor. Row anatomy per frame:
// tinted icon tile + connector line, rich text, mono metadata line, mono
// time, actor avatar (SYS for system events).
import { useEffect, useState } from 'react';
import { Avatar, Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';

const PILLS = [
  ['', 'All'], ['build', 'Builds'], ['governance', 'Governance'],
  ['data', 'Data'], ['share', 'Sharing'],
];
const TILE = {
  build: [P.accentSoft, P.accent], governance: [P.purpleBg, P.purple],
  alert: [P.redBg, P.red], share: [P.cyanBg, P.cyan],
  data: [P.amberBg, P.amber], model: [P.greenBg, P.green],
  system: [P.grayBg, P.gray],
};
const firstName = (email) => {
  if (!email || email === 'system') return null;
  const n = email.split('@')[0].split(/[._-]/)[0];
  return n ? n[0].toUpperCase() + n.slice(1) : null;
};
const clock = (ts) => {
  if (!ts) return '';
  const t = new Date(String(ts).includes('T') ? ts : ts.replace(' ', 'T') + 'Z');
  return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Activity() {
  const [kind, setKind] = useState('');
  const [items, setItems] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = (k) => {
    setItems(null);
    fetch(`/api/activity?limit=20${k ? `&kind=${k}` : ''}`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setCursor(d.next_cursor); })
      .catch(() => { setItems([]); setCursor(null); });
  };
  useEffect(() => { load(kind); }, [kind]);

  const more = async () => {
    setLoadingMore(true);
    try {
      const d = await fetch(`/api/activity?limit=20&cursor=${cursor}${kind ? `&kind=${kind}` : ''}`)
        .then(r => r.json());
      setItems(list => [...(list || []), ...(d.items || [])]);
      setCursor(d.next_cursor);
    } catch { /* noop */ } finally { setLoadingMore(false); }
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader title="Recent activity" />
      <div data-testid="activity-pills"
           style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        {PILLS.map(([k, label]) => {
          const on = kind === k;
          return (
            <span key={label} onClick={() => setKind(k)}
                  style={{ display: 'inline-flex', alignItems: 'center', height: 30,
                           padding: '0 13px', borderRadius: 999, cursor: 'pointer',
                           background: on ? P.ink : '#fff',
                           border: on ? 'none' : `1px solid ${P.borderStrong}`,
                           color: on ? '#fff' : P.itemInk, fontSize: 12.5,
                           fontWeight: on ? 600 : 500, fontFamily: FONT }}>
              {label}
            </span>
          );
        })}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center',
                       gap: 5, fontFamily: MONO, fontSize: 11, color: P.muted }}>
          last 20+ events
          <svg width="8" height="5" viewBox="0 0 8 5">
            <path d="M1 1l3 3 3-3" fill="none" stroke={P.muted} strokeWidth="1.3"
                  strokeLinecap="round" />
          </svg>
        </span>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10,
                    padding: '6px 22px' }}>
        {items === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
            <Spinner size={22} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 20, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            Nothing here yet for this filter.
          </div>
        ) : items.map((it, i) => {
          const [bg, fg] = TILE[it.kind] || TILE.system;
          const name = firstName(it.actor);
          return (
            <div key={it.id} data-testid="activity-row" data-kind={it.kind}
                 style={{ display: 'flex', gap: 14, padding: '15px 0',
                          borderBottom: i < items.length - 1 ? `1px solid ${P.borderRow}` : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span data-testid="activity-tile"
                      style={{ width: 28, height: 28, borderRadius: 8, background: bg,
                               display: 'inline-flex', alignItems: 'center',
                               justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="4" fill="none" stroke={fg} strokeWidth="1.5" />
                  </svg>
                </span>
                {i < items.length - 1 && (
                  <span style={{ flex: 1, width: 1, background: P.borderRow, marginTop: 6 }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 13, color: P.body, fontFamily: FONT }}>
                  <strong style={{ color: P.ink, fontWeight: 600 }}>{name || 'System'}</strong>{' '}
                  {it.link ? (
                    <a href={it.link} style={{ color: P.accentHover, fontWeight: 500 }}>{it.title}</a>
                  ) : it.title}
                </span>
                <span data-testid="activity-meta"
                      style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint }}>{it.meta}</span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, flexShrink: 0 }}>
                {clock(it.at)}
              </span>
              <span data-testid="activity-avatar" style={{ flexShrink: 0 }}>
                {name ? (
                  <Avatar initials={it.actor.slice(0, 2).toUpperCase()} size={26} />
                ) : (
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: P.grayBg,
                                 color: P.gray, display: 'inline-flex', alignItems: 'center',
                                 justifyContent: 'center', fontSize: 8, fontWeight: 700,
                                 fontFamily: MONO }}>SYS</span>
                )}
              </span>
            </div>
          );
        })}
        {cursor && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <Btn data-testid="activity-load-more" variant="outline" size="sm"
                 disabled={loadingMore} onClick={more}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
