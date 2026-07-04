# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s2_components.spec.js >> artifact list offers table view with working column sort
- Location: tests/ui/r15s2_components.spec.js:15:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('view-toggle-table')

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
          - generic [ref=e15]: ⌂
          - text: Home
        - link "Create" [ref=e16] [cursor=pointer]:
          - /url: /app/create
          - generic [ref=e17]: ✦
          - text: Create
        - link "Artifacts" [ref=e18] [cursor=pointer]:
          - /url: /app/artifacts
          - generic [ref=e19]: ▦
          - text: Artifacts
      - generic [ref=e20]:
        - generic [ref=e21]: Data
        - link "Data" [ref=e22] [cursor=pointer]:
          - /url: /app/data/sources
          - generic [ref=e23]: ⬡
          - text: Data
        - link "Semantic Layer" [ref=e24] [cursor=pointer]:
          - /url: /app/semantic
          - generic [ref=e25]: ◈
          - text: Semantic Layer
        - link "Gold Tables" [ref=e26] [cursor=pointer]:
          - /url: /app/gold
          - generic [ref=e27]: ▤
          - text: Gold Tables
        - link "Models" [ref=e28] [cursor=pointer]:
          - /url: /app/models
          - generic [ref=e29]: ⚗
          - text: Models
      - generic [ref=e30]:
        - generic [ref=e31]: Operate
        - link "Alerts" [ref=e32] [cursor=pointer]:
          - /url: /app/alerts
          - generic [ref=e33]: ◉
          - text: Alerts
        - link "Governance" [ref=e34] [cursor=pointer]:
          - /url: /app/governance
          - generic [ref=e35]: ⛭
          - text: Governance
      - generic [ref=e36]:
        - generic [ref=e37]: Organization
        - link "Team" [ref=e38] [cursor=pointer]:
          - /url: /app/team
          - generic [ref=e39]: ◇
          - text: Team
        - link "Admin" [ref=e40] [cursor=pointer]:
          - /url: /app/admin/platform
          - generic [ref=e41]: ⚙
          - text: Admin
        - link "Billing" [ref=e42] [cursor=pointer]:
          - /url: /app/billing
          - generic [ref=e43]: ❖
          - text: Billing
        - link "Settings" [ref=e44] [cursor=pointer]:
          - /url: /app/settings/profile
          - generic [ref=e45]: ○
          - text: Settings
    - button "« Collapse" [ref=e46] [cursor=pointer]
  - generic [ref=e47]:
    - banner [ref=e48]:
      - generic [ref=e49]: acme-retail ▾
      - button "Search… ⌘K" [ref=e51] [cursor=pointer]:
        - text: Search…
        - generic [ref=e52]: ⌘K
      - generic "Notifications" [ref=e53]:
        - text: 🔔
        - generic [ref=e54]: "0"
      - generic "Help" [ref=e55]: "?"
      - button "A" [ref=e57] [cursor=pointer]
    - generic [ref=e58]: app / artifacts
    - main [ref=e59]:
      - generic [ref=e60]:
        - generic [ref=e61]:
          - generic [ref=e62]:
            - heading "Workspace artifacts" [level=1] [ref=e64]
            - paragraph [ref=e65]: 2 saved analyses · shareable with your team
          - generic [ref=e66]:
            - button "⊙ ROI report" [ref=e67] [cursor=pointer]
            - button "⧉ Sandbox" [ref=e68] [cursor=pointer]
            - button "⚕ Health dashboard" [ref=e69] [cursor=pointer]
            - button "+ New analysis" [ref=e70] [cursor=pointer]
        - textbox "Deep search (titles + metric names, FTS)…" [ref=e72]
        - generic [ref=e73]:
          - textbox "Search by title..." [ref=e74]
          - combobox [ref=e75] [cursor=pointer]:
            - option "All types" [selected]
            - option "Predictive"
            - option "Descriptive"
          - combobox [ref=e76] [cursor=pointer]:
            - option "All DQ statuses" [selected]
            - option "Pass"
            - option "Warn"
        - generic [ref=e77]:
          - generic [ref=e79]:
            - img [ref=e81]
            - generic [ref=e84]:
              - generic [ref=e85]:
                - generic [ref=e86] [cursor=pointer]: BBB Sort 905005
                - generic [ref=e87]: Predictive
                - 'generic "Dashboard health: readability · accessibility · redundancy · performance · usefulness (§17.5.5)" [ref=e88]': ⚕ 85
                - generic [ref=e89]: DQ pass
                - generic [ref=e90]: MAPE 8.9%
              - generic [ref=e91]:
                - generic [ref=e92]: 👤 analyst@acme.com
                - generic [ref=e93]: 🕐 Jul 3, 2026
            - generic [ref=e94]:
              - button "Open" [ref=e95] [cursor=pointer]
              - button "☆" [ref=e96] [cursor=pointer]
              - button "Preview" [ref=e97] [cursor=pointer]
              - button "Insights" [ref=e98] [cursor=pointer]
              - button "Link" [ref=e99] [cursor=pointer]
              - button "Embed" [ref=e100] [cursor=pointer]
              - button "Activity" [ref=e101] [cursor=pointer]
              - button "Monitor" [ref=e102] [cursor=pointer]
              - button "Opportunities" [ref=e103] [cursor=pointer]
              - button "Replay" [ref=e104] [cursor=pointer]
              - button "Explain" [ref=e105] [cursor=pointer]
              - button "Provenance" [ref=e106] [cursor=pointer]
              - button "Share" [ref=e107] [cursor=pointer]
              - button "Schedule" [ref=e109] [cursor=pointer]
              - button "✕" [ref=e110] [cursor=pointer]
          - generic [ref=e112]:
            - img [ref=e114]
            - generic [ref=e117]:
              - generic [ref=e118]:
                - generic [ref=e119] [cursor=pointer]: AAA Sort 905005
                - generic [ref=e120]: Predictive
                - 'generic "Dashboard health: readability · accessibility · redundancy · performance · usefulness (§17.5.5)" [ref=e121]': ⚕ 85
                - generic [ref=e122]: DQ pass
                - generic [ref=e123]: MAPE 8.9%
              - generic [ref=e124]:
                - generic [ref=e125]: 👤 analyst@acme.com
                - generic [ref=e126]: 🕐 Jul 3, 2026
            - generic [ref=e127]:
              - button "Open" [ref=e128] [cursor=pointer]
              - button "☆" [ref=e129] [cursor=pointer]
              - button "Preview" [ref=e130] [cursor=pointer]
              - button "Insights" [ref=e131] [cursor=pointer]
              - button "Link" [ref=e132] [cursor=pointer]
              - button "Embed" [ref=e133] [cursor=pointer]
              - button "Activity" [ref=e134] [cursor=pointer]
              - button "Monitor" [ref=e135] [cursor=pointer]
              - button "Opportunities" [ref=e136] [cursor=pointer]
              - button "Replay" [ref=e137] [cursor=pointer]
              - button "Explain" [ref=e138] [cursor=pointer]
              - button "Provenance" [ref=e139] [cursor=pointer]
              - button "Share" [ref=e140] [cursor=pointer]
              - button "Schedule" [ref=e142] [cursor=pointer]
              - button "✕" [ref=e143] [cursor=pointer]
```

# Test source

```ts
  1  | // R15S2E3-US1 (UI) — committed design components on a real list screen:
  2  | // sortable DataTable, card⇄table toggle, StatusBadge language.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | async function seedArtifacts(request, titles) {
  6  |   for (const title of titles) {
  7  |     const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  8  |     const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  9  |     await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  10 |                       { timeout: 20_000 }).toBe('done');
  11 |     await request.post(`/api/sessions/${sess.id}/save_artifact`, { data: { title } });
  12 |   }
  13 | }
  14 | 
  15 | test('artifact list offers table view with working column sort', async ({ page, request }) => {
  16 |   const stamp = Date.now() % 1e6;
  17 |   await seedArtifacts(request, [`BBB Sort ${stamp}`, `AAA Sort ${stamp}`]);
  18 | 
  19 |   await page.goto('/app/artifacts');
> 20 |   await page.getByTestId('view-toggle-table').click();
     |                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  21 |   const table = page.getByTestId('artifacts-table');
  22 |   await expect(table).toBeVisible();
  23 | 
  24 |   await table.getByRole('button', { name: /^Title/ }).click();      // sort asc
  25 |   const rowsAsc = await table.locator('[data-testid^="table-row-"]')
  26 |     .filter({ hasText: `Sort ${stamp}` }).allTextContents();
  27 |   const a = rowsAsc.findIndex(t => t.includes(`AAA Sort ${stamp}`));
  28 |   const b = rowsAsc.findIndex(t => t.includes(`BBB Sort ${stamp}`));
  29 |   expect(a).toBeLessThan(b);
  30 | 
  31 |   await table.getByRole('button', { name: /^Title/ }).click();      // sort desc
  32 |   const rowsDesc = await table.locator('[data-testid^="table-row-"]')
  33 |     .filter({ hasText: `Sort ${stamp}` }).allTextContents();
  34 |   const a2 = rowsDesc.findIndex(t => t.includes(`AAA Sort ${stamp}`));
  35 |   const b2 = rowsDesc.findIndex(t => t.includes(`BBB Sort ${stamp}`));
  36 |   expect(b2).toBeLessThan(a2);
  37 | 
  38 |   await page.getByTestId('view-toggle-cards').click();              // back to cards
  39 |   await expect(table).toHaveCount(0);
  40 | });
  41 | 
  42 | test('status badges follow the pill + dot spec', async ({ page, request }) => {
  43 |   const stamp = Date.now() % 1e6;
  44 |   await seedArtifacts(request, [`Badge Spec ${stamp}`]);
  45 |   await page.goto('/app/artifacts');
  46 |   const badge = page.locator('[data-testid="status-badge"]').first();
  47 |   await expect(badge).toBeVisible();
  48 |   await expect(badge.locator('[data-testid="badge-dot"]')).toBeVisible();
  49 | });
  50 | 
```