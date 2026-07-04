import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Badge } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';

const H = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase',
                letterSpacing: '0.06em', fontFamily: MONO, margin: '18px 0 8px' }}>{children}</div>
);
const input = { padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                fontSize: 12, fontFamily: MONO, outline: 'none' };
const gate = s => <span style={{ color: s === 'PASS' ? '#1e7d3c' : '#b3261e',
                                 fontFamily: MONO, fontSize: 11 }}>{s}</span>;

export default function Screen14() {
  const { sessionId, nav } = useApp();
  const [gold, setGold]       = useState([]);
  const [jobs, setJobs]       = useState([]);
  const [card, setCard]       = useState(null);
  const [trials, setTrials]   = useState([]);
  const [registry, setRegistry] = useState([]);
  const [msg, setMsg]         = useState('');
  const [cf, setCf]           = useState({ name: '', expr: '' });
  const [dry, setDry]         = useState(null);

  const load = () => {
    if (!sessionId) return;
    api.goldTables(sessionId).then(setGold).catch(() => {});
    api.trainingJobs(sessionId).then(setJobs).catch(() => {});
    api.registryModels(sessionId).then(setRegistry).catch(() => {});
    api.trainingResult(sessionId).then(res => {
      if (res.model_card_id) {
        api.modelCard(res.model_card_id).then(setCard).catch(() => {});
        api.jobTrials(res.job_id).then(setTrials).catch(() => {});
      }
    }).catch(() => {});
  };
  useEffect(() => { load(); }, [sessionId]);   // PAR-2 unmount-crash fix

  const act = (fn, ok) => async () => {
    setMsg('');
    try {
      const res = await fn();
      setMsg(typeof ok === 'function' ? ok(res) : ok);
      load();
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch {}
      setMsg(`️ ${m}`);
    }
  };

  if (!sessionId) return (
    <div style={{ maxWidth: 620 }}>
      <PageHeader title="Models" sub="Confirm an analysis spec first — then build gold tables and train here." />
      <Btn onClick={() => nav(6)}>← Start an analysis</Btn>
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="Models"
                  sub="Gold tables, feature engineering, training trials, promotion and the registry." />
      {msg && <div style={{ fontSize: 12, marginBottom: 10, fontFamily: FONT }}>{msg}</div>}

      <Card>
        <H>Data modeler</H>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn size="sm" variant="outline"
               onClick={act(async () => setDry(await api.modelerGenerate(
                 { sessionId, mode: 'dry_run' })), 'Dry run complete — SQL below.')}>Dry run</Btn>
          <Btn size="sm" onClick={act(() => api.modelerGenerate(
            { sessionId, mode: 'execute' }), 'Gold table written.')}>Execute gold write</Btn>
          <Btn size="sm" variant="outline" onClick={act(() => api.modelerEnrich(sessionId),
            'Feature engineering applied (lags, rolling, holidays, encodings).')}>Enrich features</Btn>
        </div>
        {dry && (
          <pre style={{ fontSize: 10, background: C.bg, padding: 10, borderRadius: 6,
                        overflowX: 'auto', maxHeight: 160 }}>{dry.ddl}\n\n{dry.insert_sql}</pre>
        )}
        {gold.map(g_ => (
          <div key={g_.id} style={{ fontSize: 12, fontFamily: MONO, padding: '4px 0' }}>
            {g_.table_name} · {g_.row_count} rows · {g_.status} · manifest {g_.manifest_version || '—'}
          </div>
        ))}

        <H>Custom features (reviewed)</H>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...input, width: 160 }} placeholder="feature_name"
                 value={cf.name} onChange={e => setCf(f => ({ ...f, name: e.target.value }))} />
          <input style={{ ...input, width: 260 }} placeholder="target_net_revenue / rolling_mean_7_target"
                 value={cf.expr} onChange={e => setCf(f => ({ ...f, expr: e.target.value }))} />
          <Btn size="sm" onClick={act(async () => {
            const created = await api.customFeatures({ sessionId, name: cf.name, expr: cf.expr });
            await api.approveFeature(created.id);
            await api.applyFeature(created.id);
            if (created.leakage?.action === 'HOLD') {
              await api.confirmLeakage({ sessionId, features: [created.name],
                                         justification: 'confirmed from UI' });
              return 'Feature applied (leakage HOLD explicitly confirmed).';
            }
            return 'Feature reviewed, approved and applied.';
          }, r => r)}>Add + review + apply</Btn>
        </div>

        <H>Training</H>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn size="sm" onClick={act(() => api.trainRun(sessionId),
            'Training queued — refresh in a moment.')}>Train candidates</Btn>
          <Btn size="sm" variant="outline" onClick={act(() => api.retrain(sessionId),
            'Retrain queued with an advanced rolling window; champion archived.')}>One-click retrain</Btn>
          <Btn size="sm" variant="ghost" onClick={load}>↻ Refresh</Btn>
        </div>
        {jobs.map(j => (
          <div key={j.id} style={{ display: 'flex', gap: 10, alignItems: 'center',
                                   fontSize: 12, fontFamily: MONO, padding: '4px 0' }}>
            job #{j.id} · {j.status} {j.error ? `· ${j.error}` : ''}
            {j.status === 'done' && j.model_card_id && (
              <Btn size="sm" variant="outline" onClick={act(() => api.promote(j.id),
                r => r.status === 'promoted'
                  ? `Promoted ${r.model_id} (repair cycles: ${r.repair_cycles}).`
                  : `Promotion failed after ${r.repair_cycles} repair cycles — human review required.`)}>
                Promote
              </Btn>
            )}
          </div>
        ))}

        {card && (
          <>
            <H>Model card · {card.algorithm} ({card.status})</H>
            <div style={{ fontSize: 12, fontFamily: MONO }}>
              val MAPE {card.metrics.val_mape}% · test {card.metrics.test_mape}% ·{' '}
              {card.metrics.training_duration_seconds}s ·{' '}
              {Object.entries(card.gates).map(([k, v]) => (
                <span key={k} style={{ marginRight: 10 }}>{k} {gate(v.status)}</span>
              ))}
            </div>
            {(card.top_features || []).length > 0 && (
              <div style={{ marginTop: 8 }}>
                {card.top_features.slice(0, 8).map(t => (
                  <div key={t.name} style={{ display: 'flex', gap: 8, alignItems: 'center',
                                             fontSize: 11, fontFamily: MONO }}>
                    <span style={{ width: 190, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    <span style={{ height: 8, background: C.primary, borderRadius: 3,
                                   width: `${Math.max(2, t.importance * 300)}px` }} />
                    <span>{t.importance}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {trials.length > 0 && (
          <>
            <H>Trial leaderboard</H>
            {trials.slice(0, 8).map(t => (
              <div key={t.id} style={{ fontSize: 11, fontFamily: MONO, padding: '3px 0' }}>
                {(t.params.family || 'seasonal-trend').padEnd(16)} · MAPE {t.mape}%
              </div>
            ))}
          </>
        )}

        <H>Registry</H>
        {registry.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center',
                                   fontSize: 12, fontFamily: MONO, padding: '3px 0' }}>
            {m.model_id} · v{m.version} ·{' '}
            <Badge variant={m.status === 'active' ? 'success' : 'default'} xs>{m.status}</Badge>
            {m.status === 'challenger' && (
              <Btn size="sm" variant="outline" onClick={act(() => api.evaluateChallenger(m.id),
                r => r.outcome === 'challenger_promoted'
                  ? `Challenger promoted (+${r.improvement_pct}%).`
                  : `Champion retained (${r.improvement_pct}% improvement < 5%).`)}>
                Evaluate vs champion
              </Btn>
            )}
            {m.status === 'active' && (
              <Btn size="sm" variant="ghost" onClick={act(() => api.archiveModel(m.id),
                'Model archived.')}>Archive</Btn>
            )}
          </div>
        ))}
        {!registry.length && <div style={{ fontSize: 12, color: C.textTer }}>No registered models yet.</div>}
      </Card>
    </div>
  );
}
