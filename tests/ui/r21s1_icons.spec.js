// R21S1E3-US1 (UI) — SVG icon set replaces every emoji glyph; icons.jsx
// exports the 15px stroke set extracted from App Home.dc.html.
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();

test('client/src contains zero emoji glyphs (grep-enforced)', async () => {
  // Emoji / pictograph / dingbat / misc-symbol ranges + the specific glyphs
  // the legacy chrome used (⌂ ✦ ▦ ⬡ ◈ ▤ ⚗ ◉ ⛭ ◇ ⚙ ❖ ○ 🔔 ❄️ 🐘 🔵 🔴 ⚡ 🔌 ✨ 📊).
  let out = '';
  try {
    out = execFileSync('grep', ['-rnP',
      '[\\x{1F300}-\\x{1FAFF}]|[\\x{2600}-\\x{27BF}]|[\\x{2B00}-\\x{2BFF}]|[\\x{25A0}-\\x{25FF}]|[\\x{2190}-\\x{21FF}]|[\\x{2300}-\\x{23FF}]',
      '--include=*.jsx', '--include=*.js',
      path.join(REPO, 'client', 'src')], { encoding: 'utf8' });
  } catch (e) {
    // grep exit 1 = no matches = what we want
    out = String(e.stdout || '');
  }
  // Frame-language glyphs the mockups themselves use in COPY are allowed:
  // arrows, ⏎ keycap, ✕ close, ✓/✗ gates, ✎ edit, ● status dot, ⌘ keycap.
  const ALLOWED = /[→←↑↓⏎✕✓✗✎●⌘«»]/gu;
  const BANNED = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2300}-\u{23FF}]/u;
  const hits = out.split('\n').filter(Boolean)
    .filter(l => BANNED.test(l.replace(ALLOWED, '')));
  expect(hits, `emoji/pictograph glyphs remain:\n${hits.slice(0, 20).join('\n')}`).toEqual([]);
});

test('icons.jsx exports the sidebar/topbar set and the shared Logo', async () => {
  const src = fs.readFileSync(path.join(REPO, 'client', 'src', 'components', 'icons.jsx'), 'utf8');
  for (const name of ['Home', 'Create', 'Artifacts', 'Data', 'Semantic', 'Gold',
                      'Models', 'Alerts', 'Governance', 'Team', 'Admin', 'Billing',
                      'Settings', 'Search', 'Bell', 'Help', 'Caret', 'Close',
                      'Check', 'Warning', 'Lock', 'External', 'Copy', 'Eye', 'Filter']) {
    expect(src.includes(`${name}:`) || src.includes(`function ${name}`),
           `icon ${name} missing`).toBe(true);
  }
  expect(src).toContain('export function Logo');
});

test('sidebar items render 15px stroke SVGs, not text glyphs', async ({ page }) => {
  await page.goto('/app');
  const sidebar = page.getByTestId('app-sidebar');
  const homeLink = sidebar.getByRole('link', { name: 'Home', exact: true });
  await expect(homeLink.locator('svg')).toBeVisible();
  const [w, h] = await homeLink.locator('svg').evaluate(el =>
    [el.getAttribute('width'), el.getAttribute('height')]);
  expect(w).toBe('15');
  expect(h).toBe('15');
});
