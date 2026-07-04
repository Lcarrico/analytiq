// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R10S1E1-US1 (UI) — the Account screen shows agent memory and lets the
// user forget entries.
import { test, expect } from '@playwright/test';

test('account screen lists agent memory and deletes an entry', async ({ page, request }) => {
  const key = `pref_${Date.now()}`;
  const created = await (await request.post('/api/memory', {
    data: { agent: 'viz', category: 'chart_type_default', key, value: 'line' } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Settings', exact: true }).click();
  const panel = page.getByTestId('memory-panel');
  await expect(panel).toBeVisible();
  const row = panel.getByTestId(`memory-row-${created.id}`);
  await expect(row).toBeVisible();
  await expect(row.getByText(`${key} → line`)).toBeVisible();

  await row.getByTestId('memory-delete').click();
  await expect(row).toHaveCount(0);              // forgotten
});
