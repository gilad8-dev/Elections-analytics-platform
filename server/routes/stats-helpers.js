'use strict';

const db = require('../db');

const AXES = ['first', 'second', 'third', 'fourth'];

function genderWhere(query) {
  if (query.gender === 'male')   return 'WHERE is_female = 0';
  if (query.gender === 'female') return 'WHERE is_female = 1';
  return '';
}

// Build a WHERE clause combining optional gender and language filters.
// Language codes are validated against a strict pattern before interpolation.
function buildWhere(query) {
  const conds = [];
  if (query.gender === 'male')   conds.push('is_female = 0');
  if (query.gender === 'female') conds.push('is_female = 1');
  if (query.language && query.language !== 'all' && /^[a-z]{2,5}$/.test(query.language)) {
    conds.push("language = '" + query.language + "'");
  }
  return conds.length ? 'WHERE ' + conds.join(' AND ') : '';
}

function computeStats(query) {
  const where       = buildWhere(query);
  const total       = db.prepare(`SELECT COUNT(*) AS count FROM submissions ${where}`).get().count;
  const maleCount   = db.prepare('SELECT COUNT(*) AS count FROM submissions WHERE is_female = 0').get().count;
  const femaleCount = db.prepare('SELECT COUNT(*) AS count FROM submissions WHERE is_female = 1').get().count;
  const rows        = db.prepare(`SELECT axis_scores, recommended_parties FROM submissions ${where}`).all();

  const scoresByAxis  = { first: [], second: [], third: [], fourth: [] };
  const partiesByAxis = { first: {}, second: {}, third: {}, fourth: {} };

  for (const row of rows) {
    let scores, parties;
    try {
      scores  = JSON.parse(row.axis_scores);
      parties = JSON.parse(row.recommended_parties);
    } catch { continue; }

    AXES.forEach((axis, i) => {
      const s = scores[i];
      if (typeof s === 'number' && Number.isFinite(s)) scoresByAxis[axis].push(s);
      const p = parties[i];
      if (typeof p === 'string') partiesByAxis[axis][p] = (partiesByAxis[axis][p] || 0) + 1;
    });
  }

  const stats = {};
  for (const axis of AXES) {
    const arr = scoresByAxis[axis];
    const avg = arr.length
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100
      : null;

    const histogram = Array(10).fill(0);
    for (const s of arr) histogram[Math.min(Math.floor(s / 10), 9)]++;

    const partDist = partiesByAxis[axis];
    const topParty = Object.keys(partDist).length
      ? Object.entries(partDist).sort((a, b) => b[1] - a[1])[0]
      : null;

    stats[axis] = {
      average:          avg,
      histogram,
      topParty:         topParty ? { id: topParty[0], count: topParty[1] } : null,
      partyDistribution: partDist
    };
  }

  return { total, maleCount, femaleCount, stats };
}

function computeQuestions(query) {
  const where = buildWhere(query);
  const rows  = db.prepare(`SELECT answers FROM submissions ${where}`).all();

  const dist = Array.from({ length: 52 }, () => ({
    '-1': 0, '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, total: 0
  }));

  for (const row of rows) {
    let answers;
    try { answers = JSON.parse(row.answers); } catch { continue; }
    answers.forEach((val, idx) => {
      if (idx >= 52) return;
      const key = String(val);
      if (key in dist[idx]) {
        dist[idx][key]++;
        dist[idx].total++;
      }
    });
  }

  return dist;
}

module.exports = { computeStats, computeQuestions, genderWhere, buildWhere };
