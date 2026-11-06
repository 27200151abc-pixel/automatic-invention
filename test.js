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

const lessonMatch = html.match(/const lessons=(\[[\s\S]*?\]);([\s\S]*?)\nlet index=0/);
assert.ok(lessonMatch, 'lesson data and per-item metadata are present');
const lessons = vm.runInNewContext('const lessons=' + lessonMatch[1] + lessonMatch[2] + '\nlessons;');
assert.equal(lessons.length, 8, 'eight lesson records are parsed');
for (const [index, lesson] of lessons.entries()) {
  assert.ok(Array.isArray(lesson.whyNot), 'lesson ' + (index + 1) + ' has distractor explanations');
  assert.equal(lesson.whyNot.length, lesson.a.length, 'lesson ' + (index + 1) + ' has one note per option');
  assert.equal(lesson.whyNot[lesson.correct], '', 'lesson ' + (index + 1) + ' does not label the correct answer as wrong');
  lesson.whyNot.forEach((reason, choice) => {
    if (choice !== lesson.correct) {
      assert.ok(typeof reason === 'string' && reason.trim().length > 0,
        'lesson ' + (index + 1) + ' explains incorrect option ' + (choice + 1));
    }
  });
}
assert.match(html, /الإجابة الصحيحة هي/, 'incorrect answers reveal the correct choice');
assert.match(html, /whyNot\?\.\[choice\]/, 'incorrect answers receive option-specific explanations');

console.log('PASS: Arabic RTL, 8 A1 lessons, complete distractor feedback, accessible status, responsive layout, and standalone source');
