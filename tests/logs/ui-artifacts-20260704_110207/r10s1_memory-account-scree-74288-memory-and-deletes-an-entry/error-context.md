# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r10s1_memory.spec.js >> account screen lists agent memory and deletes an entry
- Location: tests/ui/r10s1_memory.spec.js:6:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('app-sidebar').getByRole('link', { name: 'Settings', exact: true })

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
  2  | // R10S1E1-US1 (UI) — the Account screen shows agent memory and lets the
  3  | // user forget entries.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | test('account screen lists agent memory and deletes an entry', async ({ page, request }) => {
  7  |   const key = `pref_${Date.now()}`;
  8  |   const created = await (await request.post('/api/memory', {
  9  |     data: { agent: 'viz', category: 'chart_type_default', key, value: 'line' } })).json();
  10 | 
  11 |   await page.goto('/');
> 12 |   await page.getByTestId('app-sidebar').getByRole('link', { name: 'Settings', exact: true }).click();
     |                                                                                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  13 |   const panel = page.getByTestId('memory-panel');
  14 |   await expect(panel).toBeVisible();
  15 |   const row = panel.getByTestId(`memory-row-${created.id}`);
  16 |   await expect(row).toBeVisible();
  17 |   await expect(row.getByText(`${key} → line`)).toBeVisible();
  18 | 
  19 |   await row.getByTestId('memory-delete').click();
  20 |   await expect(row).toHaveCount(0);              // forgotten
  21 | });
  22 | 
```