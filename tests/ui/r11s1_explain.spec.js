// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R11S1E1-US1 (UI) — every artifact carries an Explain affordance showing
// lineage, SQL, bindings, and model state.
import { test, expect } from '@playwright/test';

test('explain panel renders lineage, sql, bindings and model sections', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Explain UI ${Date.now()}` } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();
  // R30S1E2-US1: row actions moved into the per-card ⋯ menu
  await row.getByTestId('card-menu-trigger').click();
  await row.getByTestId('explain-btn').click();

  const panel = page.getByTestId('explain-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByText(`run ${run.runId}`)).toBeVisible();
  await expect(panel.getByText(/gold_predictions/).first()).toBeVisible();
  await expect(panel.getByText(/format: currency/)).toBeVisible();
  await expect(panel.getByText(/Descriptive artifact — no model/)).toBeVisible();
});
