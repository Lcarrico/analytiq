// R33S2E3-US1 (program R30–R36) — Present mode (`Artifact Sharing.dc.html`
// frame 04 / ch14): full-screen chrome-free dark stage. Slides derive from
// the artifact's real chart data (overview KPIs, actuals trend, forecast
// ±CI, recent daily bars — plus any custom layout sections' titles);
// presenter notes come straight from the grounded narrative engine.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FONT, MONO, P } from '../tokens';
import { api } from '../api';

const INK = '#0f172a';

function Line({ rows, showForecast, accent }) {
  const w = 760, h = 300, pad = 30;
  const data = rows.filter(r => showForecast || !r.is_forecast);
  if (!data.length) return null;
  const vals = data.map(r => (r.is_forecast ? r.predicted : r.actual) || 0);
  const min = Math.min(...vals, ...data.map(r => r.ci_low || Infinity));
  const max = Math.max(...vals, ...data.map(r => r.ci_high || 0));
  const x = i => pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
  const y = v => h - pad - ((v - min) / Math.max(max - min, 1)) * (h - pad * 2);
  const actuals = data.filter(r => !r.is_forecast);
  const fc = data.filter(r => r.is_forecast);
  const off = actuals.length - 1;
  const path = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {showForecast && fc.length > 0 && (
        <path d={path(fc.map((r, i) => [x(off + i + 1), y(r.ci_high || 0)]))
                 + ' ' + fc.map((r, i) => [x(off + fc.length - i), y(r.ci_low || 0)])
                   .map(p => `L${p[0]},${p[1]}`).join(' ') + ' Z'}
              fill={accent} opacity="0.14" />
      )}
      <path d={path(actuals.map((r, i) => [x(i), y(r.actual || 0)]))}
            fill="none" stroke={accent} strokeWidth="2.2" />
      {showForecast && fc.length > 0 && (
        <path d={path([[x(off), y(actuals[off]?.actual || 0)],
                       ...fc.map((r, i) => [x(off + i + 1), y(r.predicted || 0)])])}
              fill="none" stroke={accent} strokeWidth="2" strokeDasharray="6 5"
              opacity="0.8" />
      )}
    </svg>
  );
}

export default function PresentMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [art, setArt] = useState(null);
  const [chart, setChart] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [idx, setIdx] = useState(0);
  const [notes, setNotes] = useState(false);

  useEffect(() => {
    api.getArtifact(id).then(setArt).catch(() => setArt(false));
    api.artifactChart(id).then(setChart).catch(() => {});
    fetch(`/api/artifacts/${id}/narrative?audience=executive`)
      .then(r => r.json()).then(setNarrative).catch(() => {});
  }, [id]);

  const slides = useMemo(() => {
    const rows = chart?.rows || [];
    const k = chart?.kpis || {};
    const recent = rows.filter(r => !r.is_forecast).slice(-14);
    return [
      { title: `${art?.title || 'Dashboard'} · overview`, kind: 'kpis', k },
      { title: 'Actuals · daily trend', kind: 'line', rows, forecast: false },
      { title: 'Forecast with confidence band', kind: 'line', rows, forecast: true },
      { title: 'Recent two weeks · daily', kind: 'bars', recent },
    ];
  }, [art, chart]);
  const slide = slides[idx];
  const accent = '#60a5fa';

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, slides.length - 1));
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0));
      if (e.key === 'Escape') navigate(`/app/artifacts/${id}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length, id, navigate]);

  if (art === false) {
    return (
      <div style={{ minHeight: '100vh', background: INK, color: '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT }}>
        Artifact not found.
      </div>
    );
  }

  return (
    <div data-testid="present-stage"
         style={{ minHeight: '100vh', background: INK, color: '#e2e8f0',
                  display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14,
                    padding: '22px 34px 0' }}>
        <h1 data-testid="present-title"
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
          {slide?.title || '…'}
        </h1>
        <span data-testid="present-counter"
              style={{ fontFamily: MONO, fontSize: 11, color: '#64748b' }}>
          section {idx + 1} / {slides.length}
        </span>
        <span data-testid="present-exit" onClick={() => navigate(`/app/artifacts/${id}`)}
              style={{ marginLeft: 'auto', cursor: 'pointer', color: '#64748b',
                       fontSize: 16, lineHeight: 1 }}>
          &#10005;
        </span>
      </div>

      <div data-testid="present-chart"
           style={{ flex: 1, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '10px 34px 90px' }}>
        <div style={{ width: '100%', maxWidth: 860, background: '#111c31',
                      border: '1px solid #1e293b', borderRadius: 14,
                      padding: '26px 30px' }}>
          {!chart ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 60 }}>
              Loading data…
            </div>
          ) : slide.kind === 'kpis' ? (
            <div style={{ display: 'flex', gap: 16 }}>
              {[['AVG ACTUAL', Math.round(slide.k.avgActual || 0).toLocaleString('en-US')],
                ['FORECAST AVG', Math.round(slide.k.forecast14Avg || 0).toLocaleString('en-US')],
                ['BACKTEST MAPE', `${slide.k.mape ?? '—'}%`]].map(([k2, v]) => (
                <div key={k2} style={{ flex: 1, background: '#0d1830',
                                       border: '1px solid #1e293b', borderRadius: 10,
                                       padding: '20px 22px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em',
                                color: '#64748b', fontWeight: 700 }}>{k2}</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: '#f1f5f9',
                                marginTop: 8 }}>{v}</div>
                </div>
              ))}
            </div>
          ) : slide.kind === 'bars' ? (
            <svg width="100%" viewBox="0 0 760 300">
              {slide.recent.map((r, i) => {
                const max = Math.max(...slide.recent.map(x => x.actual || 0), 1);
                const bh = ((r.actual || 0) / max) * 240;
                return (
                  <rect key={i} x={30 + i * (700 / slide.recent.length)}
                        y={270 - bh} width={700 / slide.recent.length - 10}
                        height={bh} rx="4" fill={accent} opacity="0.8" />
                );
              })}
            </svg>
          ) : (
            <Line rows={slide.rows} showForecast={slide.forecast} accent={accent} />
          )}
          {slide.kind === 'line' && (
            <div style={{ display: 'flex', gap: 18, marginTop: 10, fontFamily: MONO,
                          fontSize: 9.5, color: '#64748b' }}>
              <span>— actual</span>
              {slide.forecast && <span>-- forecast &plusmn;CI</span>}
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 26, left: '50%',
                    transform: 'translateX(-50%)', display: 'flex',
                    alignItems: 'center', gap: 14, background: '#111c31',
                    border: '1px solid #1e293b', borderRadius: 999,
                    padding: '8px 18px' }}>
        <span data-testid="present-prev" onClick={() => setIdx(i => Math.max(i - 1, 0))}
              style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 15 }}>
          &larr;
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#cbd5e1' }}>
          {idx + 1} / {slides.length}
        </span>
        <span data-testid="present-next"
              onClick={() => setIdx(i => Math.min(i + 1, slides.length - 1))}
              style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 15 }}>
          &rarr;
        </span>
        <span style={{ width: 1, height: 16, background: '#1e293b' }} />
        <span data-testid="present-notes-toggle" onClick={() => setNotes(n => !n)}
              style={{ cursor: 'pointer', fontSize: 11.5, color: '#cbd5e1',
                       fontFamily: FONT }}>
          Notes
        </span>
      </div>

      {notes && (
        <div data-testid="present-notes"
             style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360,
                      background: '#0d1830', borderLeft: '1px solid #1e293b',
                      padding: '24px 22px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em',
                           color: '#64748b', fontWeight: 700 }}>
              PRESENTER NOTES &middot; AUTO-GENERATED NARRATIVE
            </span>
            <span data-testid="present-notes-close" onClick={() => setNotes(false)}
                  style={{ marginLeft: 'auto', cursor: 'pointer', color: '#64748b' }}>
              &#10005;
            </span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: '#cbd5e1' }}>
            {narrative?.narrative || 'Narrative unavailable for this artifact.'}
          </div>
        </div>
      )}
    </div>
  );
}
