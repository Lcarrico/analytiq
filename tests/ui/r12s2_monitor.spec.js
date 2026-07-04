// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R12S2E4-US1 (UI) — model monitoring surfaces importance/input drift on
// the artifact row.
import { test, expect } from '@playwright/test';

test('monitor panel shows stable drift chips for a healthy model', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Mon UI ${Date.now()}` } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();
  await row.getByTestId('monitor-btn').click();

  const panel = page.getByTestId('monitor-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId('mon-importance')).toContainText('stable');
  await expect(panel.getByTestId('mon-input')).toContainText('stable');
});
