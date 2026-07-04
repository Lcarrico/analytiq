# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r21s1_tokens.spec.js >> typography scale T carries the frame roles
- Location: tests/ui/r21s1_tokens.spec.js:38:5

# Error details

```
Error: T scale missing from tokens

expect(received).toBeTruthy()

Received: undefined
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
  1  | // R21S1E1-US1/US2 (UI) — Design-Parity Program: single design-token source.
  2  | // US1: every mockup color importable from P (checklist §0.2 names) + T scale.
  3  | // US2: lint wall — importing the legacy C palette fails `npm run lint:tokens`.
  4  | import { test, expect } from '@playwright/test';
  5  | import { execFileSync } from 'node:child_process';
  6  | import path from 'node:path';
  7  | import fs from 'node:fs';
  8  | import os from 'node:os';
  9  | 
  10 | // Repo root: run_ui.sh exports BOOT_PY=$REPO/tests/ui/boot_server.py; native
  11 | // runs fall back to cwd.
  12 | const REPO = process.env.BOOT_PY
  13 |   ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  14 |   : process.cwd();
  15 | 
  16 | const EXPECTED_P = {
  17 |   itemInk: '#47516b', boardLabel: '#5b6478', rowFaint: '#f3f5f9',
  18 |   selectedRow: '#f8faff', tableHeadBg: '#fafbfc', anomalyAmber: '#fdf9ef',
  19 |   anomalyRed: '#fdf6f6', greenBorder: '#b7e0c3', amberBorder: '#f2ddb0',
  20 |   amberDark: '#7a4a10', grayBar: '#cbd5e1', authStage: '#f2f4f8',
  21 |   darkAccent: '#60a5fa', codeBlue: '#93c5fd', codePink: '#f472b6',
  22 |   codeGreen: '#4ade80', codeRed: '#f87171', sidebarBg: '#fbfcfe',
  23 | };
  24 | 
  25 | test('P exposes every mockup frame color under its checklist §0.2 name', async ({ page }) => {
  26 |   await page.goto('/app');
  27 |   const tokens = await page.evaluate(() => window.__TOKENS__);
  28 |   expect(tokens, 'window.__TOKENS__ hook missing (main.jsx)').toBeTruthy();
  29 |   for (const [name, hex] of Object.entries(EXPECTED_P)) {
  30 |     expect(tokens.P[name], `P.${name}`).toBe(hex);
  31 |   }
  32 |   // committed language (R15S2E3) unchanged
  33 |   expect(tokens.P.accent).toBe('#2563eb');
  34 |   expect(tokens.P.bg).toBe('#f7f8fa');
  35 |   expect(tokens.P.border).toBe('#e4e8ef');
  36 | });
  37 | 
  38 | test('typography scale T carries the frame roles', async ({ page }) => {
  39 |   await page.goto('/app');
  40 |   const T = (await page.evaluate(() => window.__TOKENS__))?.T;
> 41 |   expect(T, 'T scale missing from tokens').toBeTruthy();
     |                                            ^ Error: T scale missing from tokens
  42 |   expect(T.pageTitle).toMatchObject({ fontSize: 21, fontWeight: 600 });
  43 |   expect(T.cardTitle).toMatchObject({ fontSize: 13.5, fontWeight: 600 });
  44 |   expect(T.microLabel).toMatchObject({
  45 |     fontSize: 9.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' });
  46 |   expect(T.kpi).toMatchObject({ fontSize: 26, fontWeight: 600 });
  47 |   expect(T.tableHeader).toMatchObject({
  48 |     fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' });
  49 |   expect(String(T.kpi.fontFamily)).toContain('Mono');
  50 |   expect(String(T.microLabel.fontFamily)).toContain('Mono');
  51 | });
  52 | 
  53 | test('lint wall rejects new imports of the legacy C palette', async () => {
  54 |   const eslint = path.join(REPO, 'node_modules', 'eslint', 'bin', 'eslint.js');
  55 |   expect(fs.existsSync(eslint), 'eslint devDependency missing').toBe(true);
  56 | 
  57 |   // probe: a NEW file importing C must fail
  58 |   const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiq_lint_'));
  59 |   const probe = path.join(probeDir, 'Probe.jsx');
  60 |   fs.writeFileSync(probe, "import { C } from '../tokens';\nexport default () => <div style={{ color: C.primary }} />;\n");
  61 |   let failed = false;
  62 |   try {
  63 |     execFileSync('node', [eslint, '--no-ignore', '--config',
  64 |       path.join(REPO, 'eslint.config.mjs'), probe], { stdio: 'pipe' });
  65 |   } catch { failed = true; }
  66 |   expect(failed, 'probe importing C must be rejected').toBe(true);
  67 | 
  68 |   // current tree (legacy consumers grandfathered via ignores) must pass
  69 |   let cleanOk = true; let out = '';
  70 |   try {
  71 |     execFileSync('node', [eslint, path.join(REPO, 'client', 'src')],
  72 |       { stdio: 'pipe', cwd: REPO });
  73 |   } catch (e) { cleanOk = false; out = String(e.stdout || e); }
  74 |   expect(cleanOk, `client/src must lint clean (grandfather list stale?)\n${out}`).toBe(true);
  75 | });
  76 | 
```