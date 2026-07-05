// R30S3E5-US1 (UI) — Version history panel (`Inspector Panels.dc.html`
// #version-history): opens from the session-topbar Versions button, timeline
// rows (avatar + `v{n} · current` + relative time), human dependency chips
// (spec/gold/model — NEVER raw content hashes), real append-only Restore on
// non-current rows, Compare opens that version's html.
import { test, expect } from '@playwright/test';

async function buildToCanvas(page) {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 25_000 });
}

test('versions panel: timeline, dep chips, no hashes, restore appends', async ({ page }) => {
  await buildToCanvas(page);

  // make a second version via a real semantic edit (chart type)
  await page.getByTestId('section-timeseries').evaluate(el => el.click());
  await page.getByTestId('section-toolbar').getByTestId('chart-type-select')
    .evaluate(el => { el.value = 'bar'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.waitForTimeout(400);

  // topbar Versions button is live now and opens the panel
  const btn = page.getByTestId('session-topbar').getByTestId('wb-versions');
  await expect(btn).toBeEnabled();
  await btn.click();
  const panel = page.getByTestId('versions-panel');
  await expect(panel).toBeVisible();
  await expect(page.getByTestId('versions-count')).toContainText(/\d+ versions?/);   // drawer header

  const rows = panel.locator('[data-testid^="version-row-"]');
  expect(await rows.count()).toBeGreaterThanOrEqual(2);
  await expect(rows.first()).toContainText(/v\d+ · current/);

  // human dependency chips, zero hash leaks
  await expect(panel.locator('[data-testid="dep-chip"]').first()).toBeVisible();
  const text = await panel.innerText();
  expect(/\b[a-f0-9]{8}\b/.test(text), 'content hash leaked').toBe(false);

  // non-current rows: Compare + Restore; restore mints a NEW top version
  const older = rows.nth(1);
  await expect(older.getByTestId('version-compare')).toBeVisible();
  const before = await rows.count();
  await older.getByTestId('version-restore').click();
  await expect.poll(async () => rows.count(), { timeout: 8000 }).toBe(before + 1);
  await expect(rows.first()).toContainText(/v\d+ · current/);
});
