// R36S1E3-US1 (program R30–R36) — Alerts (`Alerts.dc.html` frames 01–03 /
// PRD §8 audit-first) over the alert-rules CRUD DEP. The center: typed
// filter pills + rules with live FIRING / OK / MUTED status and last-fired
// times. Create: a drawer that posts a real rule — its first check runs
// immediately against real data. Detail: grounded trigger history with
// delivery marks, trigger logic, linked artifacts, Mute 24h / Check now /
// Delete (all audited).
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Btn, PageHeader, Spinner } from '../components/ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 600,
                letterSpacing: '.07em', color: P.muted };
const card = { background: '#fff', border: `1px solid ${P.border}`, borderRadius: 10 };
const mono = { fontFamily: MONO, fontSize: 11, color: P.body };
const KIND_NAME = { threshold: 'Metric threshold', anomaly: 'Anomaly',
                    freshness: 'Freshness', schema_drift: 'Schema drift',
                    model_drift: 'Model drift', artifact_health: 'Artifact health' };
const STATUS_TINT = { firing: [P.redBg, P.red], ok: [P.greenBg, P.green],
                      muted: [P.tableHeadBg, P.muted] };

export function AlertsCenter() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [composer, setComposer] = useState(false);
  const [conns, setConns] = useState([]);
  const [form, setForm] = useState({ name: '', kind: 'freshness', watch: '',
                                     connection_id: '' });
  const [err, setErr] = useState('');

  const load = () => api.alertRules().then(setData).catch(() => setData(false));
  useEffect(() => {
    load();
    api.getConnections().then(r => setConns(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  if (data === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  const counts = data?.counts || { all: 0 };
  const rules = (data?.rules || []).filter(r => filter === 'all' || r.kind === filter);
  const save = async () => {
    setErr('');
    try {
      await api.createAlertRule({ name: form.name, kind: form.kind,
        watch: form.watch || undefined,
        connection_id: form.connection_id ? Number(form.connection_id) : undefined,
        condition: form.kind === 'freshness' ? { max_age_hours: 1 } : {},
        deliver: ['email'] });
      setComposer(false);
      setForm({ name: '', kind: 'freshness', watch: '', connection_id: '' });
      load();
    } catch (e) {
      let m = e.message; try { m = JSON.parse(e.message)?.error || m; } catch { /* raw */ }
      setErr(m);
    }
  };

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <PageHeader title="Alerts"
                    sub="Watches over metrics, freshness, drift, and health — every check is a real evaluation against live data." />
        <Btn data-testid="al-create" size="sm"
             style={{ marginLeft: 'auto', marginTop: -26 }}
             onClick={() => setComposer(c => !c)}>
          + Create alert
        </Btn>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '2px 0 14px', flexWrap: 'wrap' }}>
        {[['all', 'All', counts.all],
          ...Object.entries(KIND_NAME).map(([k, n]) => [k, n, counts[k] || 0])]
          .map(([key, name, n]) => {
            const on = filter === key;
            return (
              <span key={key} data-testid={`al-pill-${key}`}
                    onClick={() => setFilter(key)}
                    style={{ display: 'inline-flex', alignItems: 'center', height: 28,
                             padding: '0 12px', borderRadius: 999, cursor: 'pointer',
                             background: on ? P.ink : '#fff',
                             border: on ? 'none' : `1px solid ${P.borderStrong}`,
                             color: on ? '#fff' : P.itemInk, fontSize: 12,
                             fontWeight: on ? 600 : 500, fontFamily: FONT }}>
                {name} &middot; {n}
              </span>
            );
          })}
      </div>

      {composer && (
        <div style={{ ...card, padding: 14, marginBottom: 14, display: 'flex', gap: 8,
                      alignItems: 'center', flexWrap: 'wrap' }}>
          <input data-testid="alc-name" value={form.name} placeholder="alert name"
                 onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                 style={{ height: 30, width: 220, borderRadius: 7, fontFamily: FONT,
                          border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                          fontSize: 12, outline: 'none' }} />
          <select data-testid="alc-kind" value={form.kind}
                  onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}
                  style={{ height: 30, borderRadius: 7, fontSize: 12, fontFamily: FONT,
                           border: `1px solid ${P.borderStrong}`, background: '#fff' }}>
            {Object.entries(KIND_NAME).map(([k, n]) => (
              <option key={k} value={k}>{n}</option>
            ))}
          </select>
          <input data-testid="alc-watch" value={form.watch}
                 placeholder="watch (table / metric)"
                 onChange={e => setForm(f => ({ ...f, watch: e.target.value }))}
                 style={{ height: 30, width: 180, borderRadius: 7, fontFamily: MONO,
                          border: `1px solid ${P.borderStrong}`, padding: '0 10px',
                          fontSize: 12, outline: 'none' }} />
          <select data-testid="alc-connection" value={form.connection_id}
                  onChange={e => setForm(f => ({ ...f, connection_id: e.target.value }))}
                  style={{ height: 30, borderRadius: 7, fontSize: 12, fontFamily: FONT,
                           border: `1px solid ${P.borderStrong}`, background: '#fff' }}>
            <option value="">connection (optional)</option>
            {conns.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.account || c.type}</option>
            ))}
          </select>
          <Btn data-testid="alc-save" size="sm" onClick={save} disabled={!form.name}>
            Save alert
          </Btn>
          {err && <span style={{ fontSize: 11.5, color: P.red, fontFamily: FONT }}>{err}</span>}
        </div>
      )}

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1.1fr', gap: 10,
                      padding: '0 16px', height: 36, alignItems: 'center',
                      background: P.tableHeadBg, borderBottom: `1px solid ${P.border}`,
                      ...label }}>
          <span>ALERT</span><span>TYPE</span><span>STATUS</span><span>LAST TRIGGERED</span>
        </div>
        {rules.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12.5, color: P.muted, fontFamily: FONT }}>
            No alerts match this filter — create one to start watching.
          </div>
        ) : rules.map(r => {
          const [bg, fg] = STATUS_TINT[r.status] || STATUS_TINT.ok;
          return (
            <div key={r.id} data-testid={`al-row-${r.id}`}
                 onClick={() => navigate(`/app/alerts/${r.id}`)}
                 style={{ display: 'grid',
                          gridTemplateColumns: '2.2fr 1fr 1fr 1.1fr', gap: 10,
                          padding: '10px 16px', alignItems: 'center', cursor: 'pointer',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink,
                              fontFamily: FONT }}>
                  {r.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' }}>
                  {r.watch || '—'}{r.condition?.max_age_hours
                    ? ` · SLA ${r.condition.max_age_hours}h` : ''}
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, color: P.body }}>
                {(KIND_NAME[r.kind] || r.kind).toLowerCase()}
              </span>
              <span data-testid="al-status"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                             height: 18, padding: '0 9px', borderRadius: 999,
                             background: bg, color: fg, fontFamily: MONO, fontSize: 8.5,
                             fontWeight: 700, justifySelf: 'start' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%',
                               background: fg }} />
                {r.status.toUpperCase()}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: P.muted }}>
                {(r.last_fired || '').slice(0, 16) || 'never'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.alertRule(id).then(setD).catch(() => setD(false));
  useEffect(() => { load(); }, [id]);

  if (d === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={24} />
      </div>
    );
  }
  if (!d) {
    return (
      <div style={{ maxWidth: 700 }}>
        <PageHeader title="Alert not found" sub="It may have been deleted." />
        <Btn size="sm" variant="outline" onClick={() => navigate('/app/alerts')}>
          Back to alerts
        </Btn>
      </div>
    );
  }
  const r = d.rule;
  const [bg, fg] = STATUS_TINT[r.status] || STATUS_TINT.ok;
  const act = fn => async () => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch { /* audited server-side */ }
    await load();
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div onClick={() => navigate('/app/alerts')}
           style={{ fontSize: 12, color: P.accent, cursor: 'pointer', marginBottom: 10,
                    fontFamily: FONT }}>
        &larr; Alerts
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <h1 data-testid="ald-name"
            style={{ margin: 0, fontSize: 20, fontWeight: 700, color: P.ink,
                     fontFamily: FONT }}>
          {r.name}
        </h1>
        <span data-testid="ald-status"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 20,
                       padding: '0 10px', borderRadius: 999, background: bg, color: fg,
                       fontFamily: MONO, fontSize: 9, fontWeight: 700 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: fg }} />
          {r.status.toUpperCase()}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn data-testid="ald-check" size="sm" variant="outline" disabled={busy}
               onClick={act(() => api.checkAlertRule(id))}>
            Check now
          </Btn>
          <Btn data-testid="ald-mute" size="sm" variant="outline" disabled={busy}
               onClick={act(() => api.patchAlertRule(id,
                 { mute_hours: r.status === 'muted' ? 0 : 24 }))}>
            {r.status === 'muted' ? 'Unmute' : 'Mute 24h'}
          </Btn>
          <Btn data-testid="ald-delete" size="sm" variant="outline" disabled={busy}
               onClick={async () => {
                 try { await api.deleteAlertRule(id); navigate('/app/alerts'); }
                 catch { /* role gated */ }
               }}>
            Delete
          </Btn>
        </span>
      </div>
      <div style={{ fontSize: 12, color: P.muted, fontFamily: FONT, marginBottom: 14 }}>
        {r.owner ? `created by ${r.owner} · ` : ''}checked {r.frequency}
        {d.linked_artifacts.length
          ? ` · linked: ${d.linked_artifacts.map(a => a.title).join(', ')}` : ''}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ ...label, marginBottom: 8 }}>TRIGGER HISTORY</div>
          {d.triggers.length === 0 ? (
            <span style={{ fontSize: 12, color: P.faint, fontFamily: FONT }}>
              No checks recorded yet.
            </span>
          ) : d.triggers.map(t => (
            <div key={t.id} data-testid={`ald-trigger-${t.id}`}
                 style={{ display: 'flex', gap: 10, alignItems: 'center',
                          padding: '7px 0',
                          borderBottom: `1px solid ${P.borderRow}` }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 17,
                             padding: '0 8px', borderRadius: 999,
                             background: t.status === 'firing' ? P.redBg : P.greenBg,
                             color: t.status === 'firing' ? P.red : P.green,
                             fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                             flex: 'none' }}>
                {t.status.toUpperCase()}
              </span>
              <span style={{ fontSize: 12, color: P.body, fontFamily: FONT, flex: 1 }}>
                {t.message}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint,
                             flex: 'none' }}>
                {(t.created_at || '').slice(5, 16)}
                {(t.delivered || []).length
                  ? ` · ${t.delivered.join(' ✓ ')} ✓` : ''}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...card, padding: 16 }}>
            <div style={{ ...label, marginBottom: 7 }}>TRIGGER LOGIC</div>
            <div data-testid="ald-logic" style={{ ...mono, lineHeight: 1.7 }}>
              {r.kind === 'freshness'
                ? `${r.watch} sync exceeds max age ${r.condition.max_age_hours ?? 24}h`
                : r.kind === 'threshold'
                  ? `${r.watch} falls below floor ${r.condition.floor ?? '—'}`
                  : `${KIND_NAME[r.kind] || r.kind} check on ${r.watch || 'workspace'}`}
            </div>
          </div>
          <div style={{ ...card, padding: 16 }}>
            <div style={{ ...label, marginBottom: 7 }}>DELIVERY</div>
            <div style={{ fontSize: 12, color: P.body, fontFamily: FONT }}>
              {(r.deliver || []).join(' · ') || 'in-app only'}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: P.faint,
                          marginTop: 6 }}>
              firing checks deliver to every channel &middot; ok checks stay quiet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
