// R33S2E2-US1 (UI) — Embed preview (`Artifact Sharing.dc.html` frame 03 /
// ch14): fake-browser live preview over a real signed embed token, dark
// code block + Copy, scope checkboxes (read-only locked by design; viewer
// filters = the real interactive scope; drill/export owned later), expiry
// select, allowed-domain chips, and Save persisting through the embed
// settings DEP. The preview token additionally allows the workspace origin
// so restricted-domain embeds still preview (noted in-UI).
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function artifact(request) {
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run',
    { data: { sessionId: sess.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
    { timeout: 25_000 }).toBe('done');
  return (await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Embed ${Date.now() % 1e6}` } })).json());
}

test('embed page: live preview, code block, scopes, domains, save persists', async ({ page, request }) => {
  const art = await artifact(request);

  await page.goto(`/app/artifacts/${art.id}/embed`);
  await expect(page.locator('main h1')).toHaveText('Embed preview');

  // fake browser frame with a live token-backed iframe
  const frame = page.getByTestId('embed-browser');
  await expect(frame.getByTestId('embed-urlbar')).toContainText(/example\.com|your-site/);
  await expect(frame.locator('iframe')).toHaveAttribute('src', /\/embed\//);

  // dark code block + copy
  const code = page.getByTestId('embed-code');
  expect(await css(code, 'backgroundColor')).toBe('rgb(15, 23, 42)');
  await expect(code).toContainText(/<iframe src=".*\/embed\//);
  await page.getByTestId('embed-copy').click();
  await expect(page.getByTestId('embed-copy')).toContainText(/copied/i);

  // scopes: read-only locked; viewer filters toggles the interactive scope
  await expect(page.getByTestId('scope-readonly')).toBeChecked();
  await expect(page.getByTestId('scope-readonly')).toBeDisabled();
  await expect(page.getByTestId('scope-drill')).toBeDisabled();
  await expect(page.getByTestId('scope-export')).toBeDisabled();
  await page.getByTestId('scope-filters').check();

  // expiry + allowed domains
  await page.getByTestId('embed-expires').selectOption('168');
  await page.getByTestId('domain-input').fill('https://acme-portal.example.com');
  await page.getByTestId('domain-add').click();
  await expect(page.getByTestId('domain-chip-0')).toContainText('acme-portal.example.com');

  // save -> persisted via the DEP + audited; code block reflects a new token
  const srcBefore = await code.innerText();
  await page.getByTestId('embed-save').click();
  await expect.poll(async () => {
    const s = await (await request.get(`/api/artifacts/${art.id}/embed_settings`)).json();
    return s.scope;
  }).toBe('interactive');
  const saved = await (await request.get(`/api/artifacts/${art.id}/embed_settings`)).json();
  expect(saved.expires_in_hours).toBe(168);
  expect(saved.allowed_origins).toContain('https://acme-portal.example.com');
  await expect(code).not.toHaveText(srcBefore);   // re-minted token
  const audits = await (await request.get('/api/audit-logs?action=embed.settings_saved&limit=3')).json();
  const entries = Array.isArray(audits) ? audits : audits.entries || [];
  expect(entries.length).toBeGreaterThanOrEqual(1);

  // chips removable
  await page.getByTestId('domain-remove-0').click();
  await expect(page.getByTestId('domain-chip-0')).toHaveCount(0);

  // settings reload from persistence
  await page.reload();
  await expect(page.getByTestId('scope-filters')).toBeChecked();
});
