# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r21s2_shell.spec.js >> sidebar groups match the frame: order, labels, membership
- Location: tests/ui/r21s2_shell.spec.js:8:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: getByTestId('app-sidebar').getByTestId('nav-group-label')
Timeout: 10000ms
- Expected  - 4
+ Received  + 1

- Array [
-   "DATA",
-   "INTELLIGENCE",
- ]
+ Array []

Call log:
  - Expect "toHaveText" with timeout 10000ms
  - waiting for getByTestId('app-sidebar').getByTestId('nav-group-label')
    24 × locator resolved to 0 elements

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e10]: AnalytIQ
    - navigation [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Workspace
        - link "Home" [ref=e14] [cursor=pointer]:
          - /url: /app
          - img [ref=e15]
          - text: Home
        - link "Create" [ref=e17] [cursor=pointer]:
          - /url: /app/create
          - img [ref=e18]
          - text: Create
        - link "Artifacts" [ref=e21] [cursor=pointer]:
          - /url: /app/artifacts
          - img [ref=e22]
          - text: Artifacts
      - generic [ref=e25]:
        - generic [ref=e26]: Data
        - link "Data" [ref=e27] [cursor=pointer]:
          - /url: /app/data/sources
          - img [ref=e28]
          - text: Data
        - link "Semantic Layer" [ref=e32] [cursor=pointer]:
          - /url: /app/semantic
          - img [ref=e33]
          - text: Semantic Layer
        - link "Gold Tables" [ref=e38] [cursor=pointer]:
          - /url: /app/gold
          - img [ref=e39]
          - text: Gold Tables
        - link "Models" [ref=e41] [cursor=pointer]:
          - /url: /app/models
          - img [ref=e42]
          - text: Models
      - generic [ref=e45]:
        - generic [ref=e46]: Operate
        - link "Alerts" [ref=e47] [cursor=pointer]:
          - /url: /app/alerts
          - img [ref=e48]
          - text: Alerts
        - link "Governance" [ref=e51] [cursor=pointer]:
          - /url: /app/governance
          - img [ref=e52]
          - text: Governance
      - generic [ref=e55]:
        - generic [ref=e56]: Organization
        - link "Team" [ref=e57] [cursor=pointer]:
          - /url: /app/team
          - img [ref=e58]
          - text: Team
        - link "Admin" [ref=e63] [cursor=pointer]:
          - /url: /app/admin/platform
          - img [ref=e64]
          - text: Admin
        - link "Billing" [ref=e67] [cursor=pointer]:
          - /url: /app/billing
          - img [ref=e68]
          - text: Billing
        - link "Settings" [ref=e70] [cursor=pointer]:
          - /url: /app/settings/profile
          - img [ref=e71]
          - text: Settings
    - button "« Collapse" [ref=e75] [cursor=pointer]
  - generic [ref=e76]:
    - banner [ref=e77]:
      - generic [ref=e79]:
        - text: acme-retail
        - img [ref=e80]
      - button "Search… ⌘K" [ref=e83] [cursor=pointer]:
        - text: Search…
        - generic [ref=e84]: ⌘K
      - generic "Notifications" [ref=e85] [cursor=pointer]:
        - img [ref=e86]
        - generic [ref=e89]: "0"
      - generic "Help" [ref=e90]: "?"
      - button "A" [ref=e92] [cursor=pointer]
    - generic [ref=e93]: app
    - main [ref=e94]:
      - generic [ref=e95]:
        - heading "Welcome to AnalytIQ" [level=1] [ref=e97]
        - paragraph [ref=e98]: Ask a question in plain English. Get a backtested, governed, shareable predictive dashboard — no SQL, no Python.
        - paragraph [ref=e99]: No data sources connected yet.
        - button "Start your first analysis →" [ref=e100] [cursor=pointer]
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e103]: Credentials stay secure
            - generic [ref=e104]: Encrypted at rest and never shared with the LLM layer.
          - generic [ref=e105]:
            - generic [ref=e106]: ✓
            - generic [ref=e107]: Walk-forward backtesting
            - generic [ref=e108]: Every model validated on held-out time windows before shipping.
          - generic [ref=e109]:
            - generic [ref=e110]: Shareable artifacts
            - generic [ref=e111]: Self-contained dashboards with full lineage metadata.
```

# Test source

```ts
  1  | // R21S2E1-US1/US2 (UI) — sidebar parity with App Home.dc.html #home:
  2  | // group structure (top ungrouped · DATA · INTELLIGENCE · spacer · bottom
  3  | // border-top group + Collapse row), exact label/item styles, 64px rail.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  7  | 
  8  | test('sidebar groups match the frame: order, labels, membership', async ({ page }) => {
  9  |   await page.goto('/app');
  10 |   const sidebar = page.getByTestId('app-sidebar');
  11 |   await expect(sidebar).toBeVisible();
  12 | 
  13 |   // group labels: exactly DATA and INTELLIGENCE (legacy WORKSPACE/OPERATE/
  14 |   // ORGANIZATION headers are gone)
  15 |   const labels = sidebar.getByTestId('nav-group-label');
> 16 |   await expect(labels).toHaveText(['DATA', 'INTELLIGENCE']);
     |                        ^ Error: expect(locator).toHaveText(expected) failed
  17 | 
  18 |   // link order per frame: Models lives under INTELLIGENCE (after Gold Tables)
  19 |   const links = sidebar.getByRole('link');
  20 |   await expect(links).toHaveText([
  21 |     'Home', 'Create', 'Artifacts',
  22 |     'Data', 'Semantic Layer', 'Gold Tables',
  23 |     'Models', 'Alerts', 'Governance',
  24 |     'Team', 'Admin', 'Billing', 'Settings',
  25 |   ]);
  26 | 
  27 |   // group label style: mono 9.5/600 ls .12em, padding 12px 22px 4px
  28 |   const dataLabel = labels.first();
  29 |   expect(await css(dataLabel, 'fontSize')).toBe('9.5px');
  30 |   expect(await css(dataLabel, 'fontWeight')).toBe('600');
  31 |   expect(await css(dataLabel, 'letterSpacing')).toBe('1.14px'); // 9.5 × .12em
  32 |   expect(await css(dataLabel, 'paddingLeft')).toBe('22px');
  33 |   expect(await css(dataLabel, 'paddingTop')).toBe('12px');
  34 | 
  35 |   // logo row: h64, border-bottom #eef1f5, padding 0 20
  36 |   const logoRow = sidebar.getByTestId('sidebar-logo-row');
  37 |   expect(await logoRow.evaluate(el => el.offsetHeight)).toBe(64);
  38 |   expect(await css(logoRow, 'borderBottomColor')).toBe('rgb(238, 241, 245)');
  39 |   expect(await css(logoRow, 'paddingLeft')).toBe('20px');
  40 | 
  41 |   // active item: bg #e8effc text #1d4ed8 w600, 15px svg icon
  42 |   const home = sidebar.getByRole('link', { name: 'Home', exact: true });
  43 |   expect(await css(home, 'backgroundColor')).toBe('rgb(232, 239, 252)');
  44 |   expect(await css(home, 'color')).toBe('rgb(29, 78, 216)');
  45 |   expect(await css(home, 'fontWeight')).toBe('600');
  46 |   await expect(home.locator('svg')).toBeVisible();
  47 | 
  48 |   // bottom group sits above a border-top hairline; Collapse row (not a
  49 |   // full-width « button) closes the rail
  50 |   const bottom = sidebar.getByTestId('nav-bottom-group');
  51 |   expect(await css(bottom, 'borderTopColor')).toBe('rgb(238, 241, 245)');
  52 |   const collapse = sidebar.getByTestId('sidebar-collapse');
  53 |   await expect(collapse).toContainText('Collapse');
  54 |   expect(await css(collapse, 'fontSize')).toBe('12px');
  55 |   expect(await css(collapse, 'color')).toBe('rgb(148, 163, 184)');
  56 | });
  57 | 
  58 | test('rail collapse keeps centered icons and tooltips', async ({ page }) => {
  59 |   await page.goto('/app');
  60 |   const sidebar = page.getByTestId('app-sidebar');
  61 |   await page.getByTestId('sidebar-collapse').click();
  62 |   await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(64);
  63 |   const home = sidebar.getByRole('link', { name: 'Home', exact: true });
  64 |   await expect(home.locator('svg')).toBeVisible();       // icon survives
  65 |   expect(await home.getAttribute('title')).toBe('Home'); // tooltip
  66 |   expect(await css(home, 'justifyContent')).toBe('center');
  67 |   await page.getByTestId('sidebar-collapse').click();
  68 |   await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(240);
  69 | });
  70 | 
```