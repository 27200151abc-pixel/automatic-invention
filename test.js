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

// The weekly report must remain downloadable when GitHub blocks PR creation.
const weeklyWorkflow = fs.readFileSync('.github/workflows/weekly-improvement.yml', 'utf8');
assert.match(weeklyWorkflow, /uses:\s*actions\/upload-artifact@v4/, 'weekly report artifact upload is configured');
assert.match(weeklyWorkflow, /path:\s*docs\/weekly-review-latest\.md/, 'the generated report is uploaded');
assert.match(weeklyWorkflow, /retention-days:\s*14/, 'artifact retention is bounded');
assert.match(weeklyWorkflow, /name: Open review PR[\s\S]*id: open-pr[\s\S]*continue-on-error: true/, 'PR creation failure does not prevent fallback reporting');
assert.match(weeklyWorkflow, /if: steps\.open-pr\.outcome == 'failure'[\s\S]*GITHUB_STEP_SUMMARY/, 'blocked PR creation is explicitly reported in the job summary');
assert.match(weeklyWorkflow, /pull-requests:\s*write/, 'the workflow declares PR write permission');

console.log('PASS: Arabic RTL, local persistence, 8 A1 steps, accessible feedback, responsive layout, standalone source, and weekly-review artifact fallback');
