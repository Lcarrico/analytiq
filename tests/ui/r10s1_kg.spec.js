// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R10S1E2-US1 (UI) — planning a metric surfaces its knowledge-graph
// neighbors as related-metric chips.
import { test, expect } from '@playwright/test';

test('analysis screen shows related metrics from the knowledge graph', async ({ page, request }) => {
  // seed co-analysis edges via a confirmed spec (the real write path)
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  await request.post(`/api/sessions/${sess.id}/spec`, { data: {
    intent: 'predictive', intent_confidence: 0.9, analytic_goal: 'g',
    target_metric: 'Net Revenue', feature_candidates: ['avg_ticket', 'foot_traffic'],
    date_range: { start: '2023-01-01', end: '2023-12-31' },
    grain: 'Location · Day', output_type: 'forecast_dashboard',
    prediction_horizon: 14, explores_used: [],
    semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0' } });

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.goto('/app/create/quick');   // R16S1E1: workbench owns /app/create; quick-plan moved
  await page.locator('input').first().fill('Forecast net revenue for the next 14 days by location');
  await page.keyboard.press('Enter');

  const chips = page.getByTestId('kg-related');
  await expect(chips).toBeVisible();
  await expect(chips.getByText('avg_ticket')).toBeVisible();
  await expect(chips.getByText('foot_traffic')).toBeVisible();
});
