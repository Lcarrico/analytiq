// R36S2E2-US1 (UI) — Admin overview + roles matrix (`Admin.dc.html` frames
// 01–02 / PRD §8 audit-first, admin): nine live KPI cards over the admin
// aggregate; the permissions matrix persists per-cell grants through the
// roles kv DEP (audited), SENSITIVE rows marked, owner column locked.
import { test, expect } from '@playwright/test';

test('admin overview: nine live KPI cards', async ({ page, request }) => {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: `ad_${Date.now() % 1e5}`, username: 'u',
              password: 'p' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  const d = await (await request.get('/api/admin/overview')).json();

  await page.goto('/app/admin');
  await expect(page.locator('main h1')).toHaveText('Workspace administration');
  await expect(page.getByTestId('ao-card-users')).toContainText(String(d.users.total));
  await expect(page.getByTestId('ao-card-integrations'))
    .toContainText(`${d.integrations.healthy} healthy`);
  await expect(page.getByTestId('ao-card-backlog'))
    .toContainText(String(d.governance_backlog.total));
  // audit count keeps growing as background scans log — assert liveness
  await expect(page.getByTestId('ao-card-audit')).toContainText(/\d+/);
  await expect(page.getByTestId('ao-card-sso')).toContainText(d.sso.status);
  expect(await page.locator('[data-testid^="ao-card-"]').count()).toBe(9);

  // roles card links to the matrix
  await page.getByTestId('ao-card-roles').click();
  await expect(page).toHaveURL(/\/app\/admin\/roles$/);
});

test('roles matrix: sensitive rows, locked owner, audited cell toggle', async ({ page, request }) => {
  await page.goto('/app/admin/roles');
  await expect(page.locator('main h1')).toHaveText('Roles & permissions');
  await expect(page.getByText('written to the audit log')).toBeVisible();

  const sensitive = page.getByTestId('perm-row-View-SQL-expressions');
  await expect(sensitive.getByTestId('perm-sensitive')).toContainText('SENSITIVE');

  // owner cells are locked
  await expect(page.getByTestId('cell-Create-dashboards-owner')).toBeDisabled();

  // toggle a grant -> persists via the kv DEP + audits
  const cell = page.getByTestId('cell-Public-sharing-analyst');
  const before = await cell.isChecked();
  await cell.click();
  await expect.poll(async () => {
    const d = await (await request.get('/api/admin/roles')).json();
    return d.matrix['Public sharing'].analyst;
  }, { timeout: 10_000 }).toBe(!before);
  const audits = await (await request.get('/api/audit-logs?action=roles.updated&limit=3')).json();
  const entries = Array.isArray(audits) ? audits : audits.entries || [];
  expect(entries.length).toBeGreaterThanOrEqual(1);
});
