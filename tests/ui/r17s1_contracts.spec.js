// R17S1E1-US1 (UI) — gold catalog page + inspector Data tab on real
// per-component contracts.
import { test, expect } from '@playwright/test';

test('gold catalog lists run tables with gate badges', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');

  await page.goto('/app/gold');
  const table = page.getByTestId('gold-table');
  await expect(table).toBeVisible();
  await expect(table.getByText('gold_predictions').first()).toBeVisible();
  await expect(table.getByText('gold_forecast').first()).toBeVisible();
  await expect(table.locator('[data-testid="status-badge"]').first()).toContainText(/PASS/i);
});

test('inspector data tab shows per-component contracts', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 20_000 });

  const inspector = page.getByTestId('inspector');
  await inspector.getByRole('tab', { name: 'Data' }).click();
  const ts = inspector.getByTestId('contract-timeseries_ci');
  await expect(ts).toBeVisible();
  await expect(ts.getByText('76')).toBeVisible();          // real row contract
  await expect(ts.getByText(/contract ✓/i)).toBeVisible();
  await expect(inspector.getByTestId('contract-forecast').getByText('14')).toBeVisible();
});
