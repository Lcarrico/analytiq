# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s2_components.spec.js >> artifact list offers table view with working column sort
- Location: tests/ui/r15s2_components.spec.js:15:5

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 0
Received:   1
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
      - generic "Notifications" [ref=e53] [cursor=pointer]:
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
            - generic [ref=e67]:
              - button "▦ Cards" [ref=e68] [cursor=pointer]
              - button "≣ Table" [ref=e69] [cursor=pointer]
            - button "⊙ ROI report" [ref=e70] [cursor=pointer]
            - button "⧉ Sandbox" [ref=e71] [cursor=pointer]
            - button "⚕ Health dashboard" [ref=e72] [cursor=pointer]
            - button "+ New analysis" [ref=e73] [cursor=pointer]
        - textbox "Deep search (titles + metric names, FTS)…" [ref=e75]
        - generic [ref=e76]:
          - textbox "Search by title..." [ref=e77]: Sort 761613
          - combobox [ref=e78] [cursor=pointer]:
            - option "All types" [selected]
            - option "Predictive"
            - option "Descriptive"
          - combobox [ref=e79] [cursor=pointer]:
            - option "All DQ statuses" [selected]
            - option "Pass"
            - option "Warn"
        - generic [ref=e80]:
          - generic [ref=e81]:
            - button "Title ↑" [active] [ref=e82] [cursor=pointer]
            - button "Type" [disabled] [ref=e83]
            - button "DQ" [disabled] [ref=e84]
            - button "MAPE" [ref=e85] [cursor=pointer]
            - button "Owner" [disabled] [ref=e86]
            - button "Created" [disabled] [ref=e87]
          - generic [ref=e88]:
            - generic [ref=e89]: AAA Sort 761613
            - generic [ref=e91]: Predictive
            - generic [ref=e94]: pass
            - generic [ref=e96]: "8.9"
            - generic [ref=e97]: analyst@acme.com
            - generic [ref=e98]: 2026-07-04 15:42:42
          - generic [ref=e99]:
            - generic [ref=e100]: BBB Sort 761613
            - generic [ref=e102]: Predictive
            - generic [ref=e105]: pass
            - generic [ref=e107]: "8.9"
            - generic [ref=e108]: analyst@acme.com
            - generic [ref=e109]: 2026-07-04 15:42:41
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
  20 |   // deterministic regardless of suite history: narrow the list to the stamp
  21 |   await page.getByPlaceholder('Search by title...').fill(`Sort ${stamp}`);
  22 |   await expect(page.getByText(`AAA Sort ${stamp}`)).toBeVisible();   // debounce settled
  23 |   await page.getByTestId('view-toggle-table').click();
  24 |   const table = page.getByTestId('artifacts-table');
  25 |   await expect(table).toBeVisible();
  26 | 
  27 |   await table.getByRole('button', { name: /^Title/ }).click();      // sort asc
  28 |   const rowsAsc = await table.locator('[data-testid^="table-row-"]')
  29 |     .filter({ hasText: `Sort ${stamp}` }).allTextContents();
  30 |   const a = rowsAsc.findIndex(t => t.includes(`AAA Sort ${stamp}`));
  31 |   const b = rowsAsc.findIndex(t => t.includes(`BBB Sort ${stamp}`));
  32 |   expect(a).toBeLessThan(b);
  33 | 
  34 |   await table.getByRole('button', { name: /^Title/ }).click();      // sort desc
  35 |   const rowsDesc = await table.locator('[data-testid^="table-row-"]')
  36 |     .filter({ hasText: `Sort ${stamp}` }).allTextContents();
  37 |   const a2 = rowsDesc.findIndex(t => t.includes(`AAA Sort ${stamp}`));
  38 |   const b2 = rowsDesc.findIndex(t => t.includes(`BBB Sort ${stamp}`));
> 39 |   expect(b2).toBeLessThan(a2);
     |              ^ Error: expect(received).toBeLessThan(expected)
  40 | 
  41 |   await page.getByTestId('view-toggle-cards').click();              // back to cards
  42 |   await expect(table).toHaveCount(0);
  43 | });
  44 | 
  45 | test('status badges follow the pill + dot spec', async ({ page, request }) => {
  46 |   const stamp = Date.now() % 1e6;
  47 |   await seedArtifacts(request, [`Badge Spec ${stamp}`]);
  48 |   await page.goto('/app/artifacts');
  49 |   const badge = page.locator('[data-testid="status-badge"]').first();
  50 |   await expect(badge).toBeVisible();
  51 |   await expect(badge.locator('[data-testid="badge-dot"]')).toBeVisible();
  52 | });
  53 | 
```