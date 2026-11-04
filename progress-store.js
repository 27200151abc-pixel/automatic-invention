'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VerbaSproutProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STORAGE_KEY = 'verbasprout-progress';
  function empty() {
    return { version: 3, step: 0, questionId: null, score: 0, answered: false, selected: null, mistakes: [], completed: false, updatedAt: null };
  }
  function normalize(raw, lessonIds) {
    const fallback = empty();
    if (!Array.isArray(lessonIds) || lessonIds.length < 1 ||
        lessonIds.some(id => typeof id !== 'string' || !id.trim()) ||
        new Set(lessonIds).size !== lessonIds.length) return fallback;
    const lessonCount = lessonIds.length;
    let data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return fallback; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return fallback;
    if (!Number.isInteger(data.step) || data.step < 0 || data.step > lessonCount) return fallback;
    if (!Number.isInteger(data.score) || data.score < 0 || data.score > lessonCount) return fallback;

    const version = data.version;
    if (version !== undefined && version !== 2 && version !== 3) return fallback;
    let step = data.step;
    let questionId = step < lessonCount ? lessonIds[step] : null;
    let answered = false;
    let selected = null;
    const mistakes = [];

    if (version === 3) {
      if (typeof data.answered !== 'boolean') return fallback;
      if (step < lessonCount) {
        if (typeof data.questionId !== 'string') return fallback;
        const mappedStep = lessonIds.indexOf(data.questionId);
        if (mappedStep < 0) return fallback;
        step = mappedStep;
        questionId = data.questionId;
      } else {
        if (data.questionId !== null) return fallback;
        questionId = null;
      }
      answered = data.answered;
      selected = data.selected;
      if (answered && (step >= lessonCount || !Number.isInteger(selected) || selected < 0 || selected > 2)) return fallback;
      if (!answered) selected = null;

      const storedMistakes = data.mistakes === undefined ? [] : data.mistakes;
      if (!Array.isArray(storedMistakes) || storedMistakes.length > 100) return fallback;
      const seenQuestions = new Set();
      for (const mistake of storedMistakes) {
        if (!mistake || typeof mistake !== 'object' || Array.isArray(mistake) ||
            typeof mistake.questionId !== 'string' || !mistake.questionId.trim() ||
            !Number.isInteger(mistake.selected) || mistake.selected < 0 || mistake.selected > 2 ||
            seenQuestions.has(mistake.questionId)) return fallback;
        seenQuestions.add(mistake.questionId);
        // A removed lesson should not invalidate otherwise recoverable learner progress.
        if (lessonIds.includes(mistake.questionId)) {
          mistakes.push({ questionId: mistake.questionId, selected: mistake.selected });
        }
      }
    } else if (version === 2) {
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
        mistakes.push({ questionId: lessonIds[mistake.questionIndex], selected: mistake.selected });
      }
    }

    const completed = step >= lessonCount || data.completed === true;
    if (completed) {
      step = lessonCount;
      questionId = null;
      answered = false;
      selected = null;
    }
    return {
      version: 3, step, questionId, score: data.score, answered, selected, mistakes, completed,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null
    };
  }
  function serialize(state) { return JSON.stringify({ ...state, version: 3 }); }
  return Object.freeze({ STORAGE_KEY, empty, normalize, serialize });
});
