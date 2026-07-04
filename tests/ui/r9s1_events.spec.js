// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R9S1E3-US1 (UI) — platform events feed shows emitted events as processed.
import { test, expect } from '@playwright/test';

test('platform events feed lists processed trigger events', async ({ page, request }) => {
  await request.post('/api/platform/events', {
    data: { event_type: 'metric_threshold_breached',
            payload: { metric: 'net_revenue', value: 120, threshold: 100 } } });

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Admin', exact: true }).click();
  const panel = page.getByTestId('events-panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByText('metric_threshold_breached').first()).toBeVisible();
  await expect(panel.getByText('processed').first()).toBeVisible();
});
