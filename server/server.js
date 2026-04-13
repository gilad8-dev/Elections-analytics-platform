'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const path    = require('path');

const submitRouter = require('./routes/submit');
const statsRouter  = require('./routes/stats');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20kb' }));

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/submit', submitRouter);
app.use('/api/stats',  statsRouter);

// ── Legacy dashboard redirects ─────────────────────────────────────────────
// /admin and /guest no longer exist; redirect cleanly to the public dashboard.
app.get('/admin', (_req, res) => res.redirect(301, '/dashboard'));
app.get('/guest', (_req, res) => res.redirect(301, '/dashboard'));

// ── Dashboard UI ───────────────────────────────────────────────────────────
// Served from server/views/ so it is NOT exposed by the static middleware below.
app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// ── Static frontend (index.html, css/, js/, images/) ──────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ── 404 fallback ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nPoliticalculator running on http://localhost:${PORT}`);
  console.log(`Dashboard:                 http://localhost:${PORT}/dashboard\n`);
});
