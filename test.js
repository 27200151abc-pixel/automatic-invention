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
assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i, 'no remote script dependencies');
assert.doesNotMatch(html, /lisanora/i, 'no Lisanora integration');

// Parse the actual embedded lesson array and validate its teaching-data contract.
const lessonMatch = html.match(/const lessons=(\[[\s\S]*?\n\]);/);
assert.ok(lessonMatch, 'lesson array can be extracted from the app');
const lessons = vm.runInNewContext(lessonMatch[1]);
assert.ok(Array.isArray(lessons) && lessons.length > 0, 'lesson array is non-empty');

const normalizedQuestions = new Set();
lessons.forEach((lesson, index) => {
  assert.equal(typeof lesson.q, 'string', `lesson ${index + 1}: question is text`);
  assert.ok(lesson.q.trim().length > 0, `lesson ${index + 1}: question is not empty`);
  assert.ok(Array.isArray(lesson.a) && lesson.a.length >= 2, `lesson ${index + 1}: has at least two answer choices`);
  assert.ok(lesson.a.every(choice => typeof choice === 'string' && choice.trim().length > 0), `lesson ${index + 1}: every choice is non-empty text`);
  const normalizedChoices = lesson.a.map(choice => choice.trim().toLocaleLowerCase());
  assert.equal(new Set(normalizedChoices).size, normalizedChoices.length, `lesson ${index + 1}: answer choices are unique`);
  assert.ok(Number.isInteger(lesson.correct) && lesson.correct >= 0 && lesson.correct < lesson.a.length, `lesson ${index + 1}: correct answer index is valid`);
  assert.equal(typeof lesson.why, 'string', `lesson ${index + 1}: explanation is text`);
  assert.ok(lesson.why.trim().length > 0, `lesson ${index + 1}: explanation is not empty`);
  const normalizedQuestion = lesson.q.trim().toLocaleLowerCase();
  assert.ok(!normalizedQuestions.has(normalizedQuestion), `lesson ${index + 1}: question is not duplicated`);
  normalizedQuestions.add(normalizedQuestion);
});


// Focused editorial regression for the beginner plural item.
// These assertions protect this reviewed example; they are not a general grammar or CEFR certification.
assert.equal(lessons[2].q, 'ما جمع كلمة “book”؟', 'the target item asks for the plural of book');
assert.deepEqual(Array.from(lessons[2].a), ['bookes', 'books', 'book'], 'the options distinguish the target form from a misspelling and the singular');
assert.equal(lessons[2].correct, 1, 'books is the correct plural form');
assert.match(lessons[2].why, /book → books/, 'the explanation shows the singular-to-plural transformation');
assert.match(lessons[2].why, /bookes تهجئة غير صحيحة/, 'the explanation identifies the misspelling');

console.log(`PASS: RTL, local persistence, ${lessons.length} lesson items, accessible feedback, responsive layout, standalone source, and lesson-content structure`);
