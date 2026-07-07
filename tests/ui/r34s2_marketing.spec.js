// R34S2E1 — Solutions template (/solutions/:persona), 6 persona routes sharing
// one component. Per docs/specs/mockups/Marketing Solutions.dc.html.
// MarketingSolutions.jsx.
import { test, expect } from '@playwright/test';

const NAV_LINKS = ['product', 'solutions', 'templates', 'pricing', 'security', 'docs'];
const FOOTER_COLUMNS = ['PRODUCT', 'SOLUTIONS', 'RESOURCES', 'COMPANY'];

async function expectSharedChrome(page) {
  const nav = page.getByTestId('marketing-nav');
  await expect(nav).toBeVisible();
  for (const link of NAV_LINKS) {
    await expect(nav.getByTestId(`nav-${link}`)).toBeVisible();
  }
  const footer = page.getByTestId('marketing-footer');
  await expect(footer).toBeVisible();
  for (const heading of FOOTER_COLUMNS) {
    await expect(footer.getByText(heading, { exact: true })).toBeVisible();
  }
}

test('solutions defaults to the Executives persona and renders hero, digest, starting points, quote', async ({ page }) => {
  await page.goto('/solutions/executives');
  const solutions = page.getByTestId('marketing-solutions');
  await expect(solutions).toBeVisible();
  await expect(solutions.getByRole('heading', { name: 'Answers before the meeting, not after the sprint' })).toBeVisible();
  await expect(solutions.getByText('Monday 8am digest', { exact: true })).toBeVisible();
  await expect(solutions.getByText('Exec Weekly Revenue')).toBeVisible();
  await expect(solutions.getByText('Rosa Martínez', { exact: true })).toBeVisible();
  await expect(solutions.getByText('Bring one real question')).toBeVisible();
  await expectSharedChrome(page);
});

test('all 6 persona tabs are present and switch the page content', async ({ page }) => {
  await page.goto('/solutions/executives');
  const solutions = page.getByTestId('marketing-solutions');
  const personas = ['executives', 'data-teams', 'operations', 'finance', 'sales', 'customer-success'];
  for (const slug of personas) {
    await expect(solutions.getByTestId(`persona-tab-${slug}`)).toBeVisible();
  }
  await solutions.getByTestId('persona-tab-finance').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/solutions/finance');
  await expect(solutions.getByRole('heading', { name: 'Close the gap between the forecast and the fire drill' })).toBeVisible();
});

test('bare /solutions redirects to the Executives persona', async ({ page }) => {
  await page.goto('/solutions');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/solutions/executives');
});
