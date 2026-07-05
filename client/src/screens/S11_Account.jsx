// R31S1E1-US1 (2026-07-05) — the old in-shell auth forms (and their
// "PBKDF2…" / "Agent memory (§17.3.1)" copy) are retired: authentication is
// standalone at /login and /register now. This screen is the interim
// settings/profile view until the full Settings area lands (R36S3E2).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Btn, Card, PageHeader } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api, auth } from '../api';

export default function Screen11() {
  const user = auth.user();
  // R31S1E1: the R10 memory substrate keeps its user-facing surface — behind
  // the explicit admin affordance (§5.6), no longer a debug panel on auth
  const [memOpen, setMemOpen] = useState(false);
  const [memory, setMemory] = useState(null);
  useEffect(() => {
    if (memOpen && memory === null) {
      api.listMemory().then(r => setMemory(Array.isArray(r) ? r : r.entries || r.memories || []))
        .catch(() => setMemory([]));
    }
  }, [memOpen]);
  return (
    <div>
      <PageHeader title="Profile"
                  sub="Workspace identity — preferences, API keys and help arrive with Settings (R36S3E2)." />
      <Card style={{ maxWidth: 520 }}>
        {user ? (
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar initials={(user.email || '?').slice(0, 2).toUpperCase()} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: P.ink, fontFamily: FONT }}>
                {user.email}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.faint, marginTop: 2 }}>
                role · {user.role || 'member'}
              </div>
            </div>
            <Btn variant="outline" size="sm" style={{ marginLeft: 'auto' }}
                 onClick={() => { auth.clear(); window.location.href = '/login'; }}>
              Sign out
            </Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 13, fontFamily: FONT, color: P.body }}>
              You are browsing the demo workspace. Sign in to a personal account:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login"><Btn size="sm">Log in</Btn></Link>
              <Link to="/register"><Btn size="sm" variant="outline">Create account</Btn></Link>
            </div>
          </div>
        )}
      </Card>
      <Card style={{ maxWidth: 520, marginTop: 14 }}>
        <div data-testid="memory-toggle" onClick={() => setMemOpen(o => !o)}
             style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em',
                      textTransform: 'uppercase', color: P.faint, cursor: 'pointer' }}>
          Platform memory · admin only {memOpen ? '−' : '+'}
        </div>
        {memOpen && (
          <div data-testid="memory-panel" style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontFamily: FONT, color: P.muted, marginBottom: 8 }}>
              What the platform has learned about this workspace — a prior on
              future plans, never an override. PII-gated and deletable.
            </div>
            {memory == null ? null : memory.length === 0 ? (
              <span style={{ fontSize: 12, fontFamily: FONT, color: P.faint }}>
                Nothing remembered yet.
              </span>
            ) : memory.map(m => (
              <div key={m.id} data-testid={`memory-row-${m.id}`}
                   style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0',
                            borderBottom: `1px solid ${P.borderRow}` }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: P.body, minWidth: 0,
                               overflow: 'hidden', textOverflow: 'ellipsis',
                               whiteSpace: 'nowrap', flex: 1 }}>
                  {m.mem_key} → {m.value}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: P.faint }}>{m.agent}</span>
                <button data-testid="memory-delete" aria-label="Forget entry"
                        onClick={async () => {
                          await api.deleteMemory(m.id);
                          setMemory(list => list.filter(x => x.id !== m.id));
                        }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer',
                                 color: P.faint, fontSize: 13 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
