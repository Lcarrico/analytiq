# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r16s1_workbench.spec.js >> confident prompt produces an inline plan card with ACCESS row; approve starts the build
- Location: tests/ui/r16s1_workbench.spec.js:16:5

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /^\/app\/create\/\d+$/
Received string:  "/app/create/new"

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e10]: AnalytIQ
    - navigation [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Workspace
        - link "Home" [ref=e14] [cursor=pointer]:
          - /url: /app
          - generic [ref=e15]: ⌂
          - text: Home
        - link "Create" [ref=e16] [cursor=pointer]:
          - /url: /app/create
          - generic [ref=e17]: ✦
          - text: Create
        - link "Artifacts" [ref=e18] [cursor=pointer]:
          - /url: /app/artifacts
          - generic [ref=e19]: ▦
          - text: Artifacts
      - generic [ref=e20]:
        - generic [ref=e21]: Data
        - link "Data" [ref=e22] [cursor=pointer]:
          - /url: /app/data/sources
          - generic [ref=e23]: ⬡
          - text: Data
        - link "Semantic Layer" [ref=e24] [cursor=pointer]:
          - /url: /app/semantic
          - generic [ref=e25]: ◈
          - text: Semantic Layer
        - link "Gold Tables" [ref=e26] [cursor=pointer]:
          - /url: /app/gold
          - generic [ref=e27]: ▤
          - text: Gold Tables
        - link "Models" [ref=e28] [cursor=pointer]:
          - /url: /app/models
          - generic [ref=e29]: ⚗
          - text: Models
      - generic [ref=e30]:
        - generic [ref=e31]: Operate
        - link "Alerts" [ref=e32] [cursor=pointer]:
          - /url: /app/alerts
          - generic [ref=e33]: ◉
          - text: Alerts
        - link "Governance" [ref=e34] [cursor=pointer]:
          - /url: /app/governance
          - generic [ref=e35]: ⛭
          - text: Governance
      - generic [ref=e36]:
        - generic [ref=e37]: Organization
        - link "Team" [ref=e38] [cursor=pointer]:
          - /url: /app/team
          - generic [ref=e39]: ◇
          - text: Team
        - link "Admin" [ref=e40] [cursor=pointer]:
          - /url: /app/admin/platform
          - generic [ref=e41]: ⚙
          - text: Admin
        - link "Billing" [ref=e42] [cursor=pointer]:
          - /url: /app/billing
          - generic [ref=e43]: ❖
          - text: Billing
        - link "Settings" [ref=e44] [cursor=pointer]:
          - /url: /app/settings/profile
          - generic [ref=e45]: ○
          - text: Settings
    - button "« Collapse" [ref=e46] [cursor=pointer]
  - generic [ref=e47]:
    - banner [ref=e48]:
      - generic [ref=e49]: acme-retail ▾
      - button "Search… ⌘K" [ref=e51] [cursor=pointer]:
        - text: Search…
        - generic [ref=e52]: ⌘K
      - generic "Notifications" [ref=e53]:
        - text: 🔔
        - generic [ref=e54]: "0"
      - generic "Help" [ref=e55]: "?"
      - button "A" [ref=e57] [cursor=pointer]
    - generic [ref=e58]: app / create / new
    - main [ref=e59]:
      - generic [ref=e60]:
        - generic [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e65]: Forecast net revenue for the next 14 days by location
            - generic [ref=e67]:
              - generic [ref=e68]: Proposed plan
              - generic [ref=e69]:
                - generic [ref=e70]: Goal
                - generic [ref=e71]: Forecast net revenue for the next 14 days by location
              - generic [ref=e72]:
                - generic [ref=e73]: Metric
                - generic [ref=e74]: Net Revenue
              - generic [ref=e75]:
                - generic [ref=e76]: Grain
                - generic [ref=e77]: Location · Day
              - generic [ref=e78]:
                - generic [ref=e79]: Time range
                - generic [ref=e80]: 2023-01-01 → 2023-12-31
              - generic [ref=e81]:
                - generic [ref=e82]: Output
                - generic [ref=e83]: forecast_dashboard
              - generic [ref=e84]:
                - generic [ref=e85]: Horizon
                - generic [ref=e86]: 14 days
              - generic [ref=e87]:
                - generic [ref=e88]: Access
                - generic [ref=e89]: No PII restrictions apply to this plan
              - button "Approve & Build" [ref=e91] [cursor=pointer]
          - generic [ref=e92]:
            - textbox "Ask a business question…" [ref=e93]
            - button "⏎ Build" [active] [ref=e94] [cursor=pointer]
        - generic [ref=e95]: canvas · arrives with the live build view (R16S1E2)
```

# Test source

```ts
  1  | // R16S1E1-US1 (UI) — Create Workbench: start state, chat planning turn with
  2  | // clarification chips, inline plan card with ACCESS row, Approve & Build.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | test('start state shows typed example prompts and redirects from /app/create', async ({ page }) => {
  6  |   await page.goto('/app/create');
  7  |   await expect.poll(() => new URL(page.url()).pathname).toBe('/app/create/new');
  8  |   const start = page.getByTestId('workbench-start');
  9  |   await expect(start).toBeVisible();
  10 |   for (const kind of ['FORECAST', 'PREDICTIVE', 'VARIANCE', 'ANOMALY']) {
  11 |     await expect(start.getByText(kind, { exact: true })).toBeVisible();
  12 |   }
  13 |   await expect(page.getByTestId('workbench-input')).toBeVisible();
  14 | });
  15 | 
  16 | test('confident prompt produces an inline plan card with ACCESS row; approve starts the build', async ({ page }) => {
  17 |   await page.goto('/app/create/new');
  18 |   await page.getByTestId('workbench-input').fill(
  19 |     'Forecast net revenue for the next 14 days by location');
  20 |   await page.getByTestId('workbench-send').click();
  21 | 
> 22 |   await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/app\/create\/\d+$/);
     |                                                         ^ Error: expect(received).toMatch(expected)
  23 |   const card = page.getByTestId('plan-card');
  24 |   await expect(card).toBeVisible();
  25 |   await expect(card.getByText('Goal')).toBeVisible();
  26 |   await expect(card.getByText('Metric')).toBeVisible();
  27 |   await expect(card.getByText('Access')).toBeVisible();
  28 |   await expect(card.getByText(/No PII restrictions|excluded \(masked\)/)).toBeVisible();
  29 | 
  30 |   await card.getByTestId('approve-build').click();
  31 |   await expect(page.getByTestId('build-state')).toBeVisible();
  32 |   await expect(page.getByTestId('build-state')).toContainText(/Building|running/i, { timeout: 15_000 });
  33 | });
  34 | 
  35 | test('ambiguous prompt yields clarification chips that resolve to a plan', async ({ page }) => {
  36 |   await page.goto('/app/create/new');
  37 |   await page.getByTestId('workbench-input').fill('How is net revenue trending lately');
  38 |   await page.getByTestId('workbench-send').click();
  39 | 
  40 |   const chips = page.getByTestId('clarify-chips');
  41 |   await expect(chips).toBeVisible();
  42 |   await expect(page.getByTestId('confidence-chip')).toContainText(/0\.\d+/);
  43 |   await chips.locator('button').first().click();          // pick an option
  44 |   await expect(page.getByTestId('plan-card')).toBeVisible();
  45 | });
  46 | 
  47 | test('legacy quick-plan screen remains reachable', async ({ page }) => {
  48 |   await page.goto('/app/create/quick');
  49 |   await expect(page.locator('input').first()).toBeVisible();   // S06 body
  50 | });
  51 | 
```