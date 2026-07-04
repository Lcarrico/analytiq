# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s2_components.spec.js >> status badges follow the pill + dot spec
- Location: tests/ui/r15s2_components.spec.js:42:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="status-badge"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="status-badge"]').first()

```

```yaml
- complementary:
  - text: AnalytIQ
  - navigation:
    - text: Workspace
    - link "Home":
      - /url: /app
      - text: ⌂ Home
    - link "Create":
      - /url: /app/create
      - text: ✦ Create
    - link "Artifacts":
      - /url: /app/artifacts
      - text: ▦ Artifacts
    - text: Data
    - link "Data":
      - /url: /app/data/sources
      - text: ⬡ Data
    - link "Semantic Layer":
      - /url: /app/semantic
      - text: ◈ Semantic Layer
    - link "Gold Tables":
      - /url: /app/gold
      - text: ▤ Gold Tables
    - link "Models":
      - /url: /app/models
      - text: ⚗ Models
    - text: Operate
    - link "Alerts":
      - /url: /app/alerts
      - text: ◉ Alerts
    - link "Governance":
      - /url: /app/governance
      - text: ⛭ Governance
    - text: Organization
    - link "Team":
      - /url: /app/team
      - text: ◇ Team
    - link "Admin":
      - /url: /app/admin/platform
      - text: ⚙ Admin
    - link "Billing":
      - /url: /app/billing
      - text: ❖ Billing
    - link "Settings":
      - /url: /app/settings/profile
      - text: ○ Settings
  - button "« Collapse"
- banner:
  - text: acme-retail ▾
  - button "Search… ⌘K"
  - text: 🔔 0 ?
  - button "A"
- text: app / artifacts
- main:
  - heading "Workspace artifacts" [level=1]
  - paragraph: 3 saved analyses · shareable with your team
  - button "▦ Cards"
  - button "≣ Table"
  - button "⊙ ROI report"
  - button "⧉ Sandbox"
  - button "⚕ Health dashboard"
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
  - img
  - text: Badge Spec 34430 Predictive ⚕ 82 DQ pass MAPE 8.9% 👤 analyst@acme.com 🕐 Jul 3, 2026
  - button "Open"
  - button "☆"
  - button "Preview"
  - button "Insights"
  - button "Link"
  - button "Embed"
  - button "Activity"
  - button "Monitor"
  - button "Opportunities"
  - button "Replay"
  - button "Explain"
  - button "Provenance"
  - button "Share"
  - button "Schedule"
  - button "✕"
  - img
  - text: BBB Sort 33336 Predictive ⚕ 82 DQ pass MAPE 8.9% 👤 analyst@acme.com 🕐 Jul 3, 2026
  - button "Open"
  - button "☆"
  - button "Preview"
  - button "Insights"
  - button "Link"
  - button "Embed"
  - button "Activity"
  - button "Monitor"
  - button "Opportunities"
  - button "Replay"
  - button "Explain"
  - button "Provenance"
  - button "Share"
  - button "Schedule"
  - button "✕"
  - img
  - text: AAA Sort 33336 Predictive ⚕ 82 DQ pass MAPE 8.9% 👤 analyst@acme.com 🕐 Jul 3, 2026
  - button "Open"
  - button "☆"
  - button "Preview"
  - button "Insights"
  - button "Link"
  - button "Embed"
  - button "Activity"
  - button "Monitor"
  - button "Opportunities"
  - button "Replay"
  - button "Explain"
  - button "Provenance"
  - button "Share"
  - button "Schedule"
  - button "✕"
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
  20 |   await page.getByTestId('view-toggle-table').click();
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
> 47 |   await expect(badge).toBeVisible();
     |                       ^ Error: expect(locator).toBeVisible() failed
  48 |   await expect(badge.locator('[data-testid="badge-dot"]')).toBeVisible();
  49 | });
  50 | 
```