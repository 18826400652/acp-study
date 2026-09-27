import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const listed = [...sw.matchAll(/'([^'\s]+\.(?:js|css|html|json|svg|png))'/g)].map((m) => m[1]);

function listFiles(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).split(path.sep).join('/')}`)
    .filter((f) => f.endsWith('.js'));
}

test('every js module is precached by the service worker', () => {
  listFiles('js').forEach((f) => assert.ok(listed.indexOf(f) !== -1, `${f} is missing from SHELL in sw.js`));
});

test('every literal file listed in sw.js exists', () => {
  listed.forEach((f) => assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} is listed in sw.js but missing on disk`));
});

test('every domain in domains.json is precached', () => {
  const domains = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'domains.json'), 'utf8'));
  const block = sw.match(/const DOMAINS = \[([^\]]*)\]/);
  assert.ok(block, 'sw.js must declare const DOMAINS = [...]');
  domains.forEach((d) => assert.ok(block[1].includes(`'${d.id}'`), `${d.id} missing from DOMAINS in sw.js`));
});
