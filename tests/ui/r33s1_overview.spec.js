// R33S1E1-US1 (UI) — Models overview (`Models.dc.html` frame 01 / ch18):
// crumb + 6 live KPI cards + model table with typed status pills and
// per-state actions over /api/models/overview. Retrain is the real
// one-click retrain (archives the champion, queues a new run); Card
// deep-links the model card route (R33S1E3). Replaces S14.
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
  await request.post(`/api/training/jobs/${job.jobId}/promote`);
  return sess.id;
}

test('models overview: KPIs, champion row, real retrain, card deep link', async ({ page, request }) => {
  const sessionId = await champion(request);
  const d = await (await request.get('/api/models/overview')).json();
  expect(d.kpis.promoted).toBeGreaterThanOrEqual(1);
  const champ = d.models.find(m => m.status === 'CHAMPION');
  expect(champ).toBeTruthy();

  await page.goto('/app/models');
  await expect(page.locator('main h1')).toHaveText('Predictive models');

  // 6 KPI cards with live values
  for (const [tid, val] of [
    ['models-kpi-promoted', d.kpis.promoted],
    ['models-kpi-runs', d.kpis.runs_30d],
    ['models-kpi-failed', d.kpis.failed],
    ['models-kpi-retrain', d.kpis.retrain_due],
    ['models-kpi-challenger', d.kpis.champ_challenger],
    ['models-kpi-tables', d.kpis.prediction_tables],
  ]) {
    await expect(page.getByTestId(tid).getByTestId('models-kpi-value'))
      .toHaveText(String(val));
  }
  // retrain center link is owned by R33S1E4 until it ships
  await expect(page.getByTestId('retrain-center-link')).toBeDisabled();

  // champion row: pill, purpose, mono accuracy, actions
  const row = page.getByTestId(`model-row-${champ.registry_id}`);
  await expect(row.getByTestId('model-status-pill')).toContainText('CHAMPION');
  expect(await css(row.getByTestId('model-status-pill'), 'color')).toBe('rgb(21, 128, 61)');
  await expect(row).toContainText('Net Revenue forecast');
  const acc = row.getByTestId('model-accuracy');
  await expect(acc).toContainText(/MAPE \d+(\.\d+)?%/);
  expect(await css(acc, 'fontFamily')).toContain('Mono');

  // Card action deep-links the model card route
  await expect(row.getByTestId('model-card-link')).toBeVisible();

  // real one-click retrain: archives champion + queues a new training run
  const runsBefore = d.kpis.runs_30d;
  await row.getByTestId('model-retrain').click();
  await expect.poll(async () =>
    (await (await request.get('/api/models/overview')).json()).kpis.runs_30d,
    { timeout: 15_000 }).toBeGreaterThan(runsBefore);

  // card link navigates to /app/models/:cardId (screen ships in R33S1E3)
  await page.goto('/app/models');
  const d2 = await (await request.get('/api/models/overview')).json();
  const anyCard = d2.models.find(m => m.card_id);
  await page.getByTestId(`model-row-${anyCard.registry_id}`)
    .getByTestId('model-card-link').click();
  await expect(page).toHaveURL(new RegExp(`/app/models/${anyCard.card_id}$`));
});
