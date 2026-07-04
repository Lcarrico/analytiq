// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R11S2E5-US1 (UI) — every listed dashboard carries a health chip.
import { test, expect } from '@playwright/test';

test('artifact list shows dashboard health chips', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Health UI ${Date.now()}` } })).json();
  const expected = (await (await request.get(`/api/artifacts/${art.id}/health`)).json()).score;

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();
  const chip = row.getByTestId('health-chip');
  await expect(chip).toBeVisible();
  await expect(chip).toContainText(String(expected));   // same truth as the API
});
