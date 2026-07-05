// R30S2E2-US1 (UI) — chat column parity (`Create Workbench.dc.html`): mono
// status lines under the ask, clarify frame styling (dashed "Not sure" +
// filled "Use recommended"), plan card as "Review your plan" (DIMENSIONS /
// FORECAST / SOURCES rows, mono-blue metric chip, per-row edit affordance,
// Edit plan / Cancel footer, ✓ APPROVED pill), agent logo tile, refine
// composer + done-state follow-up chips.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function freshUser(page, request) {
  const email = `wb${Date.now() % 1e9}@acme.com`;
  await request.post('/api/auth/register', { data: { email, password: 'pass12345', role: 'admin' } });
  const login = await (await request.post('/api/auth/login',
    { data: { email, password: 'pass12345' } })).json();
  await page.goto('/app');
  await page.evaluate(([token, user]) => {
    localStorage.setItem('analytiq_token', token);
    localStorage.setItem('analytiq_user', JSON.stringify(user));
  }, [login.token, login.user]);
}

test('plan turn: status lines, Review-your-plan card, rows, chips, footer', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });

  // mono status lines under the user bubble
  const status = page.getByTestId('chat-status-lines');
  await expect(status).toContainText(/matched .*source/i);
  await expect(status).toContainText(/resolved metric/i);
  expect(await css(status, 'fontFamily')).toContain('Mono');

  // plan card header + new rows
  const card = page.getByTestId('plan-card');
  await expect(card.getByText('Review your plan', { exact: true })).toBeVisible();
  for (const row of ['Dimensions', 'Forecast', 'Sources']) {
    await expect(card.getByText(row, { exact: true })).toBeVisible();
  }
  // metric renders as a mono blue chip
  const chip = card.getByTestId('plan-metric-chip');
  expect(await css(chip, 'fontFamily')).toContain('Mono');
  expect(await css(chip, 'color')).toBe('rgb(29, 78, 216)');
  // per-row edit affordances (pencil svg)
  expect(await card.getByTestId('plan-row-edit').count()).toBeGreaterThanOrEqual(7);
  // footer: Approve & Build + Edit plan + Cancel
  await expect(card.getByTestId('approve-build')).toBeVisible();
  await expect(card.getByTestId('plan-edit')).toBeVisible();
  await expect(card.getByTestId('plan-cancel')).toBeVisible();

  // agent tile beside AI content
  await expect(page.getByTestId('agent-tile').first()).toBeVisible();
});

test('clarify state: dashed Not-sure + filled Use-recommended chips', async ({ page, request }) => {
  await freshUser(page, request);
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('How is net revenue trending lately');
  await page.getByTestId('workbench-send').click();

  const chips = page.getByTestId('clarify-chips');
  await expect(chips).toBeVisible();
  await expect(page.getByTestId('confidence-chip')).toContainText(/confidence 0\.\d+/);
  const notSure = chips.getByTestId('chip-not-sure');
  expect(await css(notSure, 'borderTopStyle')).toBe('dashed');
  const rec = chips.getByTestId('chip-recommended');
  expect(await css(rec, 'backgroundColor')).toBe('rgb(37, 99, 235)');
  await rec.click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
});

test('approve → APPROVED pill; done → follow-up chips + refine composer', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();

  await expect(page.getByTestId('plan-approved')).toContainText('APPROVED');
  await expect(page.getByTestId('build-state')).toContainText(/done|Building/i, { timeout: 20_000 });
  await expect(page.getByTestId('build-state')).toContainText('done', { timeout: 25_000 });

  // done summary + follow-up chips feed the next planning turn
  const follow = page.getByTestId('followup-chips');
  await expect(follow).toBeVisible();
  expect(await follow.locator('button').count()).toBeGreaterThanOrEqual(2);

  // composer becomes a refine box after the first build
  await expect(page.getByTestId('workbench-input'))
    .toHaveAttribute('placeholder', 'Ask a follow-up or refine…');
});
