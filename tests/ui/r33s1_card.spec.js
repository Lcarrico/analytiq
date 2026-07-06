// R33S1E3-US1 (UI) — Model card (`Models.dc.html` frame 03 / ch18): registry
// identity + PROMOTED · CHAMPION + overfit-gate pills, real Retrain, fact
// rows (purpose / target / algorithm / training data / features), metric
// tiles, purple importance bars, a SHAP dot plot from stored shap_mean
// values, and linked artifacts. Deep-linked from the artifact detail's
// Model tab. (RMSE tile from fold means; directional accuracy replaces the
// frame's MAE — no currency-scale MAE in the substrate; Agent Note.)
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
  const jobRow = await (await request.get(`/api/training/jobs/${job.jobId}`)).json();
  return { sessionId: sess.id, cardId: jobRow.model_card_id };
}

test('model card: pills, facts, tiles, importance, shap, linked artifacts', async ({ page, request }) => {
  const { sessionId, cardId } = await champion(request);
  // linked artifact on the same session
  const run = await (await request.post('/api/pipeline/run',
    { data: { sessionId } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
    { timeout: 25_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sessionId}/save_artifact`,
    { data: { title: `Card UI ${Date.now() % 1e5}` } })).json();
  const card = await (await request.get(`/api/model_cards/${cardId}`)).json();

  await page.goto(`/app/models/${cardId}`);
  await expect(page.getByTestId('card-headline'))
    .toContainText(`${card.registry.model_id} v${card.registry.version}`);
  const pill = page.getByTestId('card-status-pill');
  await expect(pill).toContainText('PROMOTED · CHAMPION');
  const overfit = page.getByTestId('card-overfit-pill');
  await expect(overfit).toContainText(/NO OVERFIT|OVERFIT REVIEW/);
  await expect(page.getByTestId('card-sub'))
    .toContainText(`card ${cardId} · ${card.algorithm}`);

  // fact rows
  await expect(page.getByTestId('card-fact-target')).toContainText('Net Revenue');
  await expect(page.getByTestId('card-fact-algorithm')).toContainText(card.algorithm);
  await expect(page.getByTestId('card-fact-data'))
    .toContainText(`${card.metrics.training_rows.toLocaleString('en-US')} rows`);
  await expect(page.getByTestId('card-fact-features')).toContainText(/\d+ used/);

  // metric tiles
  await expect(page.getByTestId('tile-mape')).toContainText(`${card.metrics.val_mape}%`);
  await expect(page.getByTestId('tile-rmse')).toBeVisible();
  await expect(page.getByTestId('tile-diracc')).toContainText('%');

  // purple importance bars + shap dots, one per stored feature
  const nFeats = card.top_features.length;
  const bars = page.locator('[data-testid^="imp-bar-"]');
  await expect(bars).toHaveCount(nFeats);
  expect(await css(bars.first(), 'backgroundColor')).toBe('rgb(124, 58, 237)');
  expect(await page.locator('[data-testid="shap-plot"] [data-testid^="shap-dot-"]').count())
    .toBe(nFeats);

  // linked artifacts navigate to the artifact detail
  const link = page.getByTestId(`card-artifact-${art.id}`);
  await expect(link).toContainText(art.title);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/app/artifacts/${art.id}`));

  // artifact detail's Model tab deep-links back to this card
  await page.goto(`/app/artifacts/${art.id}?tab=model`);
  const back = page.getByTestId('open-model-card');
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(new RegExp(`/app/models/${cardId}$`));

  // real retrain from the card header
  const jobsBefore = (await (await request.get('/api/models/overview')).json()).kpis.runs_30d;
  await page.getByTestId('card-retrain').click();
  await expect.poll(async () =>
    (await (await request.get('/api/models/overview')).json()).kpis.runs_30d,
    { timeout: 15_000 }).toBeGreaterThan(jobsBefore);
});
