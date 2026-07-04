// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R9S2E5-US1 (UI) — agent consultations are visible, first-class records.
import { test, expect } from '@playwright/test';

test('platform screen lists the viz→semantic consultation from a run', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true }).click();
  const panel = page.getByTestId('consultations-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByText('visualization_agent').first()).toBeVisible();
  await expect(panel.getByText('semantic_layer_agent').first()).toBeVisible();
  await expect(panel.getByText('metric_format').first()).toBeVisible();
});
