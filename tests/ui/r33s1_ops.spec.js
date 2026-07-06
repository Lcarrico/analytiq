// R33S1E4-US1 (UI) — Model ops (`Models Ops.dc.html` frames 01–03 / ch18):
// candidate leaderboard (ranked ±band rows, CHAMPION pill, error-vs-RMSE
// trade-off scatter, WHY prose from run facts, promotion-gate footnote,
// real Promote + Override→challenger), feature manifest viewer (encoding /
// imputation derived from dtype+transforms, real leakage risk, importance,
// DROPPED strike-through, S14's custom-feature composer rehomed), and the
// retrain center (live pills + reason rows, real Retrain now).
// (RMSE replaces the frame's MAE/cost — no currency scale in the substrate.)
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

const SPEC = {
  intent: 'predictive', intent_confidence: 0.93, analytic_goal: 'g',
  target_metric: 'Net Revenue',
  feature_candidates: ['net_revenue', 'day', 'location_id', 'tier'],
  date_range: { start: '2023-01-01', end: '2023-12-31' },
  grain: 'Location · Day', output_type: 'forecast_dashboard',
  prediction_horizon: 14, explores_used: ['fact_revenue', 'dim_location'],
  semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0',
};

async function champion(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: 'a', username: 'u', password: 'p' } })).json();
  await request.post('/api/governance/run', { data: { connectionId: conn.id } });
  await expect.poll(async () =>
    ((await (await request.get(`/api/integrations/${conn.id}/manifest/versions`)).json()) || []).length,
    { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
  await request.post('/api/semantic/default/generate', { data: { connectionId: conn.id } });
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue' } })).json();
  await request.post(`/api/sessions/${sess.id}/spec`, { data: SPEC });
  await request.post('/api/modeler/generate', { data: { sessionId: sess.id, mode: 'execute' } });
  const job = await (await request.post('/api/training/run',
    { data: { sessionId: sess.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/training/jobs/${job.jobId}`)).json()).status,
    { timeout: 30_000 }).toBe('done');
  return { sessionId: sess.id, jobId: job.jobId };
}

test('leaderboard: ranked rows, scatter, WHY, gates, promote + override', async ({ page, request }) => {
  const { sessionId, jobId } = await champion(request);
  await request.post(`/api/training/jobs/${jobId}/promote`);
  // a second run on the same session -> its leaderboard can Override
  const job2 = await (await request.post('/api/training/run',
    { data: { sessionId } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/training/jobs/${job2.jobId}`)).json()).status,
    { timeout: 30_000 }).toBe('done');
  const trials = await (await request.get(
    `/api/training/jobs/${job2.jobId}/trials`)).json();

  await page.goto(`/app/models/runs/${job2.jobId}/leaderboard`);
  await expect(page.locator('main h1')).toContainText(`Candidate leaderboard · run ${job2.jobId}`);

  const rows = page.locator('[data-testid^="lb-row-"]');
  await expect(rows).toHaveCount(trials.length);
  const first = rows.first();
  await expect(first.getByTestId('lb-rank')).toHaveText('#1');
  await expect(first.getByTestId('lb-mape')).toContainText(/±/);
  await expect(first.getByTestId('lb-champion-pill')).toContainText('WINNER');

  // trade-off scatter: one dot per candidate family
  expect(await page.locator('[data-testid="lb-scatter"] [data-testid^="lb-dot-"]').count())
    .toBe(trials.length);
  await expect(page.getByTestId('lb-why')).toContainText(/won|stable|windows/i);
  const gate = page.getByTestId('lb-gate-note');
  await expect(gate).toContainText(/promotion gate/);
  expect(await css(gate, 'fontFamily')).toContain('Mono');

  // Override -> registers this run's card as challenger (real)
  await page.getByTestId('lb-override').click();
  await expect.poll(async () => {
    const regs = await (await request.get(
      `/api/registry/models?session_id=${sessionId}`)).json();
    return regs.some(r => r.status === 'challenger');
  }, { timeout: 10_000 }).toBe(true);
});

test('feature manifest viewer: derived columns, dropped strike-through, composer', async ({ page, request }) => {
  const { sessionId } = await champion(request);
  // enrichment materializes the temporal columns the composer references
  await request.post('/api/modeler/enrich', { data: { sessionId } });
  const manifests = await (await request.get(
    `/api/feature_manifests?session_id=${sessionId}`)).json();
  const mf = manifests[0];
  const gold = (await (await request.get(`/api/modeler/gold/${sessionId}`)).json())[0];
  const dropped = gold.dq_gates.leakage.dropped || [];

  await page.goto(`/app/models/features/${mf.id}`);
  await expect(page.locator('main h1')).toContainText('Feature manifest');
  await expect(page.getByTestId('fm-sub'))
    .toContainText(`${mf.feature_list.length} used · ${dropped.length} dropped`);

  const rows = page.locator('[data-testid^="fm-row-"]');
  await expect(rows).toHaveCount(mf.feature_list.length + dropped.length);
  const live = page.getByTestId(`fm-row-${mf.feature_list[0].name}`);
  await expect(live.getByTestId('fm-encoding')).not.toBeEmpty();
  await expect(live.getByTestId('fm-status')).toContainText('APPROVED');
  if (dropped.length) {
    const dRow = page.getByTestId(`fm-row-${dropped[0]}`);
    await expect(dRow.getByTestId('fm-status')).toContainText('DROPPED');
    expect(await css(dRow.getByTestId('fm-name'), 'textDecorationLine'))
      .toContain('line-through');
  }

  // S14's composer rehomed: add + review + apply a custom feature (real)
  const featName = `probe_lag_${Date.now() % 1e4}`;
  await page.getByTestId('cf-name').fill(featName);
  await page.getByTestId('cf-expr').fill('rolling_mean_7_target');
  await page.getByTestId('cf-apply').click();
  await expect(page.getByTestId('cf-result')).toContainText(/applied|confirmed/i,
    { timeout: 10_000 });
});

test('retrain center: live pills, reason rows, real retrain now', async ({ page, request }) => {
  const { sessionId, jobId } = await champion(request);
  await request.post(`/api/training/jobs/${jobId}/promote`);
  const q = await (await request.get('/api/models/retrain_queue')).json();
  expect(q.counts.all).toBeGreaterThanOrEqual(1);

  await page.goto('/app/models/retrain');
  await expect(page.locator('main h1')).toHaveText('Retrain center');
  for (const [tid, n] of [['rc-pill-all', q.counts.all], ['rc-pill-drift', q.counts.drift],
                          ['rc-pill-failed', q.counts.failed]]) {
    await expect(page.getByTestId(tid)).toContainText(String(n));
  }
  const rows = page.locator('[data-testid^="rc-row-"]');
  await expect(rows).toHaveCount(q.counts.all);

  const mine = q.rows.find(r => r.session_id === sessionId);
  const row = page.getByTestId(`rc-row-${mine.model_id}`);
  await expect(row).toContainText(mine.kind === 'drift' ? /drift/ : /no drift/);

  // real one-click retrain from the row
  const before = (await (await request.get('/api/models/overview')).json()).kpis.runs_30d;
  await row.getByTestId('rc-retrain').click();
  await expect.poll(async () =>
    (await (await request.get('/api/models/overview')).json()).kpis.runs_30d,
    { timeout: 15_000 }).toBeGreaterThan(before);

  // overview's retrain-center link is live now
  await page.goto('/app/models');
  await page.getByTestId('retrain-center-link').click();
  await expect(page).toHaveURL(/\/app\/models\/retrain$/);
});
