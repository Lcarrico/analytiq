// R30S2E4-US1 (UI) — inspector Design tab becomes an EDITING panel and the
// tab strip follows the frame ruling (Create Workbench.dc.html canvas frame):
// Design · Data · Pipeline · Lineage · Model · Comments · Share — Versions
// lives in the session topbar, Insights on the artifact detail page. No tab
// overflows the 360px panel; the "(§5.3)" spec citation is gone (PRD §5.1).
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
const domClick = async (loc) => { await loc.waitFor({ state: 'visible' }); await loc.evaluate(el => el.click()); };

async function buildToCanvas(page) {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 25_000 });
}

test('tab strip follows the frame ruling and fits the panel', async ({ page }) => {
  await buildToCanvas(page);
  const inspector = page.getByTestId('inspector');
  await expect(inspector).toBeVisible();

  const RULING = ['Design', 'Data', 'Pipeline', 'Lineage', 'Model', 'Comments', 'Share'];
  for (const t of RULING) {
    await expect(inspector.getByRole('tab', { name: t })).toBeVisible();
  }
  await expect(inspector.getByRole('tab', { name: 'Versions' })).toHaveCount(0);
  await expect(inspector.getByRole('tab', { name: 'Insights' })).toHaveCount(0);

  // no tab overflows the panel edge (the r22 bug): every tab's right edge
  // stays inside the inspector's right edge
  const panelBox = await inspector.boundingBox();
  for (const t of RULING) {
    const b = await inspector.getByRole('tab', { name: t }).boundingBox();
    expect(b.x + b.width, `tab ${t} overflows`).toBeLessThanOrEqual(panelBox.x + panelBox.width + 1);
  }

  // §5.3 citation is dead anywhere in the inspector
  expect((await inspector.innerText()).includes('§5.3')).toBe(false);
});

test('Design tab: selection-driven editing controls (real edits)', async ({ page }) => {
  await buildToCanvas(page);
  const inspector = page.getByTestId('inspector');

  // nothing selected yet → guidance caption
  await expect(inspector.getByTestId('design-empty')).toContainText(/select a section/i);

  // select the trend section on the canvas
  await domClick(page.getByTestId('section-timeseries'));

  // SELECTED chip: mono, names the section + mark
  const chip = inspector.getByTestId('design-selected-chip');
  await expect(chip).toBeVisible();
  expect(await css(chip, 'fontFamily')).toContain('Mono');

  // title input renames the section for real (round-trips the sections API)
  const title = inspector.getByTestId('design-title-input');
  await title.fill('Revenue trend (edited)');
  await title.press('Enter');
  await expect(page.getByTestId('section-timeseries').getByText('Revenue trend (edited)'))
    .toBeVisible();

  // 6-tile chart picker: line/bar/area live, scatter/treemap/table disabled
  const tiles = inspector.locator('[data-testid^="chart-tile-"]');
  await expect(tiles).toHaveCount(6);
  expect(await inspector.locator('[data-testid^="chart-tile-"][data-live="true"]').count()).toBe(3);
  await domClick(inspector.getByTestId('chart-tile-bar'));
  await expect.poll(async () =>
    inspector.getByTestId('chart-tile-bar').getAttribute('data-selected')).toBe('true');

  // compare-vs-target toggle drives the canvas overlay
  await domClick(inspector.getByTestId('design-vs-target').getByTestId('toggle'));
  await expect(page.locator('[data-testid="trend-target-line"]')).toHaveCount(1);

  // validation pills + de-leaked rationale
  await expect(inspector.getByTestId('design-validation')).toContainText('CONTRACT PASSED');
  await expect(inspector.getByTestId('design-validation')).toContainText('SQL VALIDATED');
  await expect(inspector.getByText(/Why this chart/i)).toBeVisible();

  // REPLACE WITH… cards apply a live chart type
  await domClick(inspector.getByTestId('replace-card-area'));
  await expect.poll(async () =>
    inspector.getByTestId('chart-tile-area').getAttribute('data-selected')).toBe('true');
});

test('Lineage, Model and Comments tabs render their real substrate', async ({ page }) => {
  await buildToCanvas(page);
  const inspector = page.getByTestId('inspector');

  await inspector.getByRole('tab', { name: 'Lineage' }).click();
  await expect(inspector.getByTestId('tab-lineage')).toContainText(/gold|provenance/i);

  await inspector.getByRole('tab', { name: 'Model' }).click();
  await expect(inspector.getByTestId('tab-model')).toContainText(/MAPE|algorithm|model/i);

  await inspector.getByRole('tab', { name: 'Comments' }).click();
  await expect(inspector.getByTestId('tab-comments')).toContainText(/R30S3E6|drawer/i);
});
