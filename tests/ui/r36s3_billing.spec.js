// R36S3E1-US1 (UI) — billing at parity (`Billing.dc.html` frames 01–04 /
// ch16): plan & seats with live seat math, cycle line items, the four-plan
// grid with real local plan change, seeded demo invoices, card on file.
import { test, expect } from '@playwright/test';

test('plan & seats, cycle line items, and a real local plan change', async ({ page }) => {
  await page.goto('/app/billing');
  await expect(page.getByTestId('bp-price')).toContainText(/\$|Custom/);
  await expect(page.getByTestId('bp-seats')).toContainText(/\d+ of \d+ used/);
  await expect(page.getByTestId('bp-renewal')).toContainText(/renews/);
  await expect(page.getByTestId('bp-cycle')).toContainText('Base plan');
  await expect(page.getByTestId('bp-total')).toContainText('$');
  for (const plan of ['starter', 'team', 'business', 'enterprise']) {
    await expect(page.getByTestId(`bp-card-${plan}`)).toBeVisible();
  }
  await expect(page.getByTestId('bp-current')).toBeVisible();

  // real plan change on the local stack (no card checkout faked)
  await page.getByTestId('bp-choose-business').click();
  await expect(page.getByText('Plan changed to business')).toBeVisible();
  await expect(page.getByTestId('plan-name')).toContainText(/business/i);
  await expect(page.getByTestId('bp-card-business').getByTestId('bp-current')).toBeVisible();
});

test('seeded demo invoices and the card on file render', async ({ page }) => {
  await page.goto('/app/billing');
  await expect(page.getByTestId('bi-row-0')).toBeVisible();
  await expect(page.getByTestId('bi-row-2')).toContainText(/INV-\d+/);
  await expect(page.getByTestId('bi-row-0')).toContainText('PAID');
  await expect(page.getByTestId('pm-row')).toContainText('•••• 4242');
});
