// R21S2E4-US1 (UI) — notifications drawer parity with App Home.dc.html
// #notifications: 420px panel, tabs All/Unread·n/Mentions, day groups,
// tinted 28px icon tiles, unread wash + accent left border + dot.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function seedMention(request) {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Drawer ${Date.now()}` } })).json();
  await request.post(`/api/artifacts/${art.id}/comments`,
    { data: { body: 'Drawer parity ping @admin@acme.com', section_id: 'timeseries_ci' } });
}

test('drawer matches the frame: geometry, tabs, groups, tinted rows', async ({ page, request }) => {
  await seedMention(request);
  await page.goto('/app');
  await page.getByTestId('bell').click();

  const drawer = page.getByTestId('notifications-drawer');
  await expect(drawer).toBeVisible();
  expect(Math.round((await drawer.boundingBox()).width)).toBe(420);
  expect(await css(drawer, 'boxShadow')).toContain('-16px');

  // header: title + mark-all + close
  await expect(drawer.getByText('Notifications', { exact: true })).toBeVisible();
  await expect(drawer.getByTestId('mark-all-read')).toBeVisible();

  // tabs: All / Unread·n / Mentions
  const tabs = drawer.getByTestId('notif-tabs');
  await expect(tabs.getByText('All', { exact: true })).toBeVisible();
  await expect(tabs.getByText(/Unread · \d+/)).toBeVisible();
  await expect(tabs.getByText('Mentions', { exact: true })).toBeVisible();

  // day group label: mono 9.5 uppercase
  const group = drawer.getByTestId('notif-group-label').first();
  await expect(group).toHaveText('TODAY');
  expect(await css(group, 'fontSize')).toBe('9.5px');
  expect(await css(group, 'fontFamily')).toContain('Mono');

  // unread mention row: 28px purple tile, wash, accent left border, dot
  const row = drawer.getByTestId('notif-row').filter({ hasText: 'Drawer parity ping' }).first();
  await expect(row).toBeVisible();
  expect(await css(row, 'backgroundColor')).toBe('rgb(248, 250, 255)');
  expect(await css(row, 'borderLeftWidth')).toBe('2px');
  expect(await css(row, 'borderLeftColor')).toBe('rgb(37, 99, 235)');
  const tile = row.getByTestId('notif-icon-tile');
  expect(await tile.evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([28, 28]);
  expect(await css(tile, 'backgroundColor')).toBe('rgb(243, 238, 254)'); // mention purple
  await expect(row.getByTestId('notif-unread-dot')).toBeVisible();

  // Mentions tab filters to mention rows only
  await tabs.getByText('Mentions', { exact: true }).click();
  await expect(drawer.getByTestId('notif-row').first()).toBeVisible();
  const kinds = await drawer.getByTestId('notif-row').evaluateAll(
    els => els.map(e => e.getAttribute('data-kind')));
  expect(kinds.every(k => k === 'mention')).toBe(true);
});
