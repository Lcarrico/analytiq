# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r16s2_inspector.spec.js >> inspector tabs expose design, pipeline, insights, share and versions
- Location: tests/ui/r16s2_inspector.spec.js:4:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('inspector')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('inspector')

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
  - text: governed autosaved 10:23:07 AM
  - link "Open artifact ↗":
    - /url: /api/artifacts/1/html
  - text: ✓ Understanding request ✓ Profiling source ✓ Building gold data ✓ Training models ✓ Validating accuracy ✓ Generating visuals ✓ Assembling dashboard Total (window) 46,139 Daily average 607 Forecast days 14 MAPE 8.9% Net Revenue — actual vs predictedCONTRACT ✓
  - img
  - text: Forecast (±CI)
```

# Test source

```ts
  1  | // R16S2E3-US1 (UI) — workbench inspector: 6 tabs over existing backends.
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('inspector tabs expose design, pipeline, insights, share and versions', async ({ page }) => {
  5  |   await page.goto('/app/create/new');
  6  |   await page.getByTestId('workbench-input').fill(
  7  |     'Forecast net revenue for the next 14 days by location');
  8  |   await page.getByTestId('workbench-send').click();
  9  |   await page.getByTestId('plan-card').getByTestId('approve-build').click();
  10 |   await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 20_000 });
  11 | 
  12 |   const inspector = page.getByTestId('inspector');
> 13 |   await expect(inspector).toBeVisible();
     |                           ^ Error: expect(locator).toBeVisible() failed
  14 | 
  15 |   await inspector.getByRole('tab', { name: 'Design' }).click();
  16 |   await expect(inspector.getByText(/actual vs predicted|timeseries/i).first()).toBeVisible();
  17 |   await expect(inspector.getByText(/Why this chart/i)).toBeVisible();
  18 | 
  19 |   await inspector.getByRole('tab', { name: 'Pipeline' }).click();
  20 |   await expect(inspector.getByText('Build gold table & features')).toBeVisible();
  21 |   await expect(inspector.getByText(/min_training_rows:PASS/).first()).toBeVisible();
  22 | 
  23 |   await inspector.getByRole('tab', { name: 'Insights' }).click();
  24 |   await inspector.getByTestId('insight-scan-btn').click();
  25 |   await expect(inspector.locator('[data-testid^="insight-row-"]').first()).toBeVisible();
  26 | 
  27 |   await inspector.getByRole('tab', { name: 'Share' }).click();
  28 |   await inspector.getByTestId('make-share-link').click();
  29 |   await expect(inspector.getByTestId('share-link-url')).toContainText('/api/public/');
  30 | 
  31 |   await inspector.getByRole('tab', { name: 'Versions' }).click();
  32 |   await expect(inspector.getByText(/artifact_html_ref/).first()).toBeVisible();
  33 |   await expect(inspector.getByText(/v1/).first()).toBeVisible();
  34 | 
  35 |   await inspector.getByRole('tab', { name: 'Data' }).click();
  36 |   await expect(inspector.getByText(/gate|contract/i).first()).toBeVisible();
  37 | });
  38 | 
```