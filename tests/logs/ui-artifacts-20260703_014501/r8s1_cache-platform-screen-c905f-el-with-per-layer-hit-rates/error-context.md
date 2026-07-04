# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r8s1_cache.spec.js >> platform screen shows cache hierarchy panel with per-layer hit rates
- Location: tests/ui/r8s1_cache.spec.js:4:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('cache-panel')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('cache-panel')

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
  - heading "Platform" [level=1]
  - paragraph: Managed-tool integrations with automatic local fallbacks — zero external keys required.
  - text: Service modes auth local email local logging local queue local search local secrets local storage local Latency 5 requests · P50 1.06ms · P95 2.48ms Jobs No background jobs yet. Recent requests GET /api/workspace/status 200 1.32ms GET /api/artifacts 200 0.68ms GET /api/gold/default/gold_predictions 200 0.62ms GET /api/gold/default/gold_predictions 200 1.06ms GET /api/health 200 2.48ms Email outbox Outbox empty. Alerts No alerts. Workspace branding
  - textbox "#4f7cff"
  - textbox "Logo text"
  - textbox "Font family"
  - button "Save"
  - button "↻ Refresh"
```

# Test source

```ts
  1  | // R8S1E2-US1 (UI) — Platform screen cache panel: four layers with hit rates.
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('platform screen shows cache hierarchy panel with per-layer hit rates', async ({ page, request }) => {
  5  |   // generate at least one query-layer miss + hit
  6  |   await request.get('/api/gold/default/gold_predictions?per_page=3');
  7  |   await request.get('/api/gold/default/gold_predictions?per_page=3');
  8  | 
  9  |   await page.goto('/');
  10 |   await page.locator('nav').getByRole('button', { name: /^.*Platform$/ }).click();
  11 |   const panel = page.getByTestId('cache-panel');
> 12 |   await expect(panel).toBeVisible();
     |                       ^ Error: expect(locator).toBeVisible() failed
  13 |   for (const layer of ['semantic', 'query', 'spec', 'artifact']) {
  14 |     await expect(panel.getByText(layer, { exact: false }).first()).toBeVisible();
  15 |   }
  16 |   await expect(panel.getByText(/%/).first()).toBeVisible();   // a hit-rate figure
  17 | });
  18 | 
```