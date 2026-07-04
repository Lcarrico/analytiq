// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R9S2E4-US1 (UI) — meta-orchestrator panel: a reprioritization sweep is a
// recorded, visible decision.
import { test, expect } from '@playwright/test';

test('meta panel records a reprioritization sweep decision', async ({ page, request }) => {
  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true }).click();
  const panel = page.getByTestId('meta-panel');
  await expect(panel).toBeVisible();

  await panel.getByTestId('reprioritize-btn').click();
  await expect(panel.getByText('reprioritization', { exact: false }).first()).toBeVisible();
  await expect(panel.getByText('user_facing_first').first()).toBeVisible();
});
