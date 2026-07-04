// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R9S1E1-US1 (UI) — Platform screen shows cost-ladder dispatch telemetry.
import { test, expect } from '@playwright/test';

test('platform screen shows dispatch tiers with counts and cost', async ({ page, request }) => {
  const msg = { message: `Forecast revenue next 14 days ${Date.now()}` };
  await request.post('/api/sessions/plan', { data: msg });
  await request.post('/api/sessions/plan', { data: msg });   // repeat → cache tier

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true }).click();
  const panel = page.getByTestId('dispatch-panel');
  await expect(panel).toBeVisible();
  for (const tier of ['cache', 'template', 'small_model', 'frontier_model']) {
    await expect(panel.getByText(tier, { exact: false }).first()).toBeVisible();
  }
  await expect(panel.getByText(/est. cost/i)).toBeVisible();
});
