// R30S3E2-US1 (UI) — Pipeline audit panel (`Inspector Panels.dc.html`
// #pipeline-audit): mono RUN header + ALL GATES pill, stage cards with status
// circles + repair counts, expandable detail (Input / Gate result / Output +
// admin-only mono block), per-stage "Fork from here" (forks the session —
// substrate forks from the confirmed spec). Internal node ids never render.
import { test, expect } from '@playwright/test';

async function buildToCanvas(page) {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();
  await expect(page.getByTestId('kpi-strip')).toBeVisible({ timeout: 25_000 });
}

test('pipeline audit: run header, stage cards, expandable detail, no id leaks', async ({ page }) => {
  await buildToCanvas(page);
  const inspector = page.getByTestId('inspector');
  await inspector.getByRole('tab', { name: 'Pipeline' }).click();

  // RUN header + ALL GATES pill
  const head = inspector.getByTestId('pipeline-run-header');
  await expect(head).toContainText(/RUN \d+ · \d+ STAGES/);
  await expect(inspector.getByTestId('all-gates-pill')).toContainText(/ALL GATES|GATES/);

  // stage cards with status circles; node ids never render
  const cards = inspector.locator('[data-testid^="stage-card-"]:not([data-testid="stage-card-header"])');
  expect(await cards.count()).toBeGreaterThanOrEqual(4);
  expect(await inspector.locator('[data-testid="stage-circle"]').count())
    .toBe(await cards.count());
  // with the admin affordance CLOSED, no internal ids anywhere (§5.1);
  // opening it may legitimately reveal technical identifiers (§5.6)
  const text = await inspector.innerText();
  for (const leak of ['gold_build', 'walk_forward', 'viz_specs', 'node_key']) {
    expect(text.includes(leak), `leak ${leak}`).toBe(false);
  }
  await inspector.locator('[data-testid="stage-tech-toggle"]').first().click();
  await expect(inspector.getByTestId('stage-tech-block')).toBeVisible();
  await inspector.locator('[data-testid="stage-tech-toggle"]').first().click();

  // first card expanded: Input / Gate result / Output + admin-only caption
  const first = cards.first();
  for (const row of ['Input', 'Gate result', 'Output']) {
    await expect(first.getByText(row, { exact: true })).toBeVisible();
  }
  await expect(first.getByText(/technical detail · admin only/)).toBeVisible();

  // accordion toggles
  await first.getByTestId('stage-card-header').click();
  await expect(first.getByText('Gate result', { exact: true })).toHaveCount(0);
  await first.getByTestId('stage-card-header').click();
  await expect(first.getByText('Gate result', { exact: true })).toBeVisible();
});

test('Fork from here forks the session into a new workbench', async ({ page }) => {
  await buildToCanvas(page);
  const before = new URL(page.url()).pathname;
  const inspector = page.getByTestId('inspector');
  await inspector.getByRole('tab', { name: 'Pipeline' }).click();
  await inspector.locator('[data-testid^="stage-card-"]:not([data-testid="stage-card-header"])').first()
    .getByTestId('fork-from-here').click();
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 8000 }).not.toBe(before);
  expect(new URL(page.url()).pathname).toMatch(/^\/app\/create\/\d+$/);
});
