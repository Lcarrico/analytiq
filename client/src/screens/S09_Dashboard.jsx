import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Btn, Card, PageHeader, Badge, Spinner } from '../components/ui';
import { C, FONT, MONO } from '../tokens';
import { api } from '../api';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function KpiCard({ label, value, sub, badge }) {
  return (
    <Card style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: C.textSec, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: MONO }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: C.text, fontFamily: MONO, letterSpacing: '-0.5px', marginBottom: 6 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: C.textTer, fontFamily: FONT }}>{sub}</span>
        {badge && <Badge variant={badge.v} xs>{badge.label}</Badge>}
      </div>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2035', borderRadius: 6, padding: '10px 14px', fontSize: 12, fontFamily: MONO, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
      <div style={{ fontWeight: 600, marginBottom: 5, color: '#fff' }}>{label}</div>
      {payload.map((p, i) => p.value != null && (
        <div key={i} style={{ color: p.name === 'Actual' ? '#e2e8f0' : '#93b4f5' }}>
          {p.name}: ${Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
};

export default function Screen09() {
  const { artifactId, nav } = useApp();
  const [chartData, setChartData] = useState([]);
  const [kpis,      setKpis]      = useState(null);
  const [artifact,  setArtifact]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  // Resolve artifact ID: context > demo (id=1)
  const id = artifactId || 1;

  useEffect(() => {
    Promise.all([api.getArtifact(id), api.getChartData(id)])
      .then(([art, { rows, kpis: k }]) => {
        setArtifact(art);
        setChartData(rows.slice(46)); // last 30 history + 14 forecast
        setKpis(k);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const forecastStart = chartData.find(r => r.is_forecast)?.date;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={36} /></div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text, fontFamily: FONT, letterSpacing: '-0.3px' }}>
              {artifact?.title || 'Net Revenue by Location — 14-Day Forecast'}
            </h1>
            <Badge variant="primary">★ Centerpiece</Badge>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.textSec, fontFamily: FONT }}>
            {artifact?.created_at ? new Date(artifact.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''} · XGBoost v1 · Walk-forward validated (5 folds)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={() => nav(10)}>View all artifacts</Btn>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <KpiCard
          label="Actual · last 30d avg"
          value={kpis ? `$${kpis.avgActual.toLocaleString()}` : '—'}
          sub="per location / day"
          badge={{ label: 'Confirmed', v: 'success' }}
        />
        <KpiCard
          label="Model accuracy (MAPE)"
          value={kpis ? `${kpis.mape}%` : '—'}
          sub="walk-forward backtest"
          badge={{ label: '< 15% gate ✓', v: 'success' }}
        />
        <KpiCard
          label="14-day forecast avg"
          value={kpis ? `$${kpis.forecast14Avg.toLocaleString()}` : '—'}
          sub="per location / day"
          badge={{ label: '95% CI', v: 'primary' }}
        />
      </div>

      {/* Chart */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>Actual vs. Predicted Revenue — with 95% CI</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.textSec, alignItems: 'center', fontFamily: FONT }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 16, height: 2, background: C.primary, display: 'inline-block' }} /> Predicted
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 16, height: 2.5, background: C.text, display: 'inline-block' }} /> Actual
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 10, background: `${C.primary}28`, display: 'inline-block', borderRadius: 2 }} /> 95% CI
            </span>
            {forecastStart && <Badge xs>Forecast → {forecastStart}</Badge>}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 20, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.primary} stopOpacity={0.18} />
                <stop offset="100%" stopColor={C.primary} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textTer, fontFamily: MONO }} tickLine={false} axisLine={false} interval={7} />
            <YAxis tick={{ fontSize: 10, fill: C.textTer, fontFamily: MONO }} tickLine={false} axisLine={false} tickFormatter={v => `$${Math.round(v / 100) * 100}`} />
            <Tooltip content={<CustomTooltip />} />
            {forecastStart && (
              <ReferenceLine x={forecastStart} stroke={C.primary} strokeDasharray="5 3" strokeWidth={1.5}
                label={{ value: 'Forecast start', fontSize: 10, fill: C.primary, position: 'insideTopRight', dy: -8, fontFamily: FONT }} />
            )}
            {/* CI band */}
            <Area type="monotone" dataKey="ci_high" stroke="none" fill="url(#ciGrad)" legendType="none" name="ciHigh" />
            <Area type="monotone" dataKey="ci_low"  stroke="none" fill={C.surface}    legendType="none" name="ciLow"  />
            {/* Lines */}
            <Line type="monotone" dataKey="predicted" stroke={C.primary} strokeWidth={2}   dot={false} name="Predicted" />
            <Line type="monotone" dataKey="actual"    stroke={C.text}    strokeWidth={2.5} dot={false} name="Actual" connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* DQ/lineage footer */}
      <Card p={14}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { label: 'Model ID',         value: 'xgb-locrev-v1-20240401', icon: '🤖'              },
            { label: 'Feature manifest', value: 'v1.4.2 · 34 features',   icon: '📋'              },
            { label: 'DQ gate status',   value: 'All 5 gates passed',      icon: '✓', ok: true    },
            { label: 'Source lineage',   value: 'fact_revenue · dim_loc',  icon: '⬡'              },
          ].map((it, i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: C.textTer, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: MONO }}>{it.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>{it.icon}</span>
                <span style={{ fontSize: 11, fontFamily: MONO, color: it.ok ? C.success : C.text, fontWeight: it.ok ? 700 : 400 }}>{it.value}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
