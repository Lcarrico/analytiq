# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r16s1_workbench.spec.js >> confident prompt produces an inline plan card with ACCESS row; approve starts the build
- Location: tests/ui/r16s1_workbench.spec.js:16:5

# Error details

```
Error: locator.fill: Test ended.
Call log:
  - waiting for getByTestId('workbench-input')

```

# Test source

```ts
  1  | // R16S1E1-US1 (UI) — Create Workbench: start state, chat planning turn with
  2  | // clarification chips, inline plan card with ACCESS row, Approve & Build.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('start state shows typed example prompts and redirects from /app/create', async ({ page }) => {
  6  |   await page.goto('/app/create');
  7  |   await expect.poll(() => new URL(page.url()).pathname).toBe('/app/create/new');
  8  |   const start = page.getByTestId('workbench-start');
  9  |   await expect(start).toBeVisible();
  10 |   for (const kind of ['FORECAST', 'PREDICTIVE', 'VARIANCE', 'ANOMALY']) {
  11 |     await expect(start.getByText(kind, { exact: true })).toBeVisible();
  12 |   }
  13 |   await expect(page.getByTestId('workbench-input')).toBeVisible();
  14 | });
  15 | 
  16 | test('confident prompt produces an inline plan card with ACCESS row; approve starts the build', async ({ page }) => {
  17 |   await page.goto('/app/create/new');
> 18 |   await page.getByTestId('workbench-input').fill(
     |                                             ^ Error: locator.fill: Test ended.
  19 |     'Forecast net revenue for the next 14 days by location');
  20 |   await page.getByTestId('workbench-send').click();
  21 | 
  22 |   await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/app\/create\/\d+$/);
  23 |   const card = page.getByTestId('plan-card');
  24 |   await expect(card).toBeVisible();
  25 |   await expect(card.getByText('Goal')).toBeVisible();
  26 |   await expect(card.getByText('Metric')).toBeVisible();
  27 |   await expect(card.getByText('Access')).toBeVisible();
  28 |   await expect(card.getByText(/No PII restrictions|excluded \(masked\)/)).toBeVisible();
  29 | 
  30 |   await card.getByTestId('approve-build').click();
  31 |   await expect(page.getByTestId('build-state')).toBeVisible();
  32 |   await expect(page.getByTestId('build-state')).toContainText(/Building|running/i, { timeout: 15_000 });
  33 | });
  34 | 
  35 | test('ambiguous prompt yields clarification chips that resolve to a plan', async ({ page }) => {
  36 |   await page.goto('/app/create/new');
  37 |   await page.getByTestId('workbench-input').fill('How is net revenue trending lately');
  38 |   await page.getByTestId('workbench-send').click();
  39 | 
  40 |   const chips = page.getByTestId('clarify-chips');
  41 |   await expect(chips).toBeVisible();
  42 |   await expect(page.getByTestId('confidence-chip')).toContainText(/0\.\d+/);
  43 |   await chips.locator('button').first().click();          // pick an option
  44 |   await expect(page.getByTestId('plan-card')).toBeVisible();
  45 | });
  46 | 
  47 | test('legacy quick-plan screen remains reachable', async ({ page }) => {
  48 |   await page.goto('/app/create/quick');
  49 |   await expect(page.locator('input').first()).toBeVisible();   // S06 body
  50 | });
  51 | 
```