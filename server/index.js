require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDb, seedDemoData } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ──────────────────────────────────────────────
app.use('/api/connections', require('./routes/connections'));
app.use('/api/governance',  require('./routes/governance'));
app.use('/api/tables',      require('./routes/tables'));
app.use('/api/semantic',    require('./routes/semantic'));
app.use('/api/sessions',    require('./routes/sessions'));
app.use('/api/pipeline',    require('./routes/pipeline'));
app.use('/api/artifacts',   require('./routes/artifacts'));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── 404 / Error handlers ────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Boot ────────────────────────────────────────────────
function start() {
  initDb();
  seedDemoData();
  app.listen(PORT, () => {
    console.log(`\n✅  AnalytIQ API  →  http://localhost:${PORT}\n`);
  });
}

start();
