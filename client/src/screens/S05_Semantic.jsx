import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Badge, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

export default function Screen05() {
  const [proposals, setProposals] = useState([]);   // R10S2E5
  const loadProposals = () => api.semanticProposals().then(r => setProposals(r.proposals)).catch(() => {});
  useEffect(() => { loadProposals(); }, []);   // PAR-2 unmount-crash fix
  const [triage, setTriage] = useState([]);          // R10S2E6
  const [diff, setDiff] = useState(null);            // R11S2E4
  const compareLatest = async () => {
    try {
      const vs = await api.schemaVersions();
      if (vs.length < 2) { setDiff({ error: 'Need at least two schema versions to compare.' }); return; }
      const d = await api.artifactDiff('semantic_schema', vs[1].version, vs[0].version);
      setDiff(d);
    } catch { setDiff({ error: 'Diff failed.' }); }
  };
  useEffect(() => {
    api.governanceLatest()
      .then(r => api.reviewQueueRanked(r.run_id))
      .then(setTriage)
      .catch(() => setTriage([]));
  }, []);
  const { runId, nav } = useApp();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [editId,  setEditId]  = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saving,  setSaving]  = useState(null);

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      setError('No governance run found. Complete the connection and governance steps first.');
      return;
    }
    api.getSemantic(runId)
      .then(rows => setItems(rows))
      .catch(err => setError(err?.message || 'Failed to load semantic definitions.'))
      .finally(() => setLoading(false));
  }, [runId]);

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
            {pending > 0 ? `Resolve ${pending} more` : 'Start analysis'}
          </Btn>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : error ? (
        <Card>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: C.error, fontFamily: FONT }}>{error}</div>
          </div>
        </Card>
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
                    <Btn size="sm" variant="ghost" disabled={!!saving} onClick={() => handleAction(it.id, 'reject')}>Reject</Btn>
                    <Btn size="sm" variant="secondary" disabled={!!saving} onClick={() => handleAction(it.id, 'edit')}>Edit</Btn>
                    <Btn size="sm" disabled={saving === it.id} onClick={() => handleAction(it.id, 'accept')}>
                      {saving === it.id ? '...' : 'Accept'}
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

      <Card style={{ marginTop: 16 }} data-testid="diff-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT }}>Schema versions</span>
          <Btn size="sm" variant="outline" data-testid="compare-versions-btn" onClick={compareLatest}>
            Compare latest two
          </Btn>
        </div>
        {diff && diff.error && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>{diff.error}</span>}
        {diff && diff.summary && (
          <div data-testid="diff-panel" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, fontFamily: MONO }}>
            {diff.summary.added_metrics.map(m => (
              <span key={`a${m}`} data-testid="diff-added" style={{ color: '#1a7f37', border: '1px solid #1a7f37', borderRadius: 4, padding: '2px 8px' }}>+ {m}</span>
            ))}
            {diff.summary.removed_metrics.map(m => (
              <span key={`r${m}`} data-testid="diff-removed" style={{ color: '#b35900', border: '1px solid #b35900', borderRadius: 4, padding: '2px 8px' }}>− {m}</span>
            ))}
            {diff.summary.redefined_metrics.map(m => (
              <span key={`c${m.name}`} data-testid="diff-redefined" style={{ color: C.primary, border: `1px solid ${C.primary}`, borderRadius: 4, padding: '2px 8px' }}>~ {m.name}</span>
            ))}
            {!diff.summary.added_metrics.length && !diff.summary.removed_metrics.length &&
             !diff.summary.redefined_metrics.length &&
              <span style={{ color: C.textTer }}>No metric changes between versions</span>}
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="review-triage">
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT, marginBottom: 4 }}>Review triage</div>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          Pending low-confidence definitions ranked by supporting evidence — triage reorders, only you decide. (§17.3.7)
        </div>
        {triage.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>Queue is empty</span>}
        {triage.slice(0, 8).map(t => (
          <div key={t.id} data-testid={`triage-item-${t.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 600 }}>{t.name}</span>
            <Badge variant="default" xs>{t.type}</Badge>
            <span data-testid="ev-usage" style={{ fontSize: 11, fontFamily: MONO, color: C.textSec }}>usage ×{t.evidence.usage_frequency}</span>
            <span data-testid="ev-sim" style={{ fontSize: 11, fontFamily: MONO, color: C.textSec }}>sim {Math.round(t.evidence.similarity_to_approved * 100)}%</span>
            {t.evidence.conflict_flags.length > 0 &&
              <Badge variant="warning" xs data-testid="ev-conflict">conflict</Badge>}
            <span style={{ fontSize: 11, fontFamily: MONO, color: C.textTer, marginLeft: 'auto' }}>score {t.evidence.evidence_score}</span>
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 16 }} data-testid="evolution-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT }}>Semantic evolution proposals</span>
          <Btn size="sm" variant="outline" data-testid="evolve-scan-btn" onClick={async () => {
            await api.semanticEvolve(); loadProposals();
          }}>Scan now</Btn>
        </div>
        <div style={{ fontSize: 11, color: C.textTer, fontFamily: FONT, marginBottom: 8 }}>
          The layer proposes improvements to itself — admin review only, the canonical schema never auto-mutates. (§17.3.4)
        </div>
        {proposals.length === 0 && <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>No proposals</span>}
        {proposals.slice(0, 8).map(p => (
          <div key={p.id} data-testid={`sem-prop-${p.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
            <Badge variant={p.status === 'proposed' ? 'default' : p.status === 'approved' ? 'success' : 'warning'} xs
                   data-testid="sem-prop-status">{p.status}</Badge>
            <Badge variant="primary" xs>{p.kind}</Badge>
            <span style={{ fontSize: 12, fontFamily: FONT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={p.suggestion}>{p.suggestion}</span>
            {p.status === 'proposed' && <>
              <Btn size="sm" variant="outline" data-testid="sem-prop-approve" onClick={async () => {
                await api.decideSemanticProposal(p.id, 'approve'); loadProposals();
              }}>Approve</Btn>
              <Btn size="sm" variant="ghost" data-testid="sem-prop-reject" onClick={async () => {
                await api.decideSemanticProposal(p.id, 'reject'); loadProposals();
              }}>Reject</Btn>
            </>}
          </div>
        ))}
      </Card>
    </div>
  );
}
