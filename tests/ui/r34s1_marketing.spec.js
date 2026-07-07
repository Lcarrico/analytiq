// R34S1E1 (renamed from r29s1_marketing.spec.js — R29S1 precursor slice, itself
// renamed from r23s1 2026-07-04): shared MarketingNav + MarketingFooter chrome,
// wired into Landing + Pricing. Marketing.jsx / MarketingNav.jsx / MarketingFooter.jsx.
// R34S1E2: extended for the Landing rebuild (dark hero, BI comparison, value
// props, use cases, trust strip, CTA band) per Marketing Landing.dc.html.
// R34S1E3: extended for the new Product page (stepper + 5 stages) per
// Marketing Product.dc.html. MarketingProduct.jsx.
import { test, expect } from '@playwright/test';

const NAV_LINKS = ['product', 'solutions', 'templates', 'pricing', 'security', 'docs'];
const FOOTER_COLUMNS = ['PRODUCT', 'SOLUTIONS', 'RESOURCES', 'COMPANY'];

async function expectSharedChrome(page) {
  const nav = page.getByTestId('marketing-nav');
  await expect(nav).toBeVisible();
  for (const link of NAV_LINKS) {
    await expect(nav.getByTestId(`nav-${link}`)).toBeVisible();
  }
  await expect(nav.getByTestId('start-free')).toBeVisible();

  const footer = page.getByTestId('marketing-footer');
  await expect(footer).toBeVisible();
  for (const heading of FOOTER_COLUMNS) {
    await expect(footer.getByText(heading, { exact: true })).toBeVisible();
  }
  await expect(footer.getByText('SOC 2 Type II · GDPR · ISO 27001', { exact: true })).toBeVisible();
}

test('landing renders dark hero, BI comparison, value cards, use cases, trust strip, CTA', async ({ page }) => {
  await page.goto('/');
  const landing = page.getByTestId('marketing-landing');
  await expect(landing).toBeVisible();
  await expect(landing.getByRole('heading', { name: /Ask a question\./ })).toBeVisible();
  await expect(landing.getByTestId('hero-start-free')).toBeVisible();
  await expect(landing.getByText('raw rows sent to an LLM')).toBeVisible();
  await expect(landing.getByText("Dashboards shouldn't take a sprint")).toBeVisible();
  await expect(landing.getByText('Governed metrics')).toBeVisible();
  await expect(landing.getByText('Start from a question they already ask')).toBeVisible();
  await expect(landing.getByText('Revenue Forecast')).toBeVisible();
  await expect(landing.getByText('GOVERNED BY DESIGN')).toBeVisible();
  await expect(landing.getByText('Your next dashboard is a sentence away')).toBeVisible();
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);   // shell-free
  await expectSharedChrome(page);
});

test('pricing shows the four plan cards plus shared nav and footer', async ({ page }) => {
  await page.goto('/pricing');
  for (const plan of ['starter', 'team', 'business', 'enterprise']) {
    await expect(page.getByTestId(`plan-${plan}`)).toBeVisible();
  }
  await expect(page.getByTestId('plan-business').getByText(/most popular/i)).toBeVisible();
  await expectSharedChrome(page);
});

test('product page renders header, stepper, all 5 stages, and CTA band', async ({ page }) => {
  await page.goto('/product');
  const product = page.getByTestId('marketing-product');
  await expect(product).toBeVisible();
  await expect(product.getByRole('heading', { name: 'A governed pipeline, not a chatbot' })).toBeVisible();
  for (const label of ['Understand', 'Validate metrics', 'Build gold data', 'Train & backtest', 'Assemble & share']) {
    await expect(product.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(product.getByText('Your question becomes a reviewable plan')).toBeVisible();
  await expect(product.getByText('Deterministic gates, not vibes')).toBeVisible();
  await expect(product.getByText('An immutable gold table per answer')).toBeVisible();
  await expect(product.getByText('Forecasts earn their place')).toBeVisible();
  await expect(product.getByText('A living artifact, not a screenshot')).toBeVisible();
  await expect(product.getByRole('heading', { name: 'Watch it build your first dashboard' })).toBeVisible();
  await expectSharedChrome(page);
});

test('Start Free (nav) still enters the app from both pages', async ({ page }) => {
  // r15s1_router.spec.js already covers Landing; this locks the same contract
  // now that the button lives inside the shared MarketingNav, reused on Pricing too.
  await page.goto('/pricing');
  await page.getByTestId('marketing-nav').getByTestId('start-free').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app');
});
