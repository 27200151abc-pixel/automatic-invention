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
assert.ok(html.includes('function renderMixedLanguageText(target,text){'), 'mixed-language renderer exists');
assert.ok(html.includes("renderMixedLanguageText($('question'),l.q);"), 'question uses mixed-language renderer');
assert.ok(html.includes("renderMixedLanguageText($('feedback'),'إجابة صحيحة! '+l.why)"), 'correct feedback uses mixed-language renderer');
assert.ok(html.includes("renderMixedLanguageText($('feedback'),'ليست الإجابة الصحيحة. '+l.why)"), 'incorrect feedback uses mixed-language renderer');

const helperStart = html.indexOf('function renderMixedLanguageText(target,text){');
const helperEnd = html.indexOf('\n}', helperStart) + 2;
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'mixed-language renderer can be isolated for behavior testing');
const helper = html.slice(helperStart, helperEnd);
const renderedNodes = [];
const target = {
  replaceChildren() { renderedNodes.length = 0; },
  append(node) { renderedNodes.push(node); }
};
const fakeDocument = {
  createTextNode(value) { return { nodeType: 3, textContent: value }; },
  createElement(tagName) {
    return { tagName: tagName.toUpperCase(), lang: '', dir: '', textContent: '' };
  }
};
const sample = 'ما معنى “Hello”؟ I am happy.';
vm.runInNewContext(helper + '\nrenderMixedLanguageText(target, sample);', {
  document: fakeDocument,
  target,
  sample
});
assert.equal(renderedNodes.map(node => node.textContent).join(''), sample, 'rendering preserves the exact original text');
const englishRuns = renderedNodes.filter(node => node.tagName === 'SPAN');
assert.deepEqual(englishRuns.map(node => node.textContent), ['Hello', 'I am happy'], 'Latin phrases are grouped into English spans');
assert.ok(englishRuns.every(node => node.lang === 'en' && node.dir === 'ltr'), 'English spans carry language and direction metadata');

assert.match(html, /@media|auto-fit/, 'responsive layout');
assert.doesNotMatch(html, /<script[^>]+src=/i, 'no external script dependencies');
assert.doesNotMatch(html, /lisanora/i, 'no Lisanora integration');
console.log('PASS: Arabic RTL, local persistence, 8 A1 steps, mixed-language prompts and feedback, accessible feedback, responsive layout, standalone source');
