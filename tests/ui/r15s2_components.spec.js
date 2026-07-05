// R15S2E3-US1 (UI) — committed design components on a real list screen:
// sortable DataTable, card⇄table toggle, StatusBadge language.
import { test, expect } from '@playwright/test';

async function seedArtifacts(request, titles) {
  for (const title of titles) {
    const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
    const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
    await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                      { timeout: 20_000 }).toBe('done');
    await request.post(`/api/sessions/${sess.id}/save_artifact`, { data: { title } });
  }
}

test('artifact list offers table view with working column sort', async ({ page, request }) => {
  const stamp = Date.now() % 1e6;
  await seedArtifacts(request, [`BBB Sort ${stamp}`, `AAA Sort ${stamp}`]);

  await page.goto('/app/artifacts');
  // deterministic regardless of suite history: narrow the list to the stamp
  // R30S1E2-US1: the frame's single filter input replaced "Search by title..."
  await page.getByPlaceholder('Filter by name, tag, owner…').fill(`Sort ${stamp}`);
  await expect(page.getByText(`AAA Sort ${stamp}`)).toBeVisible();   // debounce settled
  await page.getByTestId('view-toggle-table').click();
  const table = page.getByTestId('artifacts-table');
  await expect(table).toBeVisible();

  await table.getByRole('button', { name: /^Title/ }).click();      // sort asc
  const rowsAsc = await table.locator('[data-testid^="table-row-"]')
    .filter({ hasText: `Sort ${stamp}` }).allTextContents();
  const a = rowsAsc.findIndex(t => t.includes(`AAA Sort ${stamp}`));
  const b = rowsAsc.findIndex(t => t.includes(`BBB Sort ${stamp}`));
  expect(a).toBeLessThan(b);

  await table.getByRole('button', { name: /^Title/ }).click();      // sort desc
  const rowsDesc = await table.locator('[data-testid^="table-row-"]')
    .filter({ hasText: `Sort ${stamp}` }).allTextContents();
  const a2 = rowsDesc.findIndex(t => t.includes(`AAA Sort ${stamp}`));
  const b2 = rowsDesc.findIndex(t => t.includes(`BBB Sort ${stamp}`));
  expect(b2).toBeLessThan(a2);

  await page.getByTestId('view-toggle-cards').click();              // back to cards
  await expect(table).toHaveCount(0);
});

test('status badges follow the pill + dot spec', async ({ page, request }) => {
  const stamp = Date.now() % 1e6;
  await seedArtifacts(request, [`Badge Spec ${stamp}`]);
  await page.goto('/app/artifacts');
  const badge = page.locator('[data-testid="status-badge"]').first();
  await expect(badge).toBeVisible();
  await expect(badge.locator('[data-testid="badge-dot"]')).toBeVisible();
});
