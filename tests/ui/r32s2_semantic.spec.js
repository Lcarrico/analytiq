// R32S2E1-US1 (UI) — Semantic layer overview + explores (`Semantic
// Overview.dc.html` frames 01–03 / ch17): KPI cards + MANIFEST pill + real
// Regenerate over /api/semantic/default/generate (audited); explores table
// (tables, counts, health pill, mono confidence, used-by); explore detail
// with tab counts and "Analyze this explore" seeding the workbench. S05 is
// retired and /app/semantic belongs to these screens.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function seedSemantic(request) {
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
  const gen = await (await request.post('/api/semantic/default/generate',
    { data: { connectionId: conn.id } })).json();
  return { cid: conn.id, gen };
}

test('overview: KPI cards, manifest pill, real regenerate', async ({ page, request }) => {
  await seedSemantic(request);
  const s = await (await request.get('/api/semantic/default/summary')).json();
  const before = (await (await request.get('/api/semantic/default/schema/versions')).json()).length;

  await page.goto('/app/semantic');
  await expect(page.locator('main h1')).toHaveText('Semantic layer');
  const pill = page.getByTestId('sem-manifest-pill');
  await expect(pill).toContainText(`MANIFEST v${s.manifest.version}`);
  await expect(pill).toContainText(s.manifest.status);

  // KPI cards carry live values
  await expect(page.getByTestId('sem-kpi-explores').getByTestId('sem-kpi-value'))
    .toHaveText(String(s.explores));
  await expect(page.getByTestId('sem-kpi-metrics').getByTestId('sem-kpi-value'))
    .toHaveText(String(s.metrics.total));
  await expect(page.getByTestId('sem-kpi-metrics'))
    .toContainText(`${s.metrics.governed} governed · ${s.metrics.draft} draft`);
  await expect(page.getByTestId('sem-kpi-dimensions').getByTestId('sem-kpi-value'))
    .toHaveText(String(s.dimensions));
  await expect(page.getByTestId('sem-kpi-joins').getByTestId('sem-kpi-value'))
    .toHaveText(String(s.join_paths));
  await expect(page.getByTestId('sem-kpi-conflicts').getByTestId('sem-kpi-value'))
    .toHaveText(String(s.conflicts));
  await expect(page.getByTestId('sem-kpi-version').getByTestId('sem-kpi-value'))
    .toHaveText(`v${s.version}`);
  // access policies card is owned by a later story, honestly labeled
  await expect(page.getByTestId('sem-kpi-access')).toContainText(/R36S2/);

  // Regenerate mints a new schema version through the real API
  await page.getByTestId('sem-regenerate').click();
  await expect.poll(async () =>
    (await (await request.get('/api/semantic/default/schema/versions')).json()).length,
    { timeout: 10_000 }).toBe(before + 1);
});

test('explores list + detail tabs + analyze seed', async ({ page, request }) => {
  await seedSemantic(request);
  const ex = (await (await request.get('/api/semantic/default/explores')).json()).explores;
  const withMetrics = ex.find(r => r.metrics > 0) || ex[0];

  await page.goto('/app/semantic/explores');
  await expect(page.locator('main h1')).toHaveText('Explores');
  const rows = page.locator('[data-testid^="explore-row-"]');
  await expect(rows).toHaveCount(ex.length);
  const row = page.getByTestId(`explore-row-${withMetrics.name}`);
  await expect(row.getByTestId('explore-health')).toBeVisible();
  const conf = row.getByTestId('explore-confidence');
  await expect(conf).toHaveText(withMetrics.confidence.toFixed(2));
  expect(await css(conf, 'fontFamily')).toContain('Mono');
  await expect(row.getByTestId('explore-usedby'))
    .toContainText(`${withMetrics.used_by} dashboards`);

  // row -> detail
  await row.getByTestId('explore-name').click();
  await expect(page).toHaveURL(new RegExp(`/app/semantic/explores/${withMetrics.name}$`));
  await expect(page.locator('main h1')).toHaveText(withMetrics.name);
  await expect(page.getByTestId('explore-status-pill')).toContainText(/HEALTHY|REVIEW|BLOCKED/);
  await expect(page.getByTestId('explore-sub'))
    .toContainText(`${withMetrics.tables.length} tables · confidence ${withMetrics.confidence.toFixed(2)}`);

  // tabs carry counts; metrics table matches the schema
  await expect(page.getByTestId('etab-metrics')).toContainText(`Metrics · ${withMetrics.metrics}`);
  await expect(page.getByTestId('etab-dimensions'))
    .toContainText(`Dimensions · ${withMetrics.dimensions}`);
  await expect(page.locator('[data-testid^="metric-row-"]')).toHaveCount(withMetrics.metrics);
  await page.getByTestId('etab-dimensions').click();
  await expect(page.locator('[data-testid^="dim-row-"]')).toHaveCount(withMetrics.dimensions);

  // Analyze this explore -> seeds the workbench ask
  await page.getByTestId('analyze-explore').click();
  await expect(page).toHaveURL(/\/app\/create\/new\?q=/);
});
