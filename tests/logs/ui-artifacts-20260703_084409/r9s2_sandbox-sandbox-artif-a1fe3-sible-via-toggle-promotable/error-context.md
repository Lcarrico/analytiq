# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r9s2_sandbox.spec.js >> sandbox artifact hidden by default, visible via toggle, promotable
- Location: tests/ui/r9s2_sandbox.spec.js:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="artifact-row-1"]').getByTestId('sandbox-badge')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="artifact-row-1"]').getByTestId('sandbox-badge')

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
  - paragraph: 0 saved analyses · shareable with your team
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
  - text: 📭 No artifacts yet.
  - button "Start your first analysis →"
```

# Test source

```ts
  1  | // R9S2E6-US1 (UI) — sandbox artifacts are hidden from the production list,
  2  | // visible under the Sandbox toggle, and promotable through the full gate set.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('sandbox artifact hidden by default, visible via toggle, promotable', async ({ page, request }) => {
  6  |   const title = `Sandbox UI ${Date.now()}`;
  7  |   const sess = await (await request.post('/api/sessions',
  8  |     { data: { metric: 'Net Revenue', sandbox: true } })).json();
  9  |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  10 |   await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  11 |                     { timeout: 20_000 }).toBe('done');
  12 |   const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
  13 |     { data: { title } })).json();
  14 | 
  15 |   await page.goto('/');
  16 |   await page.locator('nav').getByRole('button', { name: /All artifacts/ }).click();
  17 |   const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  18 |   await expect(row).toHaveCount(0);                    // hidden from production
  19 | 
  20 |   await page.getByTestId('sandbox-toggle').click();
  21 |   await expect(row).toBeVisible();                     // visible in sandbox view
> 22 |   await expect(row.getByTestId('sandbox-badge')).toBeVisible();
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  23 | 
  24 |   await row.getByTestId('promote-btn').click();        // full gate re-run
  25 |   await expect(page.getByText(/Promoted to production/)).toBeVisible();
  26 |   await page.getByTestId('sandbox-toggle').click();    // back to production view
  27 |   await expect(row).toBeVisible();                     // now a production artifact
  28 | });
  29 | 
```