# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s1_shell.spec.js >> sidebar collapses to an icon rail and back
- Location: tests/ui/r15s1_shell.spec.js:19:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true })
Expected: 0
Received: 1
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" with timeout 10000ms
  - waiting for getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true })
    24 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - navigation [ref=e10]:
      - generic [ref=e11]:
        - link "Home" [ref=e12] [cursor=pointer]:
          - /url: /app
          - generic [ref=e13]: ⌂
        - link "Create" [ref=e14] [cursor=pointer]:
          - /url: /app/create
          - generic [ref=e15]: ✦
        - link "Artifacts" [ref=e16] [cursor=pointer]:
          - /url: /app/artifacts
          - generic [ref=e17]: ▦
      - generic [ref=e18]:
        - link "Data" [ref=e19] [cursor=pointer]:
          - /url: /app/data/sources
          - generic [ref=e20]: ⬡
        - link "Semantic Layer" [ref=e21] [cursor=pointer]:
          - /url: /app/semantic
          - generic [ref=e22]: ◈
        - link "Gold Tables" [ref=e23] [cursor=pointer]:
          - /url: /app/gold
          - generic [ref=e24]: ▤
        - link "Models" [ref=e25] [cursor=pointer]:
          - /url: /app/models
          - generic [ref=e26]: ⚗
      - generic [ref=e27]:
        - link "Alerts" [ref=e28] [cursor=pointer]:
          - /url: /app/alerts
          - generic [ref=e29]: ◉
        - link "Governance" [ref=e30] [cursor=pointer]:
          - /url: /app/governance
          - generic [ref=e31]: ⛭
      - generic [ref=e32]:
        - link "Team" [ref=e33] [cursor=pointer]:
          - /url: /app/team
          - generic [ref=e34]: ◇
        - link "Admin" [ref=e35] [cursor=pointer]:
          - /url: /app/admin/platform
          - generic [ref=e36]: ⚙
        - link "Billing" [ref=e37] [cursor=pointer]:
          - /url: /app/billing
          - generic [ref=e38]: ❖
        - link "Settings" [ref=e39] [cursor=pointer]:
          - /url: /app/settings/profile
          - generic [ref=e40]: ○
    - button "»" [active] [ref=e41] [cursor=pointer]
  - generic [ref=e42]:
    - banner [ref=e43]:
      - generic [ref=e44]: acme-retail ▾
      - button "Search… ⌘K" [ref=e46] [cursor=pointer]:
        - text: Search…
        - generic [ref=e47]: ⌘K
      - generic "Notifications" [ref=e48]:
        - text: 🔔
        - generic [ref=e49]: "0"
      - generic "Help" [ref=e50]: "?"
      - button "A" [ref=e52] [cursor=pointer]
    - generic [ref=e53]: app
    - main [ref=e54]:
      - generic [ref=e55]:
        - generic [ref=e56]: 📊
        - heading "Welcome to AnalytIQ" [level=1] [ref=e57]
        - paragraph [ref=e58]: Ask a question in plain English. Get a backtested, governed, shareable predictive dashboard — no SQL, no Python.
        - paragraph [ref=e59]: No data sources connected yet.
        - button "Start your first analysis →" [ref=e60] [cursor=pointer]
        - generic [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e63]: 🔒
            - generic [ref=e64]: Credentials stay secure
            - generic [ref=e65]: Encrypted at rest and never shared with the LLM layer.
          - generic [ref=e66]:
            - generic [ref=e67]: ✓
            - generic [ref=e68]: Walk-forward backtesting
            - generic [ref=e69]: Every model validated on held-out time windows before shipping.
          - generic [ref=e70]:
            - generic [ref=e71]: 📤
            - generic [ref=e72]: Shareable artifacts
            - generic [ref=e73]: Self-contained dashboards with full lineage metadata.
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
  22 |   const wide = (await sidebar.boundingBox()).width;
  23 |   expect(Math.round(wide)).toBe(240);
  24 |   await page.getByTestId('sidebar-collapse').click();
  25 |   await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(64);
> 26 |   await expect(sidebar.getByRole('link', { name: 'Artifacts', exact: true })).toHaveCount(0);
     |                                                                               ^ Error: expect(locator).toHaveCount(expected) failed
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