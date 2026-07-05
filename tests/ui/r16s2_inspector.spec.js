// R16S2E3-US1 (UI) — workbench inspector: 6 tabs over existing backends.
import { test, expect } from '@playwright/test';

test('inspector tabs expose design, pipeline, insights, share and versions', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await page.getByTestId('plan-card').getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 20_000 });

  const inspector = page.getByTestId('inspector');
  await expect(inspector).toBeVisible();

  // R30S2E4-US1: the Design tab is an editing panel now — unselected state
  // shows guidance; the rationale renders once a section is selected (covered
  // by r30s2_inspector.spec.js).
  await inspector.getByRole('tab', { name: 'Design' }).click();
  await expect(inspector.getByTestId('design-empty')).toContainText(/select a section/i);

  await inspector.getByRole('tab', { name: 'Pipeline' }).click();
  await expect(inspector.getByText('Build gold table & features')).toBeVisible();
  // R30S3E2-US1: the loose gate dump became per-stage Gate-result rows + the
  // run-level ALL GATES pill (raw `gate:PASS` strings are §5.1 leaks).
  await expect(inspector.getByTestId('all-gates-pill')).toBeVisible();

  // R30S2E4-US1 tab-set ruling: Insights left the workbench strip (they live
  // on the artifact detail page + the R30S3E3 panel); Lineage and Model
  // joined per the frame.
  await inspector.getByRole('tab', { name: 'Lineage' }).click();
  await expect(inspector.getByTestId('tab-lineage')).toBeVisible();
  await inspector.getByRole('tab', { name: 'Model' }).click();
  await expect(inspector.getByTestId('tab-model')).toBeVisible();

  await inspector.getByRole('tab', { name: 'Share' }).click();
  await inspector.getByTestId('make-share-link').click();
  await expect(inspector.getByTestId('share-link-url')).toContainText('/api/public/');

  // R30S2E4-US1: Versions is a session-topbar button, not a tab (the ref-hash
  // timeline it replaced leaked internals — panel lands R30S3E5).
  await expect(inspector.getByRole('tab', { name: 'Versions' })).toHaveCount(0);
  await expect(page.getByTestId('session-topbar').getByTestId('wb-versions')).toBeVisible();

  await inspector.getByRole('tab', { name: 'Data' }).click();
  await expect(inspector.getByText(/gate|contract/i).first()).toBeVisible();
});
