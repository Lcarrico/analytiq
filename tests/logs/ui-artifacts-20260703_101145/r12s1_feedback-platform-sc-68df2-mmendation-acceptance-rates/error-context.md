# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r12s1_feedback.spec.js >> platform screen shows recommendation acceptance rates
- Location: tests/ui/r12s1_feedback.spec.js:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('feedback-panel')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('feedback-panel')

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
  - text: Service modes auth local cache local email local logging local queue local search local secrets local storage local Latency 5 requests · P50 1.37ms · P95 4.73ms Jobs No background jobs yet. Recent requests GET /api/platform/jobs 200 0.66ms GET /api/workspace/status 200 0.56ms GET /api/artifacts 200 0.76ms POST /api/feedback 201 4.05ms POST /api/feedback 201 4.73ms GET /api/health 200 1.37ms Email outbox Outbox empty. Alerts No alerts. Workspace branding
  - textbox "#4f7cff"
  - textbox "Logo text"
  - textbox "Font family"
  - button "Save"
  - button "↻ Refresh"
  - text: "Caching hierarchy Independent layers keyed by governance + semantic versions — a version bump invalidates only its dependents. (§17.7.3) artifact 0% 0h / 0m · 0 entries query 0% 0h / 0m · 0 entries semantic 0% 0h / 0m · 0 entries spec 0% 0h / 0m · 0 entries Cost-aware dispatches Ladder: cache → template → small model → frontier model. Only novel work reaches the frontier. (§17.2.2) cache 0 template 0 small_model 0 frontier_model 0 0 dispatches · est. cost $0 Platform events Data, schema, drift, and business events trigger targeted recompute without a user turn. (§17.2.4) No events yet Meta-orchestrator Deterministic arbitration, systemic-failure triage, queue reprioritization. Human checkpoints are never skippable. (§17.2.7)"
  - button "Run reprioritization sweep"
  - text: No decisions yet Agent consultations Agents consult each other mid-task instead of failing into repair cycles — never a hidden side channel. (§17.2.3) No consultations yet Optimization proposals Autonomous analysis of query telemetry and cache stats — proposals only, never auto-applied. (§17.2.9)
  - button "Run analysis now"
  - text: No proposals
```

# Test source

```ts
  1  | // R12S1E2-US1 (UI) — acceptance rates per recommendation type are visible
  2  | // on the platform screen.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('platform screen shows recommendation acceptance rates', async ({ page, request }) => {
  6  |   await request.post('/api/feedback', {
  7  |     data: { rec_type: 'benchmark', rec_id: 1, decision: 'accept', category: 'historical' } });
  8  |   await request.post('/api/feedback', {
  9  |     data: { rec_type: 'benchmark', rec_id: 2, decision: 'dismiss', category: 'historical' } });
  10 | 
  11 |   await page.goto('/');
  12 |   await page.locator('nav').getByRole('button', { name: /^.*Platform$/ }).click();
  13 |   const panel = page.getByTestId('feedback-panel');
> 14 |   await expect(panel).toBeVisible();
     |                       ^ Error: expect(locator).toBeVisible() failed
  15 |   const row = panel.getByTestId('fb-benchmark');
  16 |   await expect(row).toBeVisible();
  17 |   await expect(row.getByText('50%')).toBeVisible();
  18 | });
  19 | 
```