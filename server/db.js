'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'survey.db'));

// WAL mode gives better concurrent read/write performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id                  TEXT PRIMARY KEY,
    created_at          TEXT NOT NULL,
    survey_version      TEXT NOT NULL,
    answers             TEXT NOT NULL,
    axis_scores         TEXT NOT NULL,
    recommended_parties TEXT NOT NULL,
    is_female           INTEGER NOT NULL DEFAULT 0
  )
`);

// Migration: add is_female to existing databases that predate this column
try {
  db.exec(`ALTER TABLE submissions ADD COLUMN is_female INTEGER NOT NULL DEFAULT 0`);
} catch { /* column already exists — safe to ignore */ }

// Migration: add language to existing databases that predate this column
try {
  db.exec(`ALTER TABLE submissions ADD COLUMN language TEXT NOT NULL DEFAULT 'he'`);
} catch { /* column already exists — safe to ignore */ }

module.exports = db;
