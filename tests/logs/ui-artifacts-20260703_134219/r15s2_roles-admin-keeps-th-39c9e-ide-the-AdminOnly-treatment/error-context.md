# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15s2_roles.spec.js >> admin keeps the console inside the AdminOnly treatment
- Location: tests/ui/r15s2_roles.spec.js:33:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('admin-only-block').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('admin-only-block').first()

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
- text: app / admin / platform
- main:
  - heading "Platform" [level=1]
  - paragraph: Managed-tool integrations with automatic local fallbacks — zero external keys required.
  - text: Service modes auth local cache local email local logging local queue local search local secrets local storage local Latency 13 requests · P50 4.8ms · P95 24.63ms Jobs No background jobs yet. Recent requests GET /api/workspace/status 200 3.2ms GET /api/artifacts 200 5.63ms GET /api/workspace/status 200 4.8ms GET /api/artifacts 200 5.71ms POST /api/auth/login 200 24.63ms POST /api/auth/register 201 23.6ms GET /api/workspace/status 200 0.83ms GET /api/artifacts 200 1.31ms Email outbox Outbox empty. Alerts No alerts. Workspace branding
  - textbox "#4f7cff"
  - textbox "Logo text"
  - textbox "Font family"
  - button "Save"
  - button "↻ Refresh"
  - text: "Caching hierarchy Independent layers keyed by governance + semantic versions — a version bump invalidates only its dependents. (§17.7.3) artifact 0% 0h / 0m · 0 entries query 0% 0h / 0m · 0 entries semantic 0% 0h / 0m · 0 entries spec 0% 0h / 0m · 0 entries Cost-aware dispatches Ladder: cache → template → small model → frontier model. Only novel work reaches the frontier. (§17.2.2) cache 0 template 0 small_model 0 frontier_model 0 0 dispatches · est. cost $0 Platform events Data, schema, drift, and business events trigger targeted recompute without a user turn. (§17.2.4) No events yet Meta-orchestrator Deterministic arbitration, systemic-failure triage, queue reprioritization. Human checkpoints are never skippable. (§17.2.7)"
  - button "Run reprioritization sweep"
  - text: No decisions yet Agent consultations Agents consult each other mid-task instead of failing into repair cycles — never a hidden side channel. (§17.2.3) No consultations yet Optimization proposals Autonomous analysis of query telemetry and cache stats — proposals only, never auto-applied. (§17.2.9)
  - button "Run analysis now"
  - text: No proposals Recommendation feedback Which suggestion types are earning trust — dismissal is a first-class signal. (§17.4.3) No decisions recorded yet Self-improvement signals Mined from usage telemetry, routed to their consumers with an audited delivery trail. (§17.4.2)
  - button "Mine signals now"
  - text: No signals yet
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
  23 |   await expect(sidebar.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);
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
> 37 |   await expect(page.getByTestId('admin-only-block').first()).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  38 |   await expect(page.getByTestId('cache-panel')).toBeVisible();       // console intact
  39 | });
  40 | 
```