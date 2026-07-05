// R30S3E6-US1 (UI) — comments drawer + inline pins (`Inspector Panels.dc.html`
// #comments-drawer / #comment-popover): 400px drawer from the canvas toolbar,
// Open/Resolved pill counts, section-anchor chips, real create/reply/resolve
// over the R18 comments API, "Ask AI to apply" seeding the refine composer,
// numbered pins on anchored sections with a reply popover.
import { test, expect } from '@playwright/test';

async function buildToCanvas(page) {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 25_000 });
}

test('drawer: create, anchor chip, reply nesting, resolve, Ask-AI-to-apply', async ({ page }) => {
  await buildToCanvas(page);

  // select the trend section so the composer anchors to it, then open drawer
  await page.getByTestId('section-timeseries').evaluate(el => el.click());
  await page.getByTestId('canvas-toolbar').getByTestId('open-comments').click();
  const drawer = page.getByTestId('comments-drawer');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByTestId('comments-open-pill')).toContainText(/Open · \d+/);
  await expect(drawer.getByTestId('comments-resolved-pill')).toContainText(/Resolved · \d+/);

  // create an anchored comment
  const body = `Needs a promo overlay ${Date.now() % 1e6}`;
  await drawer.getByTestId('comment-composer').fill(body);
  await drawer.getByTestId('comment-send').click();
  const thread = drawer.locator('[data-testid^="thread-"]').filter({ hasText: body }).first();
  await expect(thread).toBeVisible();
  await expect(thread.getByTestId('thread-anchor')).toContainText(/§ /);

  // nested reply
  await thread.getByTestId('thread-reply-input').fill('Agreed — next sprint.');
  await thread.getByTestId('thread-reply-send').click();
  const reply = thread.getByTestId('comment-reply').filter({ hasText: 'Agreed' }).first();
  await expect(reply).toBeVisible();
  expect(parseFloat(await reply.evaluate(el => getComputedStyle(el).paddingLeft))).toBeGreaterThan(20);

  // resolve moves the thread to the Resolved view
  await thread.getByTestId('thread-resolve').click();
  await expect(drawer.locator('[data-testid^="thread-"]').filter({ hasText: body })).toHaveCount(0);
  await drawer.getByTestId('comments-resolved-pill').click();
  await expect(drawer.locator('[data-testid^="thread-"]').filter({ hasText: body }).first())
    .toBeVisible();

  // Ask AI to apply (on a fresh thread) seeds the refine composer and hands
  // off — the drawer closes by design
  await drawer.getByTestId('comments-open-pill').click();
  const body2 = `Add a target overlay ${Date.now() % 1e6}`;
  await drawer.getByTestId('comment-composer').fill(body2);
  await drawer.getByTestId('comment-send').click();
  const t2 = drawer.locator('[data-testid^="thread-"]').filter({ hasText: body2 }).first();
  await t2.getByTestId('ask-ai-apply').click();
  await expect(page.getByTestId('comments-drawer')).toHaveCount(0);
  await expect(page.getByTestId('workbench-input')).toHaveValue(new RegExp(body2.slice(0, 18)));
});

test('inline pin renders on the anchored section and opens a reply popover', async ({ page }) => {
  await buildToCanvas(page);
  await page.getByTestId('section-timeseries').evaluate(el => el.click());
  await page.getByTestId('canvas-toolbar').getByTestId('open-comments').click();
  const drawer = page.getByTestId('comments-drawer');
  const body = `Pin me ${Date.now() % 1e6}`;
  await drawer.getByTestId('comment-composer').fill(body);
  await drawer.getByTestId('comment-send').click();
  await expect(drawer.locator('[data-testid^="thread-"]').filter({ hasText: body }).first())
    .toBeVisible();
  await page.getByTestId('drawer-close').click();

  // numbered pin on the section
  const pin = page.getByTestId('section-timeseries').getByTestId('comment-pin');
  await expect(pin).toBeVisible();
  await expect(pin).toHaveText(/\d+/);

  // popover: body + reply round-trip
  await pin.evaluate(el => el.click());
  const pop = page.getByTestId('comment-popover');
  await expect(pop).toBeVisible();
  await expect(pop).toContainText(body);
  await pop.getByTestId('popover-reply-input').fill('From the popover');
  await pop.getByTestId('popover-reply-send').click();
  await expect(pop.getByText('From the popover')).toBeVisible();
});
