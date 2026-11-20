'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /<html lang="ar" dir="rtl">/, 'Arabic RTL document');
assert.match(html, /verbasprout-progress/, 'local progress persistence');
assert.match(html, /const lessons=\[/, 'lesson data exists');
assert.equal((html.match(/\{q:'/g) || []).length, 8, 'eight A1 lesson steps');
assert.match(html, /role="status"/, 'accessible feedback region');
assert.match(html, /@media|auto-fit/, 'responsive layout');
assert.doesNotMatch(html, /<script[^>]+src=/i, 'no external script dependencies');
assert.doesNotMatch(html, /lisanora/i, 'no Lisanora integration');
assert.match(html, /version:1/, 'saved progress is versioned');
assert.match(html, /function restoreProgress\(data\)/, 'saved progress is validated before restoration');

class FakeElement {
  constructor() {
    this.textContent = '';
    this.style = {};
    this.children = [];
    this.listeners = {};
    this.attributes = {};
    this.disabled = false;
    this.hidden = false;
  }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  append(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = value; }
  click() { if (!this.disabled && this.listeners.click) this.listeners.click({ target: this }); }
}

function boot(savedValue) {
  const elements = new Map();
  const ids = ['saved','next','answers','feedback','step-label','score-label','progress','lesson-title','question','reset'];
  for (const id of ids) elements.set(id, new FakeElement());
  const progressbar = new FakeElement();
  const storage = {
    value: savedValue,
    getItem() { return this.value; },
    setItem(_key, value) { this.value = value; },
    removeItem() { this.value = null; }
  };
  const document = {
    getElementById(id) { return elements.get(id); },
    createElement() { return new FakeElement(); },
    querySelector(selector) {
      assert.equal(selector, '[role=progressbar]');
      return progressbar;
    }
  };
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'inline lesson script exists');
  vm.runInNewContext(match[1], { document, localStorage: storage, Date, console }, { timeout: 1000 });
  return { elements, progressbar, storage };
}

const restoredCorrect = boot(JSON.stringify({
  version: 1, step: 2, score: 2, answered: true, selectedChoice: 1,
  completed: false, updatedAt: '2026-11-20T00:00:00.000Z'
}));
assert.equal(restoredCorrect.elements.get('step-label').textContent, 'الخطوة 3 من 8');
assert.equal(restoredCorrect.elements.get('score-label').textContent, 'الإجابات الصحيحة: 2');
assert.match(restoredCorrect.elements.get('feedback').textContent, /إجابة صحيحة/);
assert.equal(restoredCorrect.elements.get('next').disabled, false);
assert.ok(restoredCorrect.elements.get('answers').children.every(button => button.disabled));
restoredCorrect.elements.get('next').click();
assert.equal(restoredCorrect.elements.get('step-label').textContent, 'الخطوة 4 من 8');
assert.equal(restoredCorrect.elements.get('score-label').textContent, 'الإجابات الصحيحة: 2');
const afterNext = JSON.parse(restoredCorrect.storage.value);
assert.deepEqual(
  { version: afterNext.version, step: afterNext.step, score: afterNext.score, answered: afterNext.answered, selectedChoice: afterNext.selectedChoice },
  { version: 1, step: 3, score: 2, answered: false, selectedChoice: null },
  'moving forward persists a clean unanswered state without double-counting'
);

const restoredWrong = boot(JSON.stringify({
  version: 1, step: 1, score: 1, answered: true, selectedChoice: 2,
  completed: false, updatedAt: '2026-11-20T00:00:00.000Z'
}));
assert.match(restoredWrong.elements.get('feedback').textContent, /ليست الإجابة الصحيحة/);
assert.equal(restoredWrong.elements.get('next').disabled, false);

const legacyCorrect = boot(JSON.stringify({ step: 2, score: 3, completed: false }));
assert.match(legacyCorrect.elements.get('feedback').textContent, /إجابة صحيحة/);
assert.equal(legacyCorrect.elements.get('next').disabled, false);
assert.equal(legacyCorrect.elements.get('score-label').textContent, 'الإجابات الصحيحة: 3');

const legacyAmbiguous = boot(JSON.stringify({ step: 2, score: 2, completed: false }));
assert.equal(legacyAmbiguous.elements.get('step-label').textContent, 'الخطوة 3 من 8');
assert.equal(legacyAmbiguous.elements.get('next').disabled, true);

const corruptStates = [
  '{broken json',
  JSON.stringify({ version: 1, step: 99, score: 99, answered: true, selectedChoice: 0 }),
  JSON.stringify({ version: 1, step: 1, score: 3, answered: false }),
  JSON.stringify({ version: 2, step: 2, score: 1, answered: false }),
  JSON.stringify({ version: 1, step: 1, score: 1, answered: true, selectedChoice: 99 })
];
for (const value of corruptStates) {
  const app = boot(value);
  assert.equal(app.elements.get('step-label').textContent, 'الخطوة 1 من 8', 'invalid state safely starts at the first question');
  assert.equal(app.elements.get('score-label').textContent, 'الإجابات الصحيحة: 0', 'invalid state cannot inject a score');
}

const completed = boot(JSON.stringify({
  version: 1, step: 8, score: 6, answered: false, selectedChoice: null,
  completed: true, updatedAt: '2026-11-20T00:00:00.000Z'
}));
assert.match(completed.elements.get('lesson-title').textContent, /أحسنت/);
assert.equal(completed.progressbar.attributes['aria-valuenow'], 8);
assert.equal(completed.elements.get('next').hidden, true);

console.log('PASS: RTL, 8 A1 steps, versioned progress validation, correct/wrong answer restoration, legacy handling, corruption recovery, completion state, and no double-counting');
