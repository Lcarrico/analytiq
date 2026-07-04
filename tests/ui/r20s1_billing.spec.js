// R20S1E1 (UI) — billing page: plan card, live token meter, capability rows.
import { test, expect } from '@playwright/test';

test('billing shows plan, token meter and capability consumption', async ({ page, request }) => {
  await request.post('/api/sessions/plan',
    { data: { message: 'Forecast net revenue for the next 14 days by location' } });
  await page.goto('/app/billing');
  await expect(page.getByTestId('plan-name')).toContainText(/team|starter|business/i);
  await expect(page.getByTestId('token-meter')).toContainText(/\d[\d,]* \/ [\d,]+/);
  await expect(page.getByText('session_planning')).toBeVisible();
});
