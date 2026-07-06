// R36S1E2-US1 (UI) — Contracts screens (`Gold Contracts.dc.html` frames
// 03–04 / PRD §8 audit-first, admin): data contracts with posture rows
// (required fields, SLA, 30-day failures, ENFORCED vs BLOCKING NOW,
// affected artifacts, expand) + a real composer over PUT /api/contracts;
// query contracts per artifact over the run's stored query_contracts
// (component, expected shape, SQL safety, row caps, result status).
import { test, expect } from '@playwright/test';

const SPEC = {
  intent: 'predictive', intent_confidence: 0.93, analytic_goal: 'g',
  target_metric: 'Net Revenue',
  feature_candidates: ['net_revenue', 'day', 'location_id', 'tier'],
  date_range: { start: '2023-01-01', end: '2023-12-31' },
  grain: 'Location · Day', output_type: 'forecast_dashboard',
  prediction_horizon: 14, explores_used: ['fact_revenue', 'dim_location'],
  semantic_layer_version: '1.0.0', governance_manifest_version: '1.0.0',
};

test('data contracts: posture rows, blocking state, real composer', async ({ page, request }) => {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: `dc_${Date.now() % 1e5}`, username: 'u',
              password: 'p' } })).json();
  await request.put('/api/contracts', { data: { connectionId: conn.id,
    table: 'fact_revenue', required_columns: ['definitely_missing'], min_rows: 10 } });
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  const d = await (await request.get('/api/contracts/overview')).json();
  const mine = d.contracts.find(c => c.connection_id === conn.id);

  await page.goto('/app/contracts/data');
  await expect(page.locator('main h1')).toHaveText('Data contracts');
  const row = page.getByTestId(`dc-row-${mine.id}`);
  await expect(row.getByTestId('dc-blocking')).toContainText('BLOCKING NOW');
  await expect(row).toContainText('definitely_missing');
  await expect(row.getByTestId('dc-failures')).toContainText(String(mine.failures_30d));

  // expand shows the affected artifacts region
  await row.getByTestId('dc-expand').click();
  await expect(page.getByTestId(`dc-detail-${mine.id}`)).toBeVisible();

  // composer: a real new contract lands in the list
  await page.getByTestId('dc-new').click();
  await page.getByTestId('dcc-connection').selectOption(String(conn.id));
  await page.getByTestId('dcc-table').fill('dim_location');
  await page.getByTestId('dcc-columns').fill('location_id, tier');
  await page.getByTestId('dcc-save').click();
  await expect.poll(async () => {
    const o = await (await request.get('/api/contracts/overview')).json();
    return o.contracts.some(c => c.table === 'dim_location'
      && c.connection_id === conn.id);
  }, { timeout: 10_000 }).toBe(true);
});

test('query contracts: per-artifact component rows from the run', async ({ page, request }) => {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: `qc_${Date.now() % 1e5}`, username: 'u',
              password: 'p' } })).json();
  await request.post('/api/governance/run', { data: { connectionId: conn.id } });
  await expect.poll(async () =>
    ((await (await request.get(`/api/integrations/${conn.id}/manifest/versions`)).json()) || []).length,
    { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue' } })).json();
  await request.post(`/api/sessions/${sess.id}/spec`, { data: SPEC });
  const run = await (await request.post('/api/pipeline/run',
    { data: { sessionId: sess.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
    { timeout: 25_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `QC ${Date.now() % 1e5}` } })).json();
  const qc = await (await request.get(`/api/pipeline/${run.runId}/contracts`)).json();
  expect(qc.query_contracts.length).toBeGreaterThanOrEqual(1);

  await page.goto('/app/contracts/queries');
  await expect(page.locator('main h1')).toHaveText('Query contracts');
  await expect(page.getByTestId('qc-artifact').locator(`option[value="${art.id}"]`))
    .toHaveCount(1, { timeout: 10_000 });
  await page.getByTestId('qc-artifact').selectOption(String(art.id));
  const rows = page.locator('[data-testid^="qc-row-"]');
  await expect(rows).toHaveCount(qc.query_contracts.length);
  const first = rows.first();
  await expect(first.getByTestId('qc-safety')).toContainText('SAFE');
  await expect(first.getByTestId('qc-status'))
    .toContainText(/VALID|REPAIRED|PASS|EXECUTED/i);
});
