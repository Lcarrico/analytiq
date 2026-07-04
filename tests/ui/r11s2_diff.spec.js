// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R11S2E4-US1 (UI) — comparing schema versions highlights the metric
// lifecycle (added / deprecated / redefined).
import { test, expect } from '@playwright/test';

test('semantic screen compares latest schema versions with lifecycle chips', async ({ page, request }) => {
  const conn = await (await request.post('/api/connections', {
    data: { type: 'snowflake', name: `diff${Date.now() % 1e5}`, account: 'a',
            username: 'u', password: 'p' } })).json();
  await request.post('/api/governance/run', { data: { connectionId: conn.id } });
  await expect.poll(async () => {
    const r = await request.get(`/api/integrations/${conn.id}/manifest/versions`);
    return r.ok() ? (await r.json() || []).length : 0;
  }, { timeout: 15_000 }).toBeGreaterThan(0);
  await request.post('/api/semantic/default/generate', { data: { connectionId: conn.id } });

  // v2 via a calculated metric derived from an existing measure
  const schema = await (await request.get('/api/semantic/default/schema')).json();
  const firstMeasure = schema.schema.cubes.flatMap(c => c.measures || [])[0].name;
  const calcName = `calc_${Date.now() % 1e5}`;
  const calc = await request.post('/api/semantic/default/metrics/calculated',
    { data: { name: calcName, expr: `${firstMeasure} * 2` } });
  expect(calc.ok()).toBeTruthy();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Semantic Layer', exact: true }).click();
  await page.getByTestId('compare-versions-btn').click();
  const panel = page.getByTestId('diff-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId('diff-added').filter({ hasText: calcName })).toBeVisible();
});
