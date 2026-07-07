// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R9S2E7-US1 (UI) — optimization proposals are reviewable (approve/reject),
// generated from real telemetry, never auto-applied.
import { test, expect } from '@playwright/test';

test('scan surfaces a proposal; admin approves it in place', async ({ page, request }) => {
  // generate real low-hit-rate cache telemetry: 12 distinct query-layer misses
  for (let i = 1; i <= 12; i++) {
    await request.get(`/api/gold/default/gold_predictions?per_page=${i}&page=97`);
  }

  // R36S2E4: the platform console is directly routed (sidebar Admin is the
  // workspace overview now) — same nav as r13s1.
  await page.goto('/app/admin/platform');
  const panel = page.getByTestId('optimizations-panel');
  await expect(panel).toBeVisible();

  await panel.getByTestId('optimize-scan-btn').click();
  const row = panel.locator('[data-testid^="optim-row-"]').first();
  await expect(row).toBeVisible();
  await expect(row.getByTestId('optim-status')).toHaveText('proposed');

  await row.getByTestId('optim-approve').click();
  await expect(panel.locator('[data-testid="optim-status"]', { hasText: 'approved' }).first())
    .toBeVisible();
});
