// R35S1E3-US1 (UI) — Snowflake connector wizard (`Data Sources.dc.html`
// frame 03 / PRD §8 audit-first): 4-step stepper — real Test connection
// (latency chip), deterministic scope picker (schema groups, row counts,
// PII LIKELY pills, N-of-M counter) whose selection is REALLY enforced by
// the governance run, per-table freshness SLAs, and a live health check
// (the actual governance run) landing on the sources list.
import { test, expect } from '@playwright/test';

test('wizard: credentials -> scoped tables -> SLA -> live health check', async ({ page, request }) => {
  await page.goto('/app/data/connect/snowflake');
  await expect(page.locator('main h1')).toContainText('Connect Snowflake');
  await expect(page.locator('[data-testid^="wiz-step-"]')).toHaveCount(4);

  // step 1 — credentials + real test
  const acct = `wiz_${Date.now() % 1e6}`;
  await page.getByTestId('wiz-account').fill(acct);
  await page.getByTestId('wiz-username').fill('reader');
  await page.getByTestId('wiz-password').fill('secret');
  await page.getByTestId('wiz-test').click();
  const verified = page.getByTestId('wiz-verified');
  await expect(verified).toContainText('Connection verified');
  await expect(verified).toContainText(/read-only role · \d+(\.\d+)?ms/);
  await page.getByTestId('wiz-continue').click();

  // step 2 — scope picker over the deterministic preview
  await expect(page.getByTestId('wiz-step-2')).toHaveAttribute('data-active', 'true');
  await expect(page.getByTestId('scope-schema-CORE')).toContainText('4 tables');
  const cust = page.getByTestId('scope-table-dim_customer');
  await expect(cust.getByTestId('pii-likely')).toContainText('PII LIKELY');
  await expect(cust).toContainText('84.2K');

  await page.getByTestId('scope-table-fact_revenue').click();
  await page.getByTestId('scope-table-dim_location').click();
  await expect(page.getByTestId('scope-count')).toHaveText('2 of 6 selected');
  // filter narrows the rows
  await page.getByTestId('scope-filter').fill('fact');
  expect(await page.locator('[data-testid^="scope-table-"]').count()).toBeLessThan(6);
  await page.getByTestId('scope-filter').fill('');
  await page.getByTestId('wiz-continue').click();

  // step 3 — per-table SLA
  await expect(page.getByTestId('wiz-step-3')).toHaveAttribute('data-active', 'true');
  await page.getByTestId('sla-fact_revenue').fill('1');
  await page.getByTestId('wiz-continue').click();

  // step 4 — the health check IS the governance run, live
  await expect(page.getByTestId('wiz-step-4')).toHaveAttribute('data-active', 'true');
  await expect(page.getByTestId('wiz-health-done')).toBeVisible({ timeout: 25_000 });
  await page.getByTestId('wiz-view-source').click();
  await expect(page).toHaveURL(/\/app\/data\/sources$/);

  // scope + SLA really landed
  const d = await (await request.get('/api/data/sources')).json();
  const mine = d.sources.find(s => (s.name || '').includes(acct));
  expect(mine.tables).toBe(2);
  const slas = await (await request.get(
    `/api/tables/sla?connection_id=${mine.id}`)).json();
  expect(slas.some(s => s.table_name === 'fact_revenue'
    && s.max_age_hours === 1)).toBe(true);
});
