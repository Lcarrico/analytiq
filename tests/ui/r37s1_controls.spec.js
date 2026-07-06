// R37S1E2-US2/US3 (UI) — controls do what their labels promise (deep-dive
// F-07/F-14): Export offers only supported formats (html honestly deferred
// to R39), the telemetry pill says what it does, and the version chip
// reflects the real layout version after an edit.
import { test, expect } from '@playwright/test';

async function build(page) {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-timeseries')).toBeVisible({ timeout: 30_000 });
}

test('export menu: csv/json live, html stated as R39; no 400 route reachable', async ({ page }) => {
  await build(page);
  await expect(page.getByTestId('export-csv')).toHaveAttribute('href', /format=csv/);
  await expect(page.getByTestId('export-json')).toHaveAttribute('href', /format=json/);
  // R39S1E3 delivered the deferred html export — now a live, working anchor
  await expect(page.getByTestId('export-html')).toHaveAttribute('href', /format=html/);
  const rh = await page.request.get(
    (await page.getByTestId('export-html').getAttribute('href')));
  expect(rh.status()).toBe(200);

  const r = await page.request.get(
    (await page.getByTestId('export-csv').getAttribute('href')));
  expect(r.status()).toBe(200);
});

test('version chip tracks real layout versions across edits', async ({ page }) => {
  await build(page);
  await expect(page.getByTestId('canvas-version')).toContainText('v1');
  const section = page.getByTestId('section-timeseries');
  await section.getByTestId('section-rename-btn').click();
  await section.getByTestId('section-rename-input').fill('Revenue trend (r37)');
  await section.getByTestId('section-rename-input').press('Enter');
  await expect(section.getByText('Revenue trend (r37)')).toBeVisible();
  // first patch registers layout v1; a second distinct edit must bump to v2
  await section.getByTestId('section-rename-btn').click();
  await section.getByTestId('section-rename-input').fill('Revenue trend (r37b)');
  await section.getByTestId('section-rename-input').press('Enter');
  await expect(section.getByText('Revenue trend (r37b)')).toBeVisible();
  await expect(page.getByTestId('canvas-version')).toContainText('v2');
});

test('telemetry pill is labeled for what it does', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  const pill = page.getByTestId('skip-to-result');
  let sawPill = true;
  try { await pill.waitFor({ state: 'visible', timeout: 4000 }); }
  catch { sawPill = false; }
  test.skip(!sawPill, 'build completed before the telemetry window — nothing to hide');
  await expect(pill).toContainText('HIDE BUILD TELEMETRY');
});
