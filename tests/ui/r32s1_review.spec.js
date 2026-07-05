// R32S1E2-US1 (UI) — Human Review Queue (ch15 §2): tab counts, bulk approve,
// queue table (checkbox · item + mono context · TYPE pill · colored
// CONFIDENCE · Accept/Edit/Reject) over the real reviews API. Decisions leave
// the queue and hit the audit log.
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
  return run.runId;
}

test('review queue: tabs, rows, accept/reject round-trips', async ({ page, request }) => {
  const runId = await runGovernance(request);
  const items = await (await request.get(`/api/reviews/${runId}`)).json();
  expect(items.length).toBeGreaterThanOrEqual(1);

  await page.goto('/app/governance/review');
  await expect(page.locator('main h1')).toHaveText('Human review queue');

  // tab row: All with the live count, plus typed tabs
  const tabs = page.getByTestId('review-tabs');
  await expect(tabs.getByText(`All · ${items.length}`)).toBeVisible();
  await expect(page.getByTestId('bulk-approve')).toBeVisible();

  // rows: item text + mono context + type pill + colored mono confidence
  const rows = page.locator('[data-testid^="review-row-"]');
  await expect(rows).toHaveCount(items.length);
  const first = rows.first();
  await expect(first.getByTestId('review-type-pill')).toBeVisible();
  const conf = first.getByTestId('review-confidence');
  expect(await css(conf, 'fontFamily')).toContain('Mono');
  const cVal = parseFloat(await conf.innerText());
  expect(await css(conf, 'color'))
    .toBe(cVal >= 0.85 ? 'rgb(21, 128, 61)' : cVal < 0.7 ? 'rgb(180, 83, 9)' : 'rgb(51, 65, 85)');

  // accept the first item → it leaves the queue; audit records the decision
  const before = await rows.count();
  await first.getByTestId('review-accept').click();
  await expect.poll(async () => rows.count()).toBe(before - 1);
  const audits = await (await request.get('/api/audit-logs?action=semantic.accepted&limit=3')).json();
  const entries = Array.isArray(audits) ? audits : audits.entries || [];
  expect(entries.length).toBeGreaterThanOrEqual(1);

  // reject the next one
  if (before > 1) {
    const b2 = await rows.count();
    await rows.first().getByTestId('review-reject').click();
    await expect.poll(async () => rows.count()).toBe(b2 - 1);
  }

  // bulk approve clears what's checked (select-all → approve → queue empties)
  if (await rows.count()) {
    await page.getByTestId('review-select-all').evaluate(el => el.click());
    await page.getByTestId('bulk-approve').click();
    await expect.poll(async () => rows.count(), { timeout: 8000 }).toBe(0);
  }
});
