# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r9s1_events.spec.js >> platform events feed lists processed trigger events
- Location: tests/ui/r9s1_events.spec.js:5:5

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true })

```

# Test source

```ts
  1  | // NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
  2  | // R9S1E3-US1 (UI) — platform events feed shows emitted events as processed.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('platform events feed lists processed trigger events', async ({ page, request }) => {
  6  |   await request.post('/api/platform/events', {
  7  |     data: { event_type: 'metric_threshold_breached',
  8  |             payload: { metric: 'net_revenue', value: 120, threshold: 100 } } });
  9  | 
  10 |   await page.goto('/');
> 11 |   await page.getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true }).click();
     |                                                                                           ^ Error: locator.click: Test ended.
  12 |   const panel = page.getByTestId('events-panel');
  13 |   await expect(panel).toBeVisible();
  14 |   await expect(panel.getByText('metric_threshold_breached').first()).toBeVisible();
  15 |   await expect(panel.getByText('processed').first()).toBeVisible();
  16 | });
  17 | 
```