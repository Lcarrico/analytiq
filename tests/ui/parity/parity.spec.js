// PAR-1 — mockup-derived design-parity suite (generated from inventory.json,
// which is extracted from docs/specs/mockups/*.dc.html — the frame IS the
// spec). One describe per frame: a component-presence test (every structural
// label from the frame must exist on the route), a tab-strip test (each tab
// present + clickable), and a cross-link flow test (each frame link
// navigates to its target route).
//
// This suite is a SCOREBOARD, not a gate: unbuilt frames (R22–R29 backlog)
// are expected to fail until their stories land. Run via `npm run
// test:parity`; the main regression suite ignores this directory.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// import.meta is unavailable under Playwright's CJS transpile — resolve the
// inventory through the repo root like the other specs do (BOOT_PY env).
const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();
const inv = JSON.parse(fs.readFileSync(
  path.join(REPO, 'tests', 'ui', 'parity', 'inventory.json'), 'utf8'));

const norm = s => s.replace(/\s+/g, ' ').trim().toLowerCase();

// param routes get a demo entity id; flows to param routes assert the prefix
const resolveRoute = r => r.replace(':id', '1').replace(':token', 'demo')
                           .replace('/:persona', '/executives').replace('*', '');
const routePrefix = r => r.split('/:')[0].replace('*', '');

async function pageText(page) {
  // one rendering-aware scan instead of 700 individually-waiting locators
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(350);              // let data widgets settle
  return norm(await page.evaluate(() => document.body.innerText || ''));
}

for (const fr of inv.frames) {
  const title = `${fr.file.replace('.dc.html', '')} › #${fr.frame}`;

  if (!fr.route) {
    // context frames (inspector panels, error template board) have no route
    // of their own — they are asserted by their owning stories' specs.
    test.describe(title, () => {
      test.skip(`context frame — no standalone route; covered by story specs`, () => {});
    });
    continue;
  }

  test.describe(title, () => {
    test(`components exist on ${fr.route}`, async ({ page }) => {
      await page.goto(resolveRoute(fr.route));
      const body = await pageText(page);
      const is404 = await page.evaluate(() =>
        !!document.querySelector('[data-testid="notfound-page"]'));
      expect.soft(is404, `route ${fr.route} should not 404`).toBe(false);
      for (const label of fr.labels) {
        expect.soft(body.includes(norm(label)),
          `missing component: ${JSON.stringify(label)}`).toBe(true);
      }
    });

    if (fr.tabs.length) {
      test(`tab strip (${fr.tabs.length} tabs)`, async ({ page }) => {
        await page.goto(resolveRoute(fr.route));
        const body = await pageText(page);
        for (const tab of fr.tabs) {
          const present = body.includes(norm(tab));
          expect.soft(present, `missing tab: ${tab}`).toBe(true);
          if (present) {
            const loc = page.getByText(tab, { exact: true }).first();
            try { await loc.click({ timeout: 1200, trial: false }); }
            catch { expect.soft(false, `tab not clickable: ${tab}`).toBe(true); }
          }
        }
      });
    }

    if (fr.links.length) {
      test(`cross-links navigate (${fr.links.length} links)`, async ({ page }) => {
        for (const l of fr.links) {
          await page.goto(resolveRoute(fr.route));
          const loc = page.getByText(l.text, { exact: true }).first();
          let visible = false;
          try { visible = await loc.isVisible(); } catch { /* absent */ }
          if (!visible) {
            expect.soft(false, `link source missing: "${l.text}" → ${l.target_route}`).toBe(true);
            continue;
          }
          try {
            await loc.click({ timeout: 1200 });
            await expect.poll(() => new URL(page.url()).pathname, { timeout: 1500 })
              .toContain(routePrefix(l.target_route));
          } catch {
            expect.soft(false,
              `flow broken: "${l.text}" should reach ${l.target_route}`).toBe(true);
          }
        }
      });
    }
  });
}
