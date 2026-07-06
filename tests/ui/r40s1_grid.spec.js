// R40S1E2-US1 (UI) — the canvas is a real 12-column grid (deep-dive F-04):
// drag by the handle and resize from the corner actually move/resize the
// component, geometry persists through the layout-patch endpoint, and the
// page contains real draggable elements (inverting the audit's finding).
import { test, expect } from '@playwright/test';

async function build(page, request) {
  await request.post('/api/connections', {
    data: { type: 'snowflake', account: 'grid-src', username: 'u', password: 'p' } });
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 30_000 });
}

async function specGrid(page) {
  const sid = (await page.getByTestId('wb-session-meta').innerText()).match(/\d+/)[0];
  const r = await page.request.get(`/api/sessions/${sid}/dashboard-spec`);
  const d = await r.json();
  return Object.fromEntries(d.spec.grid.desktop.map(c => [c.component_id, c]));
}

test('drag by the handle reorders components and persists normalized geometry', async ({ page, request }) => {
  await build(page, request);
  await expect(page.getByTestId('grid-canvas')).toBeVisible();

  // full-width cards form a vertical order — a real drag-reorder swaps it
  const before = await specGrid(page);
  expect(before.dimension_breakdown.y).toBeLessThan(before.forecast.y);

  const handle = page.getByTestId('section-dimension_breakdown').getByTestId('section-drag');
  await expect(handle).toBeVisible();
  await handle.scrollIntoViewIfNeeded();          // raw mouse coords are viewport-relative
  const hb = await handle.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + 400, { steps: 10 });
  await page.mouse.up();

  await expect.poll(async () => {
    const g = await specGrid(page);
    return g.dimension_breakdown.y > g.forecast.y;
  }, { timeout: 8000 }).toBe(true);
  const after = await specGrid(page);
  for (const c of Object.values(after)) {
    expect(c.x + c.w).toBeLessThanOrEqual(12);    // normalized invariants hold
    expect(c.y).toBeGreaterThanOrEqual(0);
  }
});

test('corner resize changes width/height and persists', async ({ page, request }) => {
  await build(page, request);
  const before = await specGrid(page);
  const section = page.getByTestId('section-dimension_breakdown');
  const grip = section.getByTestId('section-resize');
  await expect(grip).toBeVisible();

  await grip.scrollIntoViewIfNeeded();
  const gb = await grip.boundingBox();
  await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await page.mouse.down();
  await page.mouse.move(gb.x - 260, gb.y + gb.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => (await specGrid(page)).dimension_breakdown.w,
                    { timeout: 8000 }).toBeLessThan(before.dimension_breakdown.w);
});
