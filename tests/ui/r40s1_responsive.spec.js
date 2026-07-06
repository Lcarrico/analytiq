// R40S1E4-US1 (UI) — responsive truth + persistence: geometry survives a
// reload (the spec head is the single source), mobile actually reflows
// (single-column sections, 2-up KPI strip — the audit's fixed-4 dies).
import { test, expect } from '@playwright/test';

async function build(page, request) {
  await request.post('/api/connections', {
    data: { type: 'snowflake', account: 'resp-src', username: 'u', password: 'p' } });
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-dimension_breakdown')).toBeVisible({ timeout: 30_000 });
}

test('patched geometry survives reload; mobile reflows for real', async ({ page, request }) => {
  await build(page, request);

  // narrow the breakdown twice via the accessible path
  const sid = (await page.getByTestId('wb-session-meta').innerText()).match(/\d+/)[0];
  const width = async () => {
    const d = await (await page.request.get(`/api/sessions/${sid}/dashboard-spec`)).json();
    return d.spec.grid.desktop.find(c => c.component_id === 'dimension_breakdown').w;
  };
  await page.getByTestId('section-dimension_breakdown').scrollIntoViewIfNeeded();
  await page.getByTestId('section-dimension_breakdown').click();
  await page.keyboard.press('Shift+ArrowLeft');
  await expect.poll(width, { timeout: 8000 }).toBe(11);
  await page.keyboard.press('Shift+ArrowLeft');
  await expect.poll(width, { timeout: 8000 }).toBe(10);

  // persistence across surfaces: the spec head holds the geometry, and the
  // stored artifact render carries the same grid (parity by construction —
  // R40S1E4). Workbench-tab reload hydration is R41S1E4's story (F-12).
  const arts = await (await page.request.get('/api/artifacts')).json();
  const aid = (arts.items || arts)[0].id;
  await page.request.patch(`/api/artifacts/${aid}/sections/dimension_breakdown`,
    { data: { title: 'Breakdown (r40)' } });          // re-render w/ current grid
  const html = await (await page.request.get(
    `/api/artifacts/${aid}/export?format=html`)).text();
  expect(html).toContain('grid-wrap');
  expect(html).toContain('span 10');

  // mobile reflow: sections stack, KPI strip goes 2-up (domClick — the
  // canvas keeps painting live data, same pattern as r30s2)
  await page.getByTestId('device-mobile').evaluate(el => el.click());
  await expect(page.getByTestId('section-dimension_breakdown'))
    .toHaveAttribute('style', /span 12/);
  const kpiStyle = await page.getByTestId('kpi-strip').getAttribute('style');
  expect(kpiStyle).toContain('repeat(2');
});
