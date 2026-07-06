// R38S2E2-US1 (UI) — intent shapes the dashboard (deep-dive F-03): a
// descriptive ask builds without forecast/model sections and without a
// forced 14-day horizon; predictive asks keep the full composition.
import { test, expect } from '@playwright/test';

test('descriptive ask: no forced horizon, no forecast sections on the canvas', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Show the net revenue trend across locations');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('plan-card')).toContainText('not requested');

  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('section-dimension_breakdown')).toBeVisible();
  await expect(page.getByTestId('section-forecast')).toHaveCount(0);
  await expect(page.getByTestId('section-feature_importance')).toHaveCount(0);
});
