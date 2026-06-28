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

// ─────────────────────────────────────────────────────────
// DEMO DATA SEED
// ─────────────────────────────────────────────────────────
const { generateChartData } = require('./services/chartData');

const DEMO_TABLES = [
  { name:'fact_revenue',   schema:'CORE',    health:98, freshness:'2h ago',  rows:'4.2M',  pk:'pass',nul:'pass',frs:'pass',pii:'pass',rmin:'pass',ml:1 },
  { name:'dim_location',   schema:'CORE',    health:94, freshness:'6h ago',  rows:'12.8K', pk:'pass',nul:'pass',frs:'pass',pii:'pass',rmin:'pass',ml:1 },
  { name:'fact_sessions',  schema:'CORE',    health:87, freshness:'1h ago',  rows:'2.1M',  pk:'pass',nul:'warn',frs:'pass',pii:'pass',rmin:'pass',ml:1 },
  { name:'dim_customer',   schema:'CORE',    health:71, freshness:'3d ago',  rows:'84.2K', pk:'pass',nul:'warn',frs:'warn',pii:'flag',rmin:'pass',ml:0 },
  { name:'staging_events', schema:'STAGING', health:90, freshness:'30m ago', rows:'890K',  pk:'warn',nul:'pass',frs:'pass',pii:'pass',rmin:'pass',ml:1 },
  { name:'raw_clickstream',schema:'RAW',     health:44, freshness:'12d ago', rows:'124',   pk:'fail',nul:'warn',frs:'fail',pii:'pass',rmin:'fail',ml:0 },
];

const DEMO_DEFS = [
  { type:'Metric',    name:'Net Revenue',          def:'Total revenue after refunds and discounts, aggregated daily per location.',   conf:0.71, explore:'Revenue'            },
  { type:'Metric',    name:'Conversion Rate',       def:'Percentage of sessions that resulted in at least one purchase.',              conf:0.64, explore:'Revenue'            },
  { type:'Dimension', name:'Location Tier',         def:'Operational tier classification assigned to a physical location.',            conf:0.68, explore:'Location Perf.'    },
  { type:'Metric',    name:'Avg Session Duration',  def:'Mean time in seconds a user spent in an active session.',                    conf:0.59, explore:'Engagement'         },
  { type:'Dimension', name:'Customer Segment',      def:'Behavioral segment label assigned to a customer by the ML pipeline.',        conf:0.73, explore:'Customer'           },
];

function seedDemoData() {
  // Only seed if no connections exist
  const existing = db.prepare('SELECT COUNT(*) as c FROM connections').get();
  if (existing.c > 0) return;

  console.log('Seeding demo data...');

  // Connection
  const conn = db.prepare(`
    INSERT INTO connections (name, type, account, username, warehouse, database_name, schema_name)
    VALUES (?,?,?,?,?,?,?)
  `).run('acme-analytics', 'snowflake', 'acme123.snowflakecomputing.com', 'analyst', 'COMPUTE_WH', 'ANALYTICS_DB', 'PUBLIC');
  const connId = conn.lastInsertRowid;

  // Governance run (completed)
  const gov = db.prepare(`
    INSERT INTO governance_runs (connection_id, status, current_step, tables_count, definitions_count, low_confidence_count, completed_at)
    VALUES (?,?,?,?,?,?,datetime('now','-10 minutes'))
  `).run(connId, 'done', 4, 47, 183, 12);
  const runId = gov.lastInsertRowid;

  // Tables
  const insTable = db.prepare(`
    INSERT INTO cataloged_tables (run_id, name, schema_name, health_score, freshness, row_count, pk_gate, null_gate, freshness_gate, pii_gate, row_min_gate, ml_ready)
    VALUES (@runId,@name,@schema_name,@health_score,@freshness,@row_count,@pk,@nul,@frs,@pii,@rmin,@ml)
  `);
  for (const t of DEMO_TABLES) insTable.run({ runId, ...t });

  // Semantic defs (all accepted)
  const insDef = db.prepare(`
    INSERT INTO semantic_definitions (run_id, type, name, definition, confidence, explore, status)
    VALUES (?,?,?,?,?,?,?)
  `);
  for (const d of DEMO_DEFS) insDef.run(runId, d.type, d.name, d.def, d.conf, d.explore, 'accepted');

  // Session
  const sess = db.prepare(`
    INSERT INTO sessions (connection_id, run_id, metric, grain, horizon, training_start, training_end, status)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(connId, runId, 'Net Revenue', 'Location · Day', 14, '2023-01-01', '2023-12-31', 'done');
  const sessId = sess.lastInsertRowid;

  // Pipeline run
  const pipe = db.prepare(`
    INSERT INTO pipeline_runs (session_id, status, current_step, mape, features_count, rows_count, completed_at)
    VALUES (?,?,?,?,?,?,datetime('now','-5 minutes'))
  `).run(sessId, 'done', 4, 8.9, 34, 12847);
  const pipeId = pipe.lastInsertRowid;

  // Chart data
  const chartRows = generateChartData(pipeId);
  const insChart = db.prepare(`
    INSERT INTO chart_data (pipeline_run_id, day_index, date, actual, predicted, ci_low, ci_high, is_forecast)
    VALUES (@pipeline_run_id,@day_index,@date,@actual,@predicted,@ci_low,@ci_high,@is_forecast)
  `);
  const insMany = db.transaction(rows => { for (const r of rows) insChart.run(r); });
  insMany(chartRows);

  // Artifact (primary)
  const art = db.prepare(`
    INSERT INTO artifacts (title, type, mape, owner, dq_status, pipeline_run_id)
    VALUES (?,?,?,?,?,?)
  `).run('Net Revenue by Location — 14-Day Forecast', 'Predictive', 8.9, 'alex@acme.com', 'pass', pipeId);
  const artId = art.lastInsertRowid;

  // Shares
  db.prepare(`INSERT INTO artifact_shares (artifact_id, email, role) VALUES (?,?,?)`).run(artId, 'sam@acme.com', 'Editor');

  // Second artifact (descriptive, no chart data)
  db.prepare(`
    INSERT INTO artifacts (title, type, mape, owner, dq_status, pipeline_run_id)
    VALUES (?,?,?,?,?,?)
  `).run('Conversion Rate Trends — Q1 2024', 'Descriptive', null, 'alex@acme.com', 'pass', null);

  // Third artifact
  db.prepare(`
    INSERT INTO artifacts (title, type, mape, owner, dq_status, pipeline_run_id)
    VALUES (?,?,?,?,?,?)
  `).run('Location Cohort Performance', 'Predictive', 11.2, 'sam@acme.com', 'warn', null);

  console.log('Demo data seeded ✓');
}

module.exports = { db, initDb, seedDemoData };
