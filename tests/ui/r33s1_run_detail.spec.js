// R33S1E2-US1 (UI) — Training run detail (`Models.dc.html` frame 02 / ch18):
// header `run N · model` + status pill + duration, 3 stat cards, and six
// tabs (Summary / Backtest windows / Candidates / Features / Leakage /
// Logs) — backtest bars from the card's real fold metrics, candidates from
// trials, features from the immutable feature manifest, leakage from the
// modeler's persisted scan, and a dark mono log derived from run truth
// (timestamps synthesized from started_at — Agent Note).
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
  const gen = await request.post('/api/modeler/generate',
    { data: { sessionId: sess.id, mode: 'execute' } });
  expect(gen.ok(), `modeler/generate → ${gen.status()}: ${await gen.text()}`).toBe(true);
  const jobResp = await request.post('/api/training/run',
    { data: { sessionId: sess.id } });
  const job = await jobResp.json();
  expect(job.jobId, `training/run → ${jobResp.status()}: ${JSON.stringify(job)}`)
    .toBeTruthy();
  await expect.poll(async () =>
    (await (await request.get(`/api/training/jobs/${job.jobId}`)).json()).status,
    { timeout: 30_000 }).toBe('done');
  await request.post(`/api/training/jobs/${job.jobId}/promote`);
  return { sessionId: sess.id, jobId: job.jobId };
}

test('run detail: header, stat cards, six tabs over run truth', async ({ page, request }) => {
  const { sessionId, jobId } = await champion(request);
  const job = await (await request.get(`/api/training/jobs/${jobId}`)).json();
  const card = await (await request.get(`/api/model_cards/${job.model_card_id}`)).json();
  const trials = await (await request.get(`/api/training/jobs/${jobId}/trials`)).json();
  const manifests = await (await request.get(
    `/api/feature_manifests?session_id=${sessionId}`)).json();
  const features = manifests[0].feature_list;
  const gold = (await (await request.get(`/api/modeler/gold/${sessionId}`)).json())[0];
  const leakage = gold.dq_gates.leakage;

  await page.goto(`/app/models/runs/${jobId}`);
  await expect(page.getByTestId('run-headline')).toContainText(`run ${jobId}`);
  await expect(page.getByTestId('run-status-pill')).toContainText('COMPLETED');
  await expect(page.getByTestId('run-status-pill')).toContainText('PROMOTED');
  await expect(page.getByTestId('run-meta')).toContainText(/\d+(\.\d+)?s/);

  // 3 stat cards
  await expect(page.getByTestId('run-stat-champion')).toContainText(card.algorithm);
  const mapeCard = page.getByTestId('run-stat-mape');
  await expect(mapeCard).toContainText(`${card.metrics.val_mape}%`);
  await expect(mapeCard).toContainText(`${card.metrics.folds.length} rolling windows`);
  await expect(page.getByTestId('run-stat-leakage')).toContainText('dropped');

  // Backtest windows tab: one bar per fold
  await page.getByTestId('rtab-backtest').click();
  await expect(page.locator('[data-testid^="bt-bar-"]'))
    .toHaveCount(card.metrics.folds.length);
  await expect(page.getByTestId('bt-bar-1')).toBeVisible();

  // Candidates: one row per trial, family + mono MAPE
  await page.getByTestId('rtab-candidates').click();
  const trialRows = page.locator('[data-testid^="trial-row-"]');
  await expect(trialRows).toHaveCount(trials.length);
  expect(await css(trialRows.first().getByTestId('trial-mape'), 'fontFamily'))
    .toContain('Mono');

  // Features: the immutable manifest's feature list
  await page.getByTestId('rtab-features').click();
  await expect(page.locator('[data-testid^="feat-row-"]')).toHaveCount(features.length);
  await expect(page.getByTestId('features-version'))
    .toContainText(manifests[0].manifest_version);

  // Leakage: dropped features struck through, holds/passes listed
  await page.getByTestId('rtab-leakage').click();
  if ((leakage.dropped || []).length) {
    const dropped = page.getByTestId(`leak-row-${leakage.dropped[0]}`);
    await expect(dropped).toBeVisible();
    expect(await css(dropped.locator('[data-testid="leak-name"]'), 'textDecorationLine'))
      .toContain('line-through');
  } else {
    await expect(page.getByTestId('leakage-clear')).toBeVisible();
  }

  // Logs: dark mono block, real run facts as lines
  await page.getByTestId('rtab-logs').click();
  const log = page.getByTestId('run-log');
  expect(await css(log, 'backgroundColor')).toBe('rgb(15, 23, 42)');
  expect(await css(log, 'fontFamily')).toContain('Mono');
  await expect(log).toContainText('promotion gate');
  await expect(log).toContainText(card.algorithm);
  expect(await log.locator('[data-testid="log-line"]').count()).toBeGreaterThanOrEqual(4);
});
