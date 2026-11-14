'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html', 'utf8');

assert.match(html, /<html lang="ar" dir="rtl">/, 'Arabic RTL document');
assert.match(html, /verbasprout-progress/, 'local progress persistence');
assert.match(html, /const lessons=\[/, 'lesson data exists');
assert.equal((html.match(/\{q:'/g) || []).length, 8, 'eight A1 lesson steps');
assert.match(html, /role="status"/, 'accessible feedback region');
assert.match(html, /@media|auto-fit/, 'responsive layout');
assert.match(html, /@media\\s*\\(prefers-reduced-motion:\\s*reduce\\)/, 'progress animation respects reduced-motion preference');
assert.match(html, /id="lesson-title" tabindex="-1"/, 'completion heading can receive programmatic focus');
assert.match(html, /id="question" tabindex="-1"/, 'question prompt can receive programmatic focus');
assert.doesNotMatch(html, /<script[^>]+src=/i, 'no external script dependencies');
assert.doesNotMatch(html, /lisanora/i, 'no Lisanora integration');

const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inlineScript, 'inline learner script exists');

function createHarness() {
  let focusedId = null;
  let buttonNumber = 0;
  const makeElement = id => ({
    id,
    textContent: '',
    style: {},
    children: [],
    listeners: Object.create(null),
    disabled: false,
    hidden: false,
    addEventListener(type, handler) { this.listeners[type] = handler; },
    append(child) { this.children.push(child); },
    replaceChildren(...children) { this.children = children; },
    setAttribute(name, value) {
      this.attributes ||= Object.create(null);
      this.attributes[name] = value;
    },
    focus() { focusedId = this.id; }
  });
  const ids = ['step-label', 'score-label', 'progress', 'lesson-title', 'question', 'answers', 'feedback', 'next', 'reset', 'saved'];
  const elements = Object.fromEntries(ids.map(id => [id, makeElement(id)]));
  const progressbar = makeElement('progressbar');
  const document = {
    getElementById(id) { return elements[id]; },
    createElement(tag) { return makeElement(tag + '-' + (++buttonNumber)); },
    querySelector(selector) {
      assert.equal(selector, '[role=progressbar]');
      return progressbar;
    }
  };
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); }
  };
  vm.runInNewContext(inlineScript[1], { document, localStorage, Date, console });
  return { elements, focused: () => focusedId };
}

const learner = createHarness();
assert.equal(learner.focused(), null, 'initial page load does not steal focus');
learner.elements.answers.children[1].listeners.click();
assert.equal(learner.focused(), 'next', 'answering moves focus to the enabled Next action');
assert.equal(learner.elements.next.disabled, false, 'Next is enabled after an answer');
learner.elements.next.listeners.click();
assert.equal(learner.focused(), 'question', 'advancing moves focus to the next question prompt');
assert.match(learner.elements.question.textContent, /I ___ a student/, 'the next question is rendered');

const correctAnswers = [0, 1, 1, 0, 1, 2, 1];
for (let i = 0; i < correctAnswers.length; i += 1) {
  learner.elements.answers.children[correctAnswers[i]].listeners.click();
  assert.equal(learner.focused(), 'next', 'each answer moves focus to Next');
  learner.elements.next.listeners.click();
  assert.equal(
    learner.focused(),
    i === correctAnswers.length - 1 ? 'lesson-title' : 'question',
    'advancing moves focus to the next prompt or completion heading'
  );
}
assert.match(learner.elements['lesson-title'].textContent, /أحسنت/, 'completion state is rendered');

learner.elements.reset.listeners.click();
assert.equal(learner.focused(), 'question', 'reset returns focus to the first question');
assert.match(learner.elements.question.textContent, /Hello/, 'reset returns the learner to question one');

console.log('PASS: Arabic RTL, 8 A1 steps, responsive source, no external dependencies, and keyboard focus moves to Next, next question, completion, and reset target');
