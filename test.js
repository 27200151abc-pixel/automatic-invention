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
assert.match(html, /<dialog id="reset-dialog"/, 'native reset confirmation dialog exists');
assert.match(html, /aria-labelledby="reset-dialog-title"/, 'reset dialog has an accessible name');
assert.match(html, /aria-describedby="reset-dialog-description"/, 'reset dialog explains the destructive action');
assert.doesNotMatch(html, /<script[^>]+src=/i, 'no external script dependencies');
assert.doesNotMatch(html, /lisanora/i, 'no Lisanora integration');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'inline application script exists');

class FakeElement {
  constructor(id) {
    this.id = id;
    this.textContent = '';
    this.children = [];
    this.style = {};
    this.listeners = {};
    this.attributes = {};
    this.disabled = false;
    this.hidden = false;
    this.open = false;
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  append(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; }
  click() {
    if (this.disabled) return;
    const callback = this.listeners.click;
    if (callback) callback({ target: this });
  }
}
const elements = new Map();
for (const match of html.matchAll(/\bid="([^"]+)"/g)) elements.set(match[1], new FakeElement(match[1]));
const progressbar = new FakeElement('progressbar');
const document = {
  getElementById: id => elements.get(id),
  querySelector: selector => selector === '[role=progressbar]' ? progressbar : null,
  createElement: tag => new FakeElement(tag)
};
const values = new Map();
const localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: key => values.delete(key)
};
vm.runInNewContext(scriptMatch[1], {
  document,
  localStorage,
  Date,
  console,
  window: { confirm: () => true }
});

const key = 'verbasprout-progress';
elements.get('answers').children[0].click();
assert.match(elements.get('score-label').textContent, /1/, 'answer is recorded before reset');
elements.get('next').click();
assert.match(elements.get('step-label').textContent, /2/, 'learner advances to the second step');
const savedBeforeCancel = values.get(key);
assert.ok(savedBeforeCancel, 'progress exists before opening reset confirmation');

elements.get('reset').click();
assert.equal(elements.get('reset-dialog').open, true, 'reset opens a confirmation dialog');
assert.equal(values.get(key), savedBeforeCancel, 'opening confirmation does not delete saved progress');
elements.get('cancel-reset').click();
assert.equal(elements.get('reset-dialog').open, false, 'cancel closes the dialog');
assert.equal(values.get(key), savedBeforeCancel, 'cancel preserves saved progress');
assert.match(elements.get('step-label').textContent, /2/, 'cancel keeps the learner on the same step');

elements.get('reset').click();
elements.get('confirm-reset').click();
assert.equal(elements.get('reset-dialog').open, false, 'confirm closes the dialog');
assert.equal(values.has(key), false, 'confirm removes saved progress');
assert.match(elements.get('question').textContent, /Hello/, 'confirm returns to the first question');
assert.match(elements.get('score-label').textContent, /0/, 'confirm resets the score');

console.log('PASS: Arabic RTL, standalone A1 lesson, accessible reset dialog, cancel preserves progress, confirm resets saved progress and score');
