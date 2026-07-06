// R35S1E2-US1 (UI) — Add-source connector grid (`Data Sources.dc.html`
// frame 02 / PRD §8 audit-first): 12 connector cards with category pills +
// search + read-only note; snowflake routes into the wizard (R35S1E3),
// upload/REST/webhook/dbt route into the import flows (R35S1E4), and the
// remaining warehouse/database/file types open a real credentials drawer
// (S02's form map rehomed) that POSTs /api/connections. S02 retired.
import { test, expect } from '@playwright/test';

test('grid: 12 typed cards, search, wizard + import routing', async ({ page }) => {
  await page.goto('/app/data/connect');
  await expect(page.locator('main h1')).toHaveText('Connect a source');
  await expect(page.getByTestId('connect-note'))
    .toContainText('read-only. Credentials are encrypted at rest.');

  const cards = page.locator('[data-testid^="conn-card-"]');
  await expect(cards).toHaveCount(12);
  await expect(page.getByTestId('conn-card-snowflake')
    .getByTestId('conn-cat')).toHaveText('WAREHOUSE');
  await expect(page.getByTestId('conn-card-upload')
    .getByTestId('conn-cat')).toHaveText('FILE UPLOAD');
  await expect(page.getByTestId('conn-card-dbt')
    .getByTestId('conn-cat')).toHaveText('MODELS + TESTS');

  // search filters the grid
  await page.getByTestId('connect-search').fill('snow');
  expect(await cards.count()).toBeLessThan(12);
  await page.getByTestId('connect-search').fill('');

  // request-a-connector affordance present
  await expect(page.getByTestId('request-connector')).toBeVisible();

  // routing: snowflake -> wizard; webhook -> import flow
  await page.getByTestId('conn-card-snowflake').click();
  await expect(page).toHaveURL(/\/app\/data\/connect\/snowflake$/);
  await page.goBack();
  await page.getByTestId('conn-card-webhook').click();
  await expect(page).toHaveURL(/\/app\/data\/import\/webhook$/);
});

test('credentials drawer: real postgres connection lands in the sources list', async ({ page, request }) => {
  await page.goto('/app/data/connect');
  await page.getByTestId('conn-card-postgres').click();

  const drawer = page.getByTestId('cred-drawer');
  await expect(drawer).toContainText('PostgreSQL');
  await drawer.getByTestId('cred-host').fill('db.example.com');
  await drawer.getByTestId('cred-database_name').fill('analytics');
  await drawer.getByTestId('cred-username').fill('reader');
  await drawer.getByTestId('cred-password').fill('secret');
  await drawer.getByTestId('cred-submit').click();

  await expect(page).toHaveURL(/\/app\/data\/sources$/, { timeout: 10_000 });
  const d = await (await request.get('/api/data/sources')).json();
  expect(d.sources.some(s => s.type === 'postgres'
    && (s.name || '').includes('db.example.com'))).toBe(true);
});
