// R31S1E3-US1 (UI) — onboarding ×4 (`Onboarding.dc.html`): branding wizard
// (accent swatches drive a LIVE preview and persist through PUT /api/branding),
// starting-mode cards (sample = FASTEST), first-dataset health preview over
// the REAL governance/profiling substrate (connection → run → cataloged
// tables), data-aware template picker. Register step 4 hands off here.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('workspace branding: swatches recolor the live preview and persist', async ({ page, request }) => {
  await page.goto('/onboarding/workspace');
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);
  await expect(page.getByText('WORKSPACE SETUP')).toBeVisible();
  await expect(page.getByText(/STEP 5 \/ 5 · BRANDING/)).toBeVisible();
  await expect(page.getByText('Make it yours')).toBeVisible();

  // pick the purple accent → live preview area recolors
  await page.getByTestId('swatch-7c3aed').evaluate(el => el.click());
  await expect.poll(async () =>
    page.getByTestId('preview-accent').getAttribute('data-accent')).toBe('#7c3aed');
  await expect(page.getByText(/applies to: dashboards · share pages · email digests/)).toBeVisible();

  // finish persists the accent through the real branding API
  await page.getByTestId('branding-finish').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/onboarding/start');
  const branding = await (await request.get('/api/branding')).json();
  expect(branding.primary_color).toBe('#7c3aed');
});

test('starting mode: five cards, sample fastest, selection moves', async ({ page }) => {
  await page.goto('/onboarding/start');
  await expect(page.getByText('Where’s your data?')).toBeVisible();
  const cards = page.locator('[data-testid^="mode-"]');
  await expect(cards).toHaveCount(5);
  await expect(page.getByTestId('mode-sample').getByText('FASTEST')).toBeVisible();
  expect(await css(page.getByTestId('mode-sample'), 'borderTopWidth')).toBe('2px');
  await page.getByTestId('mode-warehouse').evaluate(el => el.click());
  expect(await css(page.getByTestId('mode-warehouse'), 'borderTopColor')).toBe('rgb(37, 99, 235)');
  await expect(page.getByText(/All connections are read-only/)).toBeVisible();
  await page.getByTestId('start-continue').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/onboarding/source-health');
});

test('source health preview profiles the sample source for real', async ({ page }) => {
  await page.goto('/onboarding/source-health');
  await expect(page.getByText(/onboarding · 2 of 3/)).toBeVisible();
  await expect(page.getByText('Exit setup')).toBeVisible();

  // real profiling: banner + KPI cards + table rows arrive from the substrate
  await expect(page.getByTestId('safe-banner')).toContainText('Safe to analyze', { timeout: 20_000 });
  await expect(page.getByTestId('safe-banner').getByText(/HEALTH \d+\/100/)).toBeVisible();
  expect(await page.getByTestId('onb-kpis').locator('[data-testid="kpi-card"]').count()).toBe(4);
  const rows = page.locator('[data-testid^="table-row-"]');
  expect(await rows.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('[data-testid="status-badge"]').first()).toBeVisible();

  // sticky footer → templates
  await expect(page.getByTestId('onb-footer')).toContainText(/profiling completed/i);
  await page.getByTestId('onb-continue').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/onboarding/templates');
});

test('template picker: three data-aware cards; picking one enters the app', async ({ page }) => {
  await page.goto('/onboarding/templates');
  await expect(page.getByText('Recommended for your data')).toBeVisible();
  const cards = page.locator('[data-testid^="tpl-"]');
  await expect(cards).toHaveCount(3);
  await expect(page.getByText(/BEST MATCH/)).toBeVisible();
  await expect(page.getByTestId('skip-blank')).toBeVisible();
  await cards.first().evaluate(el => el.click());
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 8000 })
    .toMatch(/^\/app\/create\/new$|^\/app$/);
});
