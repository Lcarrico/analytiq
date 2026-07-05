// R32S1E3-US1 (UI) — Definition-review diff (ch16 §3, the HITL flagship):
// side-by-side CURRENT vs PROPOSED with highlighted definitions, dark SQL
// block with green diff tokens, evidence + affected dashboards, editable
// FINAL DEFINITION, and a real approve/reject decision recorded in audit.
// NOTE: the SQL panel is a compiled-expression display derived from the
// definition's explore/type (the substrate stores prose definitions, not
// SQL) — recorded as an Agent Note deviation in RELEASE_PLAN.md.
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

test('conflict diff: current vs proposed, evidence, edit + approve round-trip', async ({ page, request }) => {
  // Run A: accept "Net Revenue" so a CURRENT (accepted) counterpart exists.
  const runA = await runGovernance(request);
  const itemsA = await (await request.get(`/api/reviews/${runA}`)).json();
  const prior = itemsA.find(i => i.name === 'Conversion Rate');
  expect(prior).toBeTruthy();
  await request.post(`/api/reviews/items/${prior.id}`, { data: { action: 'accept' } });

  // Run B (latest): its "Net Revenue" proposal now conflicts with A's.
  const runB = await runGovernance(request);
  const itemsB = await (await request.get(`/api/reviews/${runB}`)).json();
  const item = itemsB.find(i => i.name === 'Conversion Rate');
  expect(item).toBeTruthy();
  const detail = await (await request.get(`/api/reviews/items/${item.id}`)).json();
  expect(detail.current).toBeTruthy();

  // Deep link from the queue row.
  await page.goto('/app/governance/review');
  await page.locator(`[data-testid="review-row-${item.id}"]`)
    .getByTestId('review-item-name').click();
  await expect(page).toHaveURL(new RegExp(`/app/governance/review/${item.id}$`));

  // Header: typed headline + mono name + amber NEEDS HUMAN confidence pill.
  await expect(page.getByTestId('diff-headline')).toContainText('Metric conflict');
  await expect(page.getByTestId('diff-headline')).toContainText('Conversion Rate');
  const pill = page.getByTestId('diff-confidence-pill');
  await expect(pill).toContainText(`CONFIDENCE ${item.confidence.toFixed(2)}`);
  await expect(pill).toContainText('NEEDS HUMAN');
  expect(await css(pill, 'color')).toBe('rgb(180, 83, 9)');

  // Side-by-side: CURRENT (in use) vs PROPOSED (tinted #f8faff column).
  const cur = page.getByTestId('diff-current');
  await expect(cur).toHaveAttribute('data-state', 'existing');
  await expect(cur).toContainText('CURRENT');
  await expect(cur.getByTestId('diff-inuse-pill')).toContainText('IN USE');
  await expect(cur).toContainText(detail.current.definition);
  const prop = page.getByTestId('diff-proposed');
  await expect(prop).toContainText('PROPOSED');
  await expect(prop).toContainText(item.definition);
  expect(await css(prop, 'backgroundColor')).toBe('rgb(248, 250, 255)');

  // Dark SQL block with green added tokens, mono.
  const sql = page.getByTestId('diff-sql');
  expect(await css(sql, 'backgroundColor')).toBe('rgb(15, 23, 42)');
  expect(await css(sql, 'fontFamily')).toContain('Mono');
  const add = sql.locator('[data-testid="diff-sql-add"]').first();
  await expect(add).toBeVisible();
  expect(await css(add, 'color')).toBe('rgb(74, 222, 128)');

  // Evidence narrative + affected dashboard chips (live count).
  await expect(page.getByTestId('diff-evidence')).toContainText('EVIDENCE');
  await expect(page.locator('[data-testid^="affected-chip-"]'))
    .toHaveCount(detail.affected_count);

  // FINAL DEFINITION is editable, prefilled with the proposal.
  const final = page.getByTestId('final-definition');
  await expect(final).toHaveValue(item.definition);
  await final.fill(item.definition + ' Reviewed by finance.');

  // Action bar: green approve with live count, request-changes (owned later),
  // red reject, mono audit note.
  const approve = page.getByTestId('diff-approve');
  await expect(approve).toContainText(`re-validate ${detail.affected_count} dashboards`);
  expect(await css(approve, 'backgroundColor')).toBe('rgb(21, 128, 61)');
  await expect(page.getByTestId('diff-request-changes')).toBeDisabled();
  const reject = page.getByTestId('diff-reject');
  expect(await css(reject, 'color')).toBe('rgb(220, 38, 38)');
  const note = page.getByTestId('diff-audit-note');
  await expect(note).toContainText('decision recorded in audit log');
  expect(await css(note, 'fontFamily')).toContain('Mono');

  // Approve with an edited final definition → recorded as semantic.edited,
  // item leaves the queue, we land back on it.
  await approve.click();
  await expect(page).toHaveURL(/\/app\/governance\/review$/);
  await expect.poll(async () => {
    const left = await (await request.get(`/api/reviews/${runB}`)).json();
    return left.some(i => i.id === item.id);
  }).toBe(false);
  const audits = await (await request.get('/api/audit-logs?action=semantic.edited&limit=5')).json();
  const entries = Array.isArray(audits) ? audits : audits.entries || [];
  expect(entries.length).toBeGreaterThanOrEqual(1);
});

test('first-time proposal: no accepted counterpart, plain accept', async ({ page, request }) => {
  const runId = await runGovernance(request);
  const items = await (await request.get(`/api/reviews/${runId}`)).json();
  const item = items.find(i => i.name === 'Avg Session Duration');
  expect(item).toBeTruthy();

  await page.goto(`/app/governance/review/${item.id}`);
  const cur = page.getByTestId('diff-current');
  await expect(cur).toHaveAttribute('data-state', 'new');
  await expect(cur).toContainText('First-time proposal');

  await page.getByTestId('diff-approve').click();
  await expect(page).toHaveURL(/\/app\/governance\/review$/);
  const audits = await (await request.get('/api/audit-logs?action=semantic.accepted&limit=5')).json();
  const entries = Array.isArray(audits) ? audits : audits.entries || [];
  expect(entries.length).toBeGreaterThanOrEqual(1);
});
