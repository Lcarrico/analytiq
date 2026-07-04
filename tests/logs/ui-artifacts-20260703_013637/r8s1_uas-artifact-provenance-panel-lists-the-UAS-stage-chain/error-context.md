# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r8s1_uas.spec.js >> artifact provenance panel lists the UAS stage chain
- Location: tests/ui/r8s1_uas.spec.js:17:5

# Error details

```
Error: locator.click: Error: strict mode violation: getByText('All artifacts') resolved to 2 elements:
    1) <button>…</button> aka getByRole('button', { name: '⊞ All artifacts' })
    2) <button>View all artifacts</button> aka getByRole('button', { name: 'View all artifacts' })

Call log:
  - waiting for getByText('All artifacts')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: A
        - generic [ref=e8]: AnalytIQ
      - generic [ref=e9]: v1.0.0-mvp
    - navigation [ref=e10]:
      - button "⌂ Workspace" [ref=e12] [cursor=pointer]:
        - generic [ref=e13]: ⌂
        - text: Workspace
      - generic [ref=e14]:
        - generic [ref=e15]: Stage 0 · Governance
        - button "⬡ Data sources" [ref=e16] [cursor=pointer]:
          - generic [ref=e17]: ⬡
          - text: Data sources
      - button "◎ Governance run" [ref=e19] [cursor=pointer]:
        - generic [ref=e20]: ◎
        - text: Governance run
      - button "✦ Table health" [ref=e22] [cursor=pointer]:
        - generic [ref=e23]: ✦
        - text: Table health
      - button "⛭ Governance ops" [ref=e25] [cursor=pointer]:
        - generic [ref=e26]: ⛭
        - text: Governance ops
      - generic [ref=e27]:
        - generic [ref=e28]: Stage 1 · Semantic
        - button "◈ Semantic layer" [ref=e29] [cursor=pointer]:
          - generic [ref=e30]: ◈
          - text: Semantic layer
      - generic [ref=e31]:
        - generic [ref=e32]: Stage 2 · Analysis
        - button "⬥ Analysis" [ref=e33] [cursor=pointer]:
          - generic [ref=e34]: ⬥
          - text: Analysis
      - button "◇ Spec review" [ref=e36] [cursor=pointer]:
        - generic [ref=e37]: ◇
        - text: Spec review
      - generic [ref=e38]:
        - generic [ref=e39]: Stage 3–5 · Pipeline
        - button "▶ Pipeline" [ref=e40] [cursor=pointer]:
          - generic [ref=e41]: ▶
          - text: Pipeline
      - button "⚗ Models" [ref=e43] [cursor=pointer]:
        - generic [ref=e44]: ⚗
        - text: Models
      - generic [ref=e45]:
        - generic [ref=e46]: Stage 6 · Artifact
        - button "✦ Dashboard ★" [ref=e47] [cursor=pointer]:
          - generic [ref=e48]: ✦
          - text: Dashboard ★
      - generic [ref=e49]:
        - generic [ref=e50]: Stage 7 · Workspace
        - button "⊞ All artifacts" [ref=e51] [cursor=pointer]:
          - generic [ref=e52]: ⊞
          - text: All artifacts
      - generic [ref=e53]:
        - generic [ref=e54]: Stage Platform
        - button "◉ Account" [ref=e55] [cursor=pointer]:
          - generic [ref=e56]: ◉
          - text: Account
      - button "⚙ Platform" [ref=e58] [cursor=pointer]:
        - generic [ref=e59]: ⚙
        - text: Platform
    - generic [ref=e61]: acme-corp / analytics
  - main [ref=e62]:
    - generic [ref=e63]:
      - heading "Welcome back" [level=1] [ref=e64]
      - paragraph [ref=e65]: 1 artifact in your workspace.
      - generic [ref=e66]:
        - generic [ref=e67]:
          - generic [ref=e68]: "1"
          - generic [ref=e69]: Total artifacts
        - generic [ref=e70]:
          - generic [ref=e71]: "1"
          - generic [ref=e72]: Predictive models
        - generic [ref=e73]:
          - generic [ref=e74]: "0"
          - generic [ref=e75]: Shared
      - generic [ref=e76]:
        - button "+ New analysis" [ref=e77] [cursor=pointer]
        - button "View all artifacts" [ref=e78] [cursor=pointer]
```

# Test source

```ts
  1  | // R8S1E1-US1 (UI) — artifact provenance panel backed by the Unified Artifact
  2  | // Store. Drives the same session→pipeline→save flow the app uses, then
  3  | // asserts the user-visible provenance chain on the All Artifacts screen.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | async function makeArtifact(request, title) {
  7  |   const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  8  |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  9  |   await expect.poll(async () => {
  10 |     const r = await (await request.get(`/api/pipeline/${run.runId}`)).json();
  11 |     return r.status;
  12 |   }, { timeout: 20_000 }).toBe('done');
  13 |   const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`, { data: { title } })).json();
  14 |   return art;
  15 | }
  16 | 
  17 | test('artifact provenance panel lists the UAS stage chain', async ({ page, request }) => {
  18 |   const title = `Provenance UI ${Date.now()}`;
  19 |   const art = await makeArtifact(request, title);
  20 | 
  21 |   await page.goto('/');
> 22 |   await page.getByText('All artifacts', { exact: false }).click();
     |                                                           ^ Error: locator.click: Error: strict mode violation: getByText('All artifacts') resolved to 2 elements:
  23 |   const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  24 |   await expect(row).toBeVisible();
  25 | 
  26 |   await row.getByTestId('provenance-btn').click();
  27 |   const panel = page.getByTestId('uas-provenance');
  28 |   await expect(panel).toBeVisible();
  29 |   for (const t of ['session_spec', 'dashboard_plan', 'gold_predictions_ref',
  30 |                    'gold_forecast_ref', 'artifact_html_ref']) {
  31 |     await expect(panel.getByText(t, { exact: false })).toBeVisible();
  32 |   }
  33 |   // versions are shown alongside types (common-schema surface)
  34 |   await expect(panel.getByText(/v\d+/).first()).toBeVisible();
  35 | });
  36 | 
```