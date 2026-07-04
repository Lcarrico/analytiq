// PAR-2 — curated cross-page flow suite (GATING, runs in the main suite).
// The mockups' cross-links define the app's navigation contract; these are
// the journeys that must already work on the rebuilt surfaces. As R22–R29
// stories land, promote their flows from parity.spec.js into here.
import { test, expect } from '@playwright/test';

const at = page => new URL(page.url()).pathname;

test('sidebar reaches all 13 areas at their mockup routes', async ({ page }) => {
  await page.goto('/app');
  const expected = [
    ['Home', '/app'], ['Create', '/app/create/new'], ['Artifacts', '/app/artifacts'],
    ['Data', '/app/data/sources'], ['Semantic Layer', '/app/semantic'],
    ['Gold Tables', '/app/gold'], ['Models', '/app/models'], ['Alerts', '/app/alerts'],
    ['Governance', '/app/governance'], ['Team', '/app/team'], ['Admin', '/app/admin/platform'],
    ['Billing', '/app/billing'], ['Settings', '/app/settings/profile'],
  ];
  for (const [label, route] of expected) {
    await page.getByTestId('app-sidebar').getByRole('link', { name: label, exact: true }).click();
    await expect.poll(() => at(page), { timeout: 5000 }).toBe(route);
    // every area renders inside the shell (topbar persists), never a 404
    await expect(page.getByTestId('topbar')).toBeVisible();
    await expect(page.getByTestId('notfound-page')).toHaveCount(0);
  }
});

test('home widgets deep-link per the frame', async ({ page }) => {
  await page.goto('/app');
  await page.getByText('View library →').click();
  await expect.poll(() => at(page)).toBe('/app/artifacts');
  await page.goto('/app');
  await page.getByText('Details →').click();
  await expect.poll(() => at(page)).toBe('/app/governance');
  await page.goto('/app');
  await page.getByText('All alerts →').click();
  await expect.poll(() => at(page)).toBe('/app/alerts');
  await page.goto('/app');
  await page.getByText('Usage & limits →').click();       // admin widget
  await expect.poll(() => at(page)).toBe('/app/billing/usage');
});

test('home hero Create button seeds the workbench', async ({ page }) => {
  await page.goto('/app');
  await page.getByTestId('hero-input').fill('Weekend vs weekday margin by region');
  await page.getByTestId('hero-create').click();
  await expect.poll(() => at(page) + new URL(page.url()).search).toContain('/app/create/new?q=');
  await expect(page.getByText('Weekend vs weekday margin by region').first()).toBeVisible();
});

test('topbar chrome flows: search overlay, bell drawer, help link', async ({ page }) => {
  await page.goto('/app');
  await page.getByTestId('global-search').click();
  await expect(page.getByTestId('search-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByTestId('bell').click();
  await expect(page.getByTestId('notifications-drawer')).toBeVisible();
  await page.getByTestId('notifications-drawer').getByRole('button', { name: 'Close' }).click();
  expect(await page.getByTestId('help-btn').getAttribute('href')).toBe('/app/help');
});

test('artifacts library toggles views and persists via URL', async ({ page, request }) => {
  // own-entities policy: an empty workspace renders the empty state, so seed
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  await request.post(`/api/sessions/${sess.id}/save_artifact`, { data: { title: `Flow ${Date.now()}` } });
  await page.goto('/app/artifacts');
  await page.getByTestId('view-toggle-table').click();
  await expect(page.getByTestId('artifacts-table')).toBeVisible();
  await page.getByTestId('view-toggle-cards').click();
});

test('marketing front door: landing → Start free → app; pricing renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('marketing-landing')).toBeVisible();
  await page.getByText('Start free', { exact: false }).first().click();
  await expect.poll(() => at(page)).toBe('/app');
  await page.goto('/pricing');
  await expect(page.getByText('Starter')).toBeVisible();
});

test('workbench round trip: question → plan → logo back to home', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
});
