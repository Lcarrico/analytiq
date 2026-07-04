# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r21s1_tokens.spec.js >> lint wall rejects new imports of the legacy C palette
- Location: tests/ui/r21s1_tokens.spec.js:52:5

# Error details

```
Error: client/src must lint clean (grandfather list stale?)

/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/Workbench.jsx
  90:13  error  Definition for rule 'react-hooks/exhaustive-deps' was not found  react-hooks/exhaustive-deps

✖ 1 problem (1 error, 0 warnings)



expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
  8  | 
  9  | // Repo root: run_ui.sh exports BOOT_PY=$REPO/tests/ui/boot_server.py; native
  10 | // runs fall back to cwd.
  11 | const REPO = process.env.BOOT_PY
  12 |   ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  13 |   : process.cwd();
  14 | 
  15 | const EXPECTED_P = {
  16 |   itemInk: '#47516b', boardLabel: '#5b6478', rowFaint: '#f3f5f9',
  17 |   selectedRow: '#f8faff', tableHeadBg: '#fafbfc', anomalyAmber: '#fdf9ef',
  18 |   anomalyRed: '#fdf6f6', greenBorder: '#b7e0c3', amberBorder: '#f2ddb0',
  19 |   amberDark: '#7a4a10', grayBar: '#cbd5e1', authStage: '#f2f4f8',
  20 |   darkAccent: '#60a5fa', codeBlue: '#93c5fd', codePink: '#f472b6',
  21 |   codeGreen: '#4ade80', codeRed: '#f87171', sidebarBg: '#fbfcfe',
  22 | };
  23 | 
  24 | test('P exposes every mockup frame color under its checklist §0.2 name', async ({ page }) => {
  25 |   await page.goto('/app');
  26 |   const tokens = await page.evaluate(() => window.__TOKENS__);
  27 |   expect(tokens, 'window.__TOKENS__ hook missing (main.jsx)').toBeTruthy();
  28 |   for (const [name, hex] of Object.entries(EXPECTED_P)) {
  29 |     expect(tokens.P[name], `P.${name}`).toBe(hex);
  30 |   }
  31 |   // committed language (R15S2E3) unchanged
  32 |   expect(tokens.P.accent).toBe('#2563eb');
  33 |   expect(tokens.P.bg).toBe('#f7f8fa');
  34 |   expect(tokens.P.border).toBe('#e4e8ef');
  35 | });
  36 | 
  37 | test('typography scale T carries the frame roles', async ({ page }) => {
  38 |   await page.goto('/app');
  39 |   const T = (await page.evaluate(() => window.__TOKENS__))?.T;
  40 |   expect(T, 'T scale missing from tokens').toBeTruthy();
  41 |   expect(T.pageTitle).toMatchObject({ fontSize: 21, fontWeight: 600 });
  42 |   expect(T.cardTitle).toMatchObject({ fontSize: 13.5, fontWeight: 600 });
  43 |   expect(T.microLabel).toMatchObject({
  44 |     fontSize: 9.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' });
  45 |   expect(T.kpi).toMatchObject({ fontSize: 26, fontWeight: 600 });
  46 |   expect(T.tableHeader).toMatchObject({
  47 |     fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' });
  48 |   expect(String(T.kpi.fontFamily)).toContain('Mono');
  49 |   expect(String(T.microLabel.fontFamily)).toContain('Mono');
  50 | });
  51 | 
  52 | test('lint wall rejects new imports of the legacy C palette', async () => {
  53 |   const eslint = path.join(REPO, 'node_modules', 'eslint', 'bin', 'eslint.js');
  54 |   expect(fs.existsSync(eslint), 'eslint devDependency missing').toBe(true);
  55 | 
  56 |   // probe: a NEW file importing C must fail. Flat-config patterns resolve
  57 |   // relative to the config's directory, so the probe must live inside the
  58 |   // repo tree (a /tmp probe silently matches no config → passes).
  59 |   const probeDir = path.join(REPO, 'client', 'src', '.lint-probe');
  60 |   fs.mkdirSync(probeDir, { recursive: true });
  61 |   const probe = path.join(probeDir, 'Probe.jsx');
  62 |   fs.writeFileSync(probe, "import { C } from '../tokens';\nexport default () => <div style={{ color: C.primary }} />;\n");
  63 |   let failed = false;
  64 |   try {
  65 |     execFileSync('node', [eslint, probe], { stdio: 'pipe', cwd: REPO });
  66 |   } catch { failed = true; } finally {
  67 |     fs.rmSync(probeDir, { recursive: true, force: true });
  68 |   }
  69 |   expect(failed, 'probe importing C must be rejected').toBe(true);
  70 | 
  71 |   // current tree (legacy consumers grandfathered via ignores) must pass
  72 |   let cleanOk = true; let out = '';
  73 |   try {
  74 |     execFileSync('node', [eslint, path.join(REPO, 'client', 'src')],
  75 |       { stdio: 'pipe', cwd: REPO });
  76 |   } catch (e) { cleanOk = false; out = String(e.stdout || e); }
> 77 |   expect(cleanOk, `client/src must lint clean (grandfather list stale?)\n${out}`).toBe(true);
     |                                                                                   ^ Error: client/src must lint clean (grandfather list stale?)
  78 | });
  79 | 
```