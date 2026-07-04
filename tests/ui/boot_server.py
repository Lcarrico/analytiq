#!/usr/bin/env python3
"""
UI test server bootstrap (Phase 2 of the Evolution Program).

Boots the Flask app in zero-key fallback mode on UI_PORT with:
- a fresh temp-file SQLite DB (never analytiq.db)
- sandboxed storage dir
- SIM_DELAY_SCALE=0 (all governance/pipeline simulation delays -> 0)
- client/dist served by Flask (one process serves app + API)

Invoked by playwright.config.mjs `webServer`.
"""
import os
import sys
import tempfile
from pathlib import Path

PORT = int(os.environ.get('UI_PORT', 3111))

tmp = tempfile.mkdtemp(prefix='analytiq_ui_')
os.environ['DATABASE_PATH'] = os.path.join(tmp, 'ui_test.db')
os.environ['ANALYTIQ_STORAGE_DIR'] = os.path.join(tmp, 'storage')
os.environ['SIM_DELAY_SCALE'] = '0'
os.environ['PORT'] = str(PORT)

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'server'))

# Match backend conftest: never write bytecode next to sources.
sys.pycache_prefix = os.path.join(tempfile.gettempdir(), 'analytiq_pyc')
sys.dont_write_bytecode = True

import app as app_mod  # noqa: E402

# Same policy as the backend conftest: deterministic tests, no rate limits.
app_mod.limiter.enabled = False

app_mod.init_db()
app_mod.start_background_services()
print(f'UI test server on :{PORT} db={os.environ["DATABASE_PATH"]}', flush=True)
app_mod.app.run(host='127.0.0.1', port=PORT, threaded=True, debug=False)
