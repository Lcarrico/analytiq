// R16S2E4-US1 (UI) — direct canvas edits: rename persists via the edit
// endpoint; move-down reorders sections.
import { test, expect } from '@playwright/test';

test('rename and reorder canvas sections in place', async ({ page, request }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 20_000 });

  const ts = page.getByTestId('section-timeseries');
  await ts.getByTestId('section-rename-btn').click();
  await page.getByTestId('section-rename-input').fill('Revenue trajectory');
  await page.getByTestId('section-rename-input').press('Enter');
  await expect(ts.getByText('Revenue trajectory')).toBeVisible();

  // persisted server-side (same truth the API sees)
  const arts = await (await request.get('/api/artifacts?per_page=5')).json();
  const art = (arts.items || arts).find(a => a.layout_json?.includes('Revenue trajectory'));
  expect(art).toBeTruthy();

  // reorder: move timeseries below forecast
  const before = await page.locator('[data-testid^="section-"]').first().getAttribute('data-testid');
  await ts.getByTestId('section-move-btn').click();
  await expect.poll(async () =>
    page.locator('[data-testid^="section-"]').first().getAttribute('data-testid'))
    .not.toBe(before);
});
