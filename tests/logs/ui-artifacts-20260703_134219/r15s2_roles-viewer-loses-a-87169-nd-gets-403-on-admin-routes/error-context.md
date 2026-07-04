# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s2_roles.spec.js >> viewer loses admin/billing/governance nav and gets 403 on admin routes
- Location: tests/ui/r15s2_roles.spec.js:19:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true })
Expected: 0
Received: 1
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" with timeout 10000ms
  - waiting for getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true })
    24 × locator resolved to 1 element
       - unexpected value "1"

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
      - button "V" [ref=e57] [cursor=pointer]
    - generic [ref=e58]: app
    - main [ref=e59]:
      - generic [ref=e60]:
        - generic [ref=e61]: 📊
        - heading "Welcome to AnalytIQ" [level=1] [ref=e62]
        - paragraph [ref=e63]: Ask a question in plain English. Get a backtested, governed, shareable predictive dashboard — no SQL, no Python.
        - paragraph [ref=e64]: No data sources connected yet.
        - button "Start your first analysis →" [ref=e65] [cursor=pointer]
        - generic [ref=e66]:
          - generic [ref=e67]:
            - generic [ref=e68]: 🔒
            - generic [ref=e69]: Credentials stay secure
            - generic [ref=e70]: Encrypted at rest and never shared with the LLM layer.
          - generic [ref=e71]:
            - generic [ref=e72]: ✓
            - generic [ref=e73]: Walk-forward backtesting
            - generic [ref=e74]: Every model validated on held-out time windows before shipping.
          - generic [ref=e75]:
            - generic [ref=e76]: 📤
            - generic [ref=e77]: Shareable artifacts
            - generic [ref=e78]: Self-contained dashboards with full lineage metadata.
```

# Test source

```ts
  1  | // R15S2E4-US1 (UI) — role-aware rendering: viewers lose admin nav and
  2  | // technical blocks; admins keep the ops console.
  3  | import { test, expect } from '@playwright/test';
  4  | 
  5  | async function loginAs(page, request, role) {
  6  |   const email = `${role}${Date.now() % 1e6}@acme.com`;
  7  |   await request.post('/api/auth/register', {
  8  |     data: { email, password: 'pass12345', role } });
  9  |   const login = await (await request.post('/api/auth/login',
  10 |     { data: { email, password: 'pass12345' } })).json();
  11 |   await page.goto('/app');
  12 |   await page.evaluate(([token, user]) => {
  13 |     localStorage.setItem('analytiq_token', token);
  14 |     localStorage.setItem('analytiq_user', JSON.stringify(user));
  15 |   }, [login.token, login.user]);
  16 |   await page.reload();
  17 | }
  18 | 
  19 | test('viewer loses admin/billing/governance nav and gets 403 on admin routes', async ({ page, request }) => {
  20 |   await loginAs(page, request, 'viewer');
  21 |   const sidebar = page.getByTestId('app-sidebar');
  22 |   await expect(sidebar.getByRole('link', { name: 'Artifacts', exact: true })).toBeVisible();
> 23 |   await expect(sidebar.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);
     |                                                                           ^ Error: expect(locator).toHaveCount(expected) failed
  24 |   await expect(sidebar.getByRole('link', { name: 'Billing', exact: true })).toHaveCount(0);
  25 |   await expect(sidebar.getByRole('link', { name: 'Governance', exact: true })).toHaveCount(0);
  26 | 
  27 |   await page.goto('/app/admin/platform');
  28 |   const forbidden = page.getByTestId('forbidden-page');
  29 |   await expect(forbidden).toBeVisible();
  30 |   await expect(forbidden).toContainText('403');
  31 | });
  32 | 
  33 | test('admin keeps the console inside the AdminOnly treatment', async ({ page, request }) => {
  34 |   await loginAs(page, request, 'admin');
  35 |   await page.goto('/app/admin/platform');
  36 |   await expect(page.getByTestId('forbidden-page')).toHaveCount(0);
  37 |   await expect(page.getByTestId('admin-only-block').first()).toBeVisible();
  38 |   await expect(page.getByTestId('cache-panel')).toBeVisible();       // console intact
  39 | });
  40 | 
```