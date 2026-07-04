import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

export default function Screen06() {
  const { runId, connectionId, update, nav } = useApp();
  const [metrics,     setMetrics]     = useState([]);
  const [loadingMets, setLoadingMets] = useState(true);
  const [msgs,        setMsgs]        = useState([{ r: 'ai', t: 'Semantic layer loaded. Ask me what you would like to understand or predict, then select a target metric from the panel.' }]);
  const [inp,         setInp]         = useState('');
  const [selMetric,   setSelMetric]   = useState(null);
  const [thinking,    setThinking]    = useState(false);
  const [history,     setHistory]     = useState([]);
  const [sugg,        setSugg]        = useState([]);
  const [related,     setRelated]     = useState([]);   // R10S1E2
  const [reuse,       setReuse]       = useState([]);   // R10S2E7
  const [warm,        setWarm]        = useState(null);  // R10S1E3
  useEffect(() => { api.warmStart().then(setWarm).catch(() => {}); }, []);

  useEffect(() => {
    api.listSessions().then(h => setHistory(h.slice(0, 5))).catch(() => {});
  }, []);
  const chatRef = useRef(null);

  useEffect(() => {
    if (!runId) { setLoadingMets(false); return; }
    api.getSemantic(runId)
      .then(rows => {
        const mets = rows.filter(r => r.type === 'Metric' && r.status === 'accepted');
        setMetrics(mets);
      })
      .catch(console.error)
      .finally(() => setLoadingMets(false));
  }, [runId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const send = async () => {
    const txt = inp.trim();
    if (!txt) return;
    setMsgs(p => [...p, { r: 'user', t: txt }]);
    setInp('');
    setThinking(true);
    try {
      // Session planner agent: intent classification → session_spec | clarification
      const plan = await api.planSession({ message: txt, connectionId: connectionId || undefined });
      let reply;
      if (plan.needs_clarification) {
        reply = `${plan.question}\n${(plan.options || []).map((o, i) => `${i + 1}. ${o}`).join('\n')}`;
      } else {
        const parts = [
          `Got it — ${plan.intent} analysis (${Math.round((plan.intent_confidence || 0) * 100)}% confident).`,
          `Target metric: ${plan.target_metric} · grain ${plan.grain}` +
            (plan.prediction_horizon ? ` · horizon ${plan.prediction_horizon} days` : ''),
          'Select the matching metric from the panel on the right to continue.',
        ];
        if (plan.assumptions && plan.assumptions.length) {
          // R10S2E4: expert mode — defaults surfaced inline, not asked about
          parts.push(`Assumptions: ${plan.assumptions.join('; ')}.`);
        }
        reply = parts.join(' ');
        const match = metrics.find(m => m.name === plan.target_metric);
        if (match) setSelMetric(match);
        // R10S1E2: knowledge-graph neighbors of the planned metric
        api.kgRelated(plan.target_metric)
          .then(r => setRelated(r.related || []))
          .catch(() => setRelated([]));
        // R10S2E7: prior validated plans as starting points
        api.reuseCandidates(plan.target_metric)
          .then(r => setReuse(r.candidates || []))
          .catch(() => setReuse([]));
      }
      setMsgs(p => [...p, { r: 'ai', t: reply }]);
    } catch {
      setMsgs(p => [...p, { r: 'ai', t: 'Planning failed — please try rephrasing your question.' }]);
    } finally {
      setThinking(false);
    }
  };

  const handleConfirm = () => {
    update({ selectedMetric: selMetric?.name });
    nav(7);
  };

  const forkFrom = async (sid) => {
    try {
      const forked = await api.forkSession(sid, {});
      update({ sessionId: forked.id });
      const s_ = await api.suggestions(forked.id);
      setSugg(s_);
      setMsgsAI(`Forked session #${sid} → #${forked.id}. Pick a metric or a follow-up below.`);
    } catch { setMsgsAI('Fork failed — the session needs a confirmed spec.'); }
  };
  const setMsgsAI = (t) => setMsgs(p => [...p, { r: 'ai', t }]);
  const askSuggestion = (q) => { setInp(q); };

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="Conversational analysis" sub="Ask in plain English. Select a metric from the semantic layer — no SQL." />
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Chat */}
        <Card p={0} style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', height: 500 }}>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.r === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: m.r === 'user' ? C.primary : C.bg,
                color: m.r === 'user' ? '#fff' : C.text,
                padding: '10px 14px',
                borderRadius: m.r === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                fontSize: 14, lineHeight: 1.5, fontFamily: FONT,
              }}>{m.t}</div>
            ))}
            {thinking && (
              <div style={{ alignSelf: 'flex-start', background: C.bg, padding: '10px 14px', borderRadius: '4px 14px 14px 14px', fontSize: 14, color: C.textSec, fontFamily: FONT }}>
                …
              </div>
            )}
          </div>
          {warm && warm.has_history && (
            <div data-testid="warm-start-hints" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', margin: '6px 0', fontSize: 11, fontFamily: MONO, color: C.textSec }}>
              <span>From your history:</span>
              {warm.likely_intents.slice(0, 2).map(li => (
                <span key={li.intent} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: '2px 8px' }}>{li.intent} ×{li.count}</span>
              ))}
              {warm.recent_metrics.slice(0, 3).map(m => (
                <span key={m} style={{ color: C.textTer }}>{m}</span>
              ))}
            </div>
          )}
          {reuse.length > 0 && (
            <div data-testid="reuse-candidates" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', margin: '6px 0' }}>
              <span style={{ fontSize: 11, color: C.textTer, fontFamily: MONO }}>Start from a prior analysis:</span>
              {reuse.slice(0, 3).map(cand => (
                <span key={cand.plan_uid} title={`similarity ${cand.similarity}`}
                      style={{ fontSize: 11, fontFamily: MONO, border: `1px solid ${C.primary}`, borderRadius: 10, padding: '2px 8px', color: C.primary }}>
                  {cand.payload.metric} · {Math.round(cand.similarity * 100)}%
                </span>
              ))}
            </div>
          )}
          {related.length > 0 && (
            <div data-testid="kg-related" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', margin: '6px 0' }}>
              <span style={{ fontSize: 11, color: C.textTer, fontFamily: MONO }}>Related:</span>
              {related.map(r => (
                <span key={r.metric} style={{ fontSize: 11, fontFamily: MONO, border: `1px solid ${C.border}`, borderRadius: 10, padding: '2px 8px', color: C.textSec }}>{r.metric}</span>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
            <input
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask a business question..."
              style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: FONT }}
            />
            <Btn onClick={send} disabled={thinking}>Send</Btn>
          </div>
        </Card>

        {/* Metrics panel */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>
            Available metrics
          </div>

          {loadingMets ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={24} /></div>
          ) : metrics.length === 0 ? (
            <div style={{ padding: 16, fontSize: 13, color: C.textSec, fontFamily: FONT, background: C.bg, borderRadius: 8 }}>
              {runId ? 'No accepted metrics yet. Go back and accept metric definitions in the semantic review step.' : 'No governance run found. Complete the connection and governance steps first.'}
              <div style={{ marginTop: 12 }}>
                <Btn variant="secondary" onClick={() => nav(5)}>← Semantic review</Btn>
              </div>
            </div>
          ) : (
            metrics.map((m, i) => (
              <button key={i} onClick={() => setSelMetric(m)} style={{
                textAlign: 'left', padding: 14, borderRadius: 8,
                border: `2px solid ${selMetric?.id === m.id ? C.primary : C.border}`,
                background: selMetric?.id === m.id ? C.primaryLight : C.surface,
                cursor: 'pointer', transition: 'all 0.15s', width: '100%',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.textSec, fontFamily: FONT, lineHeight: 1.4 }}>{m.definition}</div>
              </button>
            ))
          )}

          {selMetric && (
            <Btn onClick={handleConfirm}>Confirm: {selMetric.name} →</Btn>
          )}
        </div>

      </div>
      {(history.length > 0 || sugg.length > 0) && (
        <div style={{ marginTop: 14 }}>
          {sugg.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {sugg.map((s_, i) => (
                <button key={i} onClick={() => askSuggestion(s_.question)}
                        style={{ fontSize: 11, fontFamily: FONT, border: `1px solid ${C.border}`,
                                 background: C.surface, borderRadius: 12, padding: '4px 10px',
                                 cursor: 'pointer' }}>
                  {s_.question}
                </button>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <div style={{ fontSize: 11, color: C.textSec, fontFamily: MONO }}>
              Recent sessions:{' '}
              {history.map(h => (
                <button key={h.id} onClick={() => forkFrom(h.id)}
                        style={{ fontSize: 11, fontFamily: MONO, border: 'none',
                                 background: 'none', color: C.primary, cursor: 'pointer' }}>
                  #{h.id} {h.metric} (fork)
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
