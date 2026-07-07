// R41S1E2-US1 (UI) — post-build chat is a refinement loop (deep-dive F-09):
// messages propose validated patches with explanations; material changes
// apply only after confirmation; no detached second plan is ever created.
import { test, expect } from '@playwright/test';

test('chat proposes a patch, applies on confirm, and never re-plans', async ({ page, request }) => {
  await request.post('/api/connections', {
    data: { type: 'snowflake', account: 'chat-src', username: 'u', password: 'p' } });
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 30_000 });
  const sid = (await page.getByTestId('wb-session-meta').innerText()).match(/\d+/)[0];

  // semantic ask → proposed patch card, not a new plan card
  await page.getByTestId('workbench-input').fill('Use weekly instead of daily');
  await page.getByTestId('workbench-send').click();
  const card = page.getByTestId('patch-card');
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card).toContainText('needs your confirmation');
  await expect(card).toContainText('grain → weekly');
  expect(await page.getByTestId('plan-card').count()).toBe(1);   // F-09: no re-plan

  await card.getByTestId('patch-apply').click();
  await expect(card.getByTestId('patch-applied')).toBeVisible();
  await expect.poll(async () => {
    const d = await (await page.request.get(`/api/sessions/${sid}/dashboard-spec`)).json();
    return d.spec.analysis.grain;
  }, { timeout: 8000 }).toBe('weekly');

  // layout-only ask reads as instant
  await page.getByTestId('workbench-input').fill('Make the forecast wider');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('patch-card').last())
    .toContainText('layout-only · instant', { timeout: 10_000 });
});
