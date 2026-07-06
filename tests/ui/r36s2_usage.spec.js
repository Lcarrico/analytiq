// R36S2E5-US1 (UI) — usage & cost analytics (`Admin Usage.dc.html` frame 01 /
// ch16): live KPI meters, 14-day views/builds bars, top consumers, and
// per-area cost derived from the metered token rate — never invented numbers.
import { test, expect } from '@playwright/test';

test('usage & cost dashboard renders live meters and derived cost', async ({ page }) => {
  await page.goto('/app/admin/usage');
  await expect(page.getByTestId('au-kpi-runs')).toContainText(/\d/);
  await expect(page.getByTestId('au-kpi-calls')).toContainText(/\d/);
  await expect(page.getByTestId('au-kpi-tokens')).toContainText('%');
  await expect(page.getByTestId('au-kpi-compute')).toBeVisible();

  await expect(page.getByTestId('au-daily').first()).toBeVisible();
  expect(await page.getByTestId('au-day').count()).toBe(14);

  await expect(page.getByTestId('au-consumers')).toBeVisible();
  await expect(page.getByTestId('au-areas')).toBeVisible();
  await expect(page.getByTestId('au-total')).toContainText('$');
  await expect(page.getByTestId('au-export')).toHaveAttribute('href', /\/api\/admin\/usage/);
});
