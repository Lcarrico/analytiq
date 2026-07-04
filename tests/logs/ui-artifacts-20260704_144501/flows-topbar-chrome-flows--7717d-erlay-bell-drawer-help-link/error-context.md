# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows.spec.js >> topbar chrome flows: search overlay, bell drawer, help link
- Location: tests/ui/flows.spec.js:50:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('bell')
    - locator resolved to <div data-testid="bell" title="Notifications">…</div>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div data-testid="search-overlay">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div data-testid="search-overlay">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    57 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div data-testid="search-overlay">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e6]:
      - img "AnalytIQ" [ref=e7]
      - generic [ref=e12]: AnalytIQ
    - generic [ref=e13]:
      - navigation [ref=e15]:
        - link "Home" [ref=e16] [cursor=pointer]:
          - /url: /app
          - img [ref=e17]
          - text: Home
        - link "Create" [ref=e19] [cursor=pointer]:
          - /url: /app/create
          - img [ref=e20]
          - text: Create
        - link "Artifacts" [ref=e23] [cursor=pointer]:
          - /url: /app/artifacts
          - img [ref=e24]
          - text: Artifacts
      - generic [ref=e27]:
        - generic [ref=e28]: DATA
        - navigation [ref=e29]:
          - link "Data" [ref=e30] [cursor=pointer]:
            - /url: /app/data/sources
            - img [ref=e31]
            - text: Data
          - link "Semantic Layer" [ref=e35] [cursor=pointer]:
            - /url: /app/semantic
            - img [ref=e36]
            - text: Semantic Layer
          - link "Gold Tables" [ref=e41] [cursor=pointer]:
            - /url: /app/gold
            - img [ref=e42]
            - text: Gold Tables
      - generic [ref=e44]:
        - generic [ref=e45]: INTELLIGENCE
        - navigation [ref=e46]:
          - link "Models" [ref=e47] [cursor=pointer]:
            - /url: /app/models
            - img [ref=e48]
            - text: Models
          - link "Alerts" [ref=e51] [cursor=pointer]:
            - /url: /app/alerts
            - img [ref=e52]
            - text: Alerts
          - link "Governance" [ref=e55] [cursor=pointer]:
            - /url: /app/governance
            - img [ref=e56]
            - text: Governance
      - generic [ref=e60]:
        - link "Team" [ref=e61] [cursor=pointer]:
          - /url: /app/team
          - img [ref=e62]
          - text: Team
        - link "Admin" [ref=e67] [cursor=pointer]:
          - /url: /app/admin/platform
          - img [ref=e68]
          - text: Admin
        - link "Billing" [ref=e71] [cursor=pointer]:
          - /url: /app/billing
          - img [ref=e72]
          - text: Billing
        - link "Settings" [ref=e74] [cursor=pointer]:
          - /url: /app/settings/profile
          - img [ref=e75]
          - text: Settings
        - button "Collapse sidebar" [ref=e79] [cursor=pointer]:
          - img [ref=e80]
          - text: Collapse
  - generic [ref=e83]:
    - banner [ref=e84]:
      - button "AR Acme Retail" [ref=e85] [cursor=pointer]:
        - generic [ref=e86]: AR
        - generic [ref=e87]: Acme Retail
        - img [ref=e88]
      - button "Search artifacts, metrics, sources… ⌘K" [ref=e91] [cursor=pointer]:
        - img [ref=e92]
        - generic [ref=e95]: Search artifacts, metrics, sources…
        - generic [ref=e96]: ⌘K
      - generic "Notifications" [ref=e97] [cursor=pointer]:
        - img [ref=e98]
        - generic [ref=e101]: "0"
      - link "?" [ref=e102] [cursor=pointer]:
        - /url: /app/help
      - button "DK" [ref=e104] [cursor=pointer]
    - main [ref=e105]:
      - generic [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]: acme-retail / home
            - heading "Good morning, Admin" [level=1] [ref=e111]
          - generic [ref=e113]: Sat · Jul 4, 2026 · 14:44
        - generic [ref=e114]:
          - img [ref=e115]
          - textbox "Ask a business question — \"Which locations will miss their Q3 revenue target?\"" [ref=e117]
          - generic [ref=e118]: ⏎ build
          - button "Create" [ref=e119] [cursor=pointer]
        - generic [ref=e120]:
          - generic [ref=e121]:
            - generic [ref=e122]:
              - generic [ref=e123]: Recent artifacts
              - generic [ref=e124] [cursor=pointer]: View library →
            - generic [ref=e126]: No artifacts yet
          - generic [ref=e127]:
            - generic [ref=e128]:
              - generic [ref=e129]: Data health
              - generic [ref=e130] [cursor=pointer]: Details →
            - generic [ref=e131]:
              - generic [ref=e133]:
                - img [ref=e134]
                - generic [ref=e137]:
                  - generic [ref=e138]: "100"
                  - generic [ref=e139]: / 100
              - generic [ref=e140]:
                - generic [ref=e141]:
                  - generic [ref=e142]: Sources healthy
                  - generic [ref=e143]: 0/0
                - generic [ref=e144]:
                  - generic [ref=e145]: Freshness SLAs
                  - generic [ref=e146]: met
                - generic [ref=e147]:
                  - generic [ref=e148]: Schema drift
                  - generic [ref=e149]: 0 tables
                - generic [ref=e150]:
                  - generic [ref=e151]: PII flags
                  - generic [ref=e152]: 0 open
          - generic [ref=e153]:
            - generic [ref=e155]: Active pipeline runs
            - text: No runs in flight
          - generic [ref=e156]:
            - generic [ref=e157]:
              - generic [ref=e158]: Alerts firing
              - generic [ref=e159] [cursor=pointer]: All alerts →
            - text: Quiet — nothing firing
          - generic [ref=e160]:
            - generic [ref=e161]:
              - generic [ref=e162]: Awaiting review
              - generic [ref=e163] [cursor=pointer]: Open review queue →
            - text: Queue is clear
          - generic [ref=e164]:
            - generic [ref=e166]: Suggested analyses
            - text: Suggestions appear as the platform learns your data
          - generic [ref=e167]:
            - generic [ref=e169]: Recently viewed
            - text: Nothing viewed yet
          - generic [ref=e170]:
            - generic [ref=e171]:
              - generic [ref=e172]: Usage & cost
              - generic [ref=e173]: ADMIN
            - generic [ref=e174]: "0"
            - generic [ref=e175]: tokens this week · 0% of plan
            - text: Usage & limits →
  - textbox "Search artifacts, metrics, sources…" [active] [ref=e178]
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
> 55 |   await page.getByTestId('bell').click();
     |                                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  56 |   await expect(page.getByTestId('notifications-drawer')).toBeVisible();
  57 |   await page.getByTestId('notifications-drawer').getByRole('button', { name: 'Close' }).click();
  58 |   expect(await page.getByTestId('help-btn').getAttribute('href')).toBe('/app/help');
  59 | });
  60 | 
  61 | test('artifacts library toggles views and persists via URL', async ({ page }) => {
  62 |   await page.goto('/app/artifacts');
  63 |   await page.getByTestId('view-toggle-table').click();
  64 |   await expect(page.getByTestId('data-table')).toBeVisible();
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