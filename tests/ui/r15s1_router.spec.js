// R15S1E1-US1 (UI) — real URLs: deep links, back button, 404, wizard compat.
import { test, expect } from '@playwright/test';

test('deep link renders the artifacts screen directly', async ({ page }) => {
  await page.goto('/app/artifacts');
  await expect(page.getByTestId('roi-report-btn')).toBeVisible();   // S10 body
});

test('browser back returns to the previous route', async ({ page }) => {
  await page.goto('/app/create');
  await expect(page.locator('input').first()).toBeVisible();        // S06 chat input
  await page.goto('/app/artifacts');
  await expect(page.getByTestId('roi-report-btn')).toBeVisible();
  await page.goBack();
  await expect(page.locator('input').first()).toBeVisible();
  // R16S1E1 contract change: /app/create self-redirects to the workbench
  // start state at /app/create/new, so back lands there once the redirect
  // settles (was asserted as bare /app/create before the workbench landed).
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/create/new');
});

test('unknown route renders the 404 page', async ({ page }) => {
  await page.goto('/app/definitely-not-a-route');
  const nf = page.getByTestId('notfound-page');
  await expect(nf).toBeVisible();
  await expect(nf.getByText('/app/definitely-not-a-route')).toBeVisible();
  await nf.getByRole('link', { name: /Back to home/i }).click();
  expect(new URL(page.url()).pathname).toBe('/app');
});

test('root shows the marketing landing; Start Free enters the app', async ({ page }) => {
  // R23: '/' is the public landing page (PRD §3.1); the app lives at /app.
  await page.goto('/');
  await expect(page.getByTestId('marketing-landing')).toBeVisible();
  await page.getByTestId('start-free').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app');
});
