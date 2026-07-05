// R31S2E1-US1 (UI) — Recent Activity (`App Home.dc.html` frame 02): app-shell
// page at /app/activity (max-width 1000): filter pills (All dark-active ·
// Builds · Governance · Data · Sharing) filtering server-side, timeline rows
// (tinted icon tile + connector, rich text, mono meta line, mono time,
// actor avatar), Load more (cursor). Entry points: "View all activity →" in
// BOTH the Home header row and the notifications drawer footer.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function seedArtifact(request, title) {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  return (await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json());
}

test('activity page: pills filter, timeline anatomy, load more', async ({ page, request }) => {
  const art = await seedArtifact(request, `Act Feed ${Date.now() % 1e6}`);
  await request.post(`/api/artifacts/${art.id}/share_links`, { data: {} });

  await page.goto('/app/activity');
  await expect(page.getByTestId('breadcrumbs')).toContainText('acme-retail / activity');
  await expect(page.locator('main h1')).toHaveText('Recent activity');

  // pills: All active (dark), then the four kinds
  const pills = page.getByTestId('activity-pills');
  expect(await css(pills.getByText('All', { exact: true }), 'backgroundColor'))
    .toBe('rgb(15, 23, 42)');
  for (const p of ['Builds', 'Governance', 'Data', 'Sharing']) {
    await expect(pills.getByText(p, { exact: true })).toBeVisible();
  }

  // timeline rows: icon tile, rich text, mono meta, mono time, avatar
  const rows = page.locator('[data-testid="activity-row"]');
  expect(await rows.count()).toBeGreaterThanOrEqual(3);
  const first = rows.first();
  await expect(first.getByTestId('activity-tile')).toBeVisible();
  const meta = first.getByTestId('activity-meta');
  expect(await css(meta, 'fontFamily')).toContain('Mono');
  await expect(first.getByTestId('activity-avatar')).toBeVisible();

  // sharing filter narrows to share events server-side
  await pills.getByText('Sharing', { exact: true }).click();
  await expect.poll(async () => rows.count()).toBeGreaterThanOrEqual(1);
  const kinds = await page.locator('[data-testid="activity-row"]').evaluateAll(
    els => els.map(e => e.dataset.kind));
  expect(kinds.every(k => k === 'share')).toBe(true);

  // Load more paginates via cursor (when more rows exist)
  await pills.getByText('All', { exact: true }).click();
  const before = await rows.count();
  const loadMore = page.getByTestId('activity-load-more');
  if (await loadMore.isVisible()) {
    await loadMore.click();
    await expect.poll(async () => rows.count()).toBeGreaterThan(before);
  }
});

test('entry points: Home header link and drawer footer link', async ({ page }) => {
  await page.goto('/app');
  const homeLink = page.getByTestId('home-activity-link');
  await expect(homeLink).toContainText('View all activity');
  await homeLink.click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/activity');

  await page.goto('/app');
  await page.getByTestId('bell').click();
  const drawerLink = page.getByTestId('drawer-activity-link');
  await expect(drawerLink).toContainText('View all activity');
  await drawerLink.click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/activity');
});
