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
const uptime = fs.readFileSync('.github/workflows/uptime-smoke.yml', 'utf8');
assert.equal(manifest.start_url, './', 'PWA start URL is relative for project pages');
assert.equal(manifest.scope, './', 'PWA scope is relative for project pages');
assert.ok(uptime.includes('cron: "*/30 * * * *"'), 'uptime workflow is scheduled every 30 minutes');
assert.ok(uptime.includes('vars.SITE_URL'), 'uptime check remains gated on configured site URL');
assert.ok(manifest.icons[0].src.endsWith('icon.svg'), 'local app icon is declared');
assert.ok(html.includes('rel="manifest" href="./manifest.webmanifest"'), 'manifest linked from app shell');
assert.ok(html.includes("serviceWorker.register('./sw.js')"), 'service worker registration is relative');
assert.ok(worker.includes('self.registration.scope'), 'worker caches within its deployed subpath');
assert.ok(worker.includes("request.mode === 'navigate'"), 'worker has offline navigation fallback');
assert.ok(worker.includes('caches.match'), 'worker reads cached shell when offline');
assert.match(icon, /<svg/, 'local SVG icon exists');
for (const file of ['manifest.webmanifest', 'sw.js', 'icon.svg']) {
  assert.ok(deploy.includes('cp ' + file + ' _site/' + file), 'Pages deploy includes ' + file);
}
console.log('PASS: PWA manifest, subpath-safe offline shell, local icon, and Pages deployment assets');

console.log('PASS: Arabic RTL, local persistence, 8 A1 steps, accessible feedback, responsive layout, standalone source');
