# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r21s2_drawer.spec.js >> drawer matches the frame: geometry, tabs, groups, tinted rows
- Location: tests/ui/r21s2_drawer.spec.js:19:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 420
Received: 380
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
        - generic [ref=e101]: "1"
      - link "?" [ref=e102] [cursor=pointer]:
        - /url: /app/help
      - button "DK" [ref=e104] [cursor=pointer]
    - main [ref=e105]:
      - generic [ref=e106]:
        - heading "Welcome back" [level=1] [ref=e107]
        - paragraph [ref=e108]: 1 artifact in your workspace.
        - generic [ref=e109]:
          - generic [ref=e110]:
            - generic [ref=e111]: "1"
            - generic [ref=e112]: Total artifacts
          - generic [ref=e113]:
            - generic [ref=e114]: "1"
            - generic [ref=e115]: Predictive models
          - generic [ref=e116]:
            - generic [ref=e117]: "0"
            - generic [ref=e118]: Shared
        - generic [ref=e119]:
          - button "+ New analysis" [ref=e120] [cursor=pointer]
          - button "View all artifacts" [ref=e121] [cursor=pointer]
  - generic [ref=e123]:
    - generic [ref=e124]:
      - generic [ref=e125]: Notifications
      - button "Mark all read" [ref=e126] [cursor=pointer]
    - generic [ref=e128]: "mentionadmin@acme.com mentioned you: Drawer parity ping @admin@acme.com"
```

# Test source

```ts
  1  | // R21S2E4-US1 (UI) — notifications drawer parity with App Home.dc.html
  2  | // #notifications: 420px panel, tabs All/Unread·n/Mentions, day groups,
  3  | // tinted 28px icon tiles, unread wash + accent left border + dot.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  7  | 
  8  | async function seedMention(request) {
  9  |   const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  10 |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  11 |   await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  12 |                     { timeout: 20_000 }).toBe('done');
  13 |   const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
  14 |     { data: { title: `Drawer ${Date.now()}` } })).json();
  15 |   await request.post(`/api/artifacts/${art.id}/comments`,
  16 |     { data: { body: 'Drawer parity ping @admin@acme.com', section_id: 'timeseries_ci' } });
  17 | }
  18 | 
  19 | test('drawer matches the frame: geometry, tabs, groups, tinted rows', async ({ page, request }) => {
  20 |   await seedMention(request);
  21 |   await page.goto('/app');
  22 |   await page.getByTestId('bell').click();
  23 | 
  24 |   const drawer = page.getByTestId('notifications-drawer');
  25 |   await expect(drawer).toBeVisible();
> 26 |   expect(Math.round((await drawer.boundingBox()).width)).toBe(420);
     |                                                          ^ Error: expect(received).toBe(expected) // Object.is equality
  27 |   expect(await css(drawer, 'boxShadow')).toContain('-16px');
  28 | 
  29 |   // header: title + mark-all + close
  30 |   await expect(drawer.getByText('Notifications', { exact: true })).toBeVisible();
  31 |   await expect(drawer.getByTestId('mark-all-read')).toBeVisible();
  32 | 
  33 |   // tabs: All / Unread·n / Mentions
  34 |   const tabs = drawer.getByTestId('notif-tabs');
  35 |   await expect(tabs.getByText('All', { exact: true })).toBeVisible();
  36 |   await expect(tabs.getByText(/Unread · \d+/)).toBeVisible();
  37 |   await expect(tabs.getByText('Mentions', { exact: true })).toBeVisible();
  38 | 
  39 |   // day group label: mono 9.5 uppercase
  40 |   const group = drawer.getByTestId('notif-group-label').first();
  41 |   await expect(group).toHaveText('TODAY');
  42 |   expect(await css(group, 'fontSize')).toBe('9.5px');
  43 |   expect(await css(group, 'fontFamily')).toContain('Mono');
  44 | 
  45 |   // unread mention row: 28px purple tile, wash, accent left border, dot
  46 |   const row = drawer.getByTestId('notif-row').filter({ hasText: 'Drawer parity ping' }).first();
  47 |   await expect(row).toBeVisible();
  48 |   expect(await css(row, 'backgroundColor')).toBe('rgb(248, 250, 255)');
  49 |   expect(await css(row, 'borderLeftWidth')).toBe('2px');
  50 |   expect(await css(row, 'borderLeftColor')).toBe('rgb(37, 99, 235)');
  51 |   const tile = row.getByTestId('notif-icon-tile');
  52 |   expect(await tile.evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([28, 28]);
  53 |   expect(await css(tile, 'backgroundColor')).toBe('rgb(243, 238, 254)'); // mention purple
  54 |   await expect(row.getByTestId('notif-unread-dot')).toBeVisible();
  55 | 
  56 |   // Mentions tab filters to mention rows only
  57 |   await tabs.getByText('Mentions', { exact: true }).click();
  58 |   await expect(drawer.getByTestId('notif-row').first()).toBeVisible();
  59 |   const kinds = await drawer.getByTestId('notif-row').evaluateAll(
  60 |     els => els.map(e => e.getAttribute('data-kind')));
  61 |   expect(kinds.every(k => k === 'mention')).toBe(true);
  62 | });
  63 | 
```