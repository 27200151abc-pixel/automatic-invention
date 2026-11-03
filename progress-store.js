'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VerbaSproutProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'verbasprout-progress';
  function empty() {
    return { version: 2, step: 0, score: 0, answered: false, selected: null, mistakes: [], completed: false, updatedAt: null };
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
    let step = data.step, answered = false, selected = null, mistakes = [];
    if (currentVersion) {
      if (typeof data.answered !== 'boolean') return fallback;
      answered = data.answered;
      selected = data.selected;
      if (answered && step < lessonCount && (!Number.isInteger(selected) || selected < 0 || selected > 2)) return fallback;
      if (!answered) selected = null;
      const storedMistakes = data.mistakes === undefined ? [] : data.mistakes;
      if (!Array.isArray(storedMistakes) || storedMistakes.length > lessonCount) return fallback;
      const seenQuestions = new Set();
      for (const mistake of storedMistakes) {
        if (!mistake || typeof mistake !== 'object' || Array.isArray(mistake) ||
            !Number.isInteger(mistake.questionIndex) || mistake.questionIndex < 0 ||
            mistake.questionIndex >= lessonCount || mistake.questionIndex > data.step ||
            !Number.isInteger(mistake.selected) || mistake.selected < 0 || mistake.selected > 2 ||
            seenQuestions.has(mistake.questionIndex)) return fallback;
        seenQuestions.add(mistake.questionIndex);
        mistakes.push({ questionIndex: mistake.questionIndex, selected: mistake.selected });
      }
    }
    const completed = step >= lessonCount || data.completed === true;
    if (completed) { step = lessonCount; answered = false; selected = null; }
    return { version: 2, step, score: data.score, answered, selected, mistakes, completed,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null };
  }
  function serialize(state) { return JSON.stringify({ ...state, version: 2 }); }
  return Object.freeze({ STORAGE_KEY, empty, normalize, serialize });
});
