/**
 * js/lang/index.js — Language registry
 *
 * Add a new language here after creating its file in js/lang/<code>.js.
 * Loaded after all language data files so LANG_* globals are available.
 */

var LANGUAGES = {
  he: { name: 'עברית',    dir: 'rtl', data: LANG_HE },
  ar: { name: 'العربية', dir: 'rtl', data: LANG_AR },
  ru: { name: 'Русский',  dir: 'ltr', data: LANG_RU }
};

var DEFAULT_LANGUAGE = 'he';
