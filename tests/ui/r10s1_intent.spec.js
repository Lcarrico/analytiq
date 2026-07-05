// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R10S1E3-US1 (UI) — returning users see warm-start hints from their
// investigation history on the Analysis screen.
import { test, expect } from '@playwright/test';

test('analysis screen shows history-derived warm-start hints', async ({ page, request }) => {
  // build history: two predictive questions through the real planner
  for (const days of [14, 30]) {
    await request.post('/api/sessions/plan',
      { data: { message: `Forecast net revenue for the next ${days} days by location` } });
  }

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.goto('/app/create/new');   // R30S3E7: quick-plan retired — surfaces ported to the workbench
  const hints = page.getByTestId('warm-start-hints');
  await expect(hints).toBeVisible();
  await expect(hints.getByText(/predictive/)).toBeVisible();
});
