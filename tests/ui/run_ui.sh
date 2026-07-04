#!/usr/bin/env bash
# UI suite runner (sandbox). The workspace mount makes the Playwright runner
# ~12x slower, so we execute from a local workdir and copy logs back.
# On a native checkout, plain `npx playwright test` works too.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="${UI_WORKDIR:-/tmp/analytiq_ui_run}"
rm -rf "$WORK"
mkdir -p "$WORK/tests/logs"
cp "$REPO/playwright.config.mjs" "$WORK/"
cp -r "$REPO/tests/ui" "$WORK/tests/ui"
ln -sfn "$REPO/node_modules" "$WORK/node_modules"
cd "$WORK"
set +e
BOOT_PY="$REPO/tests/ui/boot_server.py" UI_OUTPUT_DIR="$WORK/ui-artifacts" \
  node node_modules/playwright/cli.js test "$@"
code=$?
set -e
# Mirror logs + failure artifacts back into the repo (append-only on mount).
cp tests/logs/ui_*.log "$REPO/tests/logs/" 2>/dev/null || true
if compgen -G "ui-artifacts/*" > /dev/null 2>&1; then
  dest="$REPO/tests/logs/ui-artifacts-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$dest" && cp -r ui-artifacts/* "$dest/" || true
fi
exit $code
