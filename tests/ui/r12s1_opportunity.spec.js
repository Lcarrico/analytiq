// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R12S1E1-US1 (UI) — opportunities are accept/dismiss suggestions; accepting
// a forecast gap creates a pre-seeded session, never a silent dashboard.
import { test, expect } from '@playwright/test';

test('opportunities panel lists suggestions and accepts one into a session', async ({ page, request }) => {
  const metric = 'Net Revenue';
  const sess = await (await request.post('/api/sessions', { data: { metric } })).json();
  // co-analysis edge via a confirmed spec (real KG write path)
  await request.post(`/api/sessions/${sess.id}/spec`, { data: {
    intent: 'predictive', intent_confidence: 0.9, analytic_goal: 'g',
    target_metric: metric, feature_candidates: [`gap_metric_${Date.now() % 1e5}`],
    date_range: { start: '2023-01-01', end: '2023-12-31' },
    grain: 'Location · Day', output_type: 'forecast_dashboard',
    prediction_horizon: 14, explores_used: [],
    semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0' } });
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Opp UI ${Date.now()}` } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();
  // R30S1E2-US1: row actions moved into the per-card ⋯ menu
  await row.getByTestId('card-menu-trigger').click();
  await row.getByTestId('opportunities-btn').click();

  const panel = page.getByTestId('opportunities-panel');
  await expect(panel).toBeVisible();
  const gap = panel.locator('[data-testid^="opp-row-"]').filter({ hasText: 'forecast_gap' }).first();
  await expect(gap).toBeVisible();
  await gap.getByTestId('opp-accept').click();
  await expect(page.getByText(/Investigation session #\d+ created/)).toBeVisible();
  await expect(panel.locator('[data-testid="opp-status"]', { hasText: 'accepted' }).first())
    .toBeVisible();
});
