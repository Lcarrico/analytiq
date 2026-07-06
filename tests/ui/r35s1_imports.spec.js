// R35S1E4-US1 (UI) — Import flows ×4 (`Data Import.dc.html` / PRD §8
// audit-first) over the real R2 connectors: file upload with a live schema
// preview (profiler types, PII masking, null rates), REST API connector
// (real create + poll ingest), webhook endpoint (capability token shown
// once, real test event -> recent events), and dbt import (manifest ->
// semantic candidates with inherited tests). Payload-schema validation on
// webhooks is owned by R36S1 (noted in-UI).
import { test, expect } from '@playwright/test';

const CSV = ['visit_date,store_id,foot_traffic,manager_email',
  '2026-06-28,ST-0042,1204,jane.doe@acme.com',
  '2026-06-29,ST-0042,1188,jane.doe@acme.com',
  '2026-06-30,ST-0043,990,mark.p@acme.com'].join('\n');

test('upload: schema preview with PII flag, lands in sources', async ({ page }) => {
  await page.goto('/app/data/import/upload');
  await expect(page.locator('main h1')).toContainText('Upload a file');
  await page.getByTestId('upload-input').setInputFiles({
    name: 'store_traffic.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });

  await expect(page.getByTestId('upload-schema')).toBeVisible({ timeout: 10_000 });
  const cols = page.locator('[data-testid^="upcol-"]');
  await expect(cols).toHaveCount(4);
  await expect(page.getByTestId('upcol-manager_email').getByTestId('up-pii'))
    .toContainText('PII');
  await expect(page.getByTestId('upload-rows')).toContainText('3');
  await expect(page.getByTestId('upload-piicount')).toContainText('1');

  await page.getByTestId('upload-finish').click();
  await expect(page).toHaveURL(/\/app\/data\/sources$/);
});

test('rest connector: save + real poll ingests rows', async ({ page }) => {
  await page.goto('/app/data/import/rest');
  await page.getByTestId('rest-url').fill('https://api.example.com/orders.json');
  await page.getByTestId('rest-save').click();
  await expect(page.getByTestId('rest-saved')).toBeVisible({ timeout: 10_000 });

  await page.getByTestId('rest-poll').click();
  await expect(page.getByTestId('rest-poll-result'))
    .toContainText(/\d+ records ingested/, { timeout: 10_000 });
});

test('webhook: token shown once, test event lands in recent events', async ({ page }) => {
  await page.goto('/app/data/import/webhook');
  await page.getByTestId('wh-create').click();
  const url = page.getByTestId('wh-url');
  await expect(url).toContainText(/\/api\/ingest\/webhook\//, { timeout: 10_000 });
  await expect(page.getByTestId('wh-secret')).toBeVisible();
  await expect(page.getByTestId('wh-once-note')).toContainText(/shown once/i);

  await page.getByTestId('wh-send-test').click();
  const rows = page.locator('[data-testid^="wh-event-"]');
  await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  await expect(rows.first()).toContainText('201');
});

test('dbt: demo manifest maps models + inherited tests into the semantic layer', async ({ page, request }) => {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: `dbt_${Date.now() % 1e5}`,
              username: 'u', password: 'p' } })).json();
  const before = ((await (await request.get(
    '/api/semantic/default/schema/versions')).json()) || []).length;

  await page.goto('/app/data/import/dbt');
  await page.getByTestId('dbt-connection').selectOption(String(conn.id));
  await page.getByTestId('dbt-demo').click();
  const rows = page.locator('[data-testid^="dbt-model-"]');
  await expect(rows).toHaveCount(2);
  await expect(rows.first().getByTestId('dbt-tests')).toContainText(/INHERITED/);

  await page.getByTestId('dbt-import').click();
  await expect(page.getByTestId('dbt-result'))
    .toContainText(/2 models .* tests inherited/i, { timeout: 10_000 });
  await expect.poll(async () =>
    ((await (await request.get('/api/semantic/default/schema/versions')).json()) || []).length)
    .toBeGreaterThan(before);
});
