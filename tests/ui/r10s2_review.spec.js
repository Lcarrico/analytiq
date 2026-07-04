// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R10S2E6-US1 (UI) — the semantic screen's review triage shows the
// evidence-ranked queue, matching the API's ranking (shared source of truth).
import { test, expect } from '@playwright/test';

test('review triage lists evidence-ranked pending definitions', async ({ page, request }) => {
  const conn = await (await request.post('/api/connections', {
    data: { type: 'snowflake', name: `triage${Date.now() % 1e5}`, account: 'a',
            username: 'u', password: 'p' } })).json();
  await request.post('/api/governance/run', { data: { connectionId: conn.id } });
  // governance sim (SIM_DELAY_SCALE=0) → wait for low-confidence defs
  const latest = await expect.poll(async () => {
    const r = await request.get('/api/governance/latest');
    return r.ok() ? (await r.json()).run_id : null;
  }, { timeout: 15_000 }).not.toBe(null).then(() => request.get('/api/governance/latest'));
  const runId = (await (await request.get('/api/governance/latest')).json()).run_id;
  await expect.poll(async () =>
    (await (await request.get(`/api/reviews/${runId}?ranked=1`)).json()).length,
    { timeout: 15_000 }).toBeGreaterThan(0);
  const ranked = await (await request.get(`/api/reviews/${runId}?ranked=1`)).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Semantic Layer', exact: true }).click();
  const panel = page.getByTestId('review-triage');
  await expect(panel).toBeVisible();
  // UI shows the same top-ranked item as the API (cross-checked truth)
  const top = panel.locator('[data-testid^="triage-item-"]').first();
  await expect(top).toBeVisible();
  await expect(top).toContainText(ranked[0].name);
  await expect(top.getByTestId('ev-usage')).toBeVisible();
  await expect(top.getByTestId('ev-sim')).toBeVisible();
});
