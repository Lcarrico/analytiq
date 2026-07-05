// R30S1E2-US1 (UI) — Artifacts Library Frame 01 at parity: 220px filter rail
// (FILTERS checkboxes + FOLDERS), header h1 "Artifacts {n}" + single filter
// input + Cards/Table toggle + "+ New dashboard", 3-col card grid (thumb zone,
// type/health pills, owner avatar + mono age, per-card ⋯ menu), dashed ghost
// tile → workbench. Reconciliation (d): ROI report / Sandbox / Health
// dashboard live ONLY behind ⋯ menus (ROI per-artifact; Sandbox + Health
// dashboard proved workspace-level → header-level ⋯). §5.1: "FTS" de-leaked.
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();

// same seeding path as tests/ui/r22s1_home.spec.js seedArtifact
async function seedArtifact(request, title) {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  return (await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json());
}

// direct create (zero-key server defaults to admin) — lets us pin type/dq
async function seedRaw(request, body) {
  const r = await request.post('/api/artifacts', { data: body });
  expect(r.status()).toBe(201);
  return r.json();
}

test('frame structure: 220px rail (FILTERS + FOLDERS), header, no FTS leak', async ({ page, request }) => {
  const title = `Lib Frame ${Date.now() % 1e6}`;
  await seedArtifact(request, title);
  const total = (await (await request.get('/api/artifacts')).json()).total;

  await page.goto('/app/artifacts');

  // ── filter rail: 220px, mono FILTERS label, 6 checkboxes, divider, FOLDERS
  const rail = page.getByTestId('artifacts-rail');
  await expect(rail).toBeVisible();
  expect(await rail.evaluate(el => el.offsetWidth)).toBe(220);
  const filtersLabel = rail.getByText('FILTERS', { exact: true });
  await expect(filtersLabel).toBeVisible();
  expect(await css(filtersLabel, 'fontFamily')).toContain('Mono');
  for (const key of ['mine', 'shared', 'predictive', 'warnings', 'public', 'review']) {
    await expect(rail.getByTestId(`rail-filter-${key}`)).toBeVisible();
  }
  for (const label of ['Created by me', 'Shared with me', 'Predictive',
                       'Has warnings', 'Public links', 'Needs review']) {
    await expect(rail.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(rail.getByTestId('rail-divider')).toBeVisible();
  await expect(rail.getByText('FOLDERS', { exact: true })).toBeVisible();
  for (const folder of ['Revenue', 'Operations', 'Customer', 'Finance']) {
    await expect(rail.getByTestId(`rail-folder-${folder.toLowerCase()}`)).toBeVisible();
  }
  const count0 = rail.getByTestId('rail-folder-revenue').locator('span').last();
  expect(await css(count0, 'fontFamily')).toContain('Mono');

  // ── main column: p 24 28, h1 "Artifacts {n}" with live mono count
  const main = page.getByTestId('artifacts-main');
  expect(await css(main, 'paddingTop')).toBe('24px');
  expect(await css(main, 'paddingLeft')).toBe('28px');
  await expect(page.locator('main h1')).toHaveText('Artifacts');
  const count = page.getByTestId('artifacts-count');
  await expect(count).toHaveText(String(total));
  expect(await css(count, 'fontFamily')).toContain('Mono');

  // ── SINGLE filter input 260×34 (frame placeholder); the FTS deep-search is gone
  const input = page.getByPlaceholder('Filter by name, tag, owner…');
  await expect(input).toBeVisible();
  expect(await input.evaluate(el => el.offsetWidth)).toBe(260);
  expect(await input.evaluate(el => el.offsetHeight)).toBe(34);
  await expect(page.locator('input')).toHaveCount(1);   // single filter input in main
  await expect(page.locator('[placeholder*="FTS"]')).toHaveCount(0);
  await expect(page.locator('[placeholder*="Deep search"]')).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toContain('FTS');

  // ── Cards/Table segmented toggle — active segment #0f172a with white text
  const cardsBtn = page.getByTestId('view-toggle-cards');
  await expect(cardsBtn).toBeVisible();
  expect(await css(cardsBtn, 'backgroundColor')).toBe('rgb(15, 23, 42)');
  expect(await css(cardsBtn, 'color')).toBe('rgb(255, 255, 255)');
  await expect(page.getByTestId('view-toggle-table')).toBeVisible();

  // ── "+ New dashboard" primary button (frame copy; replaces "+ New analysis")
  await expect(page.getByTestId('new-dashboard-btn')).toHaveText(/\+ New dashboard/);
  await expect(page.getByText('New analysis')).toHaveCount(0);

  // parity evidence (PAR-1): docs/specs/parity/artifacts-library/library.png @1440
  await page.setViewportSize({ width: 1440, height: 1100 });
  const dir = path.join(REPO, 'docs', 'specs', 'parity', 'artifacts-library');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'library.png'), fullPage: true });
});

test('card grid 3-col and card anatomy: thumb, title, pills, owner, age, ⋯', async ({ page, request }) => {
  const title = `Lib Card ${Date.now() % 1e6}`;
  const art = await seedArtifact(request, title);

  await page.goto('/app/artifacts');
  const grid = page.getByTestId('artifacts-grid');
  await expect(grid).toBeVisible();
  const cols = (await css(grid, 'gridTemplateColumns')).split(' ');
  expect(cols.length).toBe(3);                          // repeat(3, 1fr)
  expect(new Set(cols).size).toBe(1);                   // equal fractions
  expect(await css(grid, 'columnGap')).toBe('16px');

  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();

  // thumb zone: #f7f8fa, skeleton KPI strip + chart svg
  const thumb = row.getByTestId('card-thumb');
  expect(await css(thumb, 'backgroundColor')).toBe('rgb(247, 248, 250)');
  expect(await css(thumb, 'paddingTop')).toBe('14px');
  await expect(thumb.getByTestId('thumb-skeleton')).toBeVisible();
  await expect(thumb.locator('svg')).toBeVisible();

  // body: title 13.5/600 (frame wins over plan shorthand) + ⋯ trigger
  const cardTitle = row.getByTestId('card-title');
  await expect(cardTitle).toHaveText(title);
  expect(await css(cardTitle, 'fontSize')).toBe('13.5px');
  expect(await css(cardTitle, 'fontWeight')).toBe('600');
  await expect(row.getByTestId('card-menu-trigger')).toBeVisible();

  // pills row: TYPE (predictive purple) + health (● HEALTHY green w/ dot)
  const pill = row.getByTestId('type-pill');
  await expect(pill).toHaveText('PREDICTIVE');
  expect(await css(pill, 'backgroundColor')).toBe('rgb(243, 238, 254)');
  expect(await css(pill, 'color')).toBe('rgb(124, 58, 237)');
  const chip = row.getByTestId('health-chip');
  await expect(chip).toContainText('HEALTHY');
  const badge = chip.locator('[data-testid="status-badge"]');
  expect(await css(badge, 'backgroundColor')).toBe('rgb(232, 245, 236)');
  expect(await css(badge, 'color')).toBe('rgb(21, 128, 61)');
  await expect(chip.locator('[data-testid="badge-dot"]')).toBeVisible();

  // owner avatar + mono age
  await expect(row.getByTestId('card-owner')).toBeVisible();
  const age = row.getByTestId('card-age');
  await expect(age).toBeVisible();
  expect(await css(age, 'fontFamily')).toContain('Mono');

  // zero inline action buttons on the card (the ⋯ menu owns them all)
  await expect(row.getByRole('button', { name: 'Open' })).toHaveCount(0);
  await expect(row.getByRole('button', { name: 'Preview' })).toHaveCount(0);
  await expect(row.getByRole('button', { name: 'Share' })).toHaveCount(0);
});

test('rail filters + single filter input narrow the grid (combined)', async ({ page, request }) => {
  const stamp = Date.now() % 1e6;
  const pArt = await seedArtifact(request, `Rail P ${stamp}`);
  const dArt = await seedRaw(request, { title: `Rail D ${stamp}`, type: 'Descriptive', dq_status: 'warn' });

  await page.goto('/app/artifacts');
  await page.getByPlaceholder('Filter by name, tag, owner…').fill(`Rail `);
  const pRow = page.locator(`[data-testid="artifact-row-${pArt.id}"]`);
  const dRow = page.locator(`[data-testid="artifact-row-${dArt.id}"]`);
  await expect(pRow).toBeVisible();
  await expect(dRow).toBeVisible();

  // DASHBOARD blue pill + amber warnings pill on the direct-created artifact
  await expect(dRow.getByTestId('type-pill')).toHaveText('DASHBOARD');
  expect(await css(dRow.getByTestId('type-pill'), 'backgroundColor')).toBe('rgb(239, 244, 255)');
  await expect(dRow.getByTestId('health-chip')).toContainText('1 WARNING');
  const warnBadge = dRow.getByTestId('health-chip').locator('[data-testid="status-badge"]');
  expect(await css(warnBadge, 'backgroundColor')).toBe('rgb(253, 243, 227)');
  expect(await css(warnBadge, 'color')).toBe('rgb(180, 83, 9)');

  const check = key => page.getByTestId(`rail-filter-${key}`).locator('[role="checkbox"]').click();

  await check('predictive');            // type filter narrows out the dashboard
  await expect(dRow).toHaveCount(0);
  await expect(pRow).toBeVisible();

  await check('warnings');              // combined: predictive AND has-warnings → none
  await expect(pRow).toHaveCount(0);
  await expect(dRow).toHaveCount(0);

  await check('predictive');            // drop type filter → warn artifact only
  await expect(dRow).toBeVisible();
  await expect(pRow).toHaveCount(0);

  await check('warnings');              // all rail filters off again
  await expect(pRow).toBeVisible();

  // text filter still narrows on top of the rail
  await page.getByPlaceholder('Filter by name, tag, owner…').fill(`Rail P ${stamp}`);
  await expect(pRow).toBeVisible();
  await expect(dRow).toHaveCount(0);
});

test('⋯ menus own ROI report / Sandbox / Health dashboard (Reconciliation (d))', async ({ page, request }) => {
  const title = `Lib Menu ${Date.now() % 1e6}`;
  const art = await seedArtifact(request, title);

  await page.goto('/app/artifacts');
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();

  // §1.7 de-inline: with every menu closed, none of the three ACTIONS render.
  // (Scoped to buttons — artifact titles like "Workspace ROI Report" from
  // sibling specs in the same server session must not flake this. R30S1E2-US1)
  await expect(page.getByRole('button', { name: /ROI report/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Sandbox/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Health dashboard/i })).toHaveCount(0);

  // per-artifact ⋯: carries ROI report (decision (d)) + migrated affordances
  await row.getByTestId('card-menu-trigger').click();
  const menu = page.getByTestId('card-menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByTestId('roi-report-btn')).toBeVisible();
  for (const item of ['Open', 'Preview', 'Favorite', 'Insights', 'Public link',
                      'Embed token', 'Activity', 'Share', 'Delete']) {
    await expect(menu.getByText(item, { exact: false }).first()).toBeVisible();
  }
  await expect(menu.getByText('Sandbox')).toHaveCount(0);          // workspace-level → header ⋯
  await expect(menu.getByText('Health dashboard')).toHaveCount(0);

  // ROI handler still works from the menu (generates a native artifact)
  await menu.getByTestId('roi-report-btn').click();
  await expect(page.getByText('ROI report generated as a native artifact.')).toBeVisible();
  await expect(page.getByText('Workspace ROI Report').first()).toBeVisible();

  // header-level ⋯: Sandbox view + Health dashboard (workspace-level handlers)
  await page.getByTestId('workspace-menu-trigger').click();
  const ws = page.getByTestId('workspace-menu');
  await expect(ws).toBeVisible();
  await expect(ws.getByTestId('sandbox-toggle')).toContainText('Sandbox');
  await expect(ws.getByTestId('health-dashboard-btn')).toContainText('Health dashboard');
  await expect(ws.getByText('ROI report')).toHaveCount(0);

  // health-dashboard handler works (creates the workspace health artifact)
  await ws.getByTestId('health-dashboard-btn').click();
  await expect(page.getByText(/Workspace health dashboard created/)).toBeVisible();

  // sandbox handler works: production artifact hidden in sandbox view, back visible
  await page.getByTestId('workspace-menu-trigger').click();
  await page.getByTestId('workspace-menu').getByTestId('sandbox-toggle').click();
  await expect(row).toHaveCount(0);
  await page.getByTestId('workspace-menu-trigger').click();
  await page.getByTestId('workspace-menu').getByTestId('sandbox-toggle').click();
  await expect(row).toBeVisible();
});

test('dashed ghost tile navigates to the workbench create route', async ({ page }) => {
  await page.goto('/app/artifacts');
  const ghost = page.getByTestId('ghost-tile');
  await expect(ghost).toBeVisible();                 // renders even on an empty grid
  await expect(ghost).toContainText('New dashboard from a question');
  expect(await css(ghost, 'borderTopStyle')).toBe('dashed');
  // authored value: headless Chromium floors the 1.5px USED border width to
  // 1px at DPR 1, so assert the author style, not the used value (R30S1E2-US1)
  expect(await ghost.evaluate(el => el.style.borderTopWidth)).toBe('1.5px');
  expect(await css(ghost, 'minHeight')).toBe('180px');
  await ghost.click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/create/new');
});

test('Cards/Table toggle switches to the R15S2 table and back', async ({ page, request }) => {
  const title = `Lib Table ${Date.now() % 1e6}`;
  await seedArtifact(request, title);

  await page.goto('/app/artifacts');
  await page.getByTestId('view-toggle-table').click();
  const table = page.getByTestId('artifacts-table');
  await expect(table).toBeVisible();                 // existing DataTable until R30S1E3
  await expect(table.getByText(title)).toBeVisible();
  await expect(page.getByTestId('artifacts-grid')).toHaveCount(0);
  await page.getByTestId('view-toggle-cards').click();
  await expect(page.getByTestId('artifacts-grid')).toBeVisible();
  await expect(table).toHaveCount(0);
});
