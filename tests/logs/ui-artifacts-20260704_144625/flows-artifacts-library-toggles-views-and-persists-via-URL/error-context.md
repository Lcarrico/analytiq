# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows.spec.js >> artifacts library toggles views and persists via URL
- Location: tests/ui/flows.spec.js:61:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('artifacts-table')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('artifacts-table')

```

```yaml
- complementary:
  - img "AnalytIQ"
  - text: AnalytIQ
  - navigation:
    - link "Home":
      - /url: /app
    - link "Create":
      - /url: /app/create
    - link "Artifacts":
      - /url: /app/artifacts
  - text: DATA
  - navigation:
    - link "Data":
      - /url: /app/data/sources
    - link "Semantic Layer":
      - /url: /app/semantic
    - link "Gold Tables":
      - /url: /app/gold
  - text: INTELLIGENCE
  - navigation:
    - link "Models":
      - /url: /app/models
    - link "Alerts":
      - /url: /app/alerts
    - link "Governance":
      - /url: /app/governance
  - link "Team":
    - /url: /app/team
  - link "Admin":
    - /url: /app/admin/platform
  - link "Billing":
    - /url: /app/billing
  - link "Settings":
    - /url: /app/settings/profile
  - button "Collapse sidebar": Collapse
- banner:
  - button "AR Acme Retail"
  - button "Search artifacts, metrics, sources… ⌘K"
  - text: "0"
  - link "?":
    - /url: /app/help
  - button "DK"
- main:
  - text: acme-retail / artifacts
  - heading "Workspace artifacts" [level=1]
  - paragraph: 0 saved analyses · shareable with your team
  - button "Cards":
    - img
    - text: Cards
  - button "Table":
    - img
    - text: Table
  - button "⊙ ROI report"
  - button "⧉ Sandbox"
  - button "Health dashboard"
  - button "+ New analysis"
  - textbox "Deep search (titles + metric names, FTS)…"
  - textbox "Search by title..."
  - combobox:
    - option "All types" [selected]
    - option "Predictive"
    - option "Descriptive"
  - combobox:
    - option "All DQ statuses" [selected]
    - option "Pass"
    - option "Warn"
  - text: No artifacts yet.
  - button "Start your first analysis →"
```

# Test source

```ts
  1  | // PAR-2 — curated cross-page flow suite (GATING, runs in the main suite).
  2  | // The mockups' cross-links define the app's navigation contract; these are
  3  | // the journeys that must already work on the rebuilt surfaces. As R22–R29
  4  | // stories land, promote their flows from parity.spec.js into here.
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | const at = page => new URL(page.url()).pathname;
  8  | 
  9  | test('sidebar reaches all 13 areas at their mockup routes', async ({ page }) => {
  10 |   await page.goto('/app');
  11 |   const expected = [
  12 |     ['Home', '/app'], ['Create', '/app/create/new'], ['Artifacts', '/app/artifacts'],
  13 |     ['Data', '/app/data/sources'], ['Semantic Layer', '/app/semantic'],
  14 |     ['Gold Tables', '/app/gold'], ['Models', '/app/models'], ['Alerts', '/app/alerts'],
  15 |     ['Governance', '/app/governance'], ['Team', '/app/team'], ['Admin', '/app/admin/platform'],
  16 |     ['Billing', '/app/billing'], ['Settings', '/app/settings/profile'],
  17 |   ];
  18 |   for (const [label, route] of expected) {
  19 |     await page.getByTestId('app-sidebar').getByRole('link', { name: label, exact: true }).click();
  20 |     await expect.poll(() => at(page), { timeout: 5000 }).toBe(route);
  21 |     // every area renders inside the shell (topbar persists), never a 404
  22 |     await expect(page.getByTestId('topbar')).toBeVisible();
  23 |     await expect(page.getByTestId('notfound-page')).toHaveCount(0);
  24 |   }
  25 | });
  26 | 
  27 | test('home widgets deep-link per the frame', async ({ page }) => {
  28 |   await page.goto('/app');
  29 |   await page.getByText('View library →').click();
  30 |   await expect.poll(() => at(page)).toBe('/app/artifacts');
  31 |   await page.goto('/app');
  32 |   await page.getByText('Details →').click();
  33 |   await expect.poll(() => at(page)).toBe('/app/governance');
  34 |   await page.goto('/app');
  35 |   await page.getByText('All alerts →').click();
  36 |   await expect.poll(() => at(page)).toBe('/app/alerts');
  37 |   await page.goto('/app');
  38 |   await page.getByText('Usage & limits →').click();       // admin widget
  39 |   await expect.poll(() => at(page)).toBe('/app/billing/usage');
  40 | });
  41 | 
  42 | test('home hero Create button seeds the workbench', async ({ page }) => {
  43 |   await page.goto('/app');
  44 |   await page.getByTestId('hero-input').fill('Weekend vs weekday margin by region');
  45 |   await page.getByTestId('hero-create').click();
  46 |   await expect.poll(() => at(page) + new URL(page.url()).search).toContain('/app/create/new?q=');
  47 |   await expect(page.getByText('Weekend vs weekday margin by region').first()).toBeVisible();
  48 | });
  49 | 
  50 | test('topbar chrome flows: search overlay, bell drawer, help link', async ({ page }) => {
  51 |   await page.goto('/app');
  52 |   await page.getByTestId('global-search').click();
  53 |   await expect(page.getByTestId('search-overlay')).toBeVisible();
  54 |   await page.keyboard.press('Escape');
  55 |   await page.getByTestId('bell').click();
  56 |   await expect(page.getByTestId('notifications-drawer')).toBeVisible();
  57 |   await page.getByTestId('notifications-drawer').getByRole('button', { name: 'Close' }).click();
  58 |   expect(await page.getByTestId('help-btn').getAttribute('href')).toBe('/app/help');
  59 | });
  60 | 
  61 | test('artifacts library toggles views and persists via URL', async ({ page }) => {
  62 |   await page.goto('/app/artifacts');
  63 |   await page.getByTestId('view-toggle-table').click();
> 64 |   await expect(page.getByTestId('artifacts-table')).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  65 |   await page.getByTestId('view-toggle-cards').click();
  66 | });
  67 | 
  68 | test('marketing front door: landing → Start free → app; pricing renders', async ({ page }) => {
  69 |   await page.goto('/');
  70 |   await expect(page.getByTestId('marketing-landing')).toBeVisible();
  71 |   await page.getByText('Start free', { exact: false }).first().click();
  72 |   await expect.poll(() => at(page)).toBe('/app');
  73 |   await page.goto('/pricing');
  74 |   await expect(page.getByText('Starter')).toBeVisible();
  75 | });
  76 | 
  77 | test('workbench round trip: question → plan → logo back to home', async ({ page }) => {
  78 |   await page.goto('/app/create/new');
  79 |   await page.getByTestId('workbench-input').fill(
  80 |     'Forecast net revenue for the next 14 days by location');
  81 |   await page.getByTestId('workbench-send').click();
  82 |   await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  83 | });
  84 | 
```