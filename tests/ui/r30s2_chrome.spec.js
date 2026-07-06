// R30S2E1-US1 (UI) — Workbench chrome (`Create Workbench.dc.html`): a dedicated
// 56px session topbar (title · mono session meta · ● GOVERNED · autosaved ·
// Versions · Share · avatar) replaces the workspace topbar on /app/create/*;
// the collapsed 64px icon rail is KEPT (approved deviation, Reconciliation (e)).
// Other /app routes keep the workspace topbar + expandable sidebar.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('create route: session topbar replaces workspace topbar; rail forced to 64', async ({ page }) => {
  await page.goto('/app/create/new');

  const bar = page.getByTestId('session-topbar');
  await expect(bar).toBeVisible();
  expect(await bar.evaluate(el => el.offsetHeight)).toBe(56);
  await expect(page.getByTestId('topbar')).toHaveCount(0);          // workspace topbar gone here

  // rail kept, icon-only (approved deviation)
  expect(await page.getByTestId('app-sidebar').evaluate(el => el.offsetWidth)).toBe(64);

  // chrome contents pre-session
  await expect(bar.getByTestId('wb-title')).toHaveText('New analysis');
  await expect(bar.getByTestId('wb-versions')).toBeVisible();
  await expect(bar.getByTestId('wb-share')).toBeVisible();
  await expect(bar.getByTestId('wb-avatar')).toBeVisible();
});

test('after planning: title, mono session meta, GOVERNED pill, autosaved stamp', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });

  const bar = page.getByTestId('session-topbar');
  await expect(bar.getByTestId('wb-title')).toContainText(/Forecast net revenue/);
  const meta = bar.getByTestId('wb-session-meta');
  await expect(meta).toContainText(/session · \d+/);
  expect(await css(meta, 'fontFamily')).toContain('Mono');
  // R37S1E1: trust is evidence-bound — a fresh workspace has no semantic
  // schema, so the honest chip here is UNGOVERNED (r37s1_trust covers both).
  await expect(bar.getByTestId('wb-ungoverned')).toContainText('UNGOVERNED');
  const saved = bar.getByTestId('wb-autosaved');
  await expect(saved).toContainText(/autosaved/);
  expect(await css(saved, 'fontFamily')).toContain('Mono');
});

test('other app routes keep the workspace topbar and expandable sidebar', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByTestId('topbar')).toBeVisible();
  await expect(page.getByTestId('session-topbar')).toHaveCount(0);
  expect(await page.getByTestId('app-sidebar').evaluate(el => el.offsetWidth)).toBe(240);
});
