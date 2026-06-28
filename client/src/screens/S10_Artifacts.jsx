import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Badge, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

function MiniChart() {
  return (
    <div style={{ width: 120, height: 68, background: C.primaryLight, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      <svg width={90} height={48} viewBox="0 0 90 48">
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity={0.22} />
            <stop offset="100%" stopColor={C.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <polygon points="0,38 15,28 30,33 45,18 60,23 75,8 90,13 90,48 0,48" fill="url(#mg)" />
        <polyline points="0,38 15,28 30,33 45,18 60,23 75,8 90,13" fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ShareModal({ artifact, onClose }) {
  const [shares,  setShares]  = useState([]);
  const [email,   setEmail]   = useState('');
  const [role,    setRole]    = useState('Viewer');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.getShares(artifact.id)
      .then(setShares)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artifact.id]);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      const s = await api.addShare(artifact.id, { email, role });
      setShares(prev => [...prev, s]);
      setEmail('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (shareId) => {
    try {
      await api.removeShare(artifact.id, shareId);
      setShares(prev => prev.filter(s => s.id !== shareId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.surface, borderRadius: 10, padding: 26, width: 480, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text, fontFamily: FONT }}>Share artifact</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textSec, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: 16, fontSize: 13, color: C.textSec, fontStyle: 'italic', fontFamily: FONT }}>"{artifact.title}"</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, fontFamily: FONT }}>Add workspace member</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="colleague@acme.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: FONT }}
            />
            <select value={role} onChange={e => setRole(e.target.value)}
              style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer', outline: 'none', fontFamily: FONT }}>
              <option>Viewer</option>
              <option>Editor</option>
              <option>Owner</option>
            </select>
            <Btn size="sm" disabled={saving || !email.trim()} onClick={handleAdd}>
              {saving ? '...' : 'Add'}
            </Btn>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner /></div>
        ) : shares.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, fontFamily: FONT }}>Shared with</div>
            {shares.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.borderLight}` }}>
                <span style={{ fontSize: 13, color: C.text, fontFamily: FONT }}>{s.email}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge xs>{s.role}</Badge>
                  <button onClick={() => handleRemove(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTer, fontSize: 14 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '10px 12px', background: C.bg, borderRadius: 6, fontSize: 12, color: C.textSec, fontFamily: FONT }}>
          📎 Public links and embed tokens are out of scope for v1 — available in Phase 2.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Btn onClick={onClose}>Done</Btn>
        </div>
      </div>
    </div>
  );
}

export default function Screen10() {
  const { update, nav } = useApp();
  const [artifacts, setArtifacts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [shareFor,  setShareFor]  = useState(null);

  useEffect(() => {
    api.getArtifacts()
      .then(setArtifacts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this artifact?')) return;
    await api.deleteArtifact(id).catch(() => {});
    setArtifacts(prev => prev.filter(a => a.id !== id));
  };

  const handleOpen = (art) => {
    update({ artifactId: art.id });
    nav(9);
  };

  return (
    <div>
      <PageHeader
        title="Workspace artifacts"
        sub={loading ? '' : `${artifacts.length} saved ${artifacts.length === 1 ? 'analysis' : 'analyses'} · shareable with your team`}
        action={<Btn onClick={() => nav(2)}>+ New analysis</Btn>}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : artifacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 16, color: C.textSec, marginBottom: 20, fontFamily: FONT }}>No artifacts yet.</div>
          <Btn onClick={() => nav(2)}>Start your first analysis →</Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {artifacts.map(art => (
            <Card key={art.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <MiniChart />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span onClick={() => handleOpen(art)} style={{ fontWeight: 600, fontSize: 14, color: C.text, cursor: 'pointer', fontFamily: FONT }}>
                      {art.title}
                    </span>
                    <Badge variant={art.type === 'Predictive' ? 'primary' : 'default'} xs>{art.type}</Badge>
                    <Badge variant={art.dq_status === 'pass' ? 'success' : 'warning'} xs>DQ {art.dq_status}</Badge>
                    {art.mape != null && <Badge variant="success" xs>MAPE {art.mape}%</Badge>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.textTer, fontFamily: FONT }}>
                    <span>👤 {art.owner}</span>
                    <span>🕐 {art.created_at ? new Date(art.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Just now'}</span>
                    {(art.share_count || 0) > 0 && <span>👥 Shared with {art.share_count}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Btn size="sm" variant="secondary" onClick={() => handleOpen(art)}>Open</Btn>
                  <Btn size="sm" variant="outline"   onClick={() => setShareFor(art)}>Share</Btn>
                  <Btn size="sm" variant="ghost"     onClick={() => handleDelete(art.id)}>✕</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {shareFor && (
        <ShareModal artifact={shareFor} onClose={() => setShareFor(null)} />
      )}
    </div>
  );
}
