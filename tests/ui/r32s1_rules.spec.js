// R32S1E4-US1 (UI) — Data Quality Rules master-detail (`Governance.dc.html`
// frame 04 / ch15): rules table (RULE · TYPE · THRESHOLD · ON toggles) over
// the merged /api/dq/rules catalog, editor panel with type dropdown, target /
// threshold, admin-only custom SQL, block-on-failure — all settings persist
// through the real rules API (audited). Replaces the S13 raw config strip.
import { test, expect } from '@playwright/test';

async function runGovernance(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: 'd', username: 'd', password: 'd' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  return conn.id;
}

test('rules master-detail: catalog, toggles, editor, block flag persist', async ({ page, request }) => {
  const cid = await runGovernance(request);
  const cat = await (await request.get(`/api/dq/rules?connection_id=${cid}`)).json();
  expect(cat.rules.length).toBeGreaterThanOrEqual(7);

  await page.goto('/app/governance/rules');
  await expect(page.locator('main h1')).toHaveText('Data quality rules');
  await expect(page.getByTestId('rules-count')).toHaveText(String(cat.rules.length));
  await expect(page.getByTestId('add-rule')).toBeVisible();

  // master table: typed rows with threshold + toggle
  const rows = page.locator('[data-testid^="rule-row-"]');
  await expect(rows).toHaveCount(cat.rules.length);
  const pkRow = page.getByTestId('rule-row-pk_uniqueness');
  await expect(pkRow.getByTestId('rule-type-pill')).toContainText(/primary key/i);
  await expect(pkRow.getByTestId('rule-threshold')).toContainText('100% unique');
  await expect(pkRow.getByTestId('rule-toggle')).toHaveAttribute('data-on', 'true');

  // toggle OFF → persists through the API and a reload; audited
  await pkRow.getByTestId('rule-toggle').click();
  await expect.poll(async () => {
    const c = await (await request.get(`/api/dq/rules?connection_id=${cid}`)).json();
    return c.rules.find(r => r.rule_id === 'pk_uniqueness').enabled;
  }).toBe(false);
  await page.reload();
  await expect(page.getByTestId('rule-row-pk_uniqueness').getByTestId('rule-toggle'))
    .toHaveAttribute('data-on', 'false');
  const audits = await (await request.get('/api/audit-logs?action=dq.rule_updated&limit=3')).json();
  const entries = Array.isArray(audits) ? audits : audits.entries || [];
  expect(entries.length).toBeGreaterThanOrEqual(1);

  // row select → editor: type dropdown, target/threshold, block-on-failure
  await page.getByTestId('rule-row-freshness_sla').getByTestId('rule-name').click();
  const editor = page.getByTestId('rule-editor');
  await expect(editor).toBeVisible();
  await expect(editor.getByTestId('rule-type-select')).toHaveValue('freshness_sla');
  const options = await editor.getByTestId('rule-type-select')
    .locator('option').allInnerTexts();
  expect(options.join(' ')).toMatch(/primary key/i);
  expect(options.join(' ')).toMatch(/custom test/i);
  await expect(editor.getByTestId('rule-threshold-input')).toHaveValue('within table SLA');
  await expect(editor.getByTestId('rule-threshold-input')).toBeDisabled();

  // custom SQL affordance is admin-scoped and read-only-noted
  await expect(editor.getByTestId('custom-sql-note'))
    .toContainText('admin only · runs read-only');

  // block-on-failure: check + Save → persists (warning rule escalates)
  const block = editor.getByTestId('block-on-failure');
  await expect(block).not.toBeChecked();
  await block.check();
  await editor.getByTestId('rule-save').click();
  await expect.poll(async () => {
    const c = await (await request.get(`/api/dq/rules?connection_id=${cid}`)).json();
    return c.rules.find(r => r.rule_id === 'freshness_sla').block_on_failure;
  }).toBe(true);
});

test('add rule: custom SQL test lands in the master list', async ({ page, request }) => {
  const cid = await runGovernance(request);
  const before = (await (await request.get(`/api/dq/rules?connection_id=${cid}`)).json())
    .rules.length;

  await page.goto('/app/governance/rules');
  await page.getByTestId('add-rule').click();
  const editor = page.getByTestId('rule-editor');
  await editor.getByTestId('rule-type-select').selectOption('custom');
  await editor.getByTestId('rule-target-input').fill('artifacts');
  await editor.getByTestId('custom-sql-input').fill('id IS NOT NULL');
  await editor.getByTestId('rule-save').click();

  await expect.poll(async () => {
    const c = await (await request.get(`/api/dq/rules?connection_id=${cid}`)).json();
    return c.rules.length;
  }).toBe(before + 1);
  await expect(page.getByTestId('rules-count')).toHaveText(String(before + 1));
  const customRow = page.locator('[data-testid^="rule-row-custom"]').first();
  await expect(customRow.getByTestId('rule-type-pill')).toContainText(/custom/i);
});
