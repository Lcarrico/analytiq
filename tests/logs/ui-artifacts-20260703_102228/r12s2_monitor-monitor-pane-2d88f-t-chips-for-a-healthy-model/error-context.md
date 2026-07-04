# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r12s2_monitor.spec.js >> monitor panel shows stable drift chips for a healthy model
- Location: tests/ui/r12s2_monitor.spec.js:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('monitor-panel')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('monitor-panel')

```

```yaml
- text: A AnalytIQ v1.0.0-mvp
- navigation:
  - button "⌂ Workspace"
  - text: Stage 0 · Governance
  - button "⬡ Data sources"
  - button "◎ Governance run"
  - button "✦ Table health"
  - button "⛭ Governance ops"
  - text: Stage 1 · Semantic
  - button "◈ Semantic layer"
  - text: Stage 2 · Analysis
  - button "⬥ Analysis"
  - button "◇ Spec review"
  - text: Stage 3–5 · Pipeline
  - button "▶ Pipeline"
  - button "⚗ Models"
  - text: Stage 6 · Artifact
  - button "✦ Dashboard ★"
  - text: Stage 7 · Workspace
  - button "⊞ All artifacts"
  - text: Stage Platform
  - button "◉ Account"
  - button "⚙ Platform"
- text: acme-corp / analytics
- main:
  - heading "Workspace artifacts" [level=1]
  - paragraph: 1 saved analysis · shareable with your team
  - button "⧉ Sandbox"
  - button "⚕ Health dashboard"
  - button "+ New analysis"
  - text: Monitoring needs a completed run.
  - button "×"
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
  - text: Mon UI 1783092138141 Predictive ⚕ 88 DQ pass MAPE 8.9% 👤 analyst@acme.com 🕐 Jul 3, 2026
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
  1  | // R12S2E4-US1 (UI) — model monitoring surfaces importance/input drift on
  2  | // the artifact row.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('monitor panel shows stable drift chips for a healthy model', async ({ page, request }) => {
  6  |   const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  7  |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  8  |   await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  9  |                     { timeout: 20_000 }).toBe('done');
  10 |   const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
  11 |     { data: { title: `Mon UI ${Date.now()}` } })).json();
  12 | 
  13 |   await page.goto('/');
  14 |   await page.locator('nav').getByRole('button', { name: /All artifacts/ }).click();
  15 |   const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  16 |   await expect(row).toBeVisible();
  17 |   await row.getByTestId('monitor-btn').click();
  18 | 
  19 |   const panel = page.getByTestId('monitor-panel');
> 20 |   await expect(panel).toBeVisible();
     |                       ^ Error: expect(locator).toBeVisible() failed
  21 |   await expect(panel.getByTestId('mon-importance')).toContainText('stable');
  22 |   await expect(panel.getByTestId('mon-input')).toContainText('stable');
  23 | });
  24 | 
```