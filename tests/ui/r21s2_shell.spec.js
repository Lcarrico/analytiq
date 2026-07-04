// R21S2E1-US1/US2 (UI) — sidebar parity with App Home.dc.html #home:
// group structure (top ungrouped · DATA · INTELLIGENCE · spacer · bottom
// border-top group + Collapse row), exact label/item styles, 64px rail.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test('sidebar groups match the frame: order, labels, membership', async ({ page }) => {
  await page.goto('/app');
  const sidebar = page.getByTestId('app-sidebar');
  await expect(sidebar).toBeVisible();

  // group labels: exactly DATA and INTELLIGENCE (legacy WORKSPACE/OPERATE/
  // ORGANIZATION headers are gone)
  const labels = sidebar.getByTestId('nav-group-label');
  await expect(labels).toHaveText(['DATA', 'INTELLIGENCE']);

  // link order per frame: Models lives under INTELLIGENCE (after Gold Tables)
  const links = sidebar.getByRole('link');
  await expect(links).toHaveText([
    'Home', 'Create', 'Artifacts',
    'Data', 'Semantic Layer', 'Gold Tables',
    'Models', 'Alerts', 'Governance',
    'Team', 'Admin', 'Billing', 'Settings',
  ]);

  // group label style: mono 9.5/600 ls .12em, padding 12px 22px 4px
  const dataLabel = labels.first();
  expect(await css(dataLabel, 'fontSize')).toBe('9.5px');
  expect(await css(dataLabel, 'fontWeight')).toBe('600');
  expect(await css(dataLabel, 'letterSpacing')).toBe('1.14px'); // 9.5 × .12em
  expect(await css(dataLabel, 'paddingLeft')).toBe('22px');
  expect(await css(dataLabel, 'paddingTop')).toBe('12px');

  // logo row: h64, border-bottom #eef1f5, padding 0 20
  const logoRow = sidebar.getByTestId('sidebar-logo-row');
  expect(await logoRow.evaluate(el => el.offsetHeight)).toBe(64);
  expect(await css(logoRow, 'borderBottomColor')).toBe('rgb(238, 241, 245)');
  expect(await css(logoRow, 'paddingLeft')).toBe('20px');

  // active item: bg #e8effc text #1d4ed8 w600, 15px svg icon
  const home = sidebar.getByRole('link', { name: 'Home', exact: true });
  expect(await css(home, 'backgroundColor')).toBe('rgb(232, 239, 252)');
  expect(await css(home, 'color')).toBe('rgb(29, 78, 216)');
  expect(await css(home, 'fontWeight')).toBe('600');
  await expect(home.locator('svg')).toBeVisible();

  // bottom group sits above a border-top hairline; Collapse row (not a
  // full-width « button) closes the rail
  const bottom = sidebar.getByTestId('nav-bottom-group');
  expect(await css(bottom, 'borderTopColor')).toBe('rgb(238, 241, 245)');
  const collapse = sidebar.getByTestId('sidebar-collapse');
  await expect(collapse).toContainText('Collapse');
  expect(await css(collapse, 'fontSize')).toBe('12px');
  expect(await css(collapse, 'color')).toBe('rgb(148, 163, 184)');
});

test('rail collapse keeps centered icons and tooltips', async ({ page }) => {
  await page.goto('/app');
  const sidebar = page.getByTestId('app-sidebar');
  await page.getByTestId('sidebar-collapse').click();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(64);
  const home = sidebar.getByRole('link', { name: 'Home', exact: true });
  await expect(home.locator('svg')).toBeVisible();       // icon survives
  expect(await home.getAttribute('title')).toBe('Home'); // tooltip
  expect(await css(home, 'justifyContent')).toBe('center');
  await page.getByTestId('sidebar-collapse').click();
  await expect.poll(async () => Math.round((await sidebar.boundingBox()).width)).toBe(240);
});
