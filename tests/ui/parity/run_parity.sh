#!/usr/bin/env bash
# PAR-1 — run the mockup-parity scoreboard and regenerate PARITY_REPORT.md.
# Usage: bash tests/ui/parity/run_parity.sh [--grep "File name"]
# (Sandbox note: same local-workdir dance as run_ui.sh; pass --grep chunks if
# the environment caps command duration.)
set -uo pipefail
REPO="$(cd "$(dirname "$0")/../../.." && pwd)"
WORK="${UI_WORKDIR:-/tmp/aiq_parity}"
mkdir -p "$WORK/tests/logs"
cp "$REPO/playwright.config.mjs" "$WORK/"
rm -rf "$WORK/tests/ui"; mkdir -p "$WORK/tests"
cp -r "$REPO/tests/ui" "$WORK/tests/ui"
ln -sfn "$REPO/node_modules" "$WORK/node_modules"
cd "$WORK"
PARITY=1 BOOT_PY="$REPO/tests/ui/boot_server.py" UI_OUTPUT_DIR="$WORK/ui-artifacts" \
  node node_modules/playwright/cli.js test tests/ui/parity/parity.spec.js \
    --reporter=json "$@" > "$WORK/parity-results.json" 2>"$WORK/parity-stderr.log"
code=$?
cp "$WORK/parity-results.json" "$REPO/tests/logs/parity-results-$(date +%Y%m%d_%H%M%S).json" || true
node "$REPO/tests/ui/parity/report.mjs" "$WORK/parity-results.json" \
  > "$REPO/docs/specs/parity/PARITY_REPORT.md"
echo "report → docs/specs/parity/PARITY_REPORT.md (exit $code is informational — scoreboard, not gate)"
exit 0
