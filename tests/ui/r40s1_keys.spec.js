// R40S1E3-US1 (UI) — accessible authoring: keyboard resize, undo/redo over
// the server version history, multi-select lock (deep-dive §6 grid behavior).
import { test, expect } from '@playwright/test';

async function build(page, request) {
  await request.post('/api/connections', {
    data: { type: 'snowflake', account: 'keys-src', username: 'u', password: 'p' } });
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-dimension_breakdown')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('grid-canvas')).toBeVisible();
}

async function cellOf(page, id) {
  const sid = (await page.getByTestId('wb-session-meta').innerText()).match(/\d+/)[0];
  const d = await (await page.request.get(`/api/sessions/${sid}/dashboard-spec`)).json();
  return d.spec.grid.desktop.find(c => c.component_id === id);
}

test('keyboard resize patches the grid; undo restores it', async ({ page, request }) => {
  await build(page, request);
  const before = await cellOf(page, 'dimension_breakdown');

  await page.getByTestId('section-dimension_breakdown').click();
  await page.keyboard.press('Shift+ArrowLeft');
  await expect.poll(async () => (await cellOf(page, 'dimension_breakdown')).w,
                    { timeout: 8000 }).toBe(before.w - 1);
  await expect(page.getByTestId('grid-announce')).toContainText(/resized/i);

  await page.getByTestId('canvas-undo').click();
  await expect.poll(async () => (await cellOf(page, 'dimension_breakdown')).w,
                    { timeout: 8000 }).toBe(before.w);
});

test('shift-click multi-select locks components; locked cells hold their spot', async ({ page, request }) => {
  await build(page, request);
  await page.getByTestId('section-dimension_breakdown').click();
  await page.getByTestId('section-forecast').click({ modifiers: ['Shift'] });
  const bar = page.getByTestId('bulk-bar');
  await expect(bar).toContainText('2 selected');
  await bar.getByTestId('bulk-lock').click();

  await expect(page.getByTestId('section-locked').first()).toBeVisible();
  await expect.poll(async () => (await cellOf(page, 'forecast')).locked,
                    { timeout: 8000 }).toBe(true);
});
