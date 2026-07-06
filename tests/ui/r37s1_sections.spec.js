// R37S1E2-US1 (UI) — the freshly built canvas renders EVERY persisted
// section (deep-dive F-06): dimension breakdown + feature importance were
// silently dropped by the stale save response. Also closes R37S1E1's
// deferred negative: sections without a per-component contract show the
// honest NO CONTRACT chip (contracts cover kpi/timeseries/forecast only
// until R42).
import { test, expect } from '@playwright/test';

test('fresh build renders all four persisted sections with honest contract chips', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();

  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('section-forecast')).toBeVisible();
  await expect(page.getByTestId('section-dimension_breakdown')).toBeVisible();
  await expect(page.getByTestId('section-feature_importance')).toBeVisible();

  // contract-backed sections vs honest negatives (F-10 + F-11 visibility)
  await expect(page.getByTestId('section-timeseries').getByText('CONTRACT ✓')).toBeVisible();
  await expect(page.getByTestId('section-dimension_breakdown')
    .getByTestId('section-no-contract')).toContainText('NO CONTRACT');
});
