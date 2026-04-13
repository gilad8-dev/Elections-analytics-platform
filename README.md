# Politicalculator - Demo version

A full-stack political quiz that maps voters across four ideological axes and recommends the closest-matching political parties.

Users answer 52 questions, receive scores on four independent 0<->100 axes, and get personalised party recommendations based on their results. With consent, anonymous submissions are stored and visualised in a live dashboard. This public demo version includes one open-access dashboard backed by synthetic demo data.

This is a stripped-down public version of the full application, designed for demonstration and portfolio purposes. All code in this repository is the intellectual property of Gilad Shaked.

---

## Tech Stack

| Layer      | Technology |
|------------|-----------|
| Server     | Node.js / Express |
| Database   | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Frontend   | Vanilla JS, HTML, CSS (no framework) |
| Languages  | Hebrew (RTL), Arabic (RTL), Russian (LTR)|

---

## Quick Start

```bash
npm install          # install dependencies
npm run seed         # populate the demo database (500 synthetic submissions)
npm start            # start the server: (1) Quiz pgae → http://localhost:3000
                     #                   (2) Dashboard → http://localhost:3000/dashboard
```

> The database is created automatically at `data/` on first run. No `.env` file or secrets are needed.

---

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | The quiz (landing → 52 questions → results) |
| GET | `/dashboard` | Live aggregate results: open access, read-only |
| GET | `/admin` | Redirects to `/dashboard` (301) |
| GET | `/guest` | Redirects to `/dashboard` (301) |
| POST | `/api/submit` | Submit quiz result |
| GET | `/api/stats` | Aggregate stats JSON (`?gender=all\|male\|female`) |
| GET | `/api/stats/questions` | Per-question answer distribution |
| GET | `/api/stats/export` | CSV download of all submissions |

---

## Architecture

```
politicalculator/
├── server/
│   ├── server.js              Entry point: Express app
│   ├── db.js                  SQLite connection + schema init
│   ├── seed.js                Demo data generator (run once)
│   ├── routes/
│   │   ├── submit.js          POST /api/submit: validates + stores submissions
│   │   ├── stats.js           GET  /api/stats/*: public aggregate stats
│   │   └── stats-helpers.js   Aggregation logic (histograms, distributions)
│   └── views/
│       └── dashboard.html     Public dashboard UI (served at /dashboard)
├── data/
│   └── survey.db              SQLite database (auto-created, git-ignored)
├── js/
│   ├── app.js                 Quiz controller: state, rendering, submission
│   ├── scoring.js             Pure scoring engine (axis calculations)
│   ├── questions.js           52 question definitions
│   ├── parties.js             Party ideology positions
│   └── lang/                  Hebrew, Arabic, Russian string tables
├── css/styles.css
├── index.html                 Quiz UI
└── package.json
```

### Data flow

```
User completes quiz
      │
      ▼
app.js calculates axis scores (scoring.js)
      │
      ▼
POST /api/submit  →  validate input  →  SQLite (submissions table)
                                               │
      ┌────────────────────────────────────────┘
      ▼
GET /api/stats  →  stats-helpers.js aggregates  →  dashboard.html renders
```

---

## API Reference

### `POST /api/submit`

Stores an anonymous, consent-based survey submission.

**Body (JSON):**
```json
{
  "surveyVersion": "1.3",
  "answers": [0, 1, 2, 3, 4, 0, ...],
  "axisScores": [42.5, 78.0, 61.3, 33.1],
  "recommendedParties": ["party-a", "party-b", "party-c", "party-d"],
  "isFemale": false,
  "language": "he"
}
```

Answer encoding: 
  `0` =strongly agree 
  `1` =agree 
  `2` =neutral 
  `3` =disagree 
  `4` =strongly disagree 
  `-1`=skipped

**Responses:** `201 { ok: true }` | `400 { error }` | `500 server error`

---

### `GET /api/stats`

Public aggregate statistics. No authentication required.

Query params: `?gender=all|male|female`

**Response shape:**
```json
{
  "total": 500,
  "maleCount": 275,
  "femaleCount": 225,
  "stats": {
    "first":  { "average": 52.3, "histogram": [12, 18, ...], "topParty": { "id": "party-c", "count": 87 }, "partyDistribution": { ... } },
    "second": { ... },
    "third":  { ... },
    "fourth": { ... }
  }
}
```

---

### `GET /api/stats/questions`

Per question answer distribution.

Query params: `?gender=all|male|female`

**Response:** Array of 52 objects, one per question:
```json
[{ "-1": 5, "0": 120, "1": 98, "2": 45, "3": 67, "4": 89, "total": 424 }, ...]
```

---

### `GET /api/stats/export`

Downloads a CSV of all submissions (id, dates, scores, party recommendations).

---

## Database Schema

```sql
CREATE TABLE submissions (
  id                  TEXT PRIMARY KEY,   -- UUID v4
  created_at          TEXT NOT NULL,      -- ISO 8601 date (YYYY-MM-DD)
  survey_version      TEXT NOT NULL,      -- e.g. "1.3"
  answers             TEXT NOT NULL,      -- JSON array of 52 integers
  axis_scores         TEXT NOT NULL,      -- JSON array of 4 floats [0–100]
  recommended_parties TEXT NOT NULL,      -- JSON array of 4 party ID strings
  is_female           INTEGER NOT NULL,   -- 0 = male, 1 = female
  language            TEXT NOT NULL       -- "he" | "ar" | "ru"
);
```

No personally identifiable information is stored. No IP addresses, no names, no emails.

> **Demo data:** The database shipped in this repo contains 500 synthetic submissions generated by `server/seed.js`. It is entirely fictional and safe for public use.

---

## Scoring Engine

Each of the 52 questions belongs to one of four ideological axes. Questions carry `x` (strongly agree/disagree weight) and `y` (agree/disagree weight) parameters and can be marked `inverted` to flip their direction.

The axis score formula (in `js/scoring.js`):

```
rawScore = Σ (answer weight for each question on this axis)
score    = ((rawScore - MIN_POSSIBLE) / RANGE) * 100
```

Result: a float in [0, 100] per axis, computed entirely on the client before submission.

---

## Bumping the Survey Version

When you change questions or scoring weights, update `SURVEY_VERSION` in [js/app.js](js/app.js):

```js
var SURVEY_VERSION = '1.4'; // bump this
```

This lets you segment submissions by version in analytics.

---

## Adding a New Language

See [docs/MULTILINGUAL.md](docs/MULTILINGUAL.md) for the full checklist: text inventory, architecture notes, and quality requirements.
