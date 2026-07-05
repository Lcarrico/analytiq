// R31S2E2-US1 (UI) — Home polish deltas (PRD ch10 §2–7): bell badge hidden at
// zero, data-health values color-coded + donut threshold, awaiting-review
// amber count + dot bullets + bottom link, recently-viewed thumbs, usage w/w
// delta + 7-bar mini chart, empty-state captions at 12.5px.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('home polish: bell-at-zero, health coding, review anatomy, thumbs, usage, captions', async ({ page, request }) => {
  // seed one artifact so recents/viewed have rows
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Polish ${Date.now() % 1e6}` } });

  await page.goto('/app');
  await expect(page.getByTestId('home-widgets')).toBeVisible();

  // 1 · bell badge unmounts at zero unread (PRD ch10 §2.1)
  const unread = (await (await request.get('/api/notifications')).json()).unread || 0;
  if (unread === 0) {
    await expect(page.getByTestId('bell-count')).toHaveCount(0);
  } else {
    await expect(page.getByTestId('bell-count')).toHaveText(String(unread));
  }

  // 2 · data-health values carry state coloring + mono; donut declares a tint
  const health = page.getByTestId('home-widget-health');
  const vals = health.locator('[data-testid="health-value"]');
  expect(await vals.count()).toBeGreaterThanOrEqual(1);
  for (let i = 0; i < await vals.count(); i++) {
    const v = vals.nth(i);
    expect(await css(v, 'fontFamily')).toContain('Mono');
    const state = await v.getAttribute('data-state');
    expect(['ok', 'warn']).toContain(state);
    expect(await css(v, 'color'))
      .toBe(state === 'ok' ? 'rgb(21, 128, 61)' : 'rgb(180, 83, 9)');
  }
  expect(['green', 'amber']).toContain(
    await page.getByTestId('home-health-donut').getAttribute('data-tint'));

  // 3 · awaiting review: amber count in the header, dot bullets, bottom link
  const review = page.getByTestId('home-widget-review');
  const count = review.getByTestId('review-count');
  await expect(count).toBeVisible();
  expect(await css(count, 'color')).toBe('rgb(180, 83, 9)');
  expect(parseFloat(await css(count, 'fontSize'))).toBeGreaterThanOrEqual(17);
  const items = await review.locator('[data-testid="review-dot"]').count();
  const n = parseInt(await count.innerText(), 10);
  expect(items).toBe(Math.min(n, 3));
  await expect(review.getByTestId('review-bottom-link')).toContainText('Open review queue');

  // 4 · recently-viewed rows carry 34×16 thumbs
  const viewed = page.getByTestId('home-widget-viewed');
  const thumb = viewed.locator('[data-testid="viewed-thumb"]').first();
  await expect(thumb).toBeVisible();
  expect(await thumb.evaluate(el => el.getAttribute('width'))).toBe('34');

  // 5 · usage: w/w delta (mono) when history exists + 7-bar mini chart
  const usage = page.getByTestId('home-widget-usage');
  await expect(usage.getByTestId('usage-bars')).toBeVisible();
  expect(await usage.getByTestId('usage-bars').locator('rect').count()).toBe(7);

  // 6 · empty-state caption style (12.5px muted) — runs widget is empty here
  const caption = page.getByTestId('home-widget-runs').getByText('No runs in flight');
  if (await caption.count()) {
    expect(await css(caption, 'fontSize')).toBe('12.5px');
    expect(await css(caption, 'color')).toBe('rgb(100, 116, 139)');
  }
});
