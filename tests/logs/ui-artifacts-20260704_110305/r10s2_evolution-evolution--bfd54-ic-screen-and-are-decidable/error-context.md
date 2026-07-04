# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r10s2_evolution.spec.js >> evolution proposals appear on the semantic screen and are decidable
- Location: tests/ui/r10s2_evolution.spec.js:6:5

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByTestId('app-sidebar').getByRole('link', { name: 'Semantic Layer', exact: true })

```

# Test source

```ts
  1  | // NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
  2  | // R10S2E5-US1 (UI) — the semantic screen surfaces evolution proposals for
  3  | // admin review; deciding one updates its status chip in place.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | test('evolution proposals appear on the semantic screen and are decidable', async ({ page, request }) => {
  7  |   // 3 ad-hoc specs for an undefined metric → new_metric proposal material
  8  |   const metric = `Basket Size ${Date.now() % 10000}`;
  9  |   for (let i = 0; i < 3; i++) {
  10 |     const sess = await (await request.post('/api/sessions', { data: { metric } })).json();
  11 |     await request.post(`/api/sessions/${sess.id}/spec`, { data: {
  12 |       intent: 'predictive', intent_confidence: 0.9, analytic_goal: 'g',
  13 |       target_metric: metric, feature_candidates: [],
  14 |       date_range: { start: '2023-01-01', end: '2023-12-31' },
  15 |       grain: 'Location · Day', output_type: 'forecast_dashboard',
  16 |       prediction_horizon: 14, explores_used: [],
  17 |       semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0' } });
  18 |   }
  19 | 
  20 |   await page.goto('/');
> 21 |   await page.getByTestId('app-sidebar').getByRole('link', { name: 'Semantic Layer', exact: true }).click();
     |                                                                                                    ^ Error: locator.click: Test ended.
  22 |   const panel = page.getByTestId('evolution-panel');
  23 |   await expect(panel).toBeVisible();
  24 |   await panel.getByTestId('evolve-scan-btn').click();
  25 | 
  26 |   const row = panel.locator('[data-testid^="sem-prop-"]').filter({ hasText: 'new_metric' }).first();
  27 |   await expect(row).toBeVisible();
  28 |   await row.getByTestId('sem-prop-approve').click();
  29 |   await expect(panel.locator('[data-testid="sem-prop-status"]', { hasText: 'approved' }).first())
  30 |     .toBeVisible();
  31 | });
  32 | 
```