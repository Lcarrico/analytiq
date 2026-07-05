// R32S1E1-US1 (UI) — Governance overview (ch15 §1): amber awaiting pill,
// clickable KPI cards with colored mono counts + captions, span-2 health
// trend card with sparkline — over the real /api/governance/summary. The raw
// "Governance ops" page no longer owns /app/governance. Admin-gated.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function runGovernance(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: 'd', username: 'd', password: 'd' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
}

test('overview: pill, seven cards, health trend, real counts', async ({ page, request }) => {
  await runGovernance(request);
  const summary = await (await request.get('/api/governance/summary')).json();

  await page.goto('/app/governance');
  await expect(page.locator('main h1')).toHaveText('Governance');

  // amber awaiting pill mirrors the aggregate
  if (summary.awaiting_review > 0) {
    const pill = page.getByTestId('awaiting-pill');
    await expect(pill).toContainText(`${summary.awaiting_review} ITEMS AWAITING REVIEW`);
    expect(await css(pill, 'color')).toBe('rgb(180, 83, 9)');
  }

  // six KPI cards + the span-2 health card
  for (const key of ['blocked', 'review', 'pii', 'fresh', 'drift', 'contracts']) {
    await expect(page.getByTestId(`gov-card-${key}`)).toBeVisible();
  }
  const health = page.getByTestId('gov-card-health');
  await expect(health).toBeVisible();
  await expect(health.locator('svg polyline')).toHaveCount(1);

  // counts are mono and mirror the aggregate
  const review = page.getByTestId('gov-card-review').getByTestId('gov-count');
  await expect(review).toHaveText(String(summary.awaiting_review));
  expect(await css(review, 'fontFamily')).toContain('Mono');

  // cards navigate into their areas
  await page.getByTestId('gov-card-review').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/governance/review');

  // the old ops page's raw config strings are gone from the overview
  await page.goto('/app/governance');
  const text = await page.locator('body').innerText();
  for (const leak of ['Set health threshold', 'required cols, comma-sep', 'Roll back to']) {
    expect(text.includes(leak), leak).toBe(false);
  }
});
