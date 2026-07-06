// R36S2E3-US1 (UI) — SSO settings + workspace branding (`Admin.dc.html`
// frames 03–04 / PRD §8 audit-first, admin): SAML/OIDC config persisting
// through the settings kv DEP (verified domain chips, enforce toggle,
// real Test login), and branding admin over the live branding API with
// an in-page preview that reflects saved values.
import { test, expect } from '@playwright/test';

test('sso settings: configure, enforce, test login round-trips', async ({ page, request }) => {
  await page.goto('/app/admin/sso');
  await expect(page.locator('main h1')).toHaveText('Single sign-on');

  await page.getByTestId('sso-url').fill('https://acme.okta.com/app/analytiq/sso/saml');
  await page.getByTestId('sso-entity').fill('urn:analytiq:workspace:acme');
  await page.getByTestId('sso-domain').fill('acmeretail.com');
  await page.getByTestId('sso-enforce').check();
  await page.getByTestId('sso-save').click();

  await expect(page.getByTestId('sso-status')).toContainText('ENFORCED',
    { timeout: 10_000 });
  await expect(page.getByTestId('sso-domain-chip-0')).toContainText('VERIFIED');

  const s = await (await request.get('/api/admin/sso')).json();
  expect(s.enforced).toBe(true);

  await page.getByTestId('sso-test').click();
  await expect(page.getByTestId('sso-test-result')).toContainText(/parsed|reachable/i);
});

test('branding admin: saved values drive the live preview', async ({ page, request }) => {
  await page.goto('/app/admin/branding');
  await expect(page.locator('main h1')).toHaveText('Workspace branding');

  await page.getByTestId('brand-name').fill('Acme Retail');
  await page.getByTestId('brand-color').fill('#7c3aed');
  await page.getByTestId('brand-save').click();

  await expect.poll(async () => {
    const b = await (await request.get('/api/branding')).json();
    return b.logo_text;
  }, { timeout: 10_000 }).toBe('Acme Retail');

  const preview = page.getByTestId('brand-preview');
  await expect(preview).toContainText('Acme Retail');
  await expect(preview.getByTestId('brand-preview-mark')).toHaveText('AR');
});
