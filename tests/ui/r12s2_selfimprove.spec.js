// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R12S2E3-US1 (UI) — mined signals show their routing to consumers.
import { test, expect } from '@playwright/test';

test('signals panel mines and lists routed signals', async ({ page, request }) => {
  const metric = `Popular ${Date.now() % 1e5}`;
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

  // R36S2E4: sidebar Admin lands on the workspace overview; the platform
  // console (these panels' home) is directly routed — same nav as r13s1.
  await page.goto('/app/admin/platform');
  const panel = page.getByTestId('signals-panel');
  await expect(panel).toBeVisible();
  await panel.getByTestId('mine-signals-btn').click();
  await expect(panel.getByText('popular_metric').first()).toBeVisible();
  await expect(panel.getByText('→ benchmark_library').first()).toBeVisible();
});
