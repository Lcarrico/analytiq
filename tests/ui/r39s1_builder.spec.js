// R39S1E2-US1 (UI) — Add Component: palette from the registry, pickers over
// the spec's resolved metrics, live data preview with query status, an
// encoding recommendation that never hides alternatives, and Add creating
// the same validated schema chat will use (deep-dive §6 workbench authoring).
import { test, expect } from '@playwright/test';

async function build(page, request) {
  await request.post('/api/connections', {                 // the workspace's source
    data: { type: 'snowflake', account: 'builder-src', username: 'u', password: 'p' } });
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 30_000 });
}

test('palette → pick → live preview → add renders a real new section', async ({ page, request }) => {
  await build(page, request);
  await page.getByTestId('add-component').click();
  const builder = page.getByTestId('component-builder');
  await expect(builder).toBeVisible();

  // registry palette — types visible, none silently hidden
  expect(await builder.locator('[data-testid^="cb-type-"]').count()).toBeGreaterThanOrEqual(8);
  await builder.getByTestId('cb-type-bar').click();

  await builder.getByTestId('cb-title').fill('Revenue by location');
  await builder.getByTestId('cb-metric-net_revenue').click();

  // live preview: real rows + validated-query status
  await expect(builder.getByTestId('cb-preview')).toContainText(/row/i, { timeout: 10_000 });
  await expect(builder.getByTestId('cb-query-status')).toContainText(/SELECT-only ✓/);
  await expect(builder.getByTestId('cb-recommend')).toContainText(/bar/i);

  await builder.getByTestId('cb-add').click();
  await expect(builder).toHaveCount(0);
  const section = page.getByTestId('section-revenue_by_location');
  await expect(section).toBeVisible();
  await expect(section.getByTestId('generic-bars').locator('div').first())
    .toBeVisible();                                       // real rows rendered
  await expect(section.getByText('CONTRACT ✓')).toBeVisible();   // contracted at birth
});
