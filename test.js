'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');

assert.match(html, /<html lang="ar" dir="rtl">/, 'Arabic RTL document');
assert.match(html, /verbasprout-progress/, 'local progress persistence');
assert.match(html, /const lessons=\[/, 'lesson data exists');
assert.equal((html.match(/\{q:'/g) || []).length, 8, 'eight A1 lesson steps');
assert.equal((html.match(/pronunciation:'/g) || []).length, 8, 'every A1 item has an explicit pronunciation phrase');
assert.match(html, /id="listen"/, 'visible pronunciation control exists');
assert.match(html, /utterance\.lang='en-US'/, 'English pronunciation language is set');
assert.match(html, /role="status"/, 'accessible feedback region');
assert.match(html, /@media|auto-fit/, 'responsive layout');
assert.doesNotMatch(html, /<script[^>]+src=/i, 'no external script dependencies');
assert.doesNotMatch(html, /lisanora/i, 'no Lisanora integration');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'inline app script exists');

function bootApp(supported) {
  const elements = Object.create(null);
  const makeElement = () => ({
    textContent: '',
    disabled: false,
    hidden: false,
    style: {},
    children: [],
    listeners: Object.create(null),
    attributes: Object.create(null),
    addEventListener(name, callback) { this.listeners[name] = callback; },
    append(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
    setAttribute(name, value) { this.attributes[name] = value; }
  });
  const progress = makeElement();
  const document = {
    getElementById(id) { return elements[id] || (elements[id] = makeElement()); },
    querySelector() { return progress; },
    createElement() { return makeElement(); }
  };
  const storage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  const utterances = [];
  let cancelCalls = 0;
  class FakeUtterance {
    constructor(text) { this.text = text; this.lang = ''; this.rate = 1; this.onerror = null; }
  }
  const speechSynthesis = supported ? {
    cancel() { cancelCalls += 1; },
    speak(utterance) { utterances.push(utterance); }
  } : undefined;
  const context = {
    document,
    localStorage: storage,
    window: { speechSynthesis },
    SpeechSynthesisUtterance: supported ? FakeUtterance : undefined,
    Date
  };
  vm.runInNewContext(scriptMatch[1], context);
  return { elements, utterances, get cancelCalls() { return cancelCalls; } };
}

const supported = bootApp(true);
supported.elements.listen.listeners.click();
assert.equal(supported.utterances.length, 1, 'supported browser speaks the current phrase');
assert.equal(supported.utterances[0].text, 'Hello', 'first item speaks its explicit English phrase');
assert.equal(supported.utterances[0].lang, 'en-US', 'speech uses English locale');
assert.equal(supported.utterances[0].rate, 0.9, 'speech uses a learner-friendly slower rate');
assert.equal(supported.cancelCalls, 1, 'previous speech is cancelled before a new phrase');
supported.utterances[0].onerror();
assert.match(supported.elements.feedback.textContent, /تعذّر تشغيل النطق/, 'speech errors produce visible feedback');
supported.elements.reset.listeners.click();
assert.equal(supported.cancelCalls, 2, 'reset stops ongoing speech');

const unsupported = bootApp(false);
unsupported.elements.listen.listeners.click();
assert.match(unsupported.elements.feedback.textContent, /غير متاحة في هذا المتصفح/, 'unsupported browsers receive a clear fallback');

console.log('PASS: Arabic RTL, local persistence, 8 A1 items, accessible feedback, responsive layout, and native pronunciation behavior/fallback');
