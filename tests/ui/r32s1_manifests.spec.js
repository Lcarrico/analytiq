// R32S1E6-US1 (UI) — Manifest versions + pre-aggregation recommendations
// (`Governance Lineage.dc.html` frames 02/03 / ch16): version table with
// status pills and expandable +ADD/~MOD/−DEL diffs, real Rollback (audited)
// and Approve routing into the review queue; rollup cards with value pills,
// hit share, speedup/cost readouts and a cost-ceiling card over live
// /api/semantic preagg recommendations. S13 raw config is retired.
import { test, expect } from '@playwright/test';

async function runGovernance(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: 'd', username: 'd', password: 'd' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  await expect.poll(async () =>
    (await (await request.get(`/api/integrations/${conn.id}/manifest/versions`)).json()).length,
    { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
  return conn.id;
}

test('manifest versions: status pills, expandable diff, approve + rollback', async ({ page, request }) => {
  const cid = await runGovernance(request);
  const v1 = (await (await request.get(`/api/integrations/${cid}/manifest/versions`)).json())[0];
  await request.post(`/api/integrations/${cid}/manifest/rollback`,
    { data: { version: v1.version } });
  const vs = await (await request.get(
    `/api/integrations/${cid}/manifest/versions?diffs=1`)).json();
  expect(vs.length).toBe(2);

  await page.goto('/app/governance/manifests');
  await expect(page.locator('main h1')).toHaveText('Manifest versions');
  const rows = page.locator('[data-testid^="mv-row-"]');
  await expect(rows).toHaveCount(2);

  // latest: REVIEW REQUIRED (low-confidence reviews pending), older: SUPERSEDED
  const latest = page.getByTestId(`mv-row-${vs[0].version}`);
  await expect(latest.getByTestId('mv-status')).toContainText('REVIEW REQUIRED');
  await expect(page.getByTestId(`mv-row-${vs[1].version}`).getByTestId('mv-status'))
    .toContainText('SUPERSEDED');

  // expand latest -> diff region (rolled-back copy: no structural changes)
  await latest.getByTestId('mv-expand').click();
  const diff = page.getByTestId(`mv-diff-${vs[0].version}`);
  await expect(diff).toBeVisible();
  await expect(diff).toContainText(/No structural changes|ADD|MOD|DEL/);

  // Approve routes into the human review queue while reviews are pending
  await diff.getByTestId('mv-approve').click();
  await expect(page).toHaveURL(/\/app\/governance\/review$/);

  // rollback from the older version -> a third immutable version (audited)
  await page.goto('/app/governance/manifests');
  await page.getByTestId(`mv-row-${vs[1].version}`).getByTestId('mv-expand').click();
  await page.getByTestId(`mv-diff-${vs[1].version}`).getByTestId('mv-rollback').click();
  await expect.poll(async () =>
    (await (await request.get(`/api/integrations/${cid}/manifest/versions`)).json()).length)
    .toBe(3);
  await expect(page.locator('[data-testid^="mv-row-"]')).toHaveCount(3);
  const audits = await (await request.get('/api/audit-logs?action=manifest.rolled_back&limit=3')).json();
  const entries = Array.isArray(audits) ? audits : audits.entries || [];
  expect(entries.length).toBeGreaterThanOrEqual(1);
});

test('pre-aggregation recommendations: value pills, estimates, ceiling', async ({ page, request }) => {
  await runGovernance(request);
  for (let i = 0; i < 6; i++) await request.get('/api/gold/catalog');
  const recs = await (await request.get('/api/semantic/default/preagg_recommendations')).json();
  expect(recs.length).toBeGreaterThanOrEqual(1);

  await page.goto('/app/governance/preaggregations');
  await expect(page.locator('main h1')).toHaveText('Pre-aggregation recommendations');
  const cards = page.locator('[data-testid^="preagg-card-"]');
  await expect(cards).toHaveCount(recs.length);
  const first = cards.first();
  await expect(first.getByTestId('preagg-value-pill')).toContainText(/HIGH VALUE|MEDIUM|LOW/);
  await expect(first.getByTestId('preagg-hits')).toContainText(/hits \d+% of queries/);
  await expect(first.getByTestId('preagg-speedup')).toContainText('×');
  await expect(first.getByTestId('preagg-cost')).toContainText('/mo');
  await expect(first.getByTestId('preagg-approve')).toBeDisabled();

  // dismiss removes the card from this session's list
  await first.getByTestId('preagg-dismiss').click();
  await expect(cards).toHaveCount(recs.length - 1);

  // cost ceiling card
  const ceiling = page.getByTestId('preagg-ceiling');
  await expect(ceiling).toContainText('Monthly cost ceiling');
  await expect(ceiling).toContainText('$50');
  await expect(ceiling).toContainText(/current spend \$\d+\/mo/);
});
