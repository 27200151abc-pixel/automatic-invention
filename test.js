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

// Verify the actual teaching item, not just the presence of lesson markup.
const lessonMatch = html.match(/const lessons=(\[[\s\S]*?\n\]);/);
assert.ok(lessonMatch, 'embedded lesson data can be extracted');
const lessons = vm.runInNewContext(lessonMatch[1]);
assert.equal(lessons[5].q, 'اختر أداة التنكير: ___ apple', 'the prompt must identify an indefinite article');
assert.deepEqual(Array.from(lessons[5].a), ['a', 'an', 'the'], 'the distractors must be valid English articles');
assert.equal(lessons[5].correct, 1, 'an is the correct article before the vowel sound in apple');
assert.match(lessons[5].why, /نستخدم an قبل صوت حرف علّة/, 'the explanation must match the tested rule');

console.log('PASS: Arabic RTL, local persistence, 8 A1 steps, accessible feedback, responsive layout, standalone source, and article-instruction accuracy');
