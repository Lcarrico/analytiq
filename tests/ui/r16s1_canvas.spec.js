// R16S1E2-US1 (UI) — live build: 7 stage chips driven by the DAG, then the
// canvas renders KPI strip, chart sections, autosave chip, GOVERNED badge.
import { test, expect } from '@playwright/test';

test('build shows stage chips then renders the dashboard canvas', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await page.getByTestId('plan-card').getByTestId('approve-build').click();

  const chips = page.getByTestId('stage-chips');
  await expect(chips).toBeVisible();
  for (const stage of ['Understanding request', 'Building gold data',
                       'Training models', 'Assembling dashboard']) {
    await expect(chips.getByText(stage)).toBeVisible();
  }
  // all chips reach done (SIM_DELAY_SCALE=0 → fast)
  await expect.poll(async () =>
    await chips.locator('[data-stage-state="done"]').count(),
    { timeout: 20_000 }).toBe(7);

  const canvas = page.getByTestId('workbench-canvas');
  await expect(canvas.getByTestId('kpi-strip')).toBeVisible();
  await expect(canvas.getByTestId('section-timeseries')).toBeVisible();
  await expect(canvas.getByTestId('section-forecast')).toBeVisible();
  await expect(canvas.locator('svg').first()).toBeVisible();       // real chart
  await expect(page.getByTestId('autosave-chip')).toContainText(/autosaved/i);
  await expect(page.getByTestId('governed-badge')).toBeVisible();
});
