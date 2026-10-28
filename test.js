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

const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const worker = fs.readFileSync('sw.js', 'utf8');
const icon = fs.readFileSync('icon.svg', 'utf8');
const deploy = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
assert.equal(manifest.start_url, './', 'PWA start URL is relative for project pages');
assert.equal(manifest.scope, './', 'PWA scope is relative for project pages');
assert.match(manifest.icons[0].src, /icon\\.svg$/, 'local app icon is declared');
assert.match(html, /rel="manifest" href="\\.\\/manifest\\.webmanifest"/, 'manifest linked from app shell');
assert.match(html, /serviceWorker\\.register\\('\.\\/sw\\.js'\\)/, 'service worker registration is relative');
assert.match(worker, /self\\.registration\\.scope/, 'worker caches within its deployed subpath');
assert.match(worker, /request\\.mode === 'navigate'/, 'worker has offline navigation fallback');
assert.match(worker, /caches\\.match/, 'worker reads cached shell when offline');
assert.match(icon, /<svg/, 'local SVG icon exists');
for (const file of ['manifest.webmanifest', 'sw.js', 'icon.svg']) {
  assert.match(deploy, new RegExp('cp ' + file.replace('.', '\\\\.') + ' _site/' + file.replace('.', '\\\\.' ) + '\\n'), 'Pages deploy includes ' + file);
}
console.log('PASS: PWA manifest, subpath-safe offline shell, local icon, and Pages deployment assets');

console.log('PASS: Arabic RTL, local persistence, 8 A1 steps, accessible feedback, responsive layout, standalone source');
