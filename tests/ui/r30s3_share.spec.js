// R30S3E4-US1 (UI) — canonical 520px share modal (`Inspector Panels.dc.html`
// #share-modal): header `Share "…"` + mono meta, 4 VISIBILITY radio cards
// (public → token URL bar + Copy), 7-tile DISTRIBUTE grid, collapsible
// Advanced (expires, password toggle, checkboxes, red Revoke that really
// kills the link). Canonical from every share trigger.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function seedArtifact(request, title) {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  return (await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json());
}

test('share modal: header, visibility cards, token bar, distribute, advanced, revoke', async ({ page, request }) => {
  const title = `Share Art ${Date.now() % 1e6}`;
  const art = await seedArtifact(request, title);
  await page.goto(`/app/artifacts/${art.id}`);
  await page.getByTestId('detail-share').click();

  const modal = page.getByTestId('share-modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByText(`Share "${title}"`)).toBeVisible();
  const meta = modal.getByTestId('share-meta');
  await expect(meta).toContainText(/artifact · v1 · governed/);
  expect(await css(meta, 'fontFamily')).toContain('Mono');

  // 4 visibility radio cards; private selected by default
  for (const v of ['private', 'workspace-view', 'workspace-edit', 'public']) {
    await expect(modal.getByTestId(`vis-${v}`)).toBeVisible();
  }
  expect(await modal.getByTestId('vis-private').getAttribute('aria-checked')).toBe('true');
  await expect(modal.getByTestId('share-token-bar')).toHaveCount(0);

  // choosing public mints a real signed link
  await modal.getByTestId('vis-public').click();
  const bar = modal.getByTestId('share-token-bar');
  await expect(bar).toBeVisible({ timeout: 8000 });
  await expect(bar).toContainText(/\/api\/public\//);
  expect(await css(bar.getByTestId('share-token-url'), 'fontFamily')).toContain('Mono');
  await expect(bar.getByTestId('copy-link')).toBeVisible();

  // DISTRIBUTE: 7 tiles
  const tiles = modal.locator('[data-testid^="dist-"]');
  await expect(tiles).toHaveCount(7);
  for (const t of ['Embed', 'HTML', 'PDF Export', 'PNG Export', 'Slack', 'Email', 'Link']) {
    await expect(modal.getByText(t, { exact: true })).toBeVisible();
  }

  // Advanced settings collapse open: expires select, password toggle,
  // checkboxes, red revoke
  await modal.getByTestId('advanced-toggle').click();
  await expect(modal.getByTestId('share-expires')).toBeVisible();
  await expect(modal.getByTestId('share-password').locator('[data-testid="toggle"]')).toBeVisible();
  for (const c of ['adv-comments', 'adv-drill', 'adv-export']) {
    await expect(modal.getByTestId(c)).toBeVisible();
  }
  const revoke = modal.getByTestId('revoke-link');
  expect(await css(revoke, 'color')).toBe('rgb(220, 38, 38)');

  // revoke really kills the minted link
  const url = (await bar.getByTestId('share-token-url').innerText()).trim();
  const before = await page.evaluate(u => fetch(u).then(r => r.status), url);
  expect(before).toBe(200);
  await revoke.click();
  await expect(modal.getByTestId('share-token-bar')).toHaveCount(0, { timeout: 8000 });
  const after = await page.evaluate(u => fetch(u).then(r => r.status), url);
  expect([404, 410]).toContain(after);
});
