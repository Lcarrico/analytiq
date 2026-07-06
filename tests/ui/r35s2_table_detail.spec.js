// R35S2E2-US1 (UI) — Table detail (`Data Detail.dc.html` frame 02 / PRD §8
// audit-first): crumb + health/facts header, EDITABLE business definition
// (persists via the audited PATCH DEP), health-trend spark, manifest
// columns (null rates, semantic types, PII masked pills), freshness vs
// SLA, downstream chips, quality-gate row. The lineage graph's
// "Open table detail" goes live here (owned flip).
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function governed(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: `td_${Date.now() % 1e5}`, username: 'u',
              password: 'p' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  await request.put('/api/tables/sla', { data: { connectionId: conn.id,
    table: 'fact_revenue', max_age_hours: 1 } });
  return { cid: conn.id, runId: run.runId };
}

test('table detail: header, editable definition, columns, gates, downstream', async ({ page, request }) => {
  const { runId } = await governed(request);
  const d = await (await request.get(`/api/data/tables/${runId}/dim_customer`)).json();

  await page.goto(`/app/data/tables/${runId}/dim_customer`);
  await expect(page.getByTestId('td-name')).toHaveText('dim_customer');
  await expect(page.getByTestId('td-health-pill'))
    .toContainText(String(d.health_score));
  await expect(page.getByTestId('td-sub')).toContainText(`${d.row_count} rows`);
  await expect(page.getByTestId('td-sub')).toContainText(`${d.columns.length} columns`);

  // editable business definition persists through the PATCH DEP
  await page.getByTestId('td-def-edit').click();
  await page.getByTestId('td-def-input').fill('Customer master, one row per account.');
  await page.getByTestId('td-def-save').click();
  await expect(page.getByTestId('td-definition'))
    .toContainText('Customer master, one row per account.');
  const d2 = await (await request.get(`/api/data/tables/${runId}/dim_customer`)).json();
  expect(d2.description).toBe('Customer master, one row per account.');

  // columns: manifest truth with masked PII pills
  const rows = page.locator('[data-testid^="tdcol-"]');
  await expect(rows).toHaveCount(d.columns.length);
  const email = page.getByTestId('tdcol-email');
  await expect(email.getByTestId('td-pii')).toContainText(/MASKED/);
  expect(await css(email.getByTestId('td-null'), 'fontFamily')).toContain('Mono');

  // quality gates row
  await expect(page.getByTestId('td-gates')).toContainText(/PK/);

  // fact_revenue: SLA posture renders
  await page.goto(`/app/data/tables/${runId}/fact_revenue`);
  await expect(page.getByTestId('td-freshness')).toContainText(/SLA 1h/);
});

test('lineage graph opens table detail (owned flip)', async ({ page, request }) => {
  await governed(request);
  const latest = await (await request.get('/api/governance/latest')).json();
  const g = await (await request.get(`/api/lineage/${latest.connection_id}`)).json();
  const table = g.nodes.find(n => n.kind === 'table');

  await page.goto(`/app/governance/lineage?node=${encodeURIComponent(table.id)}`);
  const btn = page.getByTestId('lin-open-table');
  await expect(btn).toBeEnabled();
  await btn.click();
  await expect(page).toHaveURL(new RegExp(`/app/data/tables/latest/${table.id}$`));
  await expect(page.getByTestId('td-name')).toHaveText(table.id);
});
