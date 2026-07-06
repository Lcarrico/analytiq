// R18S1E2 → R36S2E1 — Team (`Collaboration.dc.html` frames 02–03): seat
// accounting in the header, roster with role/status pills (OWNER · ANALYST
// · VIEWER · INVITED), and the invite modal — email chips, role select,
// live seat math, real send over the invites API. A quick link opens the
// comments inbox.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Btn, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const ROLE_TINT = { admin: [P.purpleBg, P.purple], analyst: [P.accentSoft, P.accentHover],
                    viewer: [P.tableHeadBg, P.muted] };

export default function Team() {
  const navigate = useNavigate();
  const [roster, setRoster] = useState(null);
  const [modal, setModal] = useState(false);
  const [emails, setEmails] = useState('');
  const [chips, setChips] = useState([]);
  const [role, setRole] = useState('analyst');
  const [msg, setMsg] = useState('');

  const load = () => api.teamRoster().then(setRoster).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!roster) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const remaining = roster.seats.total - roster.seats.used;
  const pending = [...chips, ...emails.split(',').map(e => e.trim()).filter(Boolean)];
  const send = async () => {
    setMsg('');
    try {
      const r = await api.createInvites({ emails: pending, role });
      setMsg(`${r.invites.length} invite(s) sent.`);
      setChips([]); setEmails('');
      load();
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setMsg(m);
    }
  };

  return (
    <div data-testid="team-page" style={{ maxWidth: 940 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, fontFamily: FONT,
                     color: P.ink }}>
          Team
        </h1>
        <span data-testid="seat-usage"
              style={{ fontFamily: MONO, fontSize: 11, color: P.muted }}>
          {roster.seats.used} of {roster.seats.total} seats
        </span>
        <span onClick={() => navigate('/app/comments')}
              style={{ marginLeft: 'auto', fontSize: 12, color: P.accent,
                       cursor: 'pointer', fontFamily: FONT }}>
          Comments inbox
        </span>
        <Btn data-testid="team-invite-open" size="sm" onClick={() => setModal(true)}>
          + Invite
        </Btn>
      </div>
      <div style={{ fontSize: 12.5, color: P.muted, fontFamily: FONT, marginBottom: 14 }}>
        Everyone with access to this workspace — roles gate what they can change.
      </div>
      {msg && (
        <div style={{ fontSize: 12, color: P.body, fontFamily: FONT, marginBottom: 10 }}>
          {msg}
        </div>
      )}

      <div data-testid="roster-table" style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.4fr 1fr', gap: 10,
                      padding: '0 16px', height: 36, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>MEMBER</span><span>ROLE</span><span>WORKSPACE ACCESS</span>
          <span>STATUS</span>
        </div>
        {roster.members.map(m => {
          const [bg, fg] = ROLE_TINT[m.role] || ROLE_TINT.viewer;
          const invited = m.status === 'invited';
          return (
            <div key={m.email}
                 style={{ display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1.4fr 1fr', gap: 10,
                          padding: '9px 16px', alignItems: 'center',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <Avatar initials={m.email.slice(0, 2).toUpperCase()} size={24} />
                <span style={{ fontSize: 12.5, color: P.ink, fontFamily: FONT,
                               overflow: 'hidden', textOverflow: 'ellipsis',
                               whiteSpace: 'nowrap' }}>
                  {m.email}
                </span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                             padding: '0 8px', borderRadius: 999, background: bg,
                             color: fg, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, justifySelf: 'start',
                             textTransform: 'uppercase' }}>
                {m.role}
              </span>
              <span style={{ fontSize: 11.5, color: P.body, fontFamily: FONT }}>
                {m.role === 'admin' ? 'all explores · admin'
                  : m.role === 'analyst' ? 'all explores · create'
                  : 'shared artifacts only'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 18,
                             padding: '0 8px', borderRadius: 999,
                             background: invited ? P.amberBg : P.greenBg,
                             color: invited ? P.amber : P.green, fontFamily: MONO,
                             fontSize: 8.5, fontWeight: 700, justifySelf: 'start' }}>
                {invited ? 'INVITED' : 'ACTIVE'}
              </span>
            </div>
          );
        })}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 22, width: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: P.ink,
                             fontFamily: FONT }}>
                Invite members
              </span>
              <span onClick={() => setModal(false)}
                    style={{ marginLeft: 'auto', cursor: 'pointer', color: P.muted }}>
                &#10005;
              </span>
            </div>
            <div style={{ ...label, marginBottom: 5 }}>EMAILS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {chips.map((e, i) => (
                <span key={e} data-testid={`invite-chip-${i}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                               height: 24, padding: '0 10px', borderRadius: 999,
                               border: `1px solid ${P.borderStrong}`, fontFamily: MONO,
                               fontSize: 10.5, color: P.body }}>
                  {e}
                  <span onClick={() => setChips(c => c.filter(x => x !== e))}
                        style={{ cursor: 'pointer', color: P.muted }}>
                    &#10005;
                  </span>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input data-testid="invite-emails" value={emails}
                     onChange={e => setEmails(e.target.value)}
                     placeholder="colleague@acme.com"
                     style={{ flex: 1, height: 30, borderRadius: 7, fontFamily: FONT,
                              border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                              fontSize: 12, outline: 'none' }} />
              <Btn data-testid="invite-add" size="sm" variant="outline"
                   disabled={!emails.trim()}
                   onClick={() => {
                     setChips(c => [...c, ...emails.split(',').map(e => e.trim())
                       .filter(Boolean)]);
                     setEmails('');
                   }}>
                Add
              </Btn>
            </div>
            <div style={{ ...label, marginBottom: 5 }}>ROLE</div>
            <select value={role} onChange={e => setRole(e.target.value)}
                    style={{ height: 30, borderRadius: 7, fontSize: 12, fontFamily: FONT,
                             border: `1px solid ${P.borderStrong}`, background: '#fff',
                             marginBottom: 12 }}>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <div data-testid="invite-seatmath"
                 style={{ fontFamily: MONO, fontSize: 10, color: P.muted,
                          marginBottom: 12 }}>
              {pending.length} invite{pending.length === 1 ? '' : 's'} will use{' '}
              {pending.length} of {remaining} remaining seats
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn size="sm" variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
              <Btn data-testid="send-invites" size="sm" onClick={send}
                   disabled={pending.length === 0}>
                Send invites
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
