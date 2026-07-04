# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s1_router.spec.js >> browser back returns to the previous route
- Location: tests/ui/r15s1_router.spec.js:9:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "/app/create"
Received: "/app/create/new"
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
      - generic "Notifications" [ref=e53] [cursor=pointer]:
        - text: 🔔
        - generic [ref=e54]: "0"
      - generic "Help" [ref=e55]: "?"
      - button "A" [ref=e57] [cursor=pointer]
    - generic [ref=e58]: app / create / new
    - main [ref=e59]:
      - generic [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]: What do you want to understand?
          - generic [ref=e64]: Ask a business question — the pipeline plans, validates, and builds a governed dashboard.
          - generic [ref=e65]:
            - button "FORECAST Forecast net revenue for the next 14 days by location" [ref=e66] [cursor=pointer]:
              - generic [ref=e67]: FORECAST
              - generic [ref=e68]: Forecast net revenue for the next 14 days by location
            - button "PREDICTIVE Predict customer churn risk for the next 30 days" [ref=e69] [cursor=pointer]:
              - generic [ref=e70]: PREDICTIVE
              - generic [ref=e71]: Predict customer churn risk for the next 30 days
            - button "VARIANCE Explain the variance in average ticket versus last month" [ref=e72] [cursor=pointer]:
              - generic [ref=e73]: VARIANCE
              - generic [ref=e74]: Explain the variance in average ticket versus last month
            - button "ANOMALY Monitor daily revenue for anomalies by store" [ref=e75] [cursor=pointer]:
              - generic [ref=e76]: ANOMALY
              - generic [ref=e77]: Monitor daily revenue for anomalies by store
        - generic [ref=e78]:
          - textbox "Ask a business question…" [ref=e79]
          - button "⏎ Build" [ref=e80] [cursor=pointer]
```

# Test source

```ts
  1  | // R15S1E1-US1 (UI) — real URLs: deep links, back button, 404, wizard compat.
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('deep link renders the artifacts screen directly', async ({ page }) => {
  5  |   await page.goto('/app/artifacts');
  6  |   await expect(page.getByTestId('roi-report-btn')).toBeVisible();   // S10 body
  7  | });
  8  | 
  9  | test('browser back returns to the previous route', async ({ page }) => {
  10 |   await page.goto('/app/create');
  11 |   await expect(page.locator('input').first()).toBeVisible();        // S06 chat input
  12 |   await page.goto('/app/artifacts');
  13 |   await expect(page.getByTestId('roi-report-btn')).toBeVisible();
  14 |   await page.goBack();
  15 |   await expect(page.locator('input').first()).toBeVisible();
> 16 |   expect(new URL(page.url()).pathname).toBe('/app/create');
     |                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  17 | });
  18 | 
  19 | test('unknown route renders the 404 page', async ({ page }) => {
  20 |   await page.goto('/app/definitely-not-a-route');
  21 |   const nf = page.getByTestId('notfound-page');
  22 |   await expect(nf).toBeVisible();
  23 |   await expect(nf.getByText('/app/definitely-not-a-route')).toBeVisible();
  24 |   await nf.getByRole('link', { name: /Back to home/i }).click();
  25 |   expect(new URL(page.url()).pathname).toBe('/app');
  26 | });
  27 | 
  28 | test('root redirects into the app', async ({ page }) => {
  29 |   await page.goto('/');
  30 |   await expect.poll(() => new URL(page.url()).pathname).toBe('/app');
  31 | });
  32 | 
```