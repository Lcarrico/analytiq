// R31S1E2-US1 (UI) — auth secondary states (`Auth.dc.html`): forgot-password
// (form → sent state), verify-email, SSO callback signing-in (auto-advances
// on the demo) and the no-workspace-access error variant (red glow, no
// redirect). All standalone on the auth stage.
import { test, expect } from '@playwright/test';

test('forgot password: form then sent state', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);
  await expect(page.getByText('Reset password')).toBeVisible();
  await page.getByTestId('forgot-email').fill('dana@acmeretail.com');
  await page.getByTestId('forgot-send').click();
  await expect(page.getByText('Check your email')).toBeVisible();
  await expect(page.getByText(/dana@acmeretail\.com/)).toBeVisible();
  await expect(page.getByText(/expires in 30 minutes/i)).toBeVisible();
  await expect(page.getByTestId('forgot-resend')).toBeVisible();
});

test('verify email screen', async ({ page }) => {
  await page.goto('/verify-email');
  await expect(page.getByText('Verify your email')).toBeVisible();
  await expect(page.getByTestId('verify-tile')).toBeVisible();
  await expect(page.getByTestId('verify-resend')).toBeVisible();
});

test('SSO callback: signing-in auto-advances into the app (demo)', async ({ page }) => {
  await page.goto('/sso/callback');
  await expect(page.getByText(/Signing you in/)).toBeVisible();
  await expect(page.getByText(/okta · acme-retail\.okta\.com/)).toBeVisible();
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 8000 }).toBe('/app');
});

test('SSO callback error: no workspace access, red variant, no redirect', async ({ page }) => {
  await page.goto('/sso/callback?error=no-workspace');
  await expect(page.getByText('No workspace access')).toBeVisible();
  await expect(page.getByText(/hasn.t been added to any AnalytIQ workspace/)).toBeVisible();
  await expect(page.getByTestId('contact-admin')).toBeVisible();
  await expect(page.getByText(/organization not enabled · session expired/)).toBeVisible();
  await page.waitForTimeout(2500);
  expect(new URL(page.url()).pathname).toBe('/sso/callback');   // stays put
});
