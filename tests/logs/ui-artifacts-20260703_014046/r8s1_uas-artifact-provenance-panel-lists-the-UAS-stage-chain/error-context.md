# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r8s1_uas.spec.js >> artifact provenance panel lists the UAS stage chain
- Location: tests/ui/r8s1_uas.spec.js:17:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="artifact-row-1"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="artifact-row-1"]')

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
  - text: Provenance UI 1783060836238 Predictive DQ pass MAPE 8.9% 👤 analyst@acme.com 🕐 Jul 3, 2026
  - button "Open"
  - button "☆"
  - button "Preview"
  - button "Insights"
  - button "Link"
  - button "Embed"
  - button "Activity"
  - button "Provenance"
  - button "Share"
  - button "Schedule"
  - button "✕"
```

# Test source

```ts
  1  | // R8S1E1-US1 (UI) — artifact provenance panel backed by the Unified Artifact
  2  | // Store. Drives the same session→pipeline→save flow the app uses, then
  3  | // asserts the user-visible provenance chain on the All Artifacts screen.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | async function makeArtifact(request, title) {
  7  |   const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  8  |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  9  |   await expect.poll(async () => {
  10 |     const r = await (await request.get(`/api/pipeline/${run.runId}`)).json();
  11 |     return r.status;
  12 |   }, { timeout: 20_000 }).toBe('done');
  13 |   const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`, { data: { title } })).json();
  14 |   return art;
  15 | }
  16 | 
  17 | test('artifact provenance panel lists the UAS stage chain', async ({ page, request }) => {
  18 |   const title = `Provenance UI ${Date.now()}`;
  19 |   const art = await makeArtifact(request, title);
  20 | 
  21 |   await page.goto('/');
  22 |   await page.locator('nav').getByRole('button', { name: /All artifacts/ }).click();
  23 |   const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
> 24 |   await expect(row).toBeVisible();
     |                     ^ Error: expect(locator).toBeVisible() failed
  25 | 
  26 |   await row.getByTestId('provenance-btn').click();
  27 |   const panel = page.getByTestId('uas-provenance');
  28 |   await expect(panel).toBeVisible();
  29 |   for (const t of ['session_spec', 'dashboard_plan', 'gold_predictions_ref',
  30 |                    'gold_forecast_ref', 'artifact_html_ref']) {
  31 |     await expect(panel.getByText(t, { exact: false })).toBeVisible();
  32 |   }
  33 |   // versions are shown alongside types (common-schema surface)
  34 |   await expect(panel.getByText(/v\d+/).first()).toBeVisible();
  35 | });
  36 | 
```