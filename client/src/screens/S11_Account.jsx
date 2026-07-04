import { useEffect, useState } from 'react';
import { Btn, Card, PageHeader, Badge } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api, auth } from '../api';

const input = { width: '100%', padding: '8px 12px', borderRadius: 6,
                border: `1px solid ${C.border}`, fontSize: 13, fontFamily: MONO,
                outline: 'none', boxSizing: 'border-box' };

export default function Screen11() {
  const [mode, setMode]   = useState('login');
  const [form, setForm]   = useState({ email: '', password: '', role: 'analyst' });
  const [user, setUser]   = useState(auth.user());
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);
  const [memories, setMemories] = useState([]);   // R10S1E1
  const loadMemories = () => api.listMemory().then(r => setMemories(r.memories)).catch(() => {});
  useEffect(() => { loadMemories(); }, []);   // PAR-2 unmount-crash fix

  useEffect(() => {
    if (auth.token()) api.me().then(setUser).catch(() => auth.clear());
  }, []);

  const submit = async () => {
    setBusy(true); setError('');
    try {
      if (mode === 'register') {
        await api.register(form);
      }
      const res = await api.login({ email: form.email, password: form.password });
      auth.save(res.token, res.user);
      setUser(res.user);
    } catch (e) {
      let msg = e.message;
      try { msg = JSON.parse(e.message)?.error || msg; } catch {}
      setError(msg);
    } finally { setBusy(false); }
  };

  if (user) return (
    <div style={{ maxWidth: 480 }}>
      <PageHeader title="Account" sub="Signed in with a bearer token — API calls carry your identity." />
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: FONT }}>{user.email}</div>
        <div style={{ marginTop: 6 }}>
          <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>{user.role}</Badge>
        </div>
        <div style={{ marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => { auth.clear(); setUser(null); }}>Sign out</Btn>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ maxWidth: 420 }}>
      <PageHeader title={mode === 'login' ? 'Sign in' : 'Create account'}
                  sub="Local fallback auth — PBKDF2 passwords, 24h bearer tokens." />
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={input} placeholder="email@company.com" value={form.email}
                 onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input style={input} type="password" placeholder="password (min 8 chars)"
                 value={form.password}
                 onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          {mode === 'register' && (
            <select style={input} value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="admin">admin</option>
              <option value="analyst">analyst</option>
              <option value="viewer">viewer</option>
            </select>
          )}
          {error && <div style={{ fontSize: 12, color: '#dc2626', fontFamily: FONT }}>️ {error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn disabled={busy} onClick={submit}>
              {busy ? '…' : mode === 'login' ? 'Sign in' : 'Register & sign in'}
            </Btn>
            <Btn variant="ghost" onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Need an account?' : 'Have an account?'}
            </Btn>
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="memory-panel">
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT, marginBottom: 4 }}>Agent memory</div>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          What the platform has learned about this workspace — a prior on future plans, never an override. PII-gated, fully deletable. (§17.3.1)
        </div>
        {memories.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>Nothing remembered yet</span>}
        {memories.map(m => (
          <div key={m.id} data-testid={`memory-row-${m.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
            <Badge variant="default" xs>{m.category}</Badge>
            <span style={{ fontSize: 12, fontFamily: MONO }}>{m.agent}</span>
            <span style={{ fontSize: 12, fontFamily: FONT }}>{m.mem_key} → {m.value}</span>
            <span style={{ fontSize: 11, color: C.textTer, fontFamily: MONO, marginLeft: 'auto' }}>w {Number(m.weight).toFixed(1)}</span>
            <button data-testid="memory-delete" title="forget"
                    onClick={async () => { await api.deleteMemory(m.id); loadMemories(); }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textTer, fontSize: 13 }}>✕</button>
          </div>
        ))}
      </Card>
    </div>
  );
}
