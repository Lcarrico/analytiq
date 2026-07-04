# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r16s1_canvas.spec.js >> build shows stage chips then renders the dashboard canvas
- Location: tests/ui/r16s1_canvas.spec.js:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('stage-chips')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('stage-chips')

```

```yaml
- complementary:
  - text: AnalytIQ
  - navigation:
    - text: Workspace
    - link "Home":
      - /url: /app
      - text: ⌂ Home
    - link "Create":
      - /url: /app/create
      - text: ✦ Create
    - link "Artifacts":
      - /url: /app/artifacts
      - text: ▦ Artifacts
    - text: Data
    - link "Data":
      - /url: /app/data/sources
      - text: ⬡ Data
    - link "Semantic Layer":
      - /url: /app/semantic
      - text: ◈ Semantic Layer
    - link "Gold Tables":
      - /url: /app/gold
      - text: ▤ Gold Tables
    - link "Models":
      - /url: /app/models
      - text: ⚗ Models
    - text: Operate
    - link "Alerts":
      - /url: /app/alerts
      - text: ◉ Alerts
    - link "Governance":
      - /url: /app/governance
      - text: ⛭ Governance
    - text: Organization
    - link "Team":
      - /url: /app/team
      - text: ◇ Team
    - link "Admin":
      - /url: /app/admin/platform
      - text: ⚙ Admin
    - link "Billing":
      - /url: /app/billing
      - text: ❖ Billing
    - link "Settings":
      - /url: /app/settings/profile
      - text: ○ Settings
  - button "« Collapse"
- banner:
  - text: acme-retail ▾
  - button "Search… ⌘K"
  - text: 🔔 0 ?
  - button "A"
- text: app / create / 1
- main:
  - text: Forecast net revenue for the next 14 days by location Proposed plan Goal Forecast net revenue for the next 14 days by location Metric Net Revenue Grain Location · Day Time range 2023-01-01 → 2023-12-31 Output forecast_dashboard Horizon 14 days Access No PII restrictions apply to this plan
  - button "Approve & Build"
  - text: Plan approved — building your dashboard now. done Build complete.
  - textbox "Ask a business question…"
  - button "⏎ Build"
  - text: canvas · arrives with the live build view (R16S1E2)
```

# Test source

```ts
  1  | // R16S1E2-US1 (UI) — live build: 7 stage chips driven by the DAG, then the
  2  | // canvas renders KPI strip, chart sections, autosave chip, GOVERNED badge.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('build shows stage chips then renders the dashboard canvas', async ({ page }) => {
  6  |   await page.goto('/app/create/new');
  7  |   await page.getByTestId('workbench-input').fill(
  8  |     'Forecast net revenue for the next 14 days by location');
  9  |   await page.getByTestId('workbench-send').click();
  10 |   await page.getByTestId('plan-card').getByTestId('approve-build').click();
  11 | 
  12 |   const chips = page.getByTestId('stage-chips');
> 13 |   await expect(chips).toBeVisible();
     |                       ^ Error: expect(locator).toBeVisible() failed
  14 |   for (const stage of ['Understanding request', 'Building gold data',
  15 |                        'Training models', 'Assembling dashboard']) {
  16 |     await expect(chips.getByText(stage)).toBeVisible();
  17 |   }
  18 |   // all chips reach done (SIM_DELAY_SCALE=0 → fast)
  19 |   await expect.poll(async () =>
  20 |     await chips.locator('[data-stage-state="done"]').count(),
  21 |     { timeout: 20_000 }).toBe(7);
  22 | 
  23 |   const canvas = page.getByTestId('workbench-canvas');
  24 |   await expect(canvas.getByTestId('kpi-strip')).toBeVisible();
  25 |   await expect(canvas.getByTestId('section-timeseries')).toBeVisible();
  26 |   await expect(canvas.getByTestId('section-forecast')).toBeVisible();
  27 |   await expect(canvas.locator('svg').first()).toBeVisible();       // real chart
  28 |   await expect(page.getByTestId('autosave-chip')).toContainText(/autosaved/i);
  29 |   await expect(page.getByTestId('governed-badge')).toBeVisible();
  30 | });
  31 | 
```