// R31S1E1-US1 (UI) — standalone auth (`Auth.dc.html`): centered 420px card on
// the #f2f4f8 stage with NO app shell pre-login; login rebuilt (labeled
// fields, forgot link, 3 SSO buttons, magic-link box, "Log in" copy); register
// is the 4-step wizard (stepper, strength meter, role cards, invite chips +
// first-path rows) driving the REAL register→login flow. The PBKDF2 /
// Agent-memory copy is unreachable from any surface (vocab ledger pruned).
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('login: standalone shell, labeled fields, SSO, magic link, real sign-in', async ({ page, request }) => {
  const email = `login${Date.now() % 1e9}@acme.com`;
  await request.post('/api/auth/register', { data: { email, password: 'pass12345', role: 'admin' } });

  await page.goto('/login');
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);
  await expect(page.getByTestId('topbar')).toHaveCount(0);
  const card = page.getByTestId('auth-card');
  await expect(card).toBeVisible();
  expect(await card.evaluate(el => el.offsetWidth)).toBe(420);
  expect(await css(page.getByTestId('auth-stage'), 'backgroundColor')).toBe('rgb(242, 244, 248)');

  // labeled fields + frame copy
  await expect(card.locator('label', { hasText: 'Email' })).toBeVisible();
  await expect(card.locator('label', { hasText: 'Password' })).toBeVisible();
  await expect(card.getByText('Welcome back to your workspace.')).toBeVisible();
  await expect(card.getByTestId('forgot-link')).toHaveAttribute('href', '/forgot-password');
  for (const sso of ['Continue with Google', 'Continue with Microsoft', 'Enterprise SSO']) {
    await expect(card.getByText(sso, { exact: true })).toBeVisible();
  }
  await card.getByTestId('magic-link-send').click();
  await expect(card.getByTestId('magic-link-sent')).toContainText(/link/i);

  // no leaked internals anywhere on the page
  const text = await page.locator('body').innerText();
  for (const leak of ['PBKDF2', 'Agent memory']) {
    expect(text.includes(leak), leak).toBe(false);
  }

  // real sign-in through the form
  await card.getByTestId('login-email').fill(email);
  await card.getByTestId('login-password').fill('pass12345');
  await card.getByTestId('login-submit').click();
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 8000 }).toBe('/app');
  await expect(page.getByTestId('topbar')).toBeVisible();
});

test('register: 4-step wizard creates a real account', async ({ page, request }) => {
  const email = `reg${Date.now() % 1e9}@acme.com`;
  await page.goto('/register');
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);

  // stepper with 4 steps, step 1 active
  const stepper = page.getByTestId('register-stepper');
  expect(await stepper.locator('[data-testid^="step-dot-"]').count()).toBe(4);

  // step 1: account + strength meter fills with a stronger password
  await page.getByTestId('reg-name').fill('Dana Kim');
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-password').fill('abc');
  const seg = () => page.locator('[data-testid="strength-seg"][data-on="true"]').count();
  const weak = await seg();
  await page.getByTestId('reg-password').fill('Str0ng-pass-12345');
  expect(await seg()).toBeGreaterThan(weak);
  await page.getByTestId('reg-continue').click();

  // step 2: workspace name
  await page.getByTestId('reg-workspace').fill('Acme Retail');
  await page.getByTestId('reg-continue').click();

  // step 3: role cards (2×2), select Analyst → 2px accent border
  const role = page.getByTestId('role-analyst');
  await role.click();
  expect(await css(role, 'borderTopWidth')).toBe('2px');
  expect(await css(role, 'borderTopColor')).toBe('rgb(37, 99, 235)');
  await page.getByTestId('reg-continue').click();

  // step 4: invite chips + first-path rows
  await page.getByTestId('invite-input').fill('mo@acmeretail.com');
  await page.getByTestId('invite-input').press('Enter');
  await expect(page.getByTestId('invite-chip').first()).toContainText('mo@acmeretail.com');
  await page.getByTestId('path-sample').click();
  await page.getByTestId('reg-create').click();

  // real account: register hands off to onboarding (R31S1E3 flow wiring),
  // and the API accepts those credentials
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 8000 })
    .toBe('/onboarding/workspace');
  const login = await request.post('/api/auth/login',
    { data: { email, password: 'Str0ng-pass-12345' } });
  expect(login.status()).toBe(200);
});

test('settings/profile no longer carries auth internals', async ({ page }) => {
  await page.goto('/app/settings/profile');
  const text = await page.locator('body').innerText();
  for (const leak of ['PBKDF2', 'Agent memory', '§17']) {
    expect(text.includes(leak), leak).toBe(false);
  }
});
