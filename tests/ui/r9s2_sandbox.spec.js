// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R9S2E6-US1 (UI) — sandbox artifacts are hidden from the production list,
// visible under the Sandbox toggle, and promotable through the full gate set.
import { test, expect } from '@playwright/test';

test('sandbox artifact hidden by default, visible via toggle, promotable', async ({ page, request }) => {
  const title = `Sandbox UI ${Date.now()}`;
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue', sandbox: true } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toHaveCount(0);                    // hidden from production

  await page.getByTestId('sandbox-toggle').click();
  await expect(row).toBeVisible();                     // visible in sandbox view
  await expect(row.getByTestId('sandbox-badge')).toBeVisible();

  await row.getByTestId('promote-btn').click();        // full gate re-run
  await expect(page.getByText(/Promoted to production/)).toBeVisible();
  await page.getByTestId('sandbox-toggle').click();    // back to production view
  await expect(row).toBeVisible();                     // now a production artifact
});
