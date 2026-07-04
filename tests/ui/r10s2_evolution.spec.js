// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R10S2E5-US1 (UI) — the semantic screen surfaces evolution proposals for
// admin review; deciding one updates its status chip in place.
import { test, expect } from '@playwright/test';

test('evolution proposals appear on the semantic screen and are decidable', async ({ page, request }) => {
  // 3 ad-hoc specs for an undefined metric → new_metric proposal material
  const metric = `Basket Size ${Date.now() % 10000}`;
  for (let i = 0; i < 3; i++) {
    const sess = await (await request.post('/api/sessions', { data: { metric } })).json();
    await request.post(`/api/sessions/${sess.id}/spec`, { data: {
      intent: 'predictive', intent_confidence: 0.9, analytic_goal: 'g',
      target_metric: metric, feature_candidates: [],
      date_range: { start: '2023-01-01', end: '2023-12-31' },
      grain: 'Location · Day', output_type: 'forecast_dashboard',
      prediction_horizon: 14, explores_used: [],
      semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0' } });
  }

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Semantic Layer', exact: true }).click();
  const panel = page.getByTestId('evolution-panel');
  await expect(panel).toBeVisible();
  await panel.getByTestId('evolve-scan-btn').click();

  const row = panel.locator('[data-testid^="sem-prop-"]').filter({ hasText: 'new_metric' }).first();
  await expect(row).toBeVisible();
  await row.getByTestId('sem-prop-approve').click();
  await expect(panel.locator('[data-testid="sem-prop-status"]', { hasText: 'approved' }).first())
    .toBeVisible();
});
