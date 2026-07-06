// R39S1E2-US2 (UI) — duplicate/delete with downstream impact + reversible
// versions (deep-dive §6): duplicating places a valid copy; deleting shows
// what's affected and states reversibility before applying.
import { test, expect } from '@playwright/test';

test('duplicate places a copy; delete shows impact and removes reversibly', async ({ page, request }) => {
  await request.post('/api/connections', {
    data: { type: 'snowflake', account: 'manage-src', username: 'u', password: 'p' } });
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('Forecast net revenue for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('section-dimension_breakdown')).toBeVisible({ timeout: 30_000 });

  await page.getByTestId('section-dimension_breakdown').getByTestId('section-duplicate').click();
  const copy = page.getByTestId('section-dimension_breakdown_copy');
  await expect(copy).toBeVisible();

  await copy.getByTestId('section-delete').click();
  const dialog = page.getByTestId('del-impact');
  await expect(dialog).toContainText('reversible version');
  await dialog.getByTestId('del-confirm').click();
  await expect(page.getByTestId('section-dimension_breakdown_copy')).toHaveCount(0);
  await expect(page.getByTestId('section-dimension_breakdown')).toBeVisible();  // original intact
});
