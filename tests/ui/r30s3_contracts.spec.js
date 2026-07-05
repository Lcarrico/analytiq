// R30S3E1-US1 (UI) — Data tab trust contracts (`Inspector Panels.dc.html`
// #data-contract): accordion per dashboard component with a HUMAN name +
// chart type (never snake_case), PASSED / 1 WARNING pills (warning card
// header tinted), expanded rows Rows / Range / Freshness / Gates — the raw
// `gate:PASS` dump is gone (PRD §5.1). Expected-row bands render when the
// contract substrate carries them (deviation: today it has row caps + gates).
import { test, expect } from '@playwright/test';

async function buildToCanvas(page) {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 25_000 });
}

test('trust-contract accordions: human names, pills, rows, no raw dump', async ({ page }) => {
  await buildToCanvas(page);
  const inspector = page.getByTestId('inspector');
  await inspector.getByRole('tab', { name: 'Data' }).click();

  const cards = inspector.locator('[data-testid^="trust-card-"]');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(1);

  // human title + chart type on every card header; snake_case ids are dead
  await expect(inspector.getByText(/Revenue vs forecast · line|Forecast horizon/).first())
    .toBeVisible();
  const tabText = await inspector.innerText();
  expect(tabText.includes('timeseries_ci'), 'snake_case id leaked').toBe(false);
  expect(tabText.includes('Gate results'), 'raw gate dump survived').toBe(false);
  expect(/:\s?PASS\b/.test(tabText), 'raw gate:PASS lines survived').toBe(false);

  // status pill on the first card
  await expect(cards.first().locator('[data-testid="status-badge"]').first())
    .toContainText(/PASSED|1 WARNING/);

  // first card is expanded: Rows / Range / Freshness / Gates rows
  const first = cards.first();
  for (const row of ['Rows', 'Freshness', 'Gates']) {
    await expect(first.getByText(row, { exact: true })).toBeVisible();
  }
  await expect(first.getByTestId('gates-row')).toContainText(/\d+\/\d+ passed/);

  // accordion collapses and re-expands
  await first.getByTestId('trust-card-header').click();
  await expect(first.getByTestId('gates-row')).toHaveCount(0);
  await first.getByTestId('trust-card-header').click();
  await expect(first.getByTestId('gates-row')).toBeVisible();
});
