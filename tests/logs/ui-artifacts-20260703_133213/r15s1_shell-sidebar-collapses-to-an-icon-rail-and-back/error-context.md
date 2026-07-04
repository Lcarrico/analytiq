# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s1_shell.spec.js >> sidebar collapses to an icon rail and back
- Location: tests/ui/r15s1_shell.spec.js:19:5

# Error details

```
Error: locator.boundingBox: Test ended.
Call log:
  - waiting for getByTestId('app-sidebar')

```

# Test source

```ts
  1  | // R15S1E2-US1 (UI) — PRD app shell: light sidebar, collapse rail, top bar
  2  | // with ⌘K search overlay, breadcrumbs, bell, avatar menu.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('shell renders sidebar groups, breadcrumbs and topbar', async ({ page }) => {
  6  |   await page.goto('/app/artifacts');
  7  |   const sidebar = page.getByTestId('app-sidebar');
  8  |   await expect(sidebar).toBeVisible();
  9  |   for (const label of ['Home', 'Create', 'Artifacts', 'Data', 'Semantic Layer',
  10 |                        'Gold Tables', 'Models', 'Alerts', 'Governance', 'Team',
  11 |                        'Admin', 'Billing', 'Settings']) {
  12 |     await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible();
  13 |   }
  14 |   await expect(page.getByTestId('breadcrumbs')).toContainText('app / artifacts');
  15 |   await expect(page.getByTestId('topbar')).toBeVisible();
  16 |   await expect(page.getByTestId('bell-count')).toBeVisible();
  17 | });
  18 | 
  19 | test('sidebar collapses to an icon rail and back', async ({ page }) => {
  20 |   await page.goto('/app');
  21 |   const sidebar = page.getByTestId('app-sidebar');
> 22 |   const wide = (await sidebar.boundingBox()).width;
     |                               ^ Error: locator.boundingBox: Test ended.
  23 |   expect(Math.round(wide)).toBe(240);
  24 |   await page.getByTestId('sidebar-collapse').click();
  25 |   await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(64);
  26 |   await expect(sidebar.getByRole('link', { name: 'Artifacts', exact: true })).toHaveCount(0);
  27 |   await page.getByTestId('sidebar-collapse').click();
  28 |   await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(240);
  29 | });
  30 | 
  31 | test('topbar search overlay finds artifacts via workspace FTS', async ({ page, request }) => {
  32 |   const title = `Searchable ${Date.now() % 1e6}`;
  33 |   const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  34 |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  35 |   await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  36 |                     { timeout: 20_000 }).toBe('done');
  37 |   await request.post(`/api/sessions/${sess.id}/save_artifact`, { data: { title } });
  38 | 
  39 |   await page.goto('/app');
  40 |   await page.getByTestId('global-search').click();
  41 |   const overlay = page.getByTestId('search-overlay');
  42 |   await expect(overlay).toBeVisible();
  43 |   await overlay.locator('input').fill(title.split(' ')[1]);
  44 |   await expect(overlay.getByText(title)).toBeVisible();
  45 |   await overlay.getByText(title).click();
  46 |   expect(new URL(page.url()).pathname).toBe('/app/artifacts');
  47 | });
  48 | 
  49 | test('navigating an unbuilt area shows its placeholder', async ({ page }) => {
  50 |   await page.goto('/app');
  51 |   await page.getByTestId('app-sidebar').getByRole('link', { name: 'Team', exact: true }).click();
  52 |   await expect(page.getByTestId('placeholder-page')).toContainText(/people layer/i);
  53 | });
  54 | 
```