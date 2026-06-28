import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Badge, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

export default function Screen05() {
  const { runId, nav } = useApp();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId,  setEditId]  = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saving,  setSaving]  = useState(null); // id of item being saved

  const effectiveRunId = runId || 1; // fall back to seeded demo run

  useEffect(() => {
    api.getSemantic(effectiveRunId)
      .then(rows => setItems(rows))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [effectiveRunId]);

  const pending = items.filter(i => i.status === 'pending').length;

  const handleAction = async (id, action) => {
    if (action === 'edit') {
      const it = items.find(i => i.id === id);
      setEditId(id);
      setEditVal(it.definition);
      return;
    }
    setSaving(id);
    try {
      const updated = await api.updateSemantic(id, { status: action === 'accept' ? 'accepted' : 'rejected' });
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(editId);
    try {
      const updated = await api.updateSemantic(editId, { definition: editVal, status: 'accepted' });
      setItems(prev => prev.map(i => i.id === editId ? updated : i));
      setEditId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const confColor = (c) => c < 0.65 ? C.error : c < 0.75 ? C.warning : C.success;

  return (
    <div style={{ maxWidth: 780 }}>
      <PageHeader
        title="Semantic review queue"
        sub="Low-confidence definitions need your approval before ML use."
        badge={{ label: `${pending} pending`, v: pending > 0 ? 'warning' : 'success' }}
        action={
          <Btn disabled={pending > 0} onClick={() => nav(6)}>
            {pending > 0 ? `Resolve ${pending} more →` : 'Start analysis →'}
          </Btn>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(it => (
            <Card key={it.id} style={{ opacity: it.status !== 'pending' ? 0.62 : 1, transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <Badge variant="primary" xs>{it.type}</Badge>
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.text, fontFamily: FONT }}>{it.name}</span>
                    <span style={{ fontSize: 11, color: C.textSec, fontFamily: FONT }}>in {it.explore}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: MONO, fontWeight: 700, color: confColor(it.confidence) }}>
                      {(it.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>

                  {editId === it.id ? (
                    <div>
                      <textarea
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.primary}`, borderRadius: 6, fontSize: 13, fontFamily: FONT, minHeight: 70, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <Btn size="sm" disabled={saving === it.id} onClick={handleSaveEdit}>
                          {saving === it.id ? 'Saving...' : 'Save'}
                        </Btn>
                        <Btn size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: C.textSec, lineHeight: 1.55, fontFamily: FONT }}>{it.definition}</p>
                  )}
                </div>

                {it.status === 'pending' && editId !== it.id && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, paddingTop: 2 }}>
                    <Btn size="sm" variant="ghost" disabled={!!saving} onClick={() => handleAction(it.id, 'reject')}>✗ Reject</Btn>
                    <Btn size="sm" variant="secondary" disabled={!!saving} onClick={() => handleAction(it.id, 'edit')}>✎ Edit</Btn>
                    <Btn size="sm" disabled={saving === it.id} onClick={() => handleAction(it.id, 'accept')}>
                      {saving === it.id ? '...' : '✓ Accept'}
                    </Btn>
                  </div>
                )}

                {it.status !== 'pending' && (
                  <Badge variant={it.status === 'accepted' ? 'success' : 'default'} xs>
                    {it.status === 'accepted' ? 'Accepted' : 'Rejected'}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
