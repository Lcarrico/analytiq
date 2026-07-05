// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R12S2E5-US1 (UI) — one click generates the ROI report as a first-class,
// listed artifact.
import { test, expect } from '@playwright/test';

test('ROI report button creates a native artifact in the list', async ({ page, request }) => {
  // R30S1E2-US1: ROI report moved into the per-artifact ⋯ menu (Reconciliation
  // (d)) — seed one artifact so a card menu exists to launch it from.
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `ROI Seed ${Date.now() % 1e6}` } })).json();
  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await row.getByTestId('card-menu-trigger').click();
  await row.getByTestId('roi-report-btn').click();
  await expect(page.getByText('ROI report generated as a native artifact.')).toBeVisible();
  await expect(page.getByText('Workspace ROI Report').first()).toBeVisible();
});
