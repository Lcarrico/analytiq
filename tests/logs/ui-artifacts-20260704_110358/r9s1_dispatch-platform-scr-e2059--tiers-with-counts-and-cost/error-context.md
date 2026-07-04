# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r9s1_dispatch.spec.js >> platform screen shows dispatch tiers with counts and cost
- Location: tests/ui/r9s1_dispatch.spec.js:5:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]: AnalytIQ
    - link "Pricing" [ref=e6] [cursor=pointer]:
      - /url: /pricing
    - generic [ref=e7]:
      - link "Login" [ref=e8] [cursor=pointer]:
        - /url: /app
      - link "Start Free" [ref=e9] [cursor=pointer]:
        - /url: /app
  - generic [ref=e10]:
    - generic [ref=e11]:
      - heading "A business question in. A governed dashboard out." [level=1] [ref=e12]:
        - text: A business question in.
        - text: A governed dashboard out.
      - paragraph [ref=e13]: AnalytIQ plans, validates, models, and assembles — every stage gated, every number traceable, zero raw rows to any LLM.
      - link "Start Free" [ref=e14] [cursor=pointer]:
        - /url: /app
      - generic [ref=e15]:
        - generic [ref=e16]: 4 MIN QUESTION→ARTIFACT
        - generic [ref=e17]: 100% QUERIES VALIDATED
        - generic [ref=e18]: 0 RAW ROWS TO LLM
    - generic [ref=e19]:
      - generic [ref=e20]: » forecast net revenue, next 14 days
      - generic [ref=e21]: ✓ plan validated · ✓ gold gated · ✓ model promoted
      - generic [ref=e22]: ▂▄▆▅▇▆█ dashboard assembled
  - generic [ref=e23]:
    - generic [ref=e24]:
      - generic [ref=e25]: Governed metrics
      - generic [ref=e26]: One metric, one definition — everywhere.
    - generic [ref=e27]:
      - generic [ref=e28]: Predictive models
      - generic [ref=e29]: Walk-forward validated, promotion-gated.
    - generic [ref=e30]:
      - generic [ref=e31]: Shareable artifacts
      - generic [ref=e32]: Self-contained dashboards, signed links.
    - generic [ref=e33]:
      - generic [ref=e34]: No SQL required
      - generic [ref=e35]: Ask in plain language; gates do the rest.
  - contentinfo [ref=e36]: SOC 2 TYPE II · GDPR · ISO 27001 — Powered by AnalytIQ
```

# Test source

```ts
  1  | // NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
  2  | // R9S1E1-US1 (UI) — Platform screen shows cost-ladder dispatch telemetry.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('platform screen shows dispatch tiers with counts and cost', async ({ page, request }) => {
  6  |   const msg = { message: `Forecast revenue next 14 days ${Date.now()}` };
  7  |   await request.post('/api/sessions/plan', { data: msg });
  8  |   await request.post('/api/sessions/plan', { data: msg });   // repeat → cache tier
  9  | 
  10 |   await page.goto('/');
> 11 |   await page.getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true }).click();
     |                                                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
  12 |   const panel = page.getByTestId('dispatch-panel');
  13 |   await expect(panel).toBeVisible();
  14 |   for (const tier of ['cache', 'template', 'small_model', 'frontier_model']) {
  15 |     await expect(panel.getByText(tier, { exact: false }).first()).toBeVisible();
  16 |   }
  17 |   await expect(panel.getByText(/est. cost/i)).toBeVisible();
  18 | });
  19 | 
```