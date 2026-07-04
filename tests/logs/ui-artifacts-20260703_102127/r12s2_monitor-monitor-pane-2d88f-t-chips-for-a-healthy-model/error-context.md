# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r12s2_monitor.spec.js >> monitor panel shows stable drift chips for a healthy model
- Location: tests/ui/r12s2_monitor.spec.js:5:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="artifact-row-1"]').getByTestId('monitor-btn')

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
        - button "⊞ All artifacts" [active] [ref=e51] [cursor=pointer]:
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
      - generic [ref=e64]:
        - generic [ref=e65]:
          - heading "Workspace artifacts" [level=1] [ref=e67]
          - paragraph [ref=e68]: 1 saved analysis · shareable with your team
        - generic [ref=e69]:
          - button "⧉ Sandbox" [ref=e70] [cursor=pointer]
          - button "⚕ Health dashboard" [ref=e71] [cursor=pointer]
          - button "+ New analysis" [ref=e72] [cursor=pointer]
      - textbox "Deep search (titles + metric names, FTS)…" [ref=e74]
      - generic [ref=e75]:
        - textbox "Search by title..." [ref=e76]
        - combobox [ref=e77] [cursor=pointer]:
          - option "All types" [selected]
          - option "Predictive"
          - option "Descriptive"
        - combobox [ref=e78] [cursor=pointer]:
          - option "All DQ statuses" [selected]
          - option "Pass"
          - option "Warn"
      - generic [ref=e81]:
        - img [ref=e83]
        - generic [ref=e86]:
          - generic [ref=e87]:
            - generic [ref=e88] [cursor=pointer]: Mon UI 1783092057376
            - generic [ref=e89]: Predictive
            - 'generic "Dashboard health: readability · accessibility · redundancy · performance · usefulness (§17.5.5)" [ref=e90]': ⚕ 88
            - generic [ref=e91]: DQ pass
            - generic [ref=e92]: MAPE 8.9%
          - generic [ref=e93]:
            - generic [ref=e94]: 👤 analyst@acme.com
            - generic [ref=e95]: 🕐 Jul 3, 2026
        - generic [ref=e96]:
          - button "Open" [ref=e97] [cursor=pointer]
          - button "☆" [ref=e98] [cursor=pointer]
          - button "Preview" [ref=e99] [cursor=pointer]
          - button "Insights" [ref=e100] [cursor=pointer]
          - button "Link" [ref=e101] [cursor=pointer]
          - button "Embed" [ref=e102] [cursor=pointer]
          - button "Activity" [ref=e103] [cursor=pointer]
          - button "Opportunities" [ref=e104] [cursor=pointer]
          - button "Replay" [ref=e105] [cursor=pointer]
          - button "Explain" [ref=e106] [cursor=pointer]
          - button "Provenance" [ref=e107] [cursor=pointer]
          - button "Share" [ref=e108] [cursor=pointer]
          - button "Schedule" [ref=e110] [cursor=pointer]
          - button "✕" [ref=e111] [cursor=pointer]
```

# Test source

```ts
  1  | // R12S2E4-US1 (UI) — model monitoring surfaces importance/input drift on
  2  | // the artifact row.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('monitor panel shows stable drift chips for a healthy model', async ({ page, request }) => {
  6  |   const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  7  |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  8  |   await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  9  |                     { timeout: 20_000 }).toBe('done');
  10 |   const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
  11 |     { data: { title: `Mon UI ${Date.now()}` } })).json();
  12 | 
  13 |   await page.goto('/');
  14 |   await page.locator('nav').getByRole('button', { name: /All artifacts/ }).click();
  15 |   const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  16 |   await expect(row).toBeVisible();
> 17 |   await row.getByTestId('monitor-btn').click();
     |                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  18 | 
  19 |   const panel = page.getByTestId('monitor-panel');
  20 |   await expect(panel).toBeVisible();
  21 |   await expect(panel.getByTestId('mon-importance')).toContainText('stable');
  22 |   await expect(panel.getByTestId('mon-input')).toContainText('stable');
  23 | });
  24 | 
```