// R36S2E4-US1 (UI) — admin security console (`Admin Security.dc.html` frames
// 01–04 / ch16): audit log with export, masked secrets with rotate, sharing
// governance rules, and RLS policies with the "test as user" simulator.
// S12 retires as a legacy screen-number remnant: /app/admin/platform stays
// live as the directly-routed platform console (r13s1 + r15s2 contracts),
// and the sidebar Admin entry now lands on the workspace admin overview.
import { test, expect } from '@playwright/test';

test('security console: audit, masked secrets, sharing rules, RLS simulator', async ({ page, request }) => {
  await request.post('/api/connections', {
    data: { type: 'snowflake', account: 'sec-ui', username: 'u', password: 'p' } });

  await page.goto('/app/admin/security');
  await expect(page.getByTestId('sec-audit-table')).toBeVisible();
  await expect(page.getByTestId('sec-audit-row-0')).toBeVisible();
  await expect(page.getByTestId('sec-audit-export')).toHaveAttribute(
    'href', /\/api\/audit-logs\/export/);

  // secrets — masked, never raw; rotate is audited
  await expect(page.getByTestId('sec-secret-row').first()).toBeVisible();
  await expect(page.getByTestId('sec-secret-cred').first()).toContainText('••••');
  await page.getByTestId('sec-rotate').first().click();
  await expect(page.getByText('Credential rotated and audited.')).toBeVisible();

  // sharing governance — live counts + editable rules
  await expect(page.getByTestId('sec-share-counts')).toContainText(/\d+/);
  await page.getByTestId('sec-share-expiry').fill('60');
  await page.getByTestId('sec-share-save').click();
  await expect(page.getByText('Sharing rules saved.')).toBeVisible();

  // RLS — create a safe-expression policy, then simulate visibility
  await page.getByTestId('sec-rls-table').fill('artifacts');
  await page.getByTestId('sec-rls-expr').fill("id > 0");
  await page.getByTestId('sec-rls-save').click();
  await expect(page.getByTestId('sec-rls-row').first()).toBeVisible();
  await page.getByTestId('sec-sim-run').click();
  await expect(page.getByTestId('sec-sim-result')).toContainText(/row/i);
});

test('admin consolidation: sidebar lands on overview; platform console lives on', async ({ page }) => {
  await page.goto('/app');
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/admin$/);
  await expect(page.getByTestId('ao-card-users')).toBeVisible();
  await page.getByTestId('ao-card-security').click();
  await expect(page).toHaveURL(/\/app\/admin\/security/);

  // the S12-era console survives at its URL as a first-class route
  await page.goto('/app/admin/platform');
  await expect(page.getByTestId('cache-panel')).toBeVisible();
});
