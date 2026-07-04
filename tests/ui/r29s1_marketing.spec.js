// R29S1 precursor slice (UI) [renamed from r23s1 2026-07-04, legacy marketing shell — R29 stories extend this file] — marketing shell: landing hero + stat chips; pricing plan cards.
import { test, expect } from '@playwright/test';

test('landing renders hero, value cards and trust strip', async ({ page }) => {
  await page.goto('/');
  const landing = page.getByTestId('marketing-landing');
  await expect(landing).toBeVisible();
  await expect(landing.getByText('0 RAW ROWS TO LLM')).toBeVisible();
  await expect(landing.getByText('Governed metrics')).toBeVisible();
  await expect(landing.getByText(/SOC 2 TYPE II/)).toBeVisible();
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);   // shell-free
});

test('pricing shows the four plan cards', async ({ page }) => {
  await page.goto('/pricing');
  for (const plan of ['starter', 'team', 'business', 'enterprise']) {
    await expect(page.getByTestId(`plan-${plan}`)).toBeVisible();
  }
  await expect(page.getByTestId('plan-business').getByText(/most popular/i)).toBeVisible();
});
