// R36S3E2-US1 (UI) — Settings ×4 + the app-wide technical-detail toggle.
// S11 retires: /app/settings/profile is the Settings area now (the S11
// identity card + R10 memory affordance rehomed with testids intact —
// r10s1_memory + r31s1_auth keep their contracts). The toggle flips the
// R30S3 §5.6 admin blocks from role-gated to toggle-gated (default on).
import { test, expect } from '@playwright/test';

test('settings area: profile + preferences + tech-detail flip app-wide', async ({ page }) => {
  await page.goto('/app/settings/profile');
  await expect(page.getByTestId('settings-tabs')).toBeVisible();
  await expect(page.getByTestId('memory-toggle')).toBeVisible();   // rehomed S11 card

  // default on: admin sees the technical console blocks
  await page.goto('/app/admin/platform');
  await expect(page.getByTestId('admin-only-block').first()).toBeVisible();

  // flip off in preferences → blocks yield the plain-language notice
  await page.goto('/app/settings/preferences');
  await page.getByTestId('pref-tech-detail').click();
  await expect(page.getByText('Preferences saved.')).toBeVisible();
  await page.goto('/app/admin/platform');
  await expect(page.getByTestId('admin-only-block')).toHaveCount(0);
  await expect(page.getByTestId('admin-only-notice').first())
    .toContainText('Technical detail is off');

  // flip back on → console returns (leaves shared state clean for r15s2)
  await page.goto('/app/settings/preferences');
  await page.getByTestId('pref-tech-detail').click();
  await expect(page.getByText('Preferences saved.')).toBeVisible();
  await page.goto('/app/admin/platform');
  await expect(page.getByTestId('admin-only-block').first()).toBeVisible();
});

test('API keys: created once-revealed, listed masked, revoke marks the row', async ({ page }) => {
  await page.goto('/app/settings/api-keys');
  await page.getByTestId('key-name').fill('ci robot');
  await page.getByTestId('key-create').click();
  await expect(page.getByTestId('key-reveal')).toContainText('aiq_');
  const raw = (await page.getByTestId('key-reveal').innerText()).match(/aiq_\w+/)[0];

  const row = page.getByTestId(/key-row-/).first();
  await expect(row).toContainText('ci robot');
  await expect(row).toContainText('••••');
  expect(await row.innerText()).not.toContain(raw);   // masked in the list

  await row.getByTestId('key-revoke').click();
  await expect(page.getByTestId(/key-row-/).first().getByTestId('key-revoked'))
    .toContainText('REVOKED');
});

test('help center links are real destinations', async ({ page }) => {
  await page.goto('/app/settings/help');
  await expect(page.getByTestId('help-documentation')).toBeVisible();
  await expect(page.getByTestId('help-contact')).toBeVisible();
  await expect(page.getByTestId('help-platform').getByText('Open →'))
    .toHaveAttribute('href', '/app/admin/platform');
});
