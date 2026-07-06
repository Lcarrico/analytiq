// R39S1E2-US1 (program R37–R43) — the component builder (deep-dive §6):
// registry palette, metric pickers over the spec's resolved inventory, a
// LIVE data preview through the validated read-only query path, and an
// encoding recommendation that never silently disables alternatives. Add
// creates the exact schema the chat patch planner (R41) will use.
import { useEffect, useRef, useState } from 'react';
import { Btn, Spinner } from './ui';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const label = { fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
                letterSpacing: '.07em', color: P.muted };

const RECOMMEND = (type, metricCount) => {
  if (metricCount > 1) return 'line — several metrics over time read best as lines';
  if (type === 'kpi') return 'kpi — a single headline number';
  return 'bar — one metric across a dimension reads best as bars';
};

export default function ComponentBuilder({ sessionId, onClose, onCreated }) {
  const [types, setTypes] = useState([]);
  const [type, setType] = useState('bar');
  const [title, setTitle] = useState('');
  const [metrics, setMetrics] = useState([]);         // spec inventory
  const [picked, setPicked] = useState([]);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    api.componentRegistry().then(d => setTypes(d.types)).catch(() => setTypes([]));
    api.specHead(sessionId)
      .then(d => setMetrics((d.spec.metrics || []).filter(m => m.resolved !== false)))
      .catch(() => setMetrics([]));
  }, [sessionId]);

  // live preview — debounced through the validated read-only path
  useEffect(() => {
    setPreview(null);
    setErr('');
    if (!picked.length || !title.trim()) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const d = await api.previewComponent(sessionId, {
          component: { type, title: title.trim(), metric_refs: picked } });
        setPreview(d);
      } catch (e) {
        setErr(e?.message || 'Preview failed');
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [sessionId, type, title, picked]);

  const needsMetrics = (types.find(t => t.type === type) || {}).needs_metrics !== false;

  return (
    <div data-testid="component-builder"
         style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
                  background: '#fff', borderLeft: `1px solid ${P.border}`,
                  boxShadow: '-12px 0 32px rgba(15,23,42,.08)', zIndex: 60,
                  display: 'flex', flexDirection: 'column', padding: 18,
                  overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: P.ink, fontFamily: FONT }}>
          Add component
        </span>
        <button data-testid="cb-close" onClick={onClose}
                style={{ marginLeft: 'auto', border: 'none', background: 'none',
                         cursor: 'pointer', fontSize: 15, color: P.muted }}>×</button>
      </div>

      <div style={{ ...label, marginBottom: 6 }}>TYPE</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {types.map(t => (
          <span key={t.type} data-testid={`cb-type-${t.type}`}
                onClick={() => setType(t.type)}
                style={{ display: 'inline-flex', alignItems: 'center', height: 26,
                         padding: '0 11px', borderRadius: 999, cursor: 'pointer',
                         background: type === t.type ? P.ink : '#fff',
                         border: type === t.type ? 'none' : `1px solid ${P.borderStrong}`,
                         color: type === t.type ? '#fff' : P.itemInk,
                         fontSize: 11.5, fontFamily: FONT }}>
            {t.type}
          </span>
        ))}
      </div>

      <div style={{ ...label, marginBottom: 6 }}>TITLE</div>
      <input data-testid="cb-title" value={title} placeholder="e.g. Revenue by location"
             onChange={e => setTitle(e.target.value)}
             style={{ height: 30, borderRadius: 7, padding: '0 10px', fontSize: 12.5,
                      border: `1px solid ${P.borderStrong}`, fontFamily: FONT,
                      outline: 'none', marginBottom: 14 }} />

      {needsMetrics && (
        <>
          <div style={{ ...label, marginBottom: 6 }}>METRICS · from the governed plan</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {metrics.map(m => {
              const on = picked.includes(m.id);
              return (
                <span key={m.id} data-testid={`cb-metric-${m.id}`}
                      onClick={() => setPicked(pk => on
                        ? pk.filter(x => x !== m.id) : [...pk, m.id])}
                      style={{ display: 'inline-flex', alignItems: 'center', height: 24,
                               padding: '0 10px', borderRadius: 999, cursor: 'pointer',
                               background: on ? P.accentSoft : '#fff',
                               border: `1px solid ${on ? P.accentBorder : P.borderStrong}`,
                               color: on ? P.accentHover : P.body, fontSize: 11,
                               fontFamily: MONO }}>
                  {m.label} {on ? '✓' : ''}
                </span>
              );
            })}
            {metrics.length === 0 && (
              <span style={{ fontSize: 11.5, color: P.muted, fontFamily: FONT }}>
                No resolved metrics in this plan yet.
              </span>
            )}
          </div>
        </>
      )}

      <div data-testid="cb-recommend"
           style={{ fontFamily: MONO, fontSize: 10, color: P.accentHover,
                    background: P.accentSoft, borderRadius: 8, padding: '6px 10px',
                    marginBottom: 14 }}>
        recommended: {RECOMMEND(type, picked.length)} — all types stay available
      </div>

      <div style={{ ...label, marginBottom: 6 }}>LIVE PREVIEW</div>
      <div data-testid="cb-preview"
           style={{ border: `1px solid ${P.border}`, borderRadius: 10, padding: 12,
                    minHeight: 96, marginBottom: 12 }}>
        {err ? (
          <span data-testid="cb-preview-error"
                style={{ fontSize: 11.5, color: P.red, fontFamily: FONT }}>{err}</span>
        ) : !preview ? (
          <span style={{ fontSize: 11.5, color: P.faint, fontFamily: FONT }}>
            {picked.length && title ? <Spinner size={16} />
              : 'Pick a type, title and metric to preview real data.'}
          </span>
        ) : (
          <>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: P.body,
                          marginBottom: 8 }}>
              {preview.row_count} row(s) · {(preview.row_shape || []).join(' · ')}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 46 }}>
              {(preview.sample || []).slice(0, 8).map((r, i) => {
                const vals = (preview.sample || []).map(x => Math.abs(Number(x[1]) || 0));
                const max = Math.max(...vals, 1);
                return (
                  <div key={i} title={String(r[0])}
                       style={{ flex: 1, borderRadius: '3px 3px 0 0',
                                background: P.accent, opacity: .85,
                                height: Math.max(3, (Math.abs(Number(r[1]) || 0) / max) * 46) }} />
                );
              })}
            </div>
          </>
        )}
      </div>
      <div data-testid="cb-query-status"
           style={{ fontFamily: MONO, fontSize: 9.5, marginBottom: 16,
                    color: preview ? P.green : P.faint }}>
        {preview ? `SELECT-only ✓ · hash ${preview.query_hash.slice(0, 10)} · `
          + `${preview.cost.rows_scanned} rows scanned` : 'query validates on preview'}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn data-testid="cb-add" disabled={busy || !preview}
             onClick={async () => {
               setBusy(true);
               try {
                 const r = await api.createComponent(sessionId, {
                   type, title: title.trim(), metric_refs: picked });
                 onCreated && onCreated(r);
                 onClose();
               } catch (e) {
                 setErr(e?.message || 'Add failed — nothing was saved.');
                 setBusy(false);
               }
             }}>
          Add to dashboard
        </Btn>
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}
