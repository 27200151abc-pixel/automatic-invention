'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /<html lang="ar" dir="rtl">/, 'Arabic RTL document');
assert.match(html, /const STORAGE_KEY='verbasprout-progress'/, 'single local storage key');
assert.equal((html.match(/\{q:'/g) || []).length, 8, 'eight A1 lesson steps');
assert.match(html, /role="status" aria-live="polite"/, 'storage feedback is announced');
assert.doesNotMatch(html, /<script[^>]+src=/i, 'no external script dependencies');

class FakeElement {
  constructor() {
    this.children = [];
    this.style = {};
    this.attributes = {};
    this.handlers = {};
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
  }
  addEventListener(type, handler) { this.handlers[type] = handler; }
  append(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = value; }
  click() { if (!this.disabled && this.handlers.click) this.handlers.click(); }
}

function makeStorage(options = {}) {
  let value = options.seed || null;
  return {
    failGet: Boolean(options.failGet),
    failSet: Boolean(options.failSet),
    failRemove: Boolean(options.failRemove),
    getItem() {
      if (this.failGet) throw new Error('storage read blocked');
      return value;
    },
    setItem(_key, next) {
      if (this.failSet) throw new Error('storage write blocked');
      value = next;
    },
    removeItem() {
      if (this.failRemove) throw new Error('storage removal blocked');
      value = null;
    }
  };
}

function boot(storage) {
  const ids = ['saved', 'next', 'reset', 'answers', 'feedback', 'step-label', 'score-label', 'progress', 'lesson-title', 'question'];
  const elements = Object.fromEntries(ids.map(id => [id, new FakeElement()]));
  const progressbar = new FakeElement();
  const document = {
    getElementById(id) { return elements[id]; },
    createElement() { return new FakeElement(); },
    querySelector() { return progressbar; }
  };
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(script, 'inline application script exists');
  vm.runInNewContext(script[1], { document, localStorage: storage, Date, JSON, Number, String });
  return { elements, progressbar };
}

{
  const app = boot(makeStorage({ failGet: true }));
  assert.match(app.elements.saved.textContent, /تعذّر قراءة التقدم/, 'read failure is visible on startup');
}
{
  const storage = makeStorage({ failSet: true });
  const app = boot(storage);
  app.elements.answers.children[0].click();
  assert.match(app.elements.saved.textContent, /تعذّر حفظ التقدم/, 'write failure is visible after answering');
  storage.failSet = false;
  app.elements.next.click();
  assert.match(app.elements.saved.textContent, /آخر حفظ/, 'successful later write clears the warning');
}
{
  const storage = makeStorage({
    seed: JSON.stringify({ step: 1, score: 1, updatedAt: '2026-11-09T00:00:00.000Z' }),
    failRemove: true
  });
  const app = boot(storage);
  app.elements.reset.click();
  assert.match(app.elements.saved.textContent, /تعذّر حذف التقدم/, 'remove failure is visible after reset');
  assert.match(app.elements.question.textContent, /Hello/, 'reset still resets the in-memory lesson');
}

console.log('PASS: RTL shell, 8 A1 items, accessible status, visible storage read/write/delete failures, recovery after a later successful save, and in-memory reset');
