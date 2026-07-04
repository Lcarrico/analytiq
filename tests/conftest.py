"""
Shared pytest fixtures + logging hooks for AnalytIQ backend tests.

- Fresh temp-file SQLite DB per test (never touches analytiq.db)
- init_db() from server/app.py sets up schema
- Flask test client fixture
- All run output mirrored to tests/logs/<sprint_N|regression>_YYYYMMDD_HHMMSS.log
"""
import os
import re
import sys
import tempfile
from datetime import datetime
from pathlib import Path

import pytest

# Compile bytecode into a temp dir instead of __pycache__ next to the sources.
# The workspace mount can serve stale .pyc files (and forbids deleting them),
# which would otherwise make tests run against outdated code.
sys.pycache_prefix = os.path.join(tempfile.gettempdir(), 'analytiq_pyc')
sys.dont_write_bytecode = True  # also covers pytest's assertion-rewrite cache

ROOT = Path(__file__).resolve().parent.parent
LOGS_DIR = Path(__file__).resolve().parent / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Make `import app` resolve to server/app.py
sys.path.insert(0, str(ROOT / 'server'))

# Safety net: valid key even if .env is missing (app.py loads .env itself and
# will overwrite these with the project values, which is fine).
os.environ.setdefault(
    'CREDENTIAL_ENCRYPTION_KEY',
    __import__('cryptography.fernet', fromlist=['Fernet']).Fernet.generate_key().decode(),
)
# Make sure module-level _DB_PATH never points at the real analytiq.db,
# even before any fixture runs.
_FALLBACK_DB = str(Path(tempfile.mkdtemp(prefix='analytiq_test_')) / 'fallback.db')
os.environ['DATABASE_PATH'] = _FALLBACK_DB

import app as app_module  # noqa: E402  (server/app.py)

# Belt & braces: background threads that outlive a test revert to the fallback
# temp DB, never to the developer database.
app_module._DB_PATH = _FALLBACK_DB


@pytest.fixture()
def app_mod(tmp_path, monkeypatch):
    """server.app module re-pointed at a fresh temp SQLite DB with schema."""
    db_file = tmp_path / 'test.db'
    monkeypatch.setattr(app_module, '_DB_PATH', str(db_file))
    monkeypatch.setenv('ANALYTIQ_STORAGE_DIR', str(tmp_path / 'storage'))
    app_module.init_db()
    app_module.app.config['TESTING'] = True
    app_module.limiter.enabled = False
    # Fast simulations for tests
    monkeypatch.setattr(app_module, 'GOV_DELAYS', [0.01] * len(app_module.GOV_DELAYS))
    monkeypatch.setattr(app_module, 'PIPE_DELAYS', [0.01] * len(app_module.PIPE_DELAYS))
    if hasattr(app_module, 'PIPE_LOG_DELAY'):
        monkeypatch.setattr(app_module, 'PIPE_LOG_DELAY', 0.0)
    return app_module


@pytest.fixture()
def client(app_mod):
    with app_mod.app.test_client() as c:
        yield c


@pytest.fixture()
def db(app_mod):
    """Direct sqlite3 connection to the current test DB."""
    conn = app_mod._new_conn()
    yield conn
    conn.close()


def wait_until(predicate, timeout=10.0, interval=0.05):
    """Poll until predicate() is truthy; returns its value or raises."""
    import time
    deadline = time.time() + timeout
    while time.time() < deadline:
        val = predicate()
        if val:
            return val
        time.sleep(interval)
    raise TimeoutError('condition not met within %.1fs' % timeout)


# ─────────────────────────────────────────────────────────
# Logging hooks — mirror results to tests/logs/
# ─────────────────────────────────────────────────────────
def _log_name_for(session):
    files = {Path(str(item.fspath)).name for item in session.items}
    sprints = set()
    for f in files:
        m = re.match(r'test_sprint(\d+)\.py$', f)
        if m:
            sprints.add(int(m.group(1)))
        else:
            sprints.add(-1)  # non-sprint file present
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    if len(sprints) == 1 and -1 not in sprints:
        return LOGS_DIR / f'sprint_{sprints.pop()}_{ts}.log'
    # gap-closure program files: test_r<R>s<S>_<epic>.py → story-scoped log
    if len(files) == 1:
        stem = next(iter(files)).removesuffix('.py')
        if re.match(r'test_r\d+s\d+_', stem):
            return LOGS_DIR / f'{stem.removeprefix("test_")}_{ts}.log'
    return LOGS_DIR / f'regression_{ts}.log'


def pytest_collection_finish(session):
    if not session.items:
        return
    path = _log_name_for(session)
    fh = open(path, 'a', encoding='utf-8')
    session.config._analytiq_log = fh
    header = (
        f'==== AnalytIQ test run ====\n'
        f'timestamp : {datetime.now().isoformat()}\n'
        f'log file  : {path.name}\n'
        f'tests     : {len(session.items)}\n'
        f'{"=" * 27}\n'
    )
    fh.write(header)
    fh.flush()


def pytest_runtest_logreport(report):
    cfg = getattr(pytest_runtest_logreport, '_cfg', None)
    if cfg is None:
        return
    fh = getattr(cfg, '_analytiq_log', None)
    if fh is None:
        return
    if report.when == 'call' or (report.when == 'setup' and report.outcome != 'passed'):
        status = {'passed': 'PASS', 'failed': 'FAIL', 'skipped': 'SKIP'}.get(report.outcome, report.outcome.upper())
        ts = datetime.now().strftime('%H:%M:%S')
        fh.write(f'[{ts}] {status:4s}  {report.nodeid}\n')
        if report.outcome == 'failed':
            fh.write('-' * 60 + '\n')
            fh.write(str(report.longrepr) + '\n')
            fh.write('-' * 60 + '\n')
        fh.flush()


@pytest.hookimpl(tryfirst=True)
def pytest_configure(config):
    pytest_runtest_logreport._cfg = config


def pytest_sessionfinish(session, exitstatus):
    fh = getattr(session.config, '_analytiq_log', None)
    if fh:
        fh.write(f'==== finished {datetime.now().isoformat()} exit={exitstatus} ====\n\n')
        fh.close()
