// R16S1E1-US1 (UI) — Create Workbench: start state, chat planning turn with
// clarification chips, inline plan card with ACCESS row, Approve & Build.
import { test, expect } from '@playwright/test';

test('start state shows typed example prompts and redirects from /app/create', async ({ page }) => {
  await page.goto('/app/create');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/create/new');
  const start = page.getByTestId('workbench-start');
  await expect(start).toBeVisible();
  for (const kind of ['FORECAST', 'PREDICTIVE', 'VARIANCE', 'ANOMALY']) {
    await expect(start.getByText(kind, { exact: true })).toBeVisible();
  }
  await expect(page.getByTestId('workbench-input')).toBeVisible();
});

test('confident prompt produces an inline plan card with ACCESS row; approve starts the build', async ({ page }) => {
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();

  await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/app\/create\/\d+$/);
  const card = page.getByTestId('plan-card');
  await expect(card).toBeVisible();
  await expect(card.getByText('Goal')).toBeVisible();
  await expect(card.getByText('Metric')).toBeVisible();
  await expect(card.getByText('Access')).toBeVisible();
  await expect(card.getByText(/No PII restrictions|excluded \(masked\)/)).toBeVisible();

  await card.getByTestId('approve-build').click();
  await expect(page.getByTestId('build-state')).toBeVisible();
  await expect(page.getByTestId('build-state')).toContainText(/Building|running/i, { timeout: 15_000 });
});

test('ambiguous prompt yields clarification chips that resolve to a plan', async ({ page, request }) => {
  // Root-cause (2026-07-04): adaptive planning (R10S2E4) conditions the
  // clarify threshold on the user's accumulated history, so this test must
  // run as a FRESH user — the shared demo user can cross into expert mode
  // depending on suite order (surfaced when r21s1_evolution was renamed to
  // r13s1 and began running before this file). Fresh user = default
  // threshold = deterministic clarification for this prompt.
  const email = `wb${Date.now() % 1e9}@acme.com`;
  await request.post('/api/auth/register', { data: { email, password: 'pass12345', role: 'admin' } });
  const login = await (await request.post('/api/auth/login',
    { data: { email, password: 'pass12345' } })).json();
  await page.goto('/app');
  await page.evaluate(([token, user]) => {
    localStorage.setItem('analytiq_token', token);
    localStorage.setItem('analytiq_user', JSON.stringify(user));
  }, [login.token, login.user]);
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill('How is net revenue trending lately');
  await page.getByTestId('workbench-send').click();

  const chips = page.getByTestId('clarify-chips');
  await expect(chips).toBeVisible();
  await expect(page.getByTestId('confidence-chip')).toContainText(/0\.\d+/);
  await chips.locator('button').first().click();          // pick an option
  await expect(page.getByTestId('plan-card')).toBeVisible();
});

test('legacy quick-plan route redirects into the workbench', async ({ page }) => {
  // R30S3E7-US1: S06–S09 retired — named children land on the start state
  await page.goto('/app/create/quick');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/create/new');
  await expect(page.getByTestId('workbench-start')).toBeVisible();
});
