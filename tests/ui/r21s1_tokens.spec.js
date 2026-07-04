// R21S1E1-US1/US2 (UI) — Design-Parity Program: single design-token source.
// US1: every mockup color importable from P (checklist §0.2 names) + T scale.
// US2: lint wall — importing the legacy C palette fails `npm run lint:tokens`.
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

// Repo root: run_ui.sh exports BOOT_PY=$REPO/tests/ui/boot_server.py; native
// runs fall back to cwd.
const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();

const EXPECTED_P = {
  itemInk: '#47516b', boardLabel: '#5b6478', rowFaint: '#f3f5f9',
  selectedRow: '#f8faff', tableHeadBg: '#fafbfc', anomalyAmber: '#fdf9ef',
  anomalyRed: '#fdf6f6', greenBorder: '#b7e0c3', amberBorder: '#f2ddb0',
  amberDark: '#7a4a10', grayBar: '#cbd5e1', authStage: '#f2f4f8',
  darkAccent: '#60a5fa', codeBlue: '#93c5fd', codePink: '#f472b6',
  codeGreen: '#4ade80', codeRed: '#f87171', sidebarBg: '#fbfcfe',
};

test('P exposes every mockup frame color under its checklist §0.2 name', async ({ page }) => {
  await page.goto('/app');
  const tokens = await page.evaluate(() => window.__TOKENS__);
  expect(tokens, 'window.__TOKENS__ hook missing (main.jsx)').toBeTruthy();
  for (const [name, hex] of Object.entries(EXPECTED_P)) {
    expect(tokens.P[name], `P.${name}`).toBe(hex);
  }
  // committed language (R15S2E3) unchanged
  expect(tokens.P.accent).toBe('#2563eb');
  expect(tokens.P.bg).toBe('#f7f8fa');
  expect(tokens.P.border).toBe('#e4e8ef');
});

test('typography scale T carries the frame roles', async ({ page }) => {
  await page.goto('/app');
  const T = (await page.evaluate(() => window.__TOKENS__))?.T;
  expect(T, 'T scale missing from tokens').toBeTruthy();
  expect(T.pageTitle).toMatchObject({ fontSize: 21, fontWeight: 600 });
  expect(T.cardTitle).toMatchObject({ fontSize: 13.5, fontWeight: 600 });
  expect(T.microLabel).toMatchObject({
    fontSize: 9.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' });
  expect(T.kpi).toMatchObject({ fontSize: 26, fontWeight: 600 });
  expect(T.tableHeader).toMatchObject({
    fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' });
  expect(String(T.kpi.fontFamily)).toContain('Mono');
  expect(String(T.microLabel.fontFamily)).toContain('Mono');
});

test('lint wall rejects new imports of the legacy C palette', async () => {
  const eslint = path.join(REPO, 'node_modules', 'eslint', 'bin', 'eslint.js');
  expect(fs.existsSync(eslint), 'eslint devDependency missing').toBe(true);

  // probe: a NEW file importing C must fail. Flat-config patterns resolve
  // relative to the config's directory, so the probe must live inside the
  // repo tree (a /tmp probe silently matches no config → passes).
  const probeDir = path.join(REPO, 'client', 'src', '.lint-probe');
  fs.mkdirSync(probeDir, { recursive: true });
  const probe = path.join(probeDir, 'Probe.jsx');
  fs.writeFileSync(probe, "import { C } from '../tokens';\nexport default () => <div style={{ color: C.primary }} />;\n");
  let failed = false;
  try {
    execFileSync('node', [eslint, probe], { stdio: 'pipe', cwd: REPO });
  } catch { failed = true; } finally {
    // Mount-safe cleanup (adaptation ledger 2026-07-04): some sandboxes mount
    // the repo with unlink forbidden (EPERM). Overwrite the probe with
    // lint-clean content so a leftover file can never trip `lint:tokens`;
    // .lint-probe/ is gitignored.
    try {
      fs.rmSync(probeDir, { recursive: true, force: true });
    } catch {
      fs.writeFileSync(probe, 'export {};\n');
    }
  }
  expect(failed, 'probe importing C must be rejected').toBe(true);

  // current tree (legacy consumers grandfathered via ignores) must pass
  let cleanOk = true; let out = '';
  try {
    execFileSync('node', [eslint, path.join(REPO, 'client', 'src')],
      { stdio: 'pipe', cwd: REPO });
  } catch (e) { cleanOk = false; out = String(e.stdout || e); }
  expect(cleanOk, `client/src must lint clean (grandfather list stale?)\n${out}`).toBe(true);
});
