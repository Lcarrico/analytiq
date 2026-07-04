# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s1_router.spec.js >> browser back returns to the previous route
- Location: tests/ui/r15s1_router.spec.js:9:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('input').first()

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
  - text: 📊
  - heading "Welcome to AnalytIQ" [level=1]
  - paragraph: Ask a question in plain English. Get a backtested, governed, shareable predictive dashboard — no SQL, no Python.
  - paragraph: No data sources connected yet.
  - button "Start your first analysis →"
  - text: 🔒 Credentials stay secure Encrypted at rest and never shared with the LLM layer. ✓ Walk-forward backtesting Every model validated on held-out time windows before shipping. 📤 Shareable artifacts Self-contained dashboards with full lineage metadata.
```

# Test source

```ts
  1  | // R15S1E1-US1 (UI) — real URLs: deep links, back button, 404, wizard compat.
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('deep link renders the artifacts screen directly', async ({ page }) => {
  5  |   await page.goto('/app/artifacts');
  6  |   await expect(page.getByTestId('roi-report-btn')).toBeVisible();   // S10 body
  7  | });
  8  | 
  9  | test('browser back returns to the previous route', async ({ page }) => {
  10 |   await page.goto('/app/create');
> 11 |   await expect(page.locator('input').first()).toBeVisible();        // S06 chat input
     |                                               ^ Error: expect(locator).toBeVisible() failed
  12 |   await page.goto('/app/artifacts');
  13 |   await expect(page.getByTestId('roi-report-btn')).toBeVisible();
  14 |   await page.goBack();
  15 |   await expect(page.locator('input').first()).toBeVisible();
  16 |   expect(new URL(page.url()).pathname).toBe('/app/create');
  17 | });
  18 | 
  19 | test('unknown route renders the 404 page', async ({ page }) => {
  20 |   await page.goto('/app/definitely-not-a-route');
  21 |   const nf = page.getByTestId('notfound-page');
  22 |   await expect(nf).toBeVisible();
  23 |   await expect(nf.getByText('/app/definitely-not-a-route')).toBeVisible();
  24 |   await nf.getByRole('link', { name: /Back to home/i }).click();
  25 |   expect(new URL(page.url()).pathname).toBe('/app');
  26 | });
  27 | 
  28 | test('root redirects into the app', async ({ page }) => {
  29 |   await page.goto('/');
  30 |   await expect.poll(() => new URL(page.url()).pathname).toBe('/app');
  31 | });
  32 | 
```