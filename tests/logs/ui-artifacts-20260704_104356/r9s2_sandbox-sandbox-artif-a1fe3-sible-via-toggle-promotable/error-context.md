# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r9s2_sandbox.spec.js >> sandbox artifact hidden by default, visible via toggle, promotable
- Location: tests/ui/r9s2_sandbox.spec.js:6:5

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for locator('[data-testid="artifact-row-4"]').getByTestId('promote-btn')

```

# Test source

```ts
  1  | // NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
  2  | // R9S2E6-US1 (UI) — sandbox artifacts are hidden from the production list,
  3  | // visible under the Sandbox toggle, and promotable through the full gate set.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | test('sandbox artifact hidden by default, visible via toggle, promotable', async ({ page, request }) => {
  7  |   const title = `Sandbox UI ${Date.now()}`;
  8  |   const sess = await (await request.post('/api/sessions',
  9  |     { data: { metric: 'Net Revenue', sandbox: true } })).json();
  10 |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  11 |   await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  12 |                     { timeout: 20_000 }).toBe('done');
  13 |   const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
  14 |     { data: { title } })).json();
  15 | 
  16 |   await page.goto('/');
  17 |   await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  18 |   const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  19 |   await expect(row).toHaveCount(0);                    // hidden from production
  20 | 
  21 |   await page.getByTestId('sandbox-toggle').click();
  22 |   await expect(row).toBeVisible();                     // visible in sandbox view
  23 |   await expect(row.getByTestId('sandbox-badge')).toBeVisible();
  24 | 
> 25 |   await row.getByTestId('promote-btn').click();        // full gate re-run
     |                                        ^ Error: locator.click: Test ended.
  26 |   await expect(page.getByText(/Promoted to production/)).toBeVisible();
  27 |   await page.getByTestId('sandbox-toggle').click();    // back to production view
  28 |   await expect(row).toBeVisible();                     // now a production artifact
  29 | });
  30 | 
```