// R15S2E4-US1 (UI) — role-aware rendering: viewers lose admin nav and
// technical blocks; admins keep the ops console.
import { test, expect } from '@playwright/test';

async function loginAs(page, request, role) {
  const email = `${role}${Date.now() % 1e6}@acme.com`;
  await request.post('/api/auth/register', {
    data: { email, password: 'pass12345', role } });
  const login = await (await request.post('/api/auth/login',
    { data: { email, password: 'pass12345' } })).json();
  await page.goto('/app');
  await page.evaluate(([token, user]) => {
    localStorage.setItem('analytiq_token', token);
    localStorage.setItem('analytiq_user', JSON.stringify(user));
  }, [login.token, login.user]);
  await page.reload();
}

test('viewer loses admin/billing/governance nav and gets 403 on admin routes', async ({ page, request }) => {
  await loginAs(page, request, 'viewer');
  const sidebar = page.getByTestId('app-sidebar');
  await expect(sidebar.getByRole('link', { name: 'Artifacts', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);
  await expect(sidebar.getByRole('link', { name: 'Billing', exact: true })).toHaveCount(0);
  await expect(sidebar.getByRole('link', { name: 'Governance', exact: true })).toHaveCount(0);

  await page.goto('/app/admin/platform');
  const forbidden = page.getByTestId('forbidden-page');
  await expect(forbidden).toBeVisible();
  await expect(forbidden).toContainText('403');
});

test('admin keeps the console inside the AdminOnly treatment', async ({ page, request }) => {
  await loginAs(page, request, 'admin');
  await page.goto('/app/admin/platform');
  await expect(page.getByTestId('forbidden-page')).toHaveCount(0);
  await expect(page.getByTestId('admin-only-block').first()).toBeVisible();
  await expect(page.getByTestId('cache-panel')).toBeVisible();       // console intact
});
