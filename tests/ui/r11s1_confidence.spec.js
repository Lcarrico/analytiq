// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R11S1E2-US1 (UI) — low propagated confidence is a visible flag on a
// normally rendered artifact, distinct from any error state.
import { test, expect } from '@playwright/test';

test('low-confidence artifact renders flagged, not failed', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  await request.post(`/api/sessions/${sess.id}/spec`, { data: {
    intent: 'predictive', intent_confidence: 0.55, analytic_goal: 'g',
    target_metric: 'Net Revenue', feature_candidates: [],
    date_range: { start: '2023-01-01', end: '2023-12-31' },
    grain: 'Location · Day', output_type: 'forecast_dashboard',
    prediction_horizon: 14, explores_used: [],
    semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0' } });
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `LowConf ${Date.now()}` } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();                                   // rendered
  await expect(row.getByTestId('low-confidence-badge')).toBeVisible(); // flagged
  await expect(row.getByTestId('low-confidence-badge')).toContainText('55%');
  await expect(row.getByText('DQ pass')).toBeVisible();              // not an error state
});
