// R13/R14 (UI) [renamed from r21s1 2026-07-04, see PROGRESS ledger] — the platform monitors itself as a native artifact.
import { test, expect } from '@playwright/test';

test('observability report generates and lands in the library', async ({ page }) => {
  await page.goto('/app/admin/platform');
  await page.getByTestId('observability-report-btn').click();
  await expect(page.getByText('Observability report generated as a native artifact.')).toBeVisible();
  await page.goto('/app/artifacts');
  await expect(page.getByText('Platform Observability').first()).toBeVisible();
});
