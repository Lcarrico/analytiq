// R38S1E2-US2 (UI) — the plan card shows the metric checklist (roles,
// formats, unresolved items as amber chips) and the proposed component plan
// BEFORE Approve & Build (deep-dive §5B step 8: show the full plan first).
import { test, expect } from '@playwright/test';

test('plan card lists the metric inventory with unresolved chips + component plan', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue vs revenue target with target gap %, order count '
    + 'and average order value for the next 14 days');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });

  const checklist = page.getByTestId('plan-metrics');
  await expect(checklist).toBeVisible();
  await expect(checklist.getByTestId('pm-row-net_revenue')).toContainText(/net revenue/i);
  await expect(checklist.getByTestId('pm-row-net_revenue').getByTestId('pm-role'))
    .toContainText('PRIMARY');
  await expect(checklist.getByTestId('pm-row-target_gap_pct').getByTestId('pm-role'))
    .toContainText('DERIVED');

  // unresolved items are visible amber chips with a reason — never dropped
  const unresolvedRow = checklist.getByTestId('pm-row-order_count');
  await expect(unresolvedRow.getByTestId('pm-unresolved')).toContainText('UNRESOLVED');
  await expect(unresolvedRow.getByTestId('pm-unresolved'))
    .toHaveAttribute('title', /catalog/i);

  await expect(page.getByTestId('plan-components')).toContainText(/component/i);
  await expect(page.getByTestId('plan-card').getByTestId('approve-build')).toBeVisible();
});
