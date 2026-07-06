// R36S1E1-US1 (UI) — Gold tables (`Gold Contracts.dc.html` frames 01–02 /
// PRD §8 audit-first): list with grain/version/gate tallies/linked chips
// over the modeler gold aggregate (legacy run outputs keep their section),
// and the detail with seven tabs — schema from real PRAGMA, humanized
// quality gates, lineage deep link, artifacts, feature manifest.
import { test, expect } from '@playwright/test';

const SPEC = {
  intent: 'predictive', intent_confidence: 0.93, analytic_goal: 'g',
  target_metric: 'Net Revenue',
  feature_candidates: ['net_revenue', 'day', 'location_id', 'tier'],
  date_range: { start: '2023-01-01', end: '2023-12-31' },
  grain: 'Location · Day', output_type: 'forecast_dashboard',
  prediction_horizon: 14, explores_used: ['fact_revenue', 'dim_location'],
  semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0',
};

async function gold(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: `g_${Date.now() % 1e5}`, username: 'u',
              password: 'p' } })).json();
  await request.post('/api/governance/run', { data: { connectionId: conn.id } });
  await expect.poll(async () =>
    ((await (await request.get(`/api/integrations/${conn.id}/manifest/versions`)).json()) || []).length,
    { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
  await request.post('/api/semantic/default/generate', { data: { connectionId: conn.id } });
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue' } })).json();
  await request.post(`/api/sessions/${sess.id}/spec`, { data: SPEC });
  await request.post('/api/modeler/generate', { data: { sessionId: sess.id, mode: 'execute' } });
  const d = await (await request.get('/api/gold/tables')).json();
  return d.tables.find(t => t.session_id === sess.id);
}

test('gold list: modeler rows with gates + linked; detail tabs over truth', async ({ page, request }) => {
  const row = await gold(request);

  await page.goto('/app/gold');
  await expect(page.locator('main h1')).toHaveText('Gold tables');
  const r = page.getByTestId(`gold-row-${row.id}`);
  await expect(r).toContainText(row.table_name);
  await expect(r.getByTestId('gold-gates'))
    .toContainText(`GATES ${row.gates.passed}/${row.gates.total}`);
  await expect(r).toContainText(row.grain);

  // detail
  await r.getByTestId('gold-name').click();
  await expect(page).toHaveURL(new RegExp(`/app/gold/${row.id}$`));
  await expect(page.getByTestId('gd-name')).toContainText(row.table_name);
  await expect(page.getByTestId('gd-pill')).toContainText('IMMUTABLE');
  await expect(page.getByTestId('gd-sub'))
    .toContainText(`${row.row_count.toLocaleString('en-US')} rows`);

  // schema tab: PRAGMA columns
  await page.getByTestId('gdtab-schema').click();
  await expect(page.locator('[data-testid^="gdcol-"]').first()).toBeVisible();
  expect(await page.locator('[data-testid^="gdcol-"]').count()).toBeGreaterThanOrEqual(3);

  // quality gates tab: humanized list, all named + statused
  await page.getByTestId('gdtab-gates').click();
  const gates = page.locator('[data-testid^="gdgate-"]');
  await expect(gates.first()).toBeVisible();
  expect(await gates.count()).toBeGreaterThanOrEqual(3);
  await expect(gates.first()).toContainText(/PASS|WARN|REPAIRED|BLOCK/);

  // feature manifest tab links to the viewer
  await page.getByTestId('gdtab-manifest').click();
  await page.getByTestId('gd-open-manifest').click();
  await expect(page).toHaveURL(/\/app\/models\/features\/\d+$/);
  await page.goBack();

  // lineage tab deep-links the graph at this gold node
  await page.getByTestId('gdtab-lineage').click();
  await page.getByTestId('gd-open-lineage').click();
  await expect(page).toHaveURL(new RegExp(`/app/governance/lineage\\?node=gold%3A${row.id}`));
});
