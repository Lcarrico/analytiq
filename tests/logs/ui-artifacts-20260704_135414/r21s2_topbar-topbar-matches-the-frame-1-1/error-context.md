# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r21s2_topbar.spec.js >> topbar matches the frame 1:1
- Location: tests/ui/r21s2_topbar.spec.js:8:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "28px"
Received: "20px"
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
      - generic [ref=e86]:
        - text: acme-retail
        - img [ref=e87]
      - button "Search… ⌘K" [ref=e90] [cursor=pointer]:
        - text: Search…
        - generic [ref=e91]: ⌘K
      - generic "Notifications" [ref=e92] [cursor=pointer]:
        - img [ref=e93]
        - generic [ref=e96]: "0"
      - generic "Help" [ref=e97]: "?"
      - button "A" [ref=e99] [cursor=pointer]
    - generic [ref=e100]: app
    - main [ref=e101]:
      - generic [ref=e102]:
        - heading "Welcome to AnalytIQ" [level=1] [ref=e104]
        - paragraph [ref=e105]: Ask a question in plain English. Get a backtested, governed, shareable predictive dashboard — no SQL, no Python.
        - paragraph [ref=e106]: No data sources connected yet.
        - button "Start your first analysis →" [ref=e107] [cursor=pointer]
        - generic [ref=e108]:
          - generic [ref=e109]:
            - generic [ref=e110]: Credentials stay secure
            - generic [ref=e111]: Encrypted at rest and never shared with the LLM layer.
          - generic [ref=e112]:
            - generic [ref=e113]: ✓
            - generic [ref=e114]: Walk-forward backtesting
            - generic [ref=e115]: Every model validated on held-out time windows before shipping.
          - generic [ref=e116]:
            - generic [ref=e117]: Shareable artifacts
            - generic [ref=e118]: Self-contained dashboards with full lineage metadata.
```

# Test source

```ts
  1  | // R21S2E2-US1 (UI) — topbar parity with App Home.dc.html #home topbar:
  2  | // workspace chip (AR mark + name + caret), 520×36 search pill w/ ⌘K keycap,
  3  | // red-badged bell, bordered help, 34px avatar.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  7  | 
  8  | test('topbar matches the frame 1:1', async ({ page }) => {
  9  |   await page.goto('/app');
  10 |   const bar = page.getByTestId('topbar');
  11 |   await expect(bar).toBeVisible();
> 12 |   expect(await css(bar, 'paddingLeft')).toBe('28px');
     |                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  13 | 
  14 |   // workspace switcher: h36 bordered; 20px purple AR mark; name 13/600; caret svg
  15 |   const ws = page.getByTestId('workspace-chip');
  16 |   await expect(ws).toContainText('Acme Retail');
  17 |   expect(await ws.evaluate(el => el.offsetHeight)).toBe(36);
  18 |   const mark = ws.getByTestId('workspace-mark');
  19 |   await expect(mark).toHaveText('AR');
  20 |   expect(await css(mark, 'backgroundColor')).toBe('rgb(124, 58, 237)');
  21 |   expect(await mark.evaluate(el => el.offsetWidth)).toBe(20);
  22 |   await expect(ws.locator('svg')).toBeVisible();
  23 | 
  24 |   // search pill: 520×36 r999 bg #f7f8fa, svg, exact placeholder, ⌘K keycap
  25 |   const pill = page.getByTestId('global-search');
  26 |   const box = await pill.boundingBox();
  27 |   expect(Math.round(box.width)).toBe(520);
  28 |   expect(Math.round(box.height)).toBe(36);
  29 |   expect(await css(pill, 'borderRadius')).toBe('999px');
  30 |   expect(await css(pill, 'backgroundColor')).toBe('rgb(247, 248, 250)');
  31 |   await expect(pill).toContainText('Search artifacts, metrics, sources…');
  32 |   await expect(pill.locator('svg')).toBeVisible();
  33 |   const keycap = pill.getByTestId('search-keycap');
  34 |   await expect(keycap).toHaveText('⌘K');
  35 |   expect(await css(keycap, 'backgroundColor')).toBe('rgb(255, 255, 255)');
  36 | 
  37 |   // bell: red badge w/ 2px white ring
  38 |   const badge = page.getByTestId('bell-count');
  39 |   expect(await css(badge, 'backgroundColor')).toBe('rgb(220, 38, 38)');
  40 |   expect(await css(badge, 'boxShadow')).toContain('rgb(255, 255, 255)');
  41 |   await expect(page.getByTestId('bell').locator('svg')).toBeVisible();
  42 | 
  43 |   // help: 34px bordered square linking to /app/help
  44 |   const help = page.getByTestId('help-btn');
  45 |   expect(await help.evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([34, 34]);
  46 |   expect(await help.getAttribute('href')).toBe('/app/help');
  47 | 
  48 |   // avatar: 34px round #0e7490, 2-letter initials
  49 |   const av = page.getByTestId('avatar-menu');
  50 |   expect(await av.evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([34, 34]);
  51 |   expect(await css(av, 'backgroundColor')).toBe('rgb(14, 116, 144)');
  52 |   await expect(av).toHaveText(/^[A-Z]{2}$/);
  53 | 
  54 |   // ⌘K overlay behavior preserved
  55 |   await pill.click();
  56 |   await expect(page.getByTestId('search-overlay')).toBeVisible();
  57 | });
  58 | 
```