// R21S2E2-US1 (UI) — topbar parity with App Home.dc.html #home topbar:
// workspace chip (AR mark + name + caret), 520×36 search pill w/ ⌘K keycap,
// red-badged bell, bordered help, 34px avatar.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('topbar matches the frame 1:1', async ({ page }) => {
  await page.goto('/app');
  const bar = page.getByTestId('topbar');
  await expect(bar).toBeVisible();
  expect(await css(bar, 'paddingLeft')).toBe('28px');

  // workspace switcher: h36 bordered; 20px purple AR mark; name 13/600; caret svg
  const ws = page.getByTestId('workspace-chip');
  await expect(ws).toContainText('Acme Retail');
  expect(await ws.evaluate(el => el.offsetHeight)).toBe(36);
  const mark = ws.getByTestId('workspace-mark');
  await expect(mark).toHaveText('AR');
  expect(await css(mark, 'backgroundColor')).toBe('rgb(124, 58, 237)');
  expect(await mark.evaluate(el => el.offsetWidth)).toBe(20);
  await expect(ws.locator('svg')).toBeVisible();

  // search pill: 520×36 r999 bg #f7f8fa, svg, exact placeholder, ⌘K keycap
  const pill = page.getByTestId('global-search');
  const box = await pill.boundingBox();
  expect(Math.round(box.width)).toBe(520);
  expect(Math.round(box.height)).toBe(36);
  expect(await css(pill, 'borderRadius')).toBe('999px');
  expect(await css(pill, 'backgroundColor')).toBe('rgb(247, 248, 250)');
  await expect(pill).toContainText('Search artifacts, metrics, sources…');
  await expect(pill.locator('svg')).toBeVisible();
  const keycap = pill.getByTestId('search-keycap');
  await expect(keycap).toHaveText('⌘K');
  expect(await css(keycap, 'backgroundColor')).toBe('rgb(255, 255, 255)');

  // bell: red badge w/ 2px white ring
  const badge = page.getByTestId('bell-count');
  expect(await css(badge, 'backgroundColor')).toBe('rgb(220, 38, 38)');
  expect(await css(badge, 'boxShadow')).toContain('rgb(255, 255, 255)');
  await expect(page.getByTestId('bell').locator('svg')).toBeVisible();

  // help: 34px bordered square linking to /app/help
  const help = page.getByTestId('help-btn');
  expect(await help.evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([34, 34]);
  expect(await help.getAttribute('href')).toBe('/app/help');

  // avatar: 34px round #0e7490, 2-letter initials
  const av = page.getByTestId('avatar-menu');
  expect(await av.evaluate(el => [el.offsetWidth, el.offsetHeight])).toEqual([34, 34]);
  expect(await css(av, 'backgroundColor')).toBe('rgb(14, 116, 144)');
  await expect(av).toHaveText(/^[A-Z]{2}$/);

  // ⌘K overlay behavior preserved
  await pill.click();
  await expect(page.getByTestId('search-overlay')).toBeVisible();
});
