// R15S1E2-US1 (UI) — PRD app shell: light sidebar, collapse rail, top bar
// with ⌘K search overlay, breadcrumbs, bell, avatar menu.
import { test, expect } from '@playwright/test';

test('shell renders sidebar groups, breadcrumbs and topbar', async ({ page }) => {
  await page.goto('/app/artifacts');
  const sidebar = page.getByTestId('app-sidebar');
  await expect(sidebar).toBeVisible();
  for (const label of ['Home', 'Create', 'Artifacts', 'Data', 'Semantic Layer',
                       'Gold Tables', 'Models', 'Alerts', 'Governance', 'Team',
                       'Admin', 'Billing', 'Settings']) {
    await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  // R21S2E3 contract change: breadcrumb moved into PageHeader with the
  // frame's `acme-retail / <area>` format (was a shell strip w/ raw path).
  await expect(page.getByTestId('breadcrumbs')).toContainText('acme-retail / artifacts');
  await expect(page.getByTestId('topbar')).toBeVisible();
  // R31S2E2-US1: the badge unmounts at zero unread (PRD ch10 §2.1) — the
  // bell itself is the stable marker
  await expect(page.getByTestId('bell')).toBeVisible();
});

test('sidebar collapses to an icon rail and back', async ({ page }) => {
  await page.goto('/app');
  const sidebar = page.getByTestId('app-sidebar');
  const wide = (await sidebar.boundingBox()).width;
  expect(Math.round(wide)).toBe(240);
  await page.getByTestId('sidebar-collapse').click();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(64);
  // icon rail keeps the links (accessible names intact), text labels hidden
  await expect(sidebar.getByRole('link', { name: 'Artifacts', exact: true }))
    .not.toContainText('Artifacts');
  await page.getByTestId('sidebar-collapse').click();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(240);
});

test('topbar search overlay finds artifacts via workspace FTS', async ({ page, request }) => {
  const title = `Searchable ${Date.now() % 1e6}`;
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  await request.post(`/api/sessions/${sess.id}/save_artifact`, { data: { title } });

  await page.goto('/app');
  await page.getByTestId('global-search').click();
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await overlay.locator('input').fill(title.split(' ')[1]);
  await expect(overlay.getByText(title)).toBeVisible();
  await overlay.getByText(title).click();
  expect(new URL(page.url()).pathname).toBe('/app/artifacts');
});

test('every sidebar area is a built surface (placeholder era over)', async ({ page }) => {
  // R36S1E3: Alerts — the last placeholder — went live; no unbuilt areas remain.
  await page.goto('/app');
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Alerts', exact: true }).click();
  await expect(page.getByTestId('placeholder-page')).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('Alerts');
});
