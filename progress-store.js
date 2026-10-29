'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VerbaSproutProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'verbasprout-progress';
  function empty() {
    return { version: 2, step: 0, score: 0, answered: false, selected: null, completed: false, updatedAt: null };
  }
  function normalize(raw, lessonCount) {
    const fallback = empty();
    if (!Number.isInteger(lessonCount) || lessonCount < 1) return fallback;
    let data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return fallback; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return fallback;
    if (!Number.isInteger(data.step) || data.step < 0 || data.step > lessonCount) return fallback;
    if (!Number.isInteger(data.score) || data.score < 0 || data.score > lessonCount) return fallback;
    const currentVersion = data.version === 2;
    let step = data.step, answered = false, selected = null;
    if (currentVersion) {
      if (typeof data.answered !== 'boolean') return fallback;
      answered = data.answered;
      selected = data.selected;
      if (answered && step < lessonCount && (!Number.isInteger(selected) || selected < 0 || selected > 2)) return fallback;
      if (!answered) selected = null;
    }
    const completed = step >= lessonCount || data.completed === true;
    if (completed) { step = lessonCount; answered = false; selected = null; }
    return { version: 2, step, score: data.score, answered, selected, completed,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null };
  }
  function serialize(state) { return JSON.stringify({ ...state, version: 2 }); }
  return Object.freeze({ STORAGE_KEY, empty, normalize, serialize });
});
