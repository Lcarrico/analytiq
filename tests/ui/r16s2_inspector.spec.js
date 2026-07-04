// R16S2E3-US1 (UI) — workbench inspector: 6 tabs over existing backends.
import { test, expect } from '@playwright/test';

test('inspector tabs expose design, pipeline, insights, share and versions', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 20_000 });

  const inspector = page.getByTestId('inspector');
  await expect(inspector).toBeVisible();

  await inspector.getByRole('tab', { name: 'Design' }).click();
  await expect(inspector.getByText(/actual vs predicted|timeseries/i).first()).toBeVisible();
  await expect(inspector.getByText(/Why this chart/i)).toBeVisible();

  await inspector.getByRole('tab', { name: 'Pipeline' }).click();
  await expect(inspector.getByText('Build gold table & features')).toBeVisible();
  await expect(inspector.getByText(/min_training_rows:PASS/).first()).toBeVisible();

  await inspector.getByRole('tab', { name: 'Insights' }).click();
  await inspector.getByTestId('insight-scan-btn').click();
  await expect(inspector.locator('[data-testid^="insight-row-"]').first()).toBeVisible();

  await inspector.getByRole('tab', { name: 'Share' }).click();
  await inspector.getByTestId('make-share-link').click();
  await expect(inspector.getByTestId('share-link-url')).toContainText('/api/public/');

  await inspector.getByRole('tab', { name: 'Versions' }).click();
  await expect(inspector.getByText(/artifact_html_ref/).first()).toBeVisible();
  await expect(inspector.getByText(/v1/).first()).toBeVisible();

  await inspector.getByRole('tab', { name: 'Data' }).click();
  await expect(inspector.getByText(/gate|contract/i).first()).toBeVisible();
});
