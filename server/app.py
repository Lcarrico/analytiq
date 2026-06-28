#!/usr/bin/env python3
"""
AnalytIQ API  —  Flask + sqlite3 (Python stdlib)
Zero native compilation. Only external deps: flask, flask-cors.

Run:   python server/app.py
API:   http://localhost:3001
"""
import json
import os
import sqlite3
import threading
import time
from datetime import date, timedelta
from pathlib import Path
from queue import Empty, Queue

from flask import Flask, Response, g, jsonify, request, session, stream_with_context
from flask_cors import CORS

# ─────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────
app  = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')
CORS(app, origins=['http://localhost:5173'], supports_credentials=True)

BASE     = Path(__file__).parent
DATA_DIR = BASE / 'data'
DATA_DIR.mkdir(exist_ok=True)
DB_PATH  = str(DATA_DIR / 'analytiq.db')
PORT     = int(os.environ.get('PORT', 3001))

# ─────────────────────────────────────────────────────────
# Database helpers
# ─────────────────────────────────────────────────────────
def get_db():
    """Per-request SQLite connection (stored in Flask g)."""
    if 'db' not in g:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA journal_mode=WAL')
        conn.execute('PRAGMA foreign_keys=ON')
        g.db = conn
    return g.db

def thread_db():
    """Fresh connection for background threads (no Flask context)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA foreign_keys=ON')
    return conn

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db:
        db.close()

def one(sql, params=()):
    row = get_db().execute(sql, params).fetchone()
    return dict(row) if row else None

def many(sql, params=()):
    return [dict(r) for r in get_db().execute(sql, params).fetchall()]

def execute(sql, params=()):
    db = get_db()
    cur = db.execute(sql, params)
    db.commit()
    return cur.lastrowid

# ─────────────────────────────────────────────────────────
# Schema
# ─────────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    password   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS connections (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    type          TEXT NOT NULL DEFAULT 'snowflake',
    account       TEXT, username TEXT, warehouse TEXT,
    database_name TEXT, schema_name TEXT,
    status        TEXT DEFAULT 'active',
    created_at    TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS governance_runs (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id        INTEGER REFERENCES connections(id),
    status               TEXT DEFAULT 'pending',
    current_step         INTEGER DEFAULT 0,
    tables_count         INTEGER,
    definitions_count    INTEGER,
    low_confidence_count INTEGER,
    started_at           TEXT DEFAULT (datetime('now')),
    completed_at         TEXT
);
CREATE TABLE IF NOT EXISTS cataloged_tables (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id         INTEGER REFERENCES governance_runs(id),
    name           TEXT NOT NULL, schema_name TEXT,
    health_score   INTEGER, freshness TEXT, row_count TEXT,
    pk_gate        TEXT DEFAULT 'pass',
    null_gate      TEXT DEFAULT 'pass',
    freshness_gate TEXT DEFAULT 'pass',
    pii_gate       TEXT DEFAULT 'pass',
    row_min_gate   TEXT DEFAULT 'pass',
    ml_ready       INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS semantic_definitions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id     INTEGER REFERENCES governance_runs(id),
    type       TEXT NOT NULL, name TEXT NOT NULL,
    definition TEXT, confidence REAL, explore TEXT,
    status     TEXT DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS sessions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id  INTEGER, run_id INTEGER,
    metric         TEXT NOT NULL,
    grain          TEXT NOT NULL DEFAULT 'Location · Day',
    horizon        INTEGER DEFAULT 14,
    training_start TEXT DEFAULT '2023-01-01',
    training_end   TEXT DEFAULT '2023-12-31',
    status         TEXT DEFAULT 'pending',
    created_at     TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id     INTEGER, status TEXT DEFAULT 'running',
    current_step   INTEGER DEFAULT 0, mape REAL,
    features_count INTEGER DEFAULT 0, rows_count INTEGER DEFAULT 0,
    log_entries    TEXT DEFAULT '[]',
    started_at     TEXT DEFAULT (datetime('now')),
    completed_at   TEXT
);
CREATE TABLE IF NOT EXISTS artifacts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL, type TEXT DEFAULT 'Predictive',
    mape            REAL, owner TEXT DEFAULT 'analyst@acme.com',
    dq_status       TEXT DEFAULT 'pass',
    pipeline_run_id INTEGER,
    created_at      TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS artifact_shares (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    artifact_id INTEGER, email TEXT NOT NULL,
    role        TEXT DEFAULT 'Viewer',
    shared_at   TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS chart_data (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    pipeline_run_id INTEGER, day_index INTEGER,
    date TEXT, actual REAL, predicted REAL,
    ci_low REAL, ci_high REAL, is_forecast INTEGER DEFAULT 0
);
"""

# ─────────────────────────────────────────────────────────
# Chart data (deterministic seeded RNG — matches JS version)
# ─────────────────────────────────────────────────────────
def seeded_rng(seed=42):
    s = seed

    def rand():
        nonlocal s
        s = (s * 9301 + 49297) % 233280
        return s / 233280

    return rand


def generate_chart_data(pipeline_run_id: int) -> list[dict]:
    rand    = seeded_rng(42)
    weekly  = [0.88, 0.94, 1.0, 1.06, 1.13, 0.80, 0.73]
    start   = date(2024, 1, 15)
    rows    = []
    for i in range(90):
        trend  = 1 + (i / 90) * 0.10
        base   = 620 * weekly[i % 7] * trend
        actual = round(base + (rand() - 0.5) * 95) if i < 76 else None
        pred   = round(base + (rand() - 0.5) * 55)
        ci     = 48 + i * 1.9
        d      = start + timedelta(days=i)
        rows.append({
            'pipeline_run_id': pipeline_run_id,
            'day_index': i,
            'date': d.strftime('%b ') + str(d.day),
            'actual': actual,
            'predicted': pred,
            'ci_low': round(pred - ci),
            'ci_high': round(pred + ci),
            'is_forecast': 1 if i >= 76 else 0,
        })
    return rows


def compute_kpis(rows: list[dict]) -> dict:
    hist = [r for r in rows if 46 <= r['day_index'] < 76 and r['actual'] is not None]
    fcast = [r for r in rows if r['is_forecast']]
    avg_actual   = round(sum(r['actual'] for r in hist) / len(hist)) if hist else 0
    mape         = round(sum(abs(r['actual'] - r['predicted']) / r['actual'] for r in hist) / len(hist) * 100, 1) if hist else 0
    forecast14   = round(sum(r['predicted'] for r in fcast) / len(fcast)) if fcast else 0
    return {'avgActual': avg_actual, 'mape': mape, 'forecast14Avg': forecast14}


# ─────────────────────────────────────────────────────────
# Seed data
# ─────────────────────────────────────────────────────────
DEMO_TABLES = [
    ('fact_revenue',    'CORE',    98, '2h ago',  '4.2M',  'pass', 'pass', 'pass', 'pass', 'pass', 1),
    ('dim_location',    'CORE',    94, '6h ago',  '12.8K', 'pass', 'pass', 'pass', 'pass', 'pass', 1),
    ('fact_sessions',   'CORE',    87, '1h ago',  '2.1M',  'pass', 'warn', 'pass', 'pass', 'pass', 1),
    ('dim_customer',    'CORE',    71, '3d ago',  '84.2K', 'pass', 'warn', 'warn', 'flag', 'pass', 0),
    ('staging_events',  'STAGING', 90, '30m ago', '890K',  'warn', 'pass', 'pass', 'pass', 'pass', 1),
    ('raw_clickstream', 'RAW',     44, '12d ago', '124',   'fail', 'warn', 'fail', 'pass', 'fail', 0),
]
DEMO_DEFS = [
    ('Metric',    'Net Revenue',         'Total revenue after refunds and discounts, aggregated daily per location.',   0.71, 'Revenue'),
    ('Metric',    'Conversion Rate',     'Percentage of sessions that resulted in at least one purchase.',              0.64, 'Revenue'),
    ('Dimension', 'Location Tier',       'Operational tier classification assigned to a physical location.',            0.68, 'Location Perf.'),
    ('Metric',    'Avg Session Duration','Mean time in seconds a user spent in an active session.',                     0.59, 'Engagement'),
    ('Dimension', 'Customer Segment',    'Behavioral segment label assigned to a customer by the ML pipeline.',         0.73, 'Customer'),
]


def init_db():
    """Create schema and seed demo data on first run."""
    conn = thread_db()
    conn.executescript(SCHEMA)
    conn.commit()

    if conn.execute('SELECT COUNT(*) FROM connections').fetchone()[0] > 0:
        conn.close()
        return

    print('Seeding demo data...')

    cur   = conn.execute(
        'INSERT INTO connections (name,type,account,username,warehouse,database_name,schema_name) VALUES (?,?,?,?,?,?,?)',
        ('acme-analytics', 'snowflake', 'acme123.snowflakecomputing.com',
         'analyst', 'COMPUTE_WH', 'ANALYTICS_DB', 'PUBLIC'),
    )
    conn_id = cur.lastrowid

    cur = conn.execute(
        "INSERT INTO governance_runs (connection_id,status,current_step,tables_count,definitions_count,low_confidence_count,completed_at) "
        "VALUES (?,?,?,?,?,?,datetime('now','-10 minutes'))",
        (conn_id, 'done', 4, 47, 183, 12),
    )
    run_id = cur.lastrowid

    conn.executemany(
        'INSERT INTO cataloged_tables (run_id,name,schema_name,health_score,freshness,row_count,'
        'pk_gate,null_gate,freshness_gate,pii_gate,row_min_gate,ml_ready) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [(run_id,) + t for t in DEMO_TABLES],
    )
    conn.executemany(
        'INSERT INTO semantic_definitions (run_id,type,name,definition,confidence,explore,status) VALUES (?,?,?,?,?,?,?)',
        [(run_id,) + d + ('accepted',) for d in DEMO_DEFS],
    )

    cur    = conn.execute(
        "INSERT INTO sessions (connection_id,run_id,metric,grain,horizon,training_start,training_end,status) "
        "VALUES (?,?,?,?,?,?,?,?)",
        (conn_id, run_id, 'Net Revenue', 'Location · Day', 14, '2023-01-01', '2023-12-31', 'done'),
    )
    sess_id = cur.lastrowid

    cur    = conn.execute(
        "INSERT INTO pipeline_runs (session_id,status,current_step,mape,features_count,rows_count,completed_at) "
        "VALUES (?,?,?,?,?,?,datetime('now','-5 minutes'))",
        (sess_id, 'done', 4, 8.9, 34, 12847),
    )
    pipe_id = cur.lastrowid

    conn.executemany(
        'INSERT INTO chart_data (pipeline_run_id,day_index,date,actual,predicted,ci_low,ci_high,is_forecast) '
        'VALUES (:pipeline_run_id,:day_index,:date,:actual,:predicted,:ci_low,:ci_high,:is_forecast)',
        generate_chart_data(pipe_id),
    )

    cur = conn.execute(
        'INSERT INTO artifacts (title,type,mape,owner,dq_status,pipeline_run_id) VALUES (?,?,?,?,?,?)',
        ('Net Revenue by Location — 14-Day Forecast', 'Predictive', 8.9, 'alex@acme.com', 'pass', pipe_id),
    )
    art_id = cur.lastrowid
    conn.execute('INSERT INTO artifact_shares (artifact_id,email,role) VALUES (?,?,?)', (art_id, 'sam@acme.com', 'Editor'))
    conn.execute('INSERT INTO artifacts (title,type,owner,dq_status) VALUES (?,?,?,?)',
                 ('Conversion Rate Trends — Q1 2024', 'Descriptive', 'alex@acme.com', 'pass'))
    conn.execute('INSERT INTO artifacts (title,type,mape,owner,dq_status) VALUES (?,?,?,?,?)',
                 ('Location Cohort Performance', 'Predictive', 11.2, 'sam@acme.com', 'warn'))

    conn.commit()
    conn.close()
    print('Demo data seeded ✓')


# ─────────────────────────────────────────────────────────
# SSE client registries (in-memory, per-process)
# ─────────────────────────────────────────────────────────
_gov_clients: dict[int, list[Queue]]  = {}
_gov_lock    = threading.Lock()
_pipe_clients: dict[int, list[Queue]] = {}
_pipe_lock   = threading.Lock()


def _broadcast(registry, lock, run_id, data):
    with lock:
        for q in list(registry.get(run_id, [])):
            try:
                q.put_nowait(data)
            except Exception:
                pass


def broadcast_gov(run_id, data):  _broadcast(_gov_clients,  _gov_lock,  run_id, data)
def broadcast_pipe(run_id, data): _broadcast(_pipe_clients, _pipe_lock, run_id, data)


# ─────────────────────────────────────────────────────────
# Governance simulation
# ─────────────────────────────────────────────────────────
GOV_DELAYS = [2.0, 3.0, 4.0, 2.5]


def simulate_governance(run_id: int):
    def _run():
        conn = thread_db()
        try:
            for step in range(1, 5):
                time.sleep(GOV_DELAYS[step - 1])
                status = 'done' if step == 4 else 'running'
                conn.execute('UPDATE governance_runs SET current_step=?, status=? WHERE id=?', (step, status, run_id))
                conn.commit()
                broadcast_gov(run_id, {'step': step, 'status': status})

            # Seed tables & definitions for this run if not already there
            if not conn.execute('SELECT 1 FROM cataloged_tables WHERE run_id=?', (run_id,)).fetchone():
                conn.executemany(
                    'INSERT INTO cataloged_tables (run_id,name,schema_name,health_score,freshness,row_count,'
                    'pk_gate,null_gate,freshness_gate,pii_gate,row_min_gate,ml_ready) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                    [(run_id,) + t for t in DEMO_TABLES],
                )
                conn.executemany(
                    'INSERT INTO semantic_definitions (run_id,type,name,definition,confidence,explore,status) VALUES (?,?,?,?,?,?,?)',
                    [(run_id,) + d + ('pending',) for d in DEMO_DEFS],
                )
            conn.execute(
                "UPDATE governance_runs SET tables_count=47,definitions_count=183,low_confidence_count=12,"
                "completed_at=datetime('now') WHERE id=?", (run_id,),
            )
            conn.commit()
        finally:
            conn.close()

    threading.Thread(target=_run, daemon=True).start()


# ─────────────────────────────────────────────────────────
# Pipeline simulation
# ─────────────────────────────────────────────────────────
PIPE_DELAYS = [3.0, 5.0, 4.5, 2.5]
PIPE_LOGS   = {
    1: [
        '[INFO] Gold table: fact_revenue × dim_location · grain=location_day',
        '[INFO] 12,847 rows · 34 features · time-based split verified',
        '[DQ]  PK uniqueness: ✓ PASS',
        '[DQ]  Key null rate < 5%: ✓ PASS (max 1.2%)',
        '[INFO] Leakage scan: clean (no future-date features)',
    ],
    2: [
        '[INFO] XGBoost training started · n_estimators=500 · max_depth=6',
        '[INFO] Train split: 8,993 rows (Jan–Sep 2023)',
        '[INFO] Val split:   1,927 rows (Oct 2023)',
        '[INFO] Test split:  1,927 rows (Nov–Dec 2023)',
    ],
    3: [
        '[INFO] Fold 1/5 → MAPE 7.4%',
        '[INFO] Fold 2/5 → MAPE 8.1%',
        '[INFO] Fold 3/5 → MAPE 9.8%',
        '[INFO] Fold 4/5 → MAPE 8.3%',
        '[INFO] Fold 5/5 → MAPE 7.9%',
        '[INFO] Validation MAPE 8.9% < 15.0% threshold: ✓ PASS',
        '[INFO] Overfit check: test 9.1% ≤ val 8.9% × 1.2: ✓ PASS',
    ],
    4: [
        '[INFO] Writing 12,847 predictions → gold.net_revenue_preds_v1',
        '[DQ]  Distribution gate: ✓ PASS (KS p=0.42)',
        '[INFO] Generating self-contained dashboard artifact...',
        '[DONE] Pipeline complete · 3m 41s · model_id=xgb-locrev-v1',
    ],
}


def simulate_pipeline(run_id: int):
    def _run():
        conn     = thread_db()
        all_logs = []
        try:
            for step in range(1, 5):
                conn.execute('UPDATE pipeline_runs SET current_step=?, status=? WHERE id=?', (step, 'running', run_id))
                conn.commit()

                for line in PIPE_LOGS.get(step, []):
                    all_logs.append(line)
                    conn.execute('UPDATE pipeline_runs SET log_entries=? WHERE id=?', (json.dumps(all_logs), run_id))
                    conn.commit()
                    broadcast_pipe(run_id, {'step': step, 'status': 'running', 'log': list(all_logs)})
                    time.sleep(0.28)

                time.sleep(PIPE_DELAYS[step - 1])

            # Store chart data
            conn.executemany(
                'INSERT INTO chart_data (pipeline_run_id,day_index,date,actual,predicted,ci_low,ci_high,is_forecast) '
                'VALUES (:pipeline_run_id,:day_index,:date,:actual,:predicted,:ci_low,:ci_high,:is_forecast)',
                generate_chart_data(run_id),
            )
            conn.execute(
                "UPDATE pipeline_runs SET status='done',current_step=4,mape=8.9,features_count=34,"
                "rows_count=12847,log_entries=?,completed_at=datetime('now') WHERE id=?",
                (json.dumps(all_logs), run_id),
            )
            conn.commit()
            broadcast_pipe(run_id, {'step': 4, 'status': 'done', 'log': all_logs})
        finally:
            conn.close()

    threading.Thread(target=_run, daemon=True).start()


# ─────────────────────────────────────────────────────────
# SSE helper
# ─────────────────────────────────────────────────────────
def sse_response(generator_fn):
    resp = Response(stream_with_context(generator_fn()), mimetype='text/event-stream')
    resp.headers['Cache-Control']      = 'no-cache'
    resp.headers['X-Accel-Buffering']  = 'no'
    resp.headers['Transfer-Encoding']  = 'chunked'
    return resp


# ─────────────────────────────────────────────────────────
# Routes — Health
# ─────────────────────────────────────────────────────────
@app.get('/api/health')
def health():
    return jsonify({'ok': True})


# ─────────────────────────────────────────────────────────
# Routes — Connections
# ─────────────────────────────────────────────────────────
@app.get('/api/connections')
def list_connections():
    return jsonify(many('SELECT * FROM connections ORDER BY created_at DESC'))

@app.get('/api/connections/<int:id>')
def get_connection(id):
    row = one('SELECT * FROM connections WHERE id=?', (id,))
    return jsonify(row) if row else (jsonify({'error': 'Not found'}), 404)

@app.post('/api/connections')
def create_connection():
    b   = request.get_json() or {}
    lid = execute(
        'INSERT INTO connections (name,type,account,username,warehouse,database_name,schema_name) VALUES (?,?,?,?,?,?,?)',
        (b.get('name', 'My Snowflake'), b.get('type', 'snowflake'), b.get('account'),
         b.get('username'), b.get('warehouse'), b.get('database_name'), b.get('schema_name')),
    )
    return jsonify(one('SELECT * FROM connections WHERE id=?', (lid,))), 201

@app.delete('/api/connections/<int:id>')
def delete_connection(id):
    execute('DELETE FROM connections WHERE id=?', (id,))
    return '', 204


# ─────────────────────────────────────────────────────────
# Routes — Governance
# ─────────────────────────────────────────────────────────
@app.post('/api/governance/run')
def start_governance():
    b   = request.get_json() or {}
    cid = b.get('connectionId')
    if not cid:
        return jsonify({'error': 'connectionId required'}), 400
    lid = execute('INSERT INTO governance_runs (connection_id,status,current_step) VALUES (?,?,?)',
                  (cid, 'running', 0))
    simulate_governance(lid)
    return jsonify({'runId': lid}), 201

@app.get('/api/governance/stream/<int:run_id>')
def governance_stream(run_id):
    q = Queue()
    with _gov_lock:
        _gov_clients.setdefault(run_id, []).append(q)

    def generate():
        row = one('SELECT * FROM governance_runs WHERE id=?', (run_id,))
        if row:
            yield f"data: {json.dumps({'step': row['current_step'], 'status': row['status']})}\n\n"
        if row and row['status'] == 'done':
            return
        try:
            while True:
                try:
                    data = q.get(timeout=15)
                    if data is None:
                        return
                    yield f"data: {json.dumps(data)}\n\n"
                    if data.get('status') == 'done':
                        return
                except Empty:
                    yield ': ping\n\n'
        finally:
            with _gov_lock:
                lst = _gov_clients.get(run_id, [])
                if q in lst:
                    lst.remove(q)

    return sse_response(generate)

@app.get('/api/governance/<int:id>')
def get_governance(id):
    row = one('SELECT * FROM governance_runs WHERE id=?', (id,))
    return jsonify(row) if row else (jsonify({'error': 'Not found'}), 404)


# ─────────────────────────────────────────────────────────
# Routes — Tables
# ─────────────────────────────────────────────────────────
@app.get('/api/tables/<int:run_id>')
def get_tables(run_id):
    return jsonify(many('SELECT * FROM cataloged_tables WHERE run_id=? ORDER BY health_score DESC', (run_id,)))


# ─────────────────────────────────────────────────────────
# Routes — Semantic
# ─────────────────────────────────────────────────────────
@app.get('/api/semantic/<int:run_id>')
def get_semantic(run_id):
    return jsonify(many('SELECT * FROM semantic_definitions WHERE run_id=? ORDER BY confidence ASC', (run_id,)))

@app.patch('/api/semantic/<int:id>')
def update_semantic(id):
    b      = request.get_json() or {}
    status = b.get('status')
    defn   = b.get('definition')
    db     = get_db()
    if defn is not None:
        db.execute('UPDATE semantic_definitions SET definition=?,confidence=?,status=? WHERE id=?',
                   (defn, 0.96, 'accepted', id))
    elif status:
        db.execute('UPDATE semantic_definitions SET status=? WHERE id=?', (status, id))
    db.commit()
    return jsonify(one('SELECT * FROM semantic_definitions WHERE id=?', (id,)))


# ─────────────────────────────────────────────────────────
# Routes — Sessions
# ─────────────────────────────────────────────────────────
@app.get('/api/sessions/<int:id>')
def get_session(id):
    row = one('SELECT * FROM sessions WHERE id=?', (id,))
    return jsonify(row) if row else (jsonify({'error': 'Not found'}), 404)

@app.post('/api/sessions')
def create_session():
    b   = request.get_json() or {}
    lid = execute(
        'INSERT INTO sessions (connection_id,run_id,metric,grain,horizon,training_start,training_end,status) '
        'VALUES (?,?,?,?,?,?,?,?)',
        (b.get('connectionId'), b.get('runId'), b.get('metric', 'Net Revenue'),
         b.get('grain', 'Location · Day'), b.get('horizon', 14),
         b.get('training_start', '2023-01-01'), b.get('training_end', '2023-12-31'), 'pending'),
    )
    return jsonify(one('SELECT * FROM sessions WHERE id=?', (lid,))), 201


# ─────────────────────────────────────────────────────────
# Routes — Pipeline
# ─────────────────────────────────────────────────────────
@app.post('/api/pipeline/run')
def start_pipeline():
    b   = request.get_json() or {}
    sid = b.get('sessionId')
    if not sid:
        return jsonify({'error': 'sessionId required'}), 400
    lid = execute('INSERT INTO pipeline_runs (session_id,status,current_step,log_entries) VALUES (?,?,?,?)',
                  (sid, 'running', 0, '[]'))
    simulate_pipeline(lid)
    return jsonify({'runId': lid}), 201

@app.get('/api/pipeline/stream/<int:run_id>')
def pipeline_stream(run_id):
    q = Queue()
    with _pipe_lock:
        _pipe_clients.setdefault(run_id, []).append(q)

    def generate():
        row = one('SELECT * FROM pipeline_runs WHERE id=?', (run_id,))
        if row:
            logs = json.loads(row['log_entries'] or '[]')
            yield f"data: {json.dumps({'step': row['current_step'], 'status': row['status'], 'log': logs})}\n\n"
        if row and row['status'] == 'done':
            return
        try:
            while True:
                try:
                    data = q.get(timeout=15)
                    if data is None:
                        return
                    yield f"data: {json.dumps(data)}\n\n"
                    if data.get('status') == 'done':
                        return
                except Empty:
                    yield ': ping\n\n'
        finally:
            with _pipe_lock:
                lst = _pipe_clients.get(run_id, [])
                if q in lst:
                    lst.remove(q)

    return sse_response(generate)

@app.get('/api/pipeline/<int:id>')
def get_pipeline(id):
    row = one('SELECT * FROM pipeline_runs WHERE id=?', (id,))
    if not row:
        return jsonify({'error': 'Not found'}), 404
    row['log_entries'] = json.loads(row['log_entries'] or '[]')
    return jsonify(row)


# ─────────────────────────────────────────────────────────
# Routes — Artifacts
# ─────────────────────────────────────────────────────────
@app.get('/api/artifacts')
def list_artifacts():
    return jsonify(many(
        'SELECT a.*, COUNT(s.id) as share_count '
        'FROM artifacts a LEFT JOIN artifact_shares s ON s.artifact_id=a.id '
        'GROUP BY a.id ORDER BY a.created_at DESC'
    ))

@app.get('/api/artifacts/<int:id>')
def get_artifact(id):
    row = one('SELECT * FROM artifacts WHERE id=?', (id,))
    return jsonify(row) if row else (jsonify({'error': 'Not found'}), 404)

@app.post('/api/artifacts')
def create_artifact():
    b   = request.get_json() or {}
    lid = execute(
        'INSERT INTO artifacts (title,type,mape,owner,dq_status,pipeline_run_id) VALUES (?,?,?,?,?,?)',
        (b.get('title'), b.get('type', 'Predictive'), b.get('mape'),
         b.get('owner', 'analyst@acme.com'), b.get('dq_status', 'pass'), b.get('pipeline_run_id')),
    )
    return jsonify(one('SELECT * FROM artifacts WHERE id=?', (lid,))), 201

@app.delete('/api/artifacts/<int:id>')
def delete_artifact(id):
    execute('DELETE FROM artifact_shares WHERE artifact_id=?', (id,))
    execute('DELETE FROM artifacts WHERE id=?', (id,))
    return '', 204

@app.get('/api/artifacts/<int:id>/chart')
def get_chart(id):
    art = one('SELECT * FROM artifacts WHERE id=?', (id,))
    if not art:
        return jsonify({'error': 'Not found'}), 404
    if not art['pipeline_run_id']:
        return jsonify({'rows': [], 'kpis': {'avgActual': 0, 'mape': 0, 'forecast14Avg': 0}})
    rows = many('SELECT * FROM chart_data WHERE pipeline_run_id=? ORDER BY day_index', (art['pipeline_run_id'],))
    return jsonify({'rows': rows, 'kpis': compute_kpis(rows)})

@app.get('/api/artifacts/<int:id>/shares')
def list_shares(id):
    return jsonify(many('SELECT * FROM artifact_shares WHERE artifact_id=? ORDER BY shared_at DESC', (id,)))

@app.post('/api/artifacts/<int:id>/shares')
def add_share(id):
    b = request.get_json() or {}
    if not b.get('email'):
        return jsonify({'error': 'email required'}), 400
    lid = execute('INSERT INTO artifact_shares (artifact_id,email,role) VALUES (?,?,?)',
                  (id, b['email'], b.get('role', 'Viewer')))
    return jsonify(one('SELECT * FROM artifact_shares WHERE id=?', (lid,))), 201

@app.delete('/api/artifacts/<int:art_id>/shares/<int:share_id>')
def remove_share(art_id, share_id):
    execute('DELETE FROM artifact_shares WHERE id=? AND artifact_id=?', (share_id, art_id))
    return '', 204


# ─────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────
from auth import auth_bp
app.register_blueprint(auth_bp)

# ─────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print(f'\n✅  AnalytIQ API  →  http://localhost:{PORT}\n')
    app.run(host='0.0.0.0', port=PORT, threaded=True, debug=False)
