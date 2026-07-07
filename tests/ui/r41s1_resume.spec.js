// R41S1E4-US1 (UI) — sessions are resumable (deep-dive F-12): reloading a
// deep-linked session restores the transcript, the approved plan, the run's
// canvas and grid — no empty approval placeholder. (Closes the deferral
// noted in R40S1E4's spec.)
import { test, expect } from '@playwright/test';

test('reload restores messages, plan, canvas and the refinement loop', async ({ page, request }) => {
  await request.post('/api/connections', {
    data: { type: 'snowflake', account: 'resume-src', username: 'u', password: 'p' } });
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 30_000 });

  await page.reload();

  // transcript + approved plan + canvas all come back
  await expect(page.getByText(/Forecast net revenue/).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('plan-card')).toBeVisible();
  await expect(page.getByTestId('plan-approved')).toBeVisible();
  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('grid-canvas')).toBeVisible();

  // and the refinement loop still works on the restored session
  await page.getByTestId('workbench-input').fill('Make the forecast wider');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('patch-card')).toBeVisible({ timeout: 10_000 });
});
