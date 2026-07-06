// R37S1E1-US1 (UI) — trust chips render from evidence only (deep-dive F-10).
// A fresh workspace has no semantic schema: planning shows UNGOVERNED, never
// a green GOVERNED badge. After a real build, contract-backed sections show
// CONTRACT ✓ and the inspector's pills reflect the derived trust block.
// (The NO CONTRACT negative renders once all four sections load — asserted
// in R37S1E2-US1's spec when the stale-layout fix lands.)
import { test, expect } from '@playwright/test';

test('fresh workspace plans are honestly UNGOVERNED', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('wb-ungoverned')).toContainText('UNGOVERNED');
  await expect(page.getByTestId('wb-governed')).toHaveCount(0);
});

test('after a build, contract evidence drives the section + inspector pills', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('section-timeseries').getByText('CONTRACT ✓')).toBeVisible();

  await page.getByTestId('section-timeseries').click();
  const inspector = page.getByTestId('inspector');
  await expect(inspector.getByTestId('design-validation')).toContainText('CONTRACT PASSED');
  await expect(inspector.getByTestId('design-validation')).toContainText('SQL VALIDATED');
});
