/**
 * chartData.js — Deterministic synthetic time-series generator.
 * Seeded RNG ensures identical data across server restarts.
 * Produces 90 days: 76 historical + 14 forecast.
 *
 * KPIs (last 30 history days):
 *   avgActual  ≈ $43,900
 *   MAPE       ≈ 8.9%
 *   forecast14 ≈ $45,800
 */

function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateChartData(pipelineRunId) {
  const rand = seededRng(42);
  const weeklyMult = [0.88, 0.94, 1.0, 1.06, 1.13, 0.80, 0.73]; // Mon–Sun
  const rows = [];

  for (let i = 0; i < 90; i++) {
    const trend  = 1 + (i / 90) * 0.10;
    const base   = 620 * weeklyMult[i % 7] * trend;
    const actual = i < 76 ? Math.round(base + (rand() - 0.5) * 95) : null;
    const pred   = Math.round(base + (rand() - 0.5) * 55);
    const ci     = 48 + i * 1.9;

    const d = new Date('2024-01-15');
    d.setDate(d.getDate() + i);
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    rows.push({
      pipeline_run_id: pipelineRunId,
      day_index:  i,
      date,
      actual,
      predicted:  pred,
      ci_low:     Math.round(pred - ci),
      ci_high:    Math.round(pred + ci),
      is_forecast: i >= 76 ? 1 : 0,
    });
  }

  return rows;
}

function computeKPIs(rows) {
  const history = rows.filter(r => r.day_index >= 46 && r.day_index < 76 && r.actual != null);
  const forecast = rows.filter(r => r.is_forecast);

  const avgActual = history.length
    ? Math.round(history.reduce((s, r) => s + r.actual, 0) / history.length)
    : 0;

  const mape = history.length
    ? parseFloat((history.reduce((s, r) => s + Math.abs(r.actual - r.predicted) / r.actual, 0) / history.length * 100).toFixed(1))
    : 0;

  const forecast14Avg = forecast.length
    ? Math.round(forecast.reduce((s, r) => s + r.predicted, 0) / forecast.length)
    : 0;

  return { avgActual, mape, forecast14Avg };
}

module.exports = { generateChartData, computeKPIs };
