const express = require('express');
const { db }  = require('../db');
const router  = express.Router();

// GET /api/connections
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM connections ORDER BY created_at DESC').all();
  res.json(rows);
});

// GET /api/connections/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/connections
router.post('/', (req, res) => {
  const { name, type = 'snowflake', account, username, warehouse, database_name, schema_name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  // Simulate a brief connection test (200 ms)
  setTimeout(() => {
    const result = db.prepare(`
      INSERT INTO connections (name, type, account, username, warehouse, database_name, schema_name)
      VALUES (?,?,?,?,?,?,?)
    `).run(name || 'My Snowflake', type, account, username, warehouse, database_name, schema_name);

    const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(conn);
  }, 200);
});

// DELETE /api/connections/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM connections WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
