// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R12S2E5-US1 (UI) — one click generates the ROI report as a first-class,
// listed artifact.
import { test, expect } from '@playwright/test';

test('ROI report button creates a native artifact in the list', async ({ page, request }) => {
  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  await page.getByTestId('roi-report-btn').click();
  await expect(page.getByText('ROI report generated as a native artifact.')).toBeVisible();
  await expect(page.getByText('Workspace ROI Report').first()).toBeVisible();
});
