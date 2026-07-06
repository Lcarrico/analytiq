// R33S2E4-US1 (UI) — error template ×8 (`Errors.dc.html` / ch14): one
// consistent layout (mono badge · title · explanation · single action)
// across all eight designed states, browsable on the internal board and
// wired into the live 404 / 403 surfaces.
import { test, expect } from '@playwright/test';

const KINDS = ['not_found', 'forbidden', 'token_expired', 'workspace_not_found',
               'artifact_unavailable', 'pipeline_failed', 'connector_failed',
               'access_denied'];

test('all eight states render the shared template on the board', async ({ page }) => {
  await page.goto('/app/__errors');
  for (const k of KINDS) {
    const card = page.getByTestId(`error-${k}`);
    await expect(card.getByTestId('error-badge')).toBeVisible();
    await expect(card.getByTestId('error-title')).toBeVisible();
    await expect(card.getByTestId('error-action')).toBeVisible();
  }
  await expect(page.getByTestId('error-not_found').getByTestId('error-badge'))
    .toHaveText('404');
  await expect(page.getByTestId('error-forbidden').getByTestId('error-badge'))
    .toContainText('403');
  await expect(page.getByTestId('error-pipeline_failed'))
    .toContainText('Your data was not modified');
});

test('live 404 uses the template; Go home recovers', async ({ page }) => {
  await page.goto('/app/definitely-not-real');
  const nf = page.getByTestId('notfound-page');
  await expect(nf.getByTestId('error-badge')).toHaveText('404');
  await expect(nf).toContainText('/app/definitely-not-real');   // mono route detail
  await nf.getByTestId('error-action').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app');
});
