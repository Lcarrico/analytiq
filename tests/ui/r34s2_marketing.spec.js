// R34S2E1 — Solutions template (/solutions/:persona), 6 persona routes sharing
// one component. Per docs/specs/mockups/Marketing Solutions.dc.html.
// MarketingSolutions.jsx.
// R34S2E2 — Templates gallery (/templates): filter rail + search + 10 cards.
// Per Marketing Templates.dc.html. MarketingTemplates.jsx.
// R34S2E3 — Security page (/security): compliance pills, jump nav, 8 section
// cards. Per Marketing Security.dc.html. MarketingSecurity.jsx.
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

test('templates gallery shows all 10 cards and filters by category, type, and search', async ({ page }) => {
  await page.goto('/templates');
  const templates = page.getByTestId('marketing-templates');
  await expect(templates).toBeVisible();
  await expect(templates.getByText('10', { exact: true })).toBeVisible();
  await expect(templates.getByTestId('template-card-revenue-forecast')).toBeVisible();
  await expect(templates.getByTestId('template-card-anomaly-monitor')).toBeVisible();

  await templates.getByText('Churn', { exact: true }).click();
  await expect(templates.getByTestId('template-card-customer-churn-risk')).toBeVisible();
  await expect(templates.getByTestId('template-card-revenue-forecast')).toHaveCount(0);

  await templates.getByText('All templates', { exact: true }).click();
  await templates.getByTestId('templates-search').fill('margin');
  await expect(templates.getByTestId('template-card-margin-variance')).toBeVisible();
  await expect(templates.getByTestId('template-card-revenue-forecast')).toHaveCount(0);
  await expectSharedChrome(page);
});

test('security page renders header, compliance pills, jump nav, and all 8 sections', async ({ page }) => {
  await page.goto('/security');
  const security = page.getByTestId('marketing-security');
  await expect(security).toBeVisible();
  await expect(security.getByRole('heading', { name: 'Built so your data team says yes' })).toBeVisible();
  for (const pill of ['SOC 2 Type II', 'ISO 27001', 'GDPR / CCPA']) {
    await expect(security.getByText(pill, { exact: true })).toBeVisible();
  }
  for (const title of [
    'No raw data ever reaches an LLM', 'Read-only warehouse access', 'Deterministic validation gates',
    'PII detected, masked, human-reviewed', 'Every action in the audit log',
    'Row-level security with a simulator', 'Signed, expiring share & embed tokens',
    'Workspace-scoped everything',
  ]) {
    await expect(security.getByText(title, { exact: true })).toBeVisible();
  }
  await expectSharedChrome(page);
});
