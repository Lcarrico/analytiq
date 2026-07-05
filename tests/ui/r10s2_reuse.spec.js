// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R10S2E7-US1 (UI) — planning a familiar metric surfaces prior validated
// plans as reuse candidates with similarity scores.
import { test, expect } from '@playwright/test';

test('analysis screen offers prior plans as starting points', async ({ page, request }) => {
  // create a validated prior plan (full pipeline for Net Revenue)
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.goto('/app/create/new');   // R30S3E7: quick-plan retired — surfaces ported to the workbench
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();

  const chips = page.getByTestId('reuse-candidates');
  await expect(chips).toBeVisible();
  await expect(chips.getByText(/Net Revenue · \d+%/).first()).toBeVisible();
});
