// R30S3E7-US1 (UI) — wizard retirement: the named /app/create children
// redirect (quick/confirm/run → workbench start; result → artifacts library);
// S06–S09 are tombstoned with zero imports; their four planning surfaces
// (warm-start hints, KG-related, assumptions, reuse candidates) live in the
// workbench chat now (covered by the migrated r10s* specs).
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();

test('named wizard routes redirect to their owning surfaces', async ({ page }) => {
  for (const seg of ['quick', 'confirm', 'run']) {
    await page.goto(`/app/create/${seg}`);
    await expect.poll(() => new URL(page.url()).pathname).toBe('/app/create/new');
  }
  await page.goto('/app/create/result');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/artifacts');
});

test('S06–S09 are tombstoned: no imports anywhere in client/src', async () => {
  let out = '';
  try {
    out = execFileSync('grep', ['-rn',
      "-e", "screens/S06_Analysis", "-e", "screens/S07_Confirm",
      "-e", "screens/S08_Pipeline", "-e", "screens/S09_Dashboard",
      path.join(REPO, 'client', 'src')], { encoding: 'utf8' });
  } catch { /* exit 1 = no matches */ }
  expect(out.trim(), 'a wizard screen is still imported').toBe('');
});
