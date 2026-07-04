// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R9S1E2-US1 (UI) — the execution graph surfaces the parallel viz_specs
// branch alongside the model chain, joined at artifact_ready.
import { test, expect } from '@playwright/test';

test('execution graph shows the parallel viz_specs branch', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Parallel UI ${Date.now()}` } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();
  await row.getByTestId('provenance-btn').click();
  const dagPanel = page.getByTestId('dag-panel');
  await expect(dagPanel).toBeVisible();
  await expect(dagPanel.locator('[data-testid="dag-node-viz_specs"]')).toBeVisible();
  await expect(dagPanel.locator('[data-testid="dag-node-model_train"]')).toBeVisible();
  await expect(dagPanel.locator('[data-testid="dag-node-artifact_ready"]')).toBeVisible();
});
