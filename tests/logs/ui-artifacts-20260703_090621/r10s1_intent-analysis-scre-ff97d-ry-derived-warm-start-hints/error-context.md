# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r10s1_intent.spec.js >> analysis screen shows history-derived warm-start hints
- Location: tests/ui/r10s1_intent.spec.js:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('warm-start-hints')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('warm-start-hints')

```

# Test source

```ts
  1  | // R10S1E3-US1 (UI) — returning users see warm-start hints from their
  2  | // investigation history on the Analysis screen.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('analysis screen shows history-derived warm-start hints', async ({ page, request }) => {
  6  |   // build history: two predictive questions through the real planner
  7  |   for (const days of [14, 30]) {
  8  |     await request.post('/api/sessions/plan',
  9  |       { data: { message: `Forecast net revenue for the next ${days} days by location` } });
  10 |   }
  11 | 
  12 |   await page.goto('/');
  13 |   await page.locator('nav').getByRole('button', { name: /Analysis/ }).click();
  14 |   const hints = page.getByTestId('warm-start-hints');
> 15 |   await expect(hints).toBeVisible();
     |                       ^ Error: expect(locator).toBeVisible() failed
  16 |   await expect(hints.getByText(/predictive/)).toBeVisible();
  17 | });
  18 | 
```