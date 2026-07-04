# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r21s1_icons.spec.js >> icons.jsx exports the sidebar/topbar set and the shared Logo
- Location: tests/ui/r21s1_icons.spec.js:32:5

# Error details

```
Error: ENOENT: no such file or directory, open '/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/icons.jsx'
```

# Test source

```ts
  1  | // R21S1E3-US1 (UI) — SVG icon set replaces every emoji glyph; icons.jsx
  2  | // exports the 15px stroke set extracted from App Home.dc.html.
  3  | import { test, expect } from '@playwright/test';
  4  | import { execFileSync } from 'node:child_process';
  5  | import path from 'node:path';
  6  | import fs from 'node:fs';
  7  | 
  8  | const REPO = process.env.BOOT_PY
  9  |   ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  10 |   : process.cwd();
  11 | 
  12 | test('client/src contains zero emoji glyphs (grep-enforced)', async () => {
  13 |   // Emoji / pictograph / dingbat / misc-symbol ranges + the specific glyphs
  14 |   // the legacy chrome used (⌂ ✦ ▦ ⬡ ◈ ▤ ⚗ ◉ ⛭ ◇ ⚙ ❖ ○ 🔔 ❄️ 🐘 🔵 🔴 ⚡ 🔌 ✨ 📊).
  15 |   let out = '';
  16 |   try {
  17 |     out = execFileSync('grep', ['-rnP',
  18 |       '[\\x{1F300}-\\x{1FAFF}]|[\\x{2600}-\\x{27BF}]|[\\x{2B00}-\\x{2BFF}]|[\\x{25A0}-\\x{25FF}]|[\\x{2190}-\\x{21FF}]|[\\x{2300}-\\x{23FF}]',
  19 |       '--include=*.jsx', '--include=*.js',
  20 |       path.join(REPO, 'client', 'src')], { encoding: 'utf8' });
  21 |   } catch (e) {
  22 |     // grep exit 1 = no matches = what we want
  23 |     out = String(e.stdout || '');
  24 |   }
  25 |   const hits = out.split('\n').filter(Boolean)
  26 |     // arrows in copy strings like "Re-scan →" are allowed by the checklist
  27 |     // (frames use → in copy); everything else is not.
  28 |     .filter(l => !/→|←|↑|↓|⏎|✕|✓|✗|✎|…|·/.test(l) || /[\u{1F300}-\u{1FAFF}]|[☀-➿]|[⬀-⯿]|[■-◿]/u.test(l));
  29 |   expect(hits, `emoji/pictograph glyphs remain:\n${hits.slice(0, 20).join('\n')}`).toEqual([]);
  30 | });
  31 | 
  32 | test('icons.jsx exports the sidebar/topbar set and the shared Logo', async () => {
> 33 |   const src = fs.readFileSync(path.join(REPO, 'client', 'src', 'components', 'icons.jsx'), 'utf8');
     |                  ^ Error: ENOENT: no such file or directory, open '/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/icons.jsx'
  34 |   for (const name of ['Home', 'Create', 'Artifacts', 'Data', 'Semantic', 'Gold',
  35 |                       'Models', 'Alerts', 'Governance', 'Team', 'Admin', 'Billing',
  36 |                       'Settings', 'Search', 'Bell', 'Help', 'Caret', 'Close',
  37 |                       'Check', 'Warning', 'Lock', 'External', 'Copy', 'Eye', 'Filter']) {
  38 |     expect(src.includes(`${name}:`) || src.includes(`function ${name}`),
  39 |            `icon ${name} missing`).toBe(true);
  40 |   }
  41 |   expect(src).toContain('export function Logo');
  42 | });
  43 | 
  44 | test('sidebar items render 15px stroke SVGs, not text glyphs', async ({ page }) => {
  45 |   await page.goto('/app');
  46 |   const sidebar = page.getByTestId('app-sidebar');
  47 |   const homeLink = sidebar.getByRole('link', { name: 'Home', exact: true });
  48 |   await expect(homeLink.locator('svg')).toBeVisible();
  49 |   const [w, h] = await homeLink.locator('svg').evaluate(el =>
  50 |     [el.getAttribute('width'), el.getAttribute('height')]);
  51 |   expect(w).toBe('15');
  52 |   expect(h).toBe('15');
  53 | });
  54 | 
```