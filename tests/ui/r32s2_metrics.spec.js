// R32S2E2-US1 (UI) — Metrics + dimensions catalogs (`Semantic
// Metrics.dc.html` frames 01–03 / ch17): searchable metrics table with
// ×2 CONFLICT tinted rows (deep-linking the review diff) and DEPRECATED
// gray rows (real lifecycle via schema rollback), a real "+ Calculated
// metric" composer, metric detail (plain-English def, ADMIN ONLY dark SQL,
// lineage chips, tests, versions), and a category-collapsible dimensions
// catalog with confidence.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function seed(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: 'd', username: 'd', password: 'd' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  await expect.poll(async () =>
    (await (await request.get(`/api/integrations/${conn.id}/manifest/versions`)).json()).length,
    { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
  await request.post('/api/semantic/default/generate', { data: { connectionId: conn.id } });
  return { cid: conn.id, runId: run.runId };
}

test('metrics catalog: search, conflict + deprecated lifecycle, calc composer', async ({ page, request }) => {
  const { runId } = await seed(request);

  // real conflict: accept "Conversion Rate", second run re-proposes it
  const items = await (await request.get(`/api/reviews/${runId}`)).json();
  const target = items.find(i => i.name === 'Conversion Rate');
  await request.post(`/api/reviews/items/${target.id}`, { data: { action: 'accept' } });
  await seed(request);
  const conflicts = (await (await request.get('/api/semantic/default/conflicts')).json()).conflicts;
  const conflict = conflicts.find(c => c.name === 'Conversion Rate');
  expect(conflict).toBeTruthy();

  // real deprecation: calc metric on vN, then roll back to vN -> it vanishes
  const vs0 = await (await request.get('/api/semantic/default/schema/versions')).json();
  const base = vs0[0].version;
  const dep = `dep_metric_${Date.now() % 1e5}`;
  const sch = await (await request.get('/api/semantic/default/schema')).json();
  const firstMeasure = sch.schema.cubes.flatMap(c => c.measures || [])[0].name;
  await request.post('/api/semantic/default/metrics/calculated',
    { data: { name: dep, expr: `${firstMeasure} * 2` } });
  await request.post('/api/semantic/default/schema/rollback', { data: { version: base } });

  await page.goto('/app/semantic/metrics');
  await expect(page.locator('main h1')).toHaveText('Metrics');
  const live = await (await request.get('/api/semantic/default/schema')).json();
  const liveCount = live.schema.cubes.reduce((s, c) => s + (c.measures || []).length, 0);

  // conflict row: tinted, ×2 CONFLICT pill, deep-links the review diff
  const cRow = page.getByTestId(`metric-conflict-${conflict.pending_id}`);
  await expect(cRow).toContainText('Conversion Rate');
  await expect(cRow.getByTestId('conflict-pill')).toContainText('×2 CONFLICT');
  expect(await css(cRow, 'backgroundColor')).not.toBe('rgba(0, 0, 0, 0)');
  await cRow.click();
  await expect(page).toHaveURL(new RegExp(`/app/governance/review/${conflict.pending_id}$`));
  await page.goBack();

  // deprecated row: gray + DEPRECATED pill, not counted as live
  const dRow = page.getByTestId(`metric-deprecated-${dep}`);
  await expect(dRow).toContainText(dep);
  await expect(dRow.getByTestId('deprecated-pill')).toContainText('DEPRECATED');

  // search filters live rows
  const rows = page.locator('[data-testid^="metric-live-"]');
  await expect(rows).toHaveCount(liveCount);
  await page.getByTestId('metric-search').fill(firstMeasure.slice(0, 6));
  expect(await rows.count()).toBeLessThan(liveCount);
  await page.getByTestId('metric-search').fill('');

  // + Calculated metric: real POST, lands in the table
  await page.getByTestId('add-calc-metric').click();
  const calcName = `calc_ui_${Date.now() % 1e5}`;
  await page.getByTestId('calc-name').fill(calcName);
  await page.getByTestId('calc-expr').fill(`${firstMeasure} * 3`);
  await page.getByTestId('calc-save').click();
  await expect(page.getByTestId(`metric-live-${calcName}`)).toBeVisible();
});

test('metric detail: pills, admin SQL, lineage, tests, versions', async ({ page, request }) => {
  await seed(request);
  const sch = await (await request.get('/api/semantic/default/schema')).json();
  const cube = sch.schema.cubes.find(c => (c.measures || []).length > 0);
  const ms = cube.measures[0];

  await page.goto(`/app/semantic/metrics/${ms.name}`);
  await expect(page.locator('main h1')).toHaveText(ms.name);
  await expect(page.getByTestId('metric-status-pill')).toContainText('GOVERNED');
  await expect(page.getByTestId('metric-conf-pill')).toContainText(/CONF 0\.\d{2}/);
  await expect(page.getByTestId('metric-plain-def')).toBeVisible();

  const sql = page.getByTestId('metric-sql');
  await expect(sql.getByTestId('admin-only-pill')).toContainText('ADMIN ONLY');
  expect(await css(sql, 'backgroundColor')).toBe('rgb(15, 23, 42)');
  await expect(sql).toContainText(ms.sql || ms.name);

  await expect(page.getByTestId('metric-agg-row')).toContainText((ms.type || 'sum').toUpperCase());
  const lineage = page.getByTestId('metric-lineage');
  await expect(lineage).toContainText(cube.name);
  await expect(lineage).toContainText(ms.name);
  await expect(page.getByTestId('metric-tests')).toBeVisible();
  await expect(page.locator('[data-testid^="metric-version-"]').first()).toBeVisible();
});

test('dimensions catalog: collapsible categories with confidence', async ({ page, request }) => {
  await seed(request);
  const sch = await (await request.get('/api/semantic/default/schema')).json();
  const dimCount = sch.schema.cubes.reduce((s, c) => s + (c.dimensions || []).length, 0);

  await page.goto('/app/semantic/dimensions');
  await expect(page.locator('main h1')).toHaveText('Dimensions');
  await expect(page.getByTestId('dims-count')).toHaveText(String(dimCount));

  const groups = page.locator('[data-testid^="dim-group-"]');
  expect(await groups.count()).toBeGreaterThanOrEqual(2);
  const first = groups.first();
  await first.getByTestId('dim-group-toggle').click();     // expand
  const rows = first.locator('[data-testid^="dim-item-"]');
  expect(await rows.count()).toBeGreaterThanOrEqual(1);
  await expect(rows.first().getByTestId('dim-item-conf')).toContainText(/0\.\d{2}/);
  await first.getByTestId('dim-group-toggle').click();     // collapse
  await expect(rows.first()).toHaveCount(0);
});
