// R21S1E2-US1/US2/US3 (UI) — primitive kit rebuilt to checklist §0.2 specs;
// /app/__kit gallery; legacy call sites render the NEW visuals (compat).
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('kit gallery renders every primitive to §0.2 geometry', async ({ page }) => {
  await page.goto('/app/__kit');
  const kit = page.getByTestId('kit-gallery');
  await expect(kit).toBeVisible();

  // Badge — pill h20 radius 999 mono 10/600 uppercase
  const badge = page.getByTestId('kit-badge-green');
  await expect(badge).toBeVisible();
  expect(await badge.evaluate(el => el.offsetHeight)).toBe(20);
  expect(await css(badge, 'borderRadius')).toBe('999px');
  expect(await css(badge, 'textTransform')).toBe('uppercase');
  expect(await css(badge, 'fontFamily')).toContain('Mono');
  expect(await css(badge, 'fontWeight')).toBe('600');

  // Btn primary h34 r8 accent 600; secondary white + #d4d9e1 border
  const btnP = page.getByTestId('kit-btn-primary');
  expect(await btnP.evaluate(el => el.offsetHeight)).toBe(34);
  expect(await css(btnP, 'borderRadius')).toBe('8px');
  expect(await css(btnP, 'backgroundColor')).toBe('rgb(37, 99, 235)');
  expect(await css(btnP, 'fontWeight')).toBe('600');
  const btnS = page.getByTestId('kit-btn-secondary');
  expect(await css(btnS, 'backgroundColor')).toBe('rgb(255, 255, 255)');
  expect(await css(btnS, 'borderColor')).toBe('rgb(212, 217, 225)');
  expect(await css(btnS, 'color')).toBe('rgb(51, 65, 85)');

  // Card r10 border #e4e8ef p20
  const card = page.getByTestId('kit-card');
  expect(await css(card, 'borderRadius')).toBe('10px');
  expect(await css(card, 'borderColor')).toBe('rgb(228, 232, 239)');
  expect(await css(card, 'paddingTop')).toBe('20px');

  // KpiCard — mono 26 value
  const kpiVal = page.getByTestId('kit-kpi-value');
  expect(await css(kpiVal, 'fontSize')).toBe('26px');
  expect(await css(kpiVal, 'fontFamily')).toContain('Mono');

  // DataTable — fr template passthrough + header spec
  const th = page.getByTestId('kit-table-head');
  expect(await th.evaluate(el => el.style.gridTemplateColumns)).toBe('1.8fr 1fr 0.8fr');
  expect(await css(th, 'backgroundColor')).toBe('rgb(250, 251, 252)');
  const thCell = th.locator('button').first();
  expect(await css(thCell, 'fontSize')).toBe('10px');
  expect(await css(thCell, 'textTransform')).toBe('uppercase');

  // Input h36 r8 border #d4d9e1
  const input = page.getByTestId('kit-input');
  expect(await input.evaluate(el => el.offsetHeight)).toBe(36);
  expect(await css(input, 'borderRadius')).toBe('8px');
  expect(await css(input, 'borderColor')).toBe('rgb(212, 217, 225)');

  // Toggle 34×20 — on accent / off #cbd5e1
  const tOn = page.getByTestId('kit-toggle-on');
  expect(await tOn.evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([34, 20]);
  expect(await css(tOn, 'backgroundColor')).toBe('rgb(37, 99, 235)');
  expect(await css(page.getByTestId('kit-toggle-off'), 'backgroundColor')).toBe('rgb(203, 213, 225)');

  // Tabs — active 600 #1d4ed8 + 2px #2563eb underline
  const activeTab = page.getByTestId('kit-tabs').getByRole('tab', { selected: true });
  expect(await css(activeTab, 'color')).toBe('rgb(29, 78, 216)');
  expect(await css(activeTab, 'borderBottomColor')).toBe('rgb(37, 99, 235)');
  expect(await css(activeTab, 'borderBottomWidth')).toBe('2px');
  expect(await css(activeTab, 'fontSize')).toBe('12.5px');

  // Avatar 34 #0e7490; RadioCard selected 2px accent + #f8faff
  const av = page.getByTestId('kit-avatar-dk');
  expect(await av.evaluate(el => el.offsetWidth)).toBe(34);
  expect(await css(av, 'backgroundColor')).toBe('rgb(14, 116, 144)');
  const radio = page.getByTestId('kit-radiocard-selected');
  expect(await css(radio, 'borderColor')).toBe('rgb(37, 99, 235)');
  expect(await css(radio, 'backgroundColor')).toBe('rgb(248, 250, 255)');

  // Modal r14 + footer #fafbfc; CodeBlock dark
  await page.getByTestId('kit-open-modal').click();
  const modal = page.getByTestId('kit-modal');
  await expect(modal).toBeVisible();
  expect(await css(modal, 'borderRadius')).toBe('14px');
  expect(await css(modal.getByTestId('modal-footer'), 'backgroundColor')).toBe('rgb(250, 251, 252)');
  await page.keyboard.press('Escape');
  const code = page.getByTestId('kit-codeblock');
  expect(await css(code, 'backgroundColor')).toBe('rgb(11, 18, 32)');
  expect(await css(code, 'color')).toBe('rgb(147, 197, 253)');

  // SectionLabel micro-label; Donut svg present
  const sl = page.getByTestId('kit-sectionlabel');
  expect(await css(sl, 'fontSize')).toBe('9.5px');
  expect(await css(sl, 'letterSpacing')).toBe('0.76px'); // 9.5px * .08em
  await expect(page.getByTestId('kit-donut').locator('svg')).toBeVisible();
});

test('parity screenshot pair captured for the kit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('/app/__kit');
  await expect(page.getByTestId('kit-gallery')).toBeVisible();
  const dir = path.join(REPO, 'docs', 'specs', 'parity', 'kit');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'app.png'), fullPage: true });
  expect(fs.existsSync(path.join(dir, 'app.png'))).toBe(true);
});

test('legacy call sites render the NEW badge/btn visuals (compat layer)', async ({ page, request }) => {
  // Seed a connection so S02 deterministically renders its LIST view (with an
  // empty connections table the component returns null — root cause of the
  // earlier pass/fail flake; suite policy: tests create their own entities).
  await request.post('/api/connections', {
    data: { type: 'snowflake', name: `kitprobe${Date.now() % 1e5}`, account: 'a',
            username: 'u', password: 'p' } });
  // S02 connect screen renders `Badge variant="success" xs` for live
  // connector tiles in its picker view — the pill spec must show through the
  // old API. (Picker opens via "+ Add new data source"; empty DBs land on the
  // picker directly, seeded DBs show the list first.)
  // R35S1E2: S02 (the last screen consumer of the legacy Badge variant API)
  // is retired — the kit gallery carries a permanent compat exhibit.
  await page.goto('/app/__kit');
  const legacyBadge = page.getByTestId('kit-badge-legacy');
  await expect(legacyBadge).toBeVisible();
  expect(await css(legacyBadge, 'borderRadius')).toBe('999px'); // was 4px
  expect(await css(legacyBadge, 'fontFamily')).toContain('Mono');
});
