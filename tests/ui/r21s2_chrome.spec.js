// R21S2E3-US1 (UI) — content chrome per frame: shell-level breadcrumb strip
// removed; PageHeader owns the crumb (`acme-retail / <area>`) above the
// 21px/600 h1; main padding 28/32; body bg #f7f8fa.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('page header block replaces the floating shell breadcrumb', async ({ page }) => {
  await page.goto('/app/artifacts');
  // crumb now lives INSIDE the content column (PageHeader), not as a strip
  // between topbar and main
  const strip = page.locator('header[data-testid="topbar"] + div[data-testid="breadcrumbs"]');
  await expect(strip).toHaveCount(0);
  const crumb = page.getByTestId('breadcrumbs');
  await expect(crumb).toContainText('acme-retail / artifacts');
  expect(await css(crumb, 'fontSize')).toBe('11px');
  expect(await css(crumb, 'fontFamily')).toContain('Mono');
  expect(await css(crumb, 'color')).toBe('rgb(148, 163, 184)');

  const h1 = page.locator('main h1').first();
  expect(await css(h1, 'fontSize')).toBe('21px');
  expect(await css(h1, 'fontWeight')).toBe('600');

  const main = page.locator('main');
  expect(await css(main, 'paddingTop')).toBe('28px');
  expect(await css(main, 'paddingLeft')).toBe('32px');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe('rgb(247, 248, 250)');
});
