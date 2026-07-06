// R36S1E3-US1 (UI) — Alerts (`Alerts.dc.html` frames 01–03 / PRD §8
// audit-first): typed filter pills + rules table with live FIRING/OK/MUTED
// status over the new alert-rules CRUD DEP; create drawer posts a real
// rule (its first check runs immediately against real data); detail shows
// grounded trigger history, logic, delivery marks, Mute 24h / Delete.
import { test, expect } from '@playwright/test';

async function seeded(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: `al_${Date.now() % 1e5}`, username: 'u',
              password: 'p' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  await request.put('/api/tables/sla', { data: { connectionId: conn.id,
    table: 'fact_revenue', max_age_hours: 1 } });
  return conn.id;
}

test('alerts center: pills + rows over CRUD; create drawer posts a real rule', async ({ page, request }) => {
  const cid = await seeded(request);
  // one existing rule so the table has content
  await request.post('/api/alert_rules', { data: {
    name: 'POS feed freshness SLA', kind: 'freshness', watch: 'fact_revenue',
    connection_id: cid, condition: { max_age_hours: 1 }, deliver: ['email'] } });
  const lst = await (await request.get('/api/alert_rules')).json();

  await page.goto('/app/alerts');
  await expect(page.locator('main h1')).toHaveText('Alerts');
  await expect(page.getByTestId('al-pill-all')).toContainText(String(lst.counts.all));
  const rows = page.locator('[data-testid^="al-row-"]');
  await expect(rows).toHaveCount(lst.counts.all);
  const mine = lst.rules.find(r => r.name === 'POS feed freshness SLA');
  await expect(page.getByTestId(`al-row-${mine.id}`).getByTestId('al-status'))
    .toContainText(new RegExp(mine.status, 'i'));

  // typed pill filters
  await page.getByTestId('al-pill-freshness').click();
  expect(await rows.count()).toBeLessThanOrEqual(lst.counts.freshness);
  await page.getByTestId('al-pill-all').click();

  // create drawer -> real rule appears
  await page.getByTestId('al-create').click();
  await page.getByTestId('alc-name').fill('Coverage watch');
  await page.getByTestId('alc-kind').selectOption('schema_drift');
  await page.getByTestId('alc-save').click();
  await expect.poll(async () => {
    const l2 = await (await request.get('/api/alert_rules')).json();
    return l2.rules.some(r => r.name === 'Coverage watch');
  }, { timeout: 10_000 }).toBe(true);
});

test('alert detail: grounded history, mute + delete round-trips', async ({ page, request }) => {
  const cid = await seeded(request);
  const rule = await (await request.post('/api/alert_rules', { data: {
    name: 'Feed guard', kind: 'freshness', watch: 'fact_revenue',
    connection_id: cid, condition: { max_age_hours: 1 },
    deliver: ['email', 'slack'] } })).json();

  await page.goto(`/app/alerts/${rule.id}`);
  await expect(page.getByTestId('ald-name')).toContainText('Feed guard');
  await expect(page.getByTestId('ald-status')).toContainText(/FIRING|OK/);
  const trig = page.locator('[data-testid^="ald-trigger-"]');
  await expect(trig.first()).toBeVisible();
  await expect(page.getByTestId('ald-logic')).toContainText(/1h|max age/i);

  // mute 24h -> status flips to MUTED (persisted)
  await page.getByTestId('ald-mute').click();
  await expect(page.getByTestId('ald-status')).toContainText(/MUTED/i,
    { timeout: 10_000 });

  // check now appends history (real evaluation)
  const before = await trig.count();
  await page.getByTestId('ald-check').click();
  await expect.poll(async () => trig.count(), { timeout: 10_000 }).toBe(before + 1);

  // delete returns to the center
  await page.getByTestId('ald-delete').click();
  await expect(page).toHaveURL(/\/app\/alerts$/);
  const l2 = await (await request.get('/api/alert_rules')).json();
  expect(l2.rules.some(r => r.id === rule.id)).toBe(false);
});
