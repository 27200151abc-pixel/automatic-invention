'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /<html lang="ar" dir="rtl">/, 'Arabic RTL document');
assert.match(html, /verbasprout-progress/, 'local progress persistence');
assert.match(html, /const lessons=\[/, 'lesson data exists');
assert.equal((html.match(/\{q:'/g) || []).length, 8, 'eight A1 lesson steps');
assert.match(html, /role="status"/, 'accessible feedback region');
assert.match(html, /@media|auto-fit/, 'responsive layout');
assert.doesNotMatch(html, /<script[^>]+src=/i, 'no external script dependencies');
assert.doesNotMatch(html, /lisanora/i, 'no Lisanora integration');

const forcedColorsBlock = html.match(/@media\s*\(forced-colors:\s*active\)\s*\{([\s\S]*?)<\/style>/);
assert.ok(forcedColorsBlock, 'forced-colors fallback exists');
for (const declaration of [
  'background:Highlight',
  'color:HighlightText',
  'background:ButtonFace',
  'color:ButtonText',
  'outline:3px solid Highlight',
  'border:1px solid CanvasText'
]) {
  assert.ok(forcedColorsBlock[1].includes(declaration), 'forced-colors declaration: ' + declaration);
}

console.log('PASS: Arabic RTL, local persistence, 8 A1 steps, accessible feedback, responsive layout, forced-colors support, standalone source');
