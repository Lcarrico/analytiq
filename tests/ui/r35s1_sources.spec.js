// R35S1E1-US1 (UI) — Data sources list (`Data Sources.dc.html` frame 01 /
// PRD §8 audit-first): crumb + live count, filter, + Add source, and one
// row per connection over the new /api/data/sources aggregate — typed kind,
// status dot pill, health, last sync, SLA posture, owner, table + issue
// counts. The legacy S02 connect screen moves to /app/data/connect until
// R35S1E2 replaces it.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function governedSource(request, account) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account, username: 'u', password: 'p' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  return conn.id;
}

test('sources list: rows over the aggregate, filter, add-source route', async ({ page, request }) => {
  const cid = await governedSource(request, `prod_pos_${Date.now() % 1e5}`);
  await request.put('/api/tables/sla', { data: { connectionId: cid,
    table: 'fact_revenue', max_age_hours: 1 } });
  const rest = await (await request.post('/api/connections',
    { data: { type: 'rest_api', name: 'shopify_orders',
              endpoint_url: 'https://api.example.com/orders' } })).json();
  const d = await (await request.get('/api/data/sources')).json();

  await page.goto('/app/data/sources');
  await expect(page.locator('main h1')).toHaveText('Data sources');
  await expect(page.getByTestId('sources-count')).toHaveText(String(d.total));

  const rows = page.locator('[data-testid^="src-row-"]');
  await expect(rows).toHaveCount(d.total);

  const mine = d.sources.find(s => s.id === cid);
  const row = page.getByTestId(`src-row-${cid}`);
  await expect(row.getByTestId('src-status')).toContainText('CONNECTED');
  await expect(row.getByTestId('src-kind')).toHaveText('warehouse');
  await expect(row.getByTestId('src-health')).toHaveText(String(mine.health));
  const sla = row.getByTestId('src-sla');
  await expect(sla).toContainText(mine.sla.label);
  await expect(sla).toContainText(mine.sla.state);
  await expect(row.getByTestId('src-tables')).toHaveText(String(mine.tables));
  expect(await css(row.getByTestId('src-health'), 'fontFamily')).toContain('Mono');

  // the REST connection carries its kind
  await expect(page.getByTestId(`src-row-${rest.id}`).getByTestId('src-kind'))
    .toHaveText('api poll');

  // filter narrows rows
  await page.getByTestId('sources-filter').fill('prod_pos');
  expect(await rows.count()).toBeLessThan(d.total);
  await page.getByTestId('sources-filter').fill('');

  // + Add source routes to the connect surface
  await page.getByTestId('add-source').click();
  await expect(page).toHaveURL(/\/app\/data\/connect$/);
});
