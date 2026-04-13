/**
 * parties.js – Party ideological data
 *
 * Each party object:
 *   id       – unique string key
 *   name     – display name (Hebrew, placeholder – replace before publishing)
 *   image    – path to party logo image, or null for colored-circle fallback
 *   color    – avatar background color used when image is null
 *   scores   – ideological position per axis, 0–100
 *                (0 = fully left end, 100 = fully right end, same scale as user)
 *   tooltips – hover descriptions:
 *                general – shown on the "best overall match" card
 *                first/second/third/fourth – shown on the per-axis cards
 *
 * To update scores: edit the scores object for each party.
 * To set a real image: set image to a path string (e.g. "img/party-a.png").
 * To add/remove parties: modify this array; all recommendation logic adapts.
 */

const PARTIES = [

  // ── 1. Far right across all axes ───────────────────────────────────────
  {
    id:    'party-a',
    name:  'מפלגה א׳',
    images: {
      general: 'images/parties/party-a.svg',
      first:   'images/parties/party-a-first.svg',
      second:  'images/parties/party-a-second.svg',
      third:   'images/parties/party-a-third.svg',
      fourth:  'images/parties/party-a-fourth.svg'
    },
    color: '#c53030',
    scores: { first: 85, second: 82, third: 78, fourth: 88 },
    tooltips: {
      general: 'מפלגה א׳ — תיאור כללי לדוגמה. מפלגה זו ממוקמת בצד הימני של כל הצירים. יש להחליף בתיאור אמיתי לפני פרסום.',
      first:   'מפלגה א׳ — עמדתה בציר הראשון: ימנית מאוד. יש להחליף.',
      second:  'מפלגה א׳ — עמדתה בציר השני: ימנית מאוד. יש להחליף.',
      third:   'מפלגה א׳ — עמדתה בציר השלישי: ימנית מאוד. יש להחליף.',
      fourth:  'מפלגה א׳ — עמדתה בציר הרביעי: ימנית מאוד. יש להחליף.'
    }
  },

  // ── 2. Right across all axes ────────────────────────────────────────────
  {
    id:    'party-b',
    name:  'מפלגה ב׳',
    images: {
      general: 'images/parties/party-b.svg',
      first:   'images/parties/party-b-first.svg',
      second:  'images/parties/party-b-second.svg',
      third:   'images/parties/party-b-third.svg',
      fourth:  'images/parties/party-b-fourth.svg'
    },
    color: '#dd6b20',
    scores: { first: 70, second: 68, third: 72, fourth: 65 },
    tooltips: {
      general: 'מפלגה ב׳ — תיאור כללי לדוגמה. מפלגה ימנית מתונה. יש להחליף.',
      first:   'מפלגה ב׳ — עמדתה בציר הראשון: ימנית. יש להחליף.',
      second:  'מפלגה ב׳ — עמדתה בציר השני: ימנית. יש להחליף.',
      third:   'מפלגה ב׳ — עמדתה בציר השלישי: ימנית. יש להחליף.',
      fourth:  'מפלגה ב׳ — עמדתה בציר הרביעי: ימנית מתונה. יש להחליף.'
    }
  },

  // ── 3. Center-right ─────────────────────────────────────────────────────
  {
    id:    'party-c',
    name:  'מפלגה ג׳',
    images: {
      general: 'images/parties/party-c.svg',
      first:   'images/parties/party-c-first.svg',
      second:  'images/parties/party-c-second.svg',
      third:   'images/parties/party-c-third.svg',
      fourth:  'images/parties/party-c-fourth.svg'
    },
    color: '#b7791f',
    scores: { first: 60, second: 58, third: 63, fourth: 55 },
    tooltips: {
      general: 'מפלגה ג׳ — תיאור כללי לדוגמה. מפלגת מרכז-ימין. יש להחליף.',
      first:   'מפלגה ג׳ — עמדתה בציר הראשון: מרכז-ימין. יש להחליף.',
      second:  'מפלגה ג׳ — עמדתה בציר השני: מרכז-ימין. יש להחליף.',
      third:   'מפלגה ג׳ — עמדתה בציר השלישי: מרכז-ימין. יש להחליף.',
      fourth:  'מפלגה ג׳ — עמדתה בציר הרביעי: מרכז-ימין. יש להחליף.'
    }
  },

  // ── 4. Center ───────────────────────────────────────────────────────────
  {
    id:    'party-d',
    name:  'מפלגה ד׳',
    images: {
      general: 'images/parties/party-d.svg',
      first:   'images/parties/party-d-first.svg',
      second:  'images/parties/party-d-second.svg',
      third:   'images/parties/party-d-third.svg',
      fourth:  'images/parties/party-d-fourth.svg'
    },
    color: '#38a169',
    scores: { first: 50, second: 52, third: 48, fourth: 50 },
    tooltips: {
      general: 'מפלגה ד׳ — תיאור כללי לדוגמה. מפלגת מרכז. יש להחליף.',
      first:   'מפלגה ד׳ — עמדתה בציר הראשון: מרכז. יש להחליף.',
      second:  'מפלגה ד׳ — עמדתה בציר השני: מרכז. יש להחליף.',
      third:   'מפלגה ד׳ — עמדתה בציר השלישי: מרכז. יש להחליף.',
      fourth:  'מפלגה ד׳ — עמדתה בציר הרביעי: מרכז. יש להחליף.'
    }
  },

  // ── 5. Center-left ──────────────────────────────────────────────────────
  {
    id:    'party-e',
    name:  'מפלגה ה׳',
    images: {
      general: 'images/parties/party-e.svg',
      first:   'images/parties/party-e-first.svg',
      second:  'images/parties/party-e-second.svg',
      third:   'images/parties/party-e-third.svg',
      fourth:  'images/parties/party-e-fourth.svg'
    },
    color: '#3182ce',
    scores: { first: 40, second: 38, third: 45, fourth: 42 },
    tooltips: {
      general: 'מפלגה ה׳ — תיאור כללי לדוגמה. מפלגת מרכז-שמאל. יש להחליף.',
      first:   'מפלגה ה׳ — עמדתה בציר הראשון: מרכז-שמאל. יש להחליף.',
      second:  'מפלגה ה׳ — עמדתה בציר השני: מרכז-שמאל. יש להחליף.',
      third:   'מפלגה ה׳ — עמדתה בציר השלישי: מרכז-שמאל. יש להחליף.',
      fourth:  'מפלגה ה׳ — עמדתה בציר הרביעי: מרכז-שמאל. יש להחליף.'
    }
  },

  // ── 6. Left ─────────────────────────────────────────────────────────────
  {
    id:    'party-f',
    name:  'מפלגה ו׳',
    images: {
      general: 'images/parties/party-f.svg',
      first:   'images/parties/party-f-first.svg',
      second:  'images/parties/party-f-second.svg',
      third:   'images/parties/party-f-third.svg',
      fourth:  'images/parties/party-f-fourth.svg'
    },
    color: '#667eea',
    scores: { first: 28, second: 30, third: 25, fourth: 32 },
    tooltips: {
      general: 'מפלגה ו׳ — תיאור כללי לדוגמה. מפלגה שמאלית. יש להחליף.',
      first:   'מפלגה ו׳ — עמדתה בציר הראשון: שמאלית. יש להחליף.',
      second:  'מפלגה ו׳ — עמדתה בציר השני: שמאלית. יש להחליף.',
      third:   'מפלגה ו׳ — עמדתה בציר השלישי: שמאלית. יש להחליף.',
      fourth:  'מפלגה ו׳ — עמדתה בציר הרביעי: שמאלית. יש להחליף.'
    }
  },

  // ── 7. Far left ─────────────────────────────────────────────────────────
  {
    id:    'party-g',
    name:  'מפלגה ז׳',
    images: {
      general: 'images/parties/party-g.svg',
      first:   'images/parties/party-g-first.svg',
      second:  'images/parties/party-g-second.svg',
      third:   'images/parties/party-g-third.svg',
      fourth:  'images/parties/party-g-fourth.svg'
    },
    color: '#9f7aea',
    scores: { first: 12, second: 15, third: 10, fourth: 18 },
    tooltips: {
      general: 'מפלגה ז׳ — תיאור כללי לדוגמה. מפלגה שמאלית מאוד. יש להחליף.',
      first:   'מפלגה ז׳ — עמדתה בציר הראשון: שמאלית מאוד. יש להחליף.',
      second:  'מפלגה ז׳ — עמדתה בציר השני: שמאלית מאוד. יש להחליף.',
      third:   'מפלגה ז׳ — עמדתה בציר השלישי: שמאלית מאוד. יש להחליף.',
      fourth:  'מפלגה ז׳ — עמדתה בציר הרביעי: שמאלית מאוד. יש להחליף.'
    }
  },

  // ── 8. Right on axis 1 & 4, left on axis 2 & 3 (nationalist-left economy)
  {
    id:    'party-h',
    name:  'מפלגה ח׳',
    images: {
      general: 'images/parties/party-h.svg',
      first:   'images/parties/party-h-first.svg',
      second:  'images/parties/party-h-second.svg',
      third:   'images/parties/party-h-third.svg',
      fourth:  'images/parties/party-h-fourth.svg'
    },
    color: '#e53e8a',
    scores: { first: 78, second: 22, third: 28, fourth: 72 },
    tooltips: {
      general: 'מפלגה ח׳ — תיאור כללי לדוגמה. מפלגה עם עמדות מנוגדות על הצירים. יש להחליף.',
      first:   'מפלגה ח׳ — עמדתה בציר הראשון: ימנית מאוד. יש להחליף.',
      second:  'מפלגה ח׳ — עמדתה בציר השני: שמאלית מאוד. יש להחליף.',
      third:   'מפלגה ח׳ — עמדתה בציר השלישי: שמאלית. יש להחליף.',
      fourth:  'מפלגה ח׳ — עמדתה בציר הרביעי: ימנית. יש להחליף.'
    }
  },

  // ── 9. Left on axis 1 & 4, right on axis 2 & 3 ─────────────────────────
  {
    id:    'party-i',
    name:  'מפלגה ט׳',
    images: {
      general: 'images/parties/party-i.svg',
      first:   'images/parties/party-i-first.svg',
      second:  'images/parties/party-i-second.svg',
      third:   'images/parties/party-i-third.svg',
      fourth:  'images/parties/party-i-fourth.svg'
    },
    color: '#2b6cb0',
    scores: { first: 22, second: 76, third: 72, fourth: 25 },
    tooltips: {
      general: 'מפלגה ט׳ — תיאור כללי לדוגמה. מפלגה עם ערוב עמדות. יש להחליף.',
      first:   'מפלגה ט׳ — עמדתה בציר הראשון: שמאלית. יש להחליף.',
      second:  'מפלגה ט׳ — עמדתה בציר השני: ימנית. יש להחליף.',
      third:   'מפלגה ט׳ — עמדתה בציר השלישי: ימנית. יש להחליף.',
      fourth:  'מפלגה ט׳ — עמדתה בציר הרביעי: שמאלית. יש להחליף.'
    }
  },

  // ── 10. Very high axis 3, very low axis 4, moderate elsewhere ───────────
  {
    id:    'party-j',
    name:  'מפלגה י׳',
    images: {
      general: 'images/parties/party-j.svg',
      first:   'images/parties/party-j-first.svg',
      second:  'images/parties/party-j-second.svg',
      third:   'images/parties/party-j-third.svg',
      fourth:  'images/parties/party-j-fourth.svg'
    },
    color: '#744210',
    scores: { first: 55, second: 45, third: 90, fourth: 14 },
    tooltips: {
      general: 'מפלגה י׳ — תיאור כללי לדוגמה. מפלגה עם עמדות ייחודיות על הצירים. יש להחליף.',
      first:   'מפלגה י׳ — עמדתה בציר הראשון: מרכז. יש להחליף.',
      second:  'מפלגה י׳ — עמדתה בציר השני: מרכז-שמאל. יש להחליף.',
      third:   'מפלגה י׳ — עמדתה בציר השלישי: ימנית מאוד. יש להחליף.',
      fourth:  'מפלגה י׳ — עמדתה בציר הרביעי: שמאלית מאוד. יש להחליף.'
    }
  }

];
