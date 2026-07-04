// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R10S2E4-US1 (UI) — an expert user's ambiguous ask proceeds without a
// clarifying question, with assumptions surfaced inline in the reply.
import { test, expect } from '@playwright/test';

test('expert user sees inline assumptions instead of a clarifying question', async ({ page, request }) => {
  for (let i = 2; i <= 13; i++) {                      // long consistent history
    await request.post('/api/sessions/plan',
      { data: { message: `Forecast net revenue for the next ${i} days by location` } });
  }
  const thr = await (await request.get('/api/planner/threshold')).json();
  expect(thr.mode).toBe('expert');

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.goto('/app/create/quick');   // R16S1E1: workbench owns /app/create; quick-plan moved
  await page.locator('input').first().fill('How is net revenue trending lately');
  await page.keyboard.press('Enter');

  await expect(page.getByText(/Assumptions: grain assumed/)).toBeVisible();
  await expect(page.getByText(/horizon assumed 14 days/)).toBeVisible();
});
