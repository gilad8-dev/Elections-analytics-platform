# Multilingual Support Protocol

## 1. Purpose

This website is designed to support multiple languages. Every language version must be a complete, faithful translation of the Hebrew source — including both **male** and **female** grammatical variants for all text that is gender-inflected in that language.

The Hebrew version is the canonical source of truth. All other languages are derived from it.

---

## 2. What Must Change When Adding a New Language

Follow this checklist in order. Do not skip steps.

### Step 1 — Create a language file

Create a new file at `js/lang/<code>.js` where `<code>` is the ISO 639-1 language code (e.g. `en`, `ar`, `fr`, `ru`).

This file must export a single object that mirrors the structure of the Hebrew language file (`js/lang/he.js`). Every key must be present. Missing keys will cause runtime errors.

### Step 2 — Translate all user-facing text

Translate every string listed in the **Text Inventory** section below. For each string that requires gender inflection in the target language, provide both a `male` and a `female` variant.

If the target language does not have grammatical gender, you may use a single shared string for both variants — but the key structure must still be present.

### Step 3 — Register the language

Add the new language code and its display name to the language configuration object in `js/lang/index.js`. This is the single place where supported languages are declared.

### Step 4 — Update the submission payload and backend validation

Two changes are required:

1. **Frontend** (`js/app.js`): Add the active language code to the data sent by `POST /api/submit`. The field name is `language` (string, e.g. `"en"`).

2. **Backend** (`server/routes/submit.js`): Add the new language code to the `VALID_LANGUAGES` set. Without this, the server will reject submissions from the new language with a 400 validation error. This step is easy to forget because it is in a different file from the frontend change.

```js
// server/routes/submit.js
const VALID_LANGUAGES = new Set(['he', 'ar', 'en']); // add new code here
```

### Step 5 — Update the database schema

The `submissions` table has a `language TEXT NOT NULL DEFAULT 'he'` column, added via a migration in `server/db.js`. **This column requires no schema change per language** — it is a plain TEXT field with no enum constraint, so any language code is stored as-is once it passes backend validation.

The only action required in this step is ensuring the column exists (the migration handles this automatically on server startup). New language codes are stored correctly as soon as they are accepted by `VALID_LANGUAGES` (Step 4).

### Step 6 — Verify the stats API accepts the new language code

The public stats API (`GET /api/stats`, `GET /api/stats/questions`) already supports optional language filtering via a `?language=` query parameter — implemented in `server/routes/stats-helpers.js`. No backend changes are needed for a new language; the filter is freeform text validated against a `/^[a-z]{2,5}$/` pattern.

The public dashboard UI (`/dashboard`) exposes only gender filters, not language filters. **No dashboard UI changes are required when adding a new language.**

If you want to query language-segmented stats directly, you can do so via the API:

```
GET /api/stats?language=en
GET /api/stats/questions?language=en
```

The CSV export (`GET /api/stats/export`) already includes a `language` column for every submission.

---

## 3. What Must NOT Change When Adding a Language

The following are **never modified** per language. They are implemented once and apply to all languages automatically:

- Layout and grid structure
- Component sizes and proportions
- Color scheme and visual design
- Spacing and padding
- Typography scale (font sizes, weights, line heights)
- Animations — except direction (see Section 8)

The goal is that any UI or design change is made once in the shared CSS and immediately applies to every language version. There must be no per-language copies of HTML structure, CSS rules, or layout logic.

---

## 4. Scalability Requirements

The system follows a **single-source-of-truth** approach for all user-facing text:

- All text lives in language files under `js/lang/`. The HTML and JavaScript contain no hardcoded strings (except within the language files themselves).
- Adding a language requires creating one new file and registering it — nothing else.
- Gender variants are stored within each language file, not scattered across `index.html` or `app.js`.
- Any wording change to the Hebrew version is made in `js/lang/he.js` only, and the translator updates their language file accordingly.
- Do not copy-paste HTML pages or CSS files per language.

---

## 5. Text Inventory

This is the complete list of every user-visible string that must be translated. Strings marked **[gendered]** require both a male and female variant in the language file.

### Landing Page

| Key | Hebrew (male) | Hebrew (female) | Notes |
|-----|---------------|-----------------|-------|
| `page.title` | מחשבון פוליטי | — | Browser tab title, no gender |
| `landing.heading` | המחשבון הפוליטי הישראלי | — | Main h1, no gender |
| `landing.description` | ענה על 52 שאלות וגלה היכן אתה ממוקם על ארבעה צירים אידיאולוגיים. הבחירות שלך יחושבו ויוצגו כתוצאה ויזואלית. | — | [gendered] |
| `landing.btn.male` | שאלון בלשון זכר | — | Button label for male survey |
| `landing.btn.female` | שאלון בלשון נקבה | — | Button label for female survey |
| `landing.btn.skip.male` | דלג על השאלון | — | Skip survey (male) |
| `landing.btn.skip.female` | דלגי על השאלון | — | Skip survey (female) |
| `landing.btn.skipToLast.male` | דלג לשאלה האחרונה | — | Dev shortcut (male) |
| `landing.btn.skipToLast.female` | דלגי לשאלה האחרונה | — | Dev shortcut (female) |

### Question Page

| Key | Hebrew (male) | Hebrew (female) | Notes |
|-----|---------------|-----------------|-------|
| `question.counter` | שאלה {n} מתוך {total} | — | No gender; `{n}` and `{total}` are interpolated |
| `question.prev` | שאלה קודמת | — | Previous button, no gender |
| `answers.stronglyAgree` | מסכים מאוד | מסכימה מאוד | [gendered] |
| `answers.agree` | מסכים | מסכימה | [gendered] |
| `answers.neutral` | לא בטוח / לא יודע | לא בטוחה / לא יודעת | [gendered] |
| `answers.disagree` | לא מסכים | לא מסכימה | [gendered] |
| `answers.stronglyDisagree` | לא מסכים בכלל | לא מסכימה בכלל | [gendered] |

### Results Page

| Key | Hebrew (male) | Hebrew (female) | Notes |
|-----|---------------|-----------------|-------|
| `results.heading` | תוצאות | — | No gender |
| `results.subtitle` | מיקומך על ארבעת הצירים האידיאולוגיים | — | No gender |
| `results.share.label` | שתף את התוצאות שלך | שתפי את התוצאות שלך | [gendered] |
| `results.share.whatsapp` | שתף בווטסאפ | — | Button tooltip, no gender |
| `results.share.instagram` | שתף באינסטגרם | — | Button tooltip, no gender |
| `results.share.x` | שתף ב-X | — | Button tooltip, no gender |
| `results.share.facebook` | שתף בפייסבוק | — | Button tooltip, no gender |
| `results.share.text` | זו התוצאה שלי במחשבון הפוליטי הישראלי. מוזמנים לנסות גם! | זו התוצאה שלי במחשבון הפוליטי הישראלי. מוזמנות לנסות גם! | [gendered] Share message text |
| `results.share.cardTitle` | המחשבון הפוליטי הישראלי | — | Share image card title |
| `results.share.cardSubtitle` | התוצאות שלי | — | Share image card subtitle |
| `results.consent.label` | אני מאשר/ת שימוש בתוצאותיי האנונימיות לצרכי מחקר וסטטיסטיקה | — | Checkbox label |
| `results.restart` | בחזרה להתחלה | — | Restart button, no gender |

### Axis Labels and Tooltips

Four axes, each with a title, left label, left tooltip, right label, right tooltip.

| Key pattern | Example Hebrew | Notes |
|-------------|----------------|-------|
| `axes.first.title` | ציר ראשון | No gender |
| `axes.first.left.label` | שמאל ראשון | No gender |
| `axes.first.left.tooltip` | תיאור הצד השמאלי | No gender |
| `axes.first.right.label` | ימין ראשון | No gender |
| `axes.first.right.tooltip` | תיאור הצד הימני | No gender |

Repeat for `axes.second`, `axes.third`, `axes.fourth` (four axes total = 20 strings).

### Party Recommendation Text

| Key | Hebrew | Notes |
|-----|--------|-------|
| `parties.closestOnAxis` | היא המפלגה הכי קרובה לדעותיך בציר זה, ב- | Followed by a percentage |
| `parties.overallBest` | הקרוב ביותר בסך הכל | Section heading, no gender |
| `parties.moreSimilar` | מפלגות קרובות נוספות: | Secondary parties header |

### Party Data (10 parties)

For each party, provide: `name`, `tooltip.general`, `tooltip.first`, `tooltip.second`, `tooltip.third`, `tooltip.fourth`.

That is **50 strings** across 10 parties. None require gender variants.

`partyData` is a keyed object — keys are party IDs (`'party-a'` through `'party-j'`). See Section 6 for details.

### Status and Error Messages

| Key | Hebrew | Notes |
|-----|--------|-------|
| `status.saving` | שומר... | Consent submission in progress |
| `status.saved` | תודה! התוצאות נשמרו בצורה אנונימית. | Consent submission success |
| `error.submit.duplicate` | כבר שלחת תוצאות מהמכשיר הזה | Present in language files; not triggered in the current system |
| `error.submit.generic` | שגיאה בשמירת התוצאות | Generic server error |
| `error.submit.network` | שגיאת תקשורת — נסו שוב מאוחר יותר | Network error |
| `toast.clipboard` | התמונה הועתקה ללוח! הדביקו אותה בפוסט לאחר שהאתר נפתח. | Share clipboard toast |
| `toast.download` | התמונה הורדה — הדביקו אותה בפוסט. | Share download toast |
| `toast.error` | לא הצלחנו ליצור את תמונת השיתוף. נסו שוב. | Share generation error toast |

### Questions (52 questions)

Each question is identified by a key `questions[n]` where `n` is 0–51.

Each question object has two fields: `male` and `female`.

All 52 questions must be translated in both variants. This is the largest translation task (~104 strings). See `js/questions.js` for the current Hebrew placeholder texts.

**Total strings to translate per language: approximately 200.**

---

## 6. Architecture Notes for Implementers

These are non-obvious constraints in the implementation that are not visible from the protocol steps alone. Violating them causes silent runtime failures, not errors during the build.

### Script load order

Language files are plain JS files loaded via `<script>` tags. The **Hebrew file** (`js/lang/he.js`) builds its `questions` array by calling `QUESTIONS.map(...)`, where `QUESTIONS` is defined in `js/questions.js`. This means the load order in `index.html` is a hard dependency:

```
questions.js  →  lang/he.js  →  lang/ar.js  →  lang/index.js  →  app.js
```

`lang/ar.js` and any future language files that define their own question strings inline are not affected by this constraint. But if a future file also uses `QUESTIONS.map()`, it must load after `questions.js`. Do not reorder these `<script>` tags without checking this dependency.

### Axis text does not live in `AXES_META`

The `AXES_META` object in `app.js` contains only `barClass` (a CSS class name). All human-readable axis content — titles, left/right labels, and tooltips — lives in the `axes` keyed object within each language file, and is accessed via the `axisText(axisKey)` helper (e.g. `axisText('first')`). When editing or adding axis labels, do not look in `app.js` — look in `js/lang/he.js` (and the corresponding translation file).

### `partyData` is keyed by party ID

Party names and tooltips for each language live in the `partyData` object within the language file, keyed by the party's `id` property (e.g. `'party-a'` through `'party-j'`). The lookup is `_langData.partyData[party.id]`. When adding a new party to `js/parties.js`, add a matching key to `partyData` in every language file. Order does not matter — only the key names must match.

---

## 7. Translation Quality Requirements

- Translations must be **grammatically correct** and **natural-sounding** for a native speaker of the target language. Avoid literal word-for-word translation.
- Male and female variants must each sound idiomatic on their own — they are not mechanical substitutions of one word.
- Maintain a **consistent register and tone** throughout the survey. The Hebrew version is informally direct. Match that tone in the target language.
- Political terminology must be translated carefully and consistently. Use terms that are neutral and widely understood in the target-language political context.
- If the target language uses a script other than Latin or Hebrew, ensure the font supports that script (see Section 9).

---

## 8. Directionality Support (RTL vs LTR)

Hebrew is right-to-left (RTL). The current layout is built for RTL.

When adding an **LTR language** (e.g. English, French, Russian):

- Set `dir="ltr"` on the `<html>` element for that session.
- The CSS grid and flexbox layouts use logical properties where possible and will reflow correctly.
- **Reverse the question text animation**: the current animation slides in from the right. For LTR, it must slide in from the left. This is controlled by the `anim-enter-right` / `anim-exit-left` classes in `css/styles.css` — add LTR equivalents and apply them when `dir="ltr"` is active.
- **Reverse the question progress bar fill direction**: the bar currently fills from right to left. For LTR, it must fill from left to right.
- **Answer button text alignment**: answer buttons default to `text-align: right` (Hebrew). For LTR languages, `html[dir="ltr"] .btn-answer` overrides this to `text-align: left`.
- **Axis party expanded hover state**: the expanded row (avatar + description + other parties) is an RTL flex row by default. For LTR the columns must render left-to-right: avatar | explanation text | other parties. This requires overriding `direction: ltr` on `.axis-party-row`, `.axis-party-expanded-inner`, `.axis-party-expanded-text`, and `.axis-party-secondary-item`; setting `text-align: left` on `.axis-party-expanded-text`; and flipping the column divider from `border-right` to `border-left` on `.axis-party-expanded-secondary` (plus per-axis color overrides). All handled via `html[dir="ltr"]` rules in `css/styles.css`.
- All other animations (results page entrance, share card, etc.) are direction-neutral and require no changes.

RTL languages (e.g. Arabic) inherit the existing layout with no direction changes needed.

---

## 9. Font Handling

The current design uses the system font stack (or a Hebrew-compatible sans-serif). When adding a language that requires a different script:

- Choose a font that matches the visual character of the Hebrew design: clean, modern, humanist sans-serif with clear legibility at small sizes.
- Load the font only for the relevant language session (do not load all fonts on every page load).
- Verify that the chosen font matches the existing type scale: the same `font-size`, `font-weight`, `line-height`, and `letter-spacing` values must produce comparable visual results.
- If the font causes layout shifts (especially in the axis bar labels or result headings), adjust only the language-specific font metrics — never the shared layout constants.

---

## 10. Layout Robustness

After adding a new language, test the following scenarios and fix any issues before marking the language as complete:

- **Question text**: all 52 questions render without overflow or truncation, on both desktop and mobile.
- **Answer buttons**: all five answer labels fit within their buttons at every viewport width. Labels that are significantly longer than Hebrew may require a smaller font size scoped to that language.
- **Axis labels**: the left/right axis labels (e.g. "שמאל ראשון" / "ימין ראשון") are short by design. Translations must be similarly short (1–3 words). Long labels will break the bar layout.
- **Results heading and subtitle**: must fit in the 220px right column on desktop without wrapping unexpectedly.
- **Share text**: must be a single coherent sentence suitable for social media. Keep it short.
- **Party names and tooltips**: tooltips appear in a constrained popover. Keep translated tooltips concise.

Fixes to layout issues must be scoped using a language-specific class on `<html>` (e.g. `lang-en`) and must not affect any other language.

---

## 11. Dashboard Behavior

The public dashboard at `/dashboard` is **English-only** and is never translated. It shows aggregated, anonymized results and is accessible without authentication.

Each submission stored in the database includes a `language` field. The stats API supports optional language filtering:

```
GET /api/stats?language=he
GET /api/stats/questions?language=ar
```

The CSV export (`GET /api/stats/export`) includes a `language` column for every row.

The dashboard UI currently exposes only a **gender filter** (All / Male / Female) per axis card and in the question analysis panel. Language-based filtering is available via the API but is not surfaced in the dashboard UI — no dashboard changes are required when adding a new language.
