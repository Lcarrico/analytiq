// Phase 2 harness smoke: zero-key one-process boot serves API + client,
// and the app shell renders in a real browser.
import { test, expect } from '@playwright/test';

test('api health responds in zero-key mode', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ ok: true });
});

test('platform status reports every service in local fallback mode', async ({ request }) => {
  const res = await request.get('/api/platform/status');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const services = body.services || body;
  for (const [name, svc] of Object.entries(services)) {
    const mode = typeof svc === 'string' ? svc : svc.mode;
    expect(['local', 'fallback', 'dev', 'memory'], `service ${name}`).toContain(mode);
  }
});

test('client app shell renders from Flask-served dist', async ({ page }) => {
  await page.goto('/app');   // R23: '/' is the marketing landing
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByText(/AnalytIQ/i).first()).toBeVisible();
});
