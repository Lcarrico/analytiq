// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R8S1E2-US1 (UI) — Platform screen cache panel: four layers with hit rates.
import { test, expect } from '@playwright/test';

test('platform screen shows cache hierarchy panel with per-layer hit rates', async ({ page, request }) => {
  // generate at least one query-layer miss + hit
  await request.get('/api/gold/default/gold_predictions?per_page=3');
  await request.get('/api/gold/default/gold_predictions?per_page=3');

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true }).click();
  const panel = page.getByTestId('cache-panel');
  await expect(panel).toBeVisible();
  for (const layer of ['semantic', 'query', 'spec', 'artifact']) {
    await expect(panel.getByText(layer, { exact: false }).first()).toBeVisible();
  }
  await expect(panel.getByText(/%/).first()).toBeVisible();   // a hit-rate figure
});
