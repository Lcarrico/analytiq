# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r21s1_kit.spec.js >> kit gallery renders every primitive to §0.2 geometry
- Location: tests/ui/r21s1_kit.spec.js:13:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('kit-gallery')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('kit-gallery')

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
- text: app / __kit
- main:
  - text: 404 This page doesn't exist. /app/__kit
  - link "← Back to home":
    - /url: /app
```

# Test source

```ts
  1   | // R21S1E2-US1/US2/US3 (UI) — primitive kit rebuilt to checklist §0.2 specs;
  2   | // /app/__kit gallery; legacy call sites render the NEW visuals (compat).
  3   | import { test, expect } from '@playwright/test';
  4   | import path from 'node:path';
  5   | import fs from 'node:fs';
  6   | 
  7   | const REPO = process.env.BOOT_PY
  8   |   ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  9   |   : process.cwd();
  10  | 
  11  | const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  12  | 
  13  | test('kit gallery renders every primitive to §0.2 geometry', async ({ page }) => {
  14  |   await page.goto('/app/__kit');
  15  |   const kit = page.getByTestId('kit-gallery');
> 16  |   await expect(kit).toBeVisible();
      |                     ^ Error: expect(locator).toBeVisible() failed
  17  | 
  18  |   // Badge — pill h20 radius 999 mono 10/600 uppercase
  19  |   const badge = page.getByTestId('kit-badge-green');
  20  |   await expect(badge).toBeVisible();
  21  |   expect(await badge.evaluate(el => el.offsetHeight)).toBe(20);
  22  |   expect(await css(badge, 'borderRadius')).toBe('999px');
  23  |   expect(await css(badge, 'textTransform')).toBe('uppercase');
  24  |   expect(await css(badge, 'fontFamily')).toContain('Mono');
  25  |   expect(await css(badge, 'fontWeight')).toBe('600');
  26  | 
  27  |   // Btn primary h34 r8 accent 600; secondary white + #d4d9e1 border
  28  |   const btnP = page.getByTestId('kit-btn-primary');
  29  |   expect(await btnP.evaluate(el => el.offsetHeight)).toBe(34);
  30  |   expect(await css(btnP, 'borderRadius')).toBe('8px');
  31  |   expect(await css(btnP, 'backgroundColor')).toBe('rgb(37, 99, 235)');
  32  |   expect(await css(btnP, 'fontWeight')).toBe('600');
  33  |   const btnS = page.getByTestId('kit-btn-secondary');
  34  |   expect(await css(btnS, 'backgroundColor')).toBe('rgb(255, 255, 255)');
  35  |   expect(await css(btnS, 'borderColor')).toBe('rgb(212, 217, 225)');
  36  |   expect(await css(btnS, 'color')).toBe('rgb(51, 65, 85)');
  37  | 
  38  |   // Card r10 border #e4e8ef p20
  39  |   const card = page.getByTestId('kit-card');
  40  |   expect(await css(card, 'borderRadius')).toBe('10px');
  41  |   expect(await css(card, 'borderColor')).toBe('rgb(228, 232, 239)');
  42  |   expect(await css(card, 'paddingTop')).toBe('20px');
  43  | 
  44  |   // KpiCard — mono 26 value
  45  |   const kpiVal = page.getByTestId('kit-kpi-value');
  46  |   expect(await css(kpiVal, 'fontSize')).toBe('26px');
  47  |   expect(await css(kpiVal, 'fontFamily')).toContain('Mono');
  48  | 
  49  |   // DataTable — fr template passthrough + header spec
  50  |   const th = page.getByTestId('kit-table-head');
  51  |   expect(await th.evaluate(el => el.style.gridTemplateColumns)).toBe('1.8fr 1fr 0.8fr');
  52  |   expect(await css(th, 'backgroundColor')).toBe('rgb(250, 251, 252)');
  53  |   const thCell = th.locator('button').first();
  54  |   expect(await css(thCell, 'fontSize')).toBe('10px');
  55  |   expect(await css(thCell, 'textTransform')).toBe('uppercase');
  56  | 
  57  |   // Input h36 r8 border #d4d9e1
  58  |   const input = page.getByTestId('kit-input');
  59  |   expect(await input.evaluate(el => el.offsetHeight)).toBe(36);
  60  |   expect(await css(input, 'borderRadius')).toBe('8px');
  61  |   expect(await css(input, 'borderColor')).toBe('rgb(212, 217, 225)');
  62  | 
  63  |   // Toggle 34×20 — on accent / off #cbd5e1
  64  |   const tOn = page.getByTestId('kit-toggle-on');
  65  |   expect(await tOn.evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([34, 20]);
  66  |   expect(await css(tOn, 'backgroundColor')).toBe('rgb(37, 99, 235)');
  67  |   expect(await css(page.getByTestId('kit-toggle-off'), 'backgroundColor')).toBe('rgb(203, 213, 225)');
  68  | 
  69  |   // Tabs — active 600 #1d4ed8 + 2px #2563eb underline
  70  |   const activeTab = page.getByTestId('kit-tabs').getByRole('tab', { selected: true });
  71  |   expect(await css(activeTab, 'color')).toBe('rgb(29, 78, 216)');
  72  |   expect(await css(activeTab, 'borderBottomColor')).toBe('rgb(37, 99, 235)');
  73  |   expect(await css(activeTab, 'borderBottomWidth')).toBe('2px');
  74  |   expect(await css(activeTab, 'fontSize')).toBe('12.5px');
  75  | 
  76  |   // Avatar 34 #0e7490; RadioCard selected 2px accent + #f8faff
  77  |   const av = page.getByTestId('kit-avatar-dk');
  78  |   expect(await av.evaluate(el => el.offsetWidth)).toBe(34);
  79  |   expect(await css(av, 'backgroundColor')).toBe('rgb(14, 116, 144)');
  80  |   const radio = page.getByTestId('kit-radiocard-selected');
  81  |   expect(await css(radio, 'borderColor')).toBe('rgb(37, 99, 235)');
  82  |   expect(await css(radio, 'backgroundColor')).toBe('rgb(248, 250, 255)');
  83  | 
  84  |   // Modal r14 + footer #fafbfc; CodeBlock dark
  85  |   await page.getByTestId('kit-open-modal').click();
  86  |   const modal = page.getByTestId('kit-modal');
  87  |   await expect(modal).toBeVisible();
  88  |   expect(await css(modal, 'borderRadius')).toBe('14px');
  89  |   expect(await css(modal.getByTestId('modal-footer'), 'backgroundColor')).toBe('rgb(250, 251, 252)');
  90  |   await page.keyboard.press('Escape');
  91  |   const code = page.getByTestId('kit-codeblock');
  92  |   expect(await css(code, 'backgroundColor')).toBe('rgb(11, 18, 32)');
  93  |   expect(await css(code, 'color')).toBe('rgb(147, 197, 253)');
  94  | 
  95  |   // SectionLabel micro-label; Donut svg present
  96  |   const sl = page.getByTestId('kit-sectionlabel');
  97  |   expect(await css(sl, 'fontSize')).toBe('9.5px');
  98  |   expect(await css(sl, 'letterSpacing')).toBe('0.76px'); // 9.5px * .08em
  99  |   await expect(page.getByTestId('kit-donut').locator('svg')).toBeVisible();
  100 | });
  101 | 
  102 | test('parity screenshot pair captured for the kit', async ({ page }) => {
  103 |   await page.setViewportSize({ width: 1440, height: 1200 });
  104 |   await page.goto('/app/__kit');
  105 |   await expect(page.getByTestId('kit-gallery')).toBeVisible();
  106 |   const dir = path.join(REPO, 'docs', 'specs', 'parity', 'kit');
  107 |   fs.mkdirSync(dir, { recursive: true });
  108 |   await page.screenshot({ path: path.join(dir, 'app.png'), fullPage: true });
  109 |   expect(fs.existsSync(path.join(dir, 'app.png'))).toBe(true);
  110 | });
  111 | 
  112 | test('legacy call sites render the NEW badge/btn visuals (compat layer)', async ({ page }) => {
  113 |   // S02 connect screen renders `Badge variant="success" xs` unconditionally
  114 |   // for live connector tiles — the pill spec must show through the old API.
  115 |   await page.goto('/app/data/sources');
  116 |   const legacyBadge = page.getByText('Available', { exact: true }).first();
```