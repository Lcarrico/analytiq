// R32S2E3-US1 (UI) — Semantic tools (`Semantic Tools.dc.html` frames 01–03 /
// ch17): 3-panel field picker with live bounded preview (100-row cap · Nms,
// deterministic DEP endpoint) + cardinality warning + workbench handoff;
// join-path manager with SAFE / FAN-OUT RISK pills from real schema joins
// and a bridge-table CTA prefilling the derived-table editor; admin derived
// tables with dark SQL, real dry run, publish, and FRESH/STALE status.
import { test, expect } from '@playwright/test';

async function seed(request) {
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
  const gen = await (await request.post('/api/semantic/default/generate',
    { data: { connectionId: conn.id } })).json();
  return gen.schema;
}

test('field picker: 3 panels, chips, bounded preview, warning, handoff', async ({ page, request }) => {
  const schema = await seed(request);
  const dims = schema.cubes.flatMap(c => c.dimensions || []);
  const cube = schema.cubes.find(c => (c.measures || []).length > 0);
  const ms = cube.measures[0];

  await page.goto('/app/semantic/field-picker');
  await expect(page.locator('main h1')).toHaveText('Field picker');
  await expect(page.getByTestId('fp-dimensions')).toBeVisible();
  await expect(page.getByTestId('fp-measures')).toBeVisible();

  // pick one dimension + one measure -> chips + live preview
  await page.getByTestId(`fp-dim-${dims[0].name}`).first().click();
  await page.getByTestId(`fp-ms-${ms.name}`).click();
  await expect(page.locator('[data-testid^="fp-chip-"]')).toHaveCount(2);
  const caption = page.getByTestId('fp-preview-caption');
  await expect(caption).toContainText(/100-row cap · \d+(\.\d+)?ms/);
  expect(await page.locator('[data-testid="fp-preview"] tbody tr').count())
    .toBeGreaterThanOrEqual(1);

  // pile on dimensions -> cardinality warning appears
  for (const d of dims.slice(1, 5)) {
    await page.getByTestId(`fp-dim-${d.name}`).first().click();
  }
  await expect(page.getByTestId('fp-warning')).toBeVisible();
  await expect(page.getByTestId('fp-warning')).toContainText(/series/);

  // chips removable
  const before = await page.locator('[data-testid^="fp-chip-"]').count();
  await page.locator('[data-testid="fp-remove"]').first().click();
  await expect(page.locator('[data-testid^="fp-chip-"]')).toHaveCount(before - 1);

  // handoff to the workbench
  await page.getByTestId('fp-analyze').click();
  await expect(page).toHaveURL(/\/app\/create\/new\?q=/);
});

test('join paths: SAFE + FAN-OUT pills from schema truth, bridge CTA prefills', async ({ page, request }) => {
  const schema = await seed(request);
  const joins = schema.cubes.flatMap(c => (c.joins || []).map(j => ({ ...j, from: c.name })));
  expect(joins.length).toBeGreaterThanOrEqual(2);
  expect(joins.some(j => j.join_type === 'left')).toBe(true);

  await page.goto('/app/semantic/joins');
  await expect(page.locator('main h1')).toHaveText('Join paths');
  await expect(page.getByTestId('joins-count')).toHaveText(String(joins.length));

  const rows = page.locator('[data-testid^="join-row-"]');
  await expect(rows).toHaveCount(joins.length);
  const safe = joins.find(j => j.join_type === 'inner');
  const risky = joins.find(j => j.join_type === 'left');
  await expect(page.getByTestId(`join-row-${safe.from}-${safe.to}`)
    .getByTestId('join-pill')).toContainText('SAFE');
  const riskRow = page.getByTestId(`join-row-${risky.from}-${risky.to}`);
  await expect(riskRow.getByTestId('join-pill')).toContainText('FAN-OUT RISK');
  await expect(riskRow).toContainText(/null/i);          // real builder note

  // CTA prefills the derived-table editor with a bridge skeleton
  await riskRow.getByTestId('bridge-cta').click();
  await expect(page).toHaveURL(/\/app\/semantic\/derived-tables\?/);
  await expect(page.getByTestId('dt-name')).toHaveValue(/^bridge_/);
});

test('derived tables: dry run validates, publish lands FRESH + GOVERNED', async ({ page, request }) => {
  await seed(request);
  await page.goto('/app/semantic/derived-tables');
  await expect(page.locator('main h1')).toHaveText('Derived tables');

  const name = `drv_ui_${Date.now() % 1e5}`;
  await page.getByTestId('dt-name').fill(name);
  await page.getByTestId('dt-sql').fill('SELECT 1 AS one');
  await page.getByTestId('dt-dry-run').click();
  await expect(page.getByTestId('dt-validated')).toContainText('validated');
  await expect(page.getByTestId('dt-validated')).toContainText('1 row');

  await page.getByTestId('dt-publish').click();
  const row = page.getByTestId(`dt-row-${name}`);
  await expect(row).toBeVisible();
  await expect(row.getByTestId('dt-status')).toContainText('FRESH');
  await expect(row.getByTestId('dt-governance')).toContainText('GOVERNED');

  // real persistence
  const listing = await (await request.get('/api/semantic/default/pdts')).json();
  const rows = Array.isArray(listing) ? listing : listing.pdts || [];
  expect(rows.some(p => p.name === name)).toBe(true);
});
