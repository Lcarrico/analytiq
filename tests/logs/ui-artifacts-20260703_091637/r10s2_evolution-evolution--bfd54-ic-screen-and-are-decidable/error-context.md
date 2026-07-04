# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r10s2_evolution.spec.js >> evolution proposals appear on the semantic screen and are decidable
- Location: tests/ui/r10s2_evolution.spec.js:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('evolution-panel').locator('[data-testid^="sem-prop-"]').filter({ hasText: 'new_metric' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('evolution-panel').locator('[data-testid^="sem-prop-"]').filter({ hasText: 'new_metric' }).first()

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
  - heading "Semantic review queue" [level=1]
  - text: 0 pending
  - paragraph: Low-confidence definitions need your approval before ML use.
  - button "Start analysis"
  - text: No governance run found. Complete the connection and governance steps first. Semantic evolution proposals
  - button "Scan now"
  - text: The layer proposes improvements to itself — admin review only, the canonical schema never auto-mutates. (§17.3.4) No proposals
```

# Test source

```ts
  1  | // R10S2E5-US1 (UI) — the semantic screen surfaces evolution proposals for
  2  | // admin review; deciding one updates its status chip in place.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('evolution proposals appear on the semantic screen and are decidable', async ({ page, request }) => {
  6  |   // 3 ad-hoc specs for an undefined metric → new_metric proposal material
  7  |   const metric = `Basket Size ${Date.now() % 10000}`;
  8  |   for (let i = 0; i < 3; i++) {
  9  |     const sess = await (await request.post('/api/sessions', { data: { metric } })).json();
  10 |     await request.post(`/api/sessions/${sess.id}/spec`, { data: {
  11 |       intent: 'predictive', intent_confidence: 0.9, analytic_goal: 'g',
  12 |       target_metric: metric, feature_candidates: [],
  13 |       date_range: { start: '2023-01-01', end: '2023-12-31' },
  14 |       grain: 'Location · Day', output_type: 'forecast_dashboard',
  15 |       prediction_horizon: 14, explores_used: [],
  16 |       semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0' } });
  17 |   }
  18 | 
  19 |   await page.goto('/');
  20 |   await page.locator('nav').getByRole('button', { name: /Semantic layer/ }).click();
  21 |   const panel = page.getByTestId('evolution-panel');
  22 |   await expect(panel).toBeVisible();
  23 |   await panel.getByTestId('evolve-scan-btn').click();
  24 | 
  25 |   const row = panel.locator('[data-testid^="sem-prop-"]').filter({ hasText: 'new_metric' }).first();
> 26 |   await expect(row).toBeVisible();
     |                     ^ Error: expect(locator).toBeVisible() failed
  27 |   await row.getByTestId('sem-prop-approve').click();
  28 |   await expect(panel.locator('[data-testid="sem-prop-status"]', { hasText: 'approved' }).first())
  29 |     .toBeVisible();
  30 | });
  31 | 
```