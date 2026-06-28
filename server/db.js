/**
 * db.js — SQLite database initialisation and demo seed
 * Uses better-sqlite3 (synchronous API, no callbacks needed).
 */
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'analytiq.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      type          TEXT NOT NULL DEFAULT 'snowflake',
      account       TEXT,
      username      TEXT,
      warehouse     TEXT,
      database_name TEXT,
      schema_name   TEXT,
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
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id          INTEGER REFERENCES governance_runs(id),
      name            TEXT NOT NULL,
      schema_name     TEXT,
      health_score    INTEGER,
      freshness       TEXT,
      row_count       TEXT,
      pk_gate         TEXT DEFAULT 'pass',
      null_gate       TEXT DEFAULT 'pass',
      freshness_gate  TEXT DEFAULT 'pass',
      pii_gate        TEXT DEFAULT 'pass',
      row_min_gate    TEXT DEFAULT 'pass',
      ml_ready        INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS semantic_definitions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id     INTEGER REFERENCES governance_runs(id),
      type       TEXT NOT NULL,
      name       TEXT NOT NULL,
      definition TEXT,
      confidence REAL,
      explore    TEXT,
      status     TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id  INTEGER REFERENCES connections(id),
      run_id         INTEGER REFERENCES governance_runs(id),
      metric         TEXT NOT NULL,
      grain          TEXT NOT NULL DEFAULT 'Location · Day',
      horizon        INTEGER DEFAULT 14,
      training_start TEXT DEFAULT '2023-01-01',
      training_end   TEXT DEFAULT '2023-12-31',
      status         TEXT DEFAULT 'pending',
      created_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id   INTEGER REFERENCES sessions(id),
      status       TEXT DEFAULT 'pending',
      current_step INTEGER DEFAULT 0,
      mape         REAL,
      features_count INTEGER DEFAULT 0,
      rows_count   INTEGER DEFAULT 0,
      log_entries  TEXT DEFAULT '[]',
      started_at   TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title           TEXT NOT NULL,
      type            TEXT DEFAULT 'Predictive',
      mape            REAL,
      owner           TEXT DEFAULT 'analyst@acme.com',
      dq_status       TEXT DEFAULT 'pass',
      pipeline_run_id INTEGER REFERENCES pipeline_runs(id),
      created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS artifact_shares (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      artifact_id INTEGER REFERENCES artifacts(id),
      email       TEXT NOT NULL,
      role        TEXT DEFAULT 'Viewer',
      shared_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chart_data (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      pipeline_run_id INTEGER REFERENCES pipeline_runs(id),
      day_index       INTEGER,
      date            TEXT,
      actual          REAL,
      predicted       REAL,
      ci_low          REAL,
      ci_high         REAL,
      is_forecast     INTEGER DEFAULT 0
    );
  `);
}

module.exports = { db, initDb };
