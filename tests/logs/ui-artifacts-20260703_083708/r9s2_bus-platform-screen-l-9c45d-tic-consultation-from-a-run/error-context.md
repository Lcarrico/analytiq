# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r9s2_bus.spec.js >> platform screen lists the viz→semantic consultation from a run
- Location: tests/ui/r9s2_bus.spec.js:4:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('consultations-panel')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('consultations-panel')

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
  - text: Service modes auth local cache local email local logging local queue local search local secrets local storage local Latency 7 requests · P50 0.77ms · P95 5.67ms Jobs No background jobs yet. Recent requests GET /api/workspace/status 200 0.59ms GET /api/artifacts 200 0.77ms GET /api/pipeline/1 200 0.63ms GET /api/pipeline/1 200 0.69ms POST /api/pipeline/run 201 5.67ms POST /api/sessions 201 4.77ms GET /api/health 200 1.3ms Email outbox Outbox empty. Alerts No alerts. Workspace branding
  - textbox "#4f7cff"
  - textbox "Logo text"
  - textbox "Font family"
  - button "Save"
  - button "↻ Refresh"
  - text: "Caching hierarchy Independent layers keyed by governance + semantic versions — a version bump invalidates only its dependents. (§17.7.3) artifact 0% 0h / 0m · 0 entries query 0% 0h / 0m · 0 entries semantic 0% 0h / 0m · 0 entries spec 0% 0h / 0m · 0 entries Cost-aware dispatches Ladder: cache → template → small model → frontier model. Only novel work reaches the frontier. (§17.2.2) cache 0 template 0 small_model 0 frontier_model 0 0 dispatches · est. cost $0 Platform events Data, schema, drift, and business events trigger targeted recompute without a user turn. (§17.2.4) No events yet Meta-orchestrator Deterministic arbitration, systemic-failure triage, queue reprioritization. Human checkpoints are never skippable. (§17.2.7)"
  - button "Run reprioritization sweep"
  - text: No decisions yet
```

# Test source

```ts
  1  | // R9S2E5-US1 (UI) — agent consultations are visible, first-class records.
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('platform screen lists the viz→semantic consultation from a run', async ({ page, request }) => {
  5  |   const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  6  |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  7  |   await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  8  |                     { timeout: 20_000 }).toBe('done');
  9  | 
  10 |   await page.goto('/');
  11 |   await page.locator('nav').getByRole('button', { name: /^.*Platform$/ }).click();
  12 |   const panel = page.getByTestId('consultations-panel');
> 13 |   await expect(panel).toBeVisible();
     |                       ^ Error: expect(locator).toBeVisible() failed
  14 |   await expect(panel.getByText('visualization_agent').first()).toBeVisible();
  15 |   await expect(panel.getByText('semantic_layer_agent').first()).toBeVisible();
  16 |   await expect(panel.getByText('metric_format').first()).toBeVisible();
  17 | });
  18 | 
```