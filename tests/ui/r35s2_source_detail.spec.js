// R35S2E1-US1 (UI) — Source detail (`Data Detail.dc.html` frame 01 / PRD §8
// audit-first): header (status + issues pills, scope/role/owner sub, real
// Sync now = a fresh governance run), nine tabs — Health KPIs + trend +
// issues over the detail aggregate, Tables rows deep-linking table detail
// (R35S2E2), PII from the manifest scan, Freshness vs SLA, Sync logs from
// run history, Lineage into the graph.
import { test, expect } from '@playwright/test';

async function governed(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: `pp_${Date.now() % 1e5}`, username: 'u',
              password: 'p' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  await request.put('/api/tables/sla', { data: { connectionId: conn.id,
    table: 'fact_revenue', max_age_hours: 1 } });
  return conn.id;
}

test('source detail: header, health tab, tables + pii + logs, real sync', async ({ page, request }) => {
  const cid = await governed(request);
  const d = await (await request.get(`/api/data/sources/${cid}`)).json();

  // list row deep-links here
  await page.goto('/app/data/sources');
  await page.getByTestId(`src-row-${cid}`).getByTestId('src-name').click();
  await expect(page).toHaveURL(new RegExp(`/app/data/sources/${cid}$`));

  await expect(page.getByTestId('sd-name')).toContainText(d.header.name);
  await expect(page.getByTestId('sd-status')).toContainText('CONNECTED');
  await expect(page.getByTestId('sd-sub'))
    .toContainText(`${d.header.tables_in_scope} tables in scope`);

  // Health tab (default): KPI cards from the aggregate
  await expect(page.getByTestId('sd-kpi-health').getByTestId('sd-kpi-value'))
    .toHaveText(String(d.kpis.health.score));
  await expect(page.getByTestId('sd-kpi-tables'))
    .toContainText(`${d.kpis.tables_healthy.ok}/${d.kpis.tables_healthy.total}`);
  await expect(page.getByTestId('sd-kpi-fresh')).toContainText(d.kpis.freshness.state);
  await expect(page.getByTestId('sd-kpi-gates'))
    .toContainText(`${d.kpis.gates_7d.passed}/${d.kpis.gates_7d.total}`);

  // Tables tab: cataloged rows link toward the table detail route
  await page.getByTestId('sdtab-tables').click();
  const rows = page.locator('[data-testid^="sdt-row-"]');
  await expect(rows).toHaveCount(d.header.tables_in_scope);
  await rows.first().click();
  await expect(page).toHaveURL(/\/app\/data\/tables\//);
  await page.goBack();

  // PII tab: flagged manifest columns render masked
  await page.getByTestId('sdtab-pii').click();
  await expect(page.locator('[data-testid^="pii-row-"]').first())
    .toBeVisible();

  // Sync logs: at least the governance run
  await page.getByTestId('sdtab-logs').click();
  await expect(page.locator('[data-testid^="log-row-"]').first())
    .toContainText(/governance/i);

  // Lineage tab links into the graph
  await page.getByTestId('sdtab-lineage').click();
  await page.getByTestId('sd-open-lineage').click();
  await expect(page).toHaveURL(/\/app\/governance\/lineage/);
  await page.goBack();

  // Sync now = a real new governance run
  await page.getByTestId('sd-sync-now').click();
  await expect.poll(async () => {
    const latest = await (await request.get('/api/governance/latest')).json();
    return latest.connection_id;
  }, { timeout: 15_000 }).toBe(cid);
  await expect(page.getByTestId('sd-syncing')).toBeVisible();
});
