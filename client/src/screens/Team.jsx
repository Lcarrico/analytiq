// R18S1E2: team roster + invites + seat accounting (PRD §15.3/15.4 slice).
import { useEffect, useState } from 'react';
import { api } from '../api';
import { Btn, DataTable, StatusBadge } from '../components/ui';
import { FONT, MONO, P } from '../tokens';

export default function Team() {
  const [roster, setRoster] = useState(null);
  const [emails, setEmails] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => api.teamRoster().then(setRoster).catch(() => {});
  useEffect(() => { load(); }, []);   // PAR-2 unmount-crash fix
  return (
    <div data-testid="team-page" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 21, fontWeight: 600, fontFamily: FONT, color: P.ink }}>Team</span>
        {roster && (
          <span data-testid="seat-usage" style={{ fontFamily: MONO, fontSize: 12, color: P.muted }}>
            {roster.seats.used} of {roster.seats.total} seats
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px' }}>
        <input data-testid="invite-emails" value={emails} onChange={e => setEmails(e.target.value)}
               placeholder="colleague@acme.com, other@acme.com"
               style={{ flex: 1, height: 36, borderRadius: 8, border: `1px solid ${P.borderStrong}`,
                        padding: '0 12px', fontSize: 13, fontFamily: FONT }} />
        <Btn data-testid="send-invites" onClick={async () => {
          try {
            const list = emails.split(',').map(e => e.trim()).filter(Boolean);
            await api.createInvites({ emails: list, role: 'analyst' });
            setMsg(`${list.length} invite(s) sent.`); setEmails(''); load();
          } catch { setMsg('Invite failed (seats or permissions).'); }
        }}>Invite</Btn>
      </div>
      {msg && <div style={{ fontSize: 12, fontFamily: FONT, color: P.green, marginBottom: 10 }}>{msg}</div>}
      {roster && (
        <DataTable
          testid="roster-table" rowKey="email"
          columns={[
            { key: 'email', label: 'Member', sortable: true, width: '1.6fr' },
            { key: 'role', label: 'Role', mono: true, width: '110px' },
            { key: 'status', label: 'Status', width: '120px',
              render: r => <StatusBadge status={r.status === 'active' ? 'green' : 'amber'}>{r.status}</StatusBadge> },
            { key: 'joined_at', label: 'Since', mono: true, width: '160px' },
          ]}
          rows={roster.members}
        />
      )}
    </div>
  );
}
