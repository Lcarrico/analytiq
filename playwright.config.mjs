// Playwright config — AnalytIQ UI suite (Evolution Program Phase 2).
//
// Environment adaptations (see PROGRESS.md ledger):
// - Browser CDN blocked in sandbox → chromium binary from @sparticuz/chromium.
// - Workspace mount is very slow for the runner → tests/ui/run_ui.sh executes
//   this config from a sandbox-local workdir; BOOT_PY/REPO_ROOT env point back
//   at the repo. `npx playwright test` from the repo root also works (slower).
import { defineConfig } from '@playwright/test';
import chromium from '@sparticuz/chromium';

const executablePath = await chromium.executablePath();
const PORT = process.env.UI_PORT || '3111';
const BOOT = process.env.BOOT_PY || 'tests/ui/boot_server.py';

export default defineConfig({
  testDir: './tests/ui',
  testMatch: /.*\.spec\.js/,
  // PAR-1: the mockup-parity scoreboard only runs when explicitly requested
  testIgnore: process.env.PARITY ? [] : ['**/parity/**'],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // single shared zero-key server; tests create their own entities
  retries: 0, // flake policy: root-cause, never retry-mask
  outputDir: process.env.UI_OUTPUT_DIR || 'tests/logs/ui-artifacts',
  reporter: [['line'], ['./tests/ui/log-reporter.mjs']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath,
      // @sparticuz/chromium's defaults include Lambda-specific flags
      // (--single-process, --no-zygote) that wedge the browser after a few
      // contexts in this sandbox — root-caused flake, so they are stripped.
      args: chromium.args.filter(a =>
        !['--single-process', '--no-zygote', "--headless='shell'", '--headless'].includes(a)),
    },
  },
  webServer: {
    command: `python3 ${BOOT}`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: true,
    timeout: 60_000,
    env: { UI_PORT: PORT },
  },
});
