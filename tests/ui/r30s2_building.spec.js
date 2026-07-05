// R30S2E3-US1 (UI) — Building state (`Create Workbench.dc.html` state 4):
// header + mono run metadata, ▶ SKIP TO RESULT while running, the mockup's
// NINE stage pills (3 visual states; all reach done), amber PII banner when
// the workspace has masked columns pending review, live event log with a
// "Show technical detail (admin)" collapsible.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

const NINE = ['Understanding request', 'Validating metrics', 'Planning dashboard',
              'Building data', 'Running queries', 'Generating charts',
              'Training model', 'Reviewing output', 'Assembling dashboard'];

test('building state: header, run meta, skip pill, 9 pills, event log, PII banner', async ({ page, request }) => {
  const pii = ((await (await request.get('/api/home/summary')).json()).review?.items || [])
    .filter(i => i.chip === 'PII').length;

  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();

  // skip pill exists while the run is in flight
  await expect(page.getByTestId('skip-to-result')).toBeVisible({ timeout: 5000 });

  // canvas eventually assembles; skip pill leaves with it
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 25_000 });
  await expect(page.getByTestId('skip-to-result')).toHaveCount(0);

  // header + mono run metadata
  await expect(page.getByTestId('build-header')).toContainText(/Build complete/);
  const meta = page.getByTestId('build-run-meta');
  await expect(meta).toContainText(/run · \d+/);
  expect(await css(meta, 'fontFamily')).toContain('Mono');

  // nine mockup stages, all done (green wash) — old 7-stage names are gone
  const chips = page.getByTestId('stage-chips');
  for (const s of NINE) await expect(chips.getByText(s, { exact: true })).toBeVisible();
  for (const old of ['Building gold data', 'Training models', 'Profiling source',
                     'Validating accuracy', 'Generating visuals']) {
    await expect(chips.getByText(old)).toHaveCount(0);
  }
  expect(await chips.locator('[data-stage-state="done"]').count()).toBe(9);

  // live event log with entries + admin technical detail collapsible
  const log = page.getByTestId('build-event-log');
  await expect(log).toBeVisible();
  expect(await log.locator('[data-testid="log-row"]').count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByTestId('build-log-raw')).toHaveCount(0);
  await log.getByText('Show technical detail (admin)').click();
  await expect(page.getByTestId('build-log-raw')).toBeVisible();
  expect(await css(page.getByTestId('build-log-raw'), 'fontFamily')).toContain('Mono');

  // PII banner tracks the same truth as the review queue
  if (pii > 0) {
    const banner = page.getByTestId('pii-banner');
    await expect(banner).toContainText(/masked/i);
    expect(await css(banner, 'backgroundColor')).toBe('rgb(253, 243, 227)');
  } else {
    await expect(page.getByTestId('pii-banner')).toHaveCount(0);
  }
});

test('skip-to-result collapses the build telemetry', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();
  const pill = page.getByTestId('skip-to-result');
  await expect(pill).toBeVisible({ timeout: 5000 });
  await pill.click();
  await expect(page.getByTestId('build-event-log')).toHaveCount(0);
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 25_000 });
});
