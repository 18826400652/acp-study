import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const listed = [...sw.matchAll(/'([^'\s]+\.(?:js|css|html|json|svg|png))'/g)].map((m) => m[1]);

function optionalEntries() {
  const m = sw.match(/const OPTIONAL = \[([^\]]*)\]/);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
}

function listFiles(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { recursive: true })
    .map((f) => `${dir}/${String(f).split(path.sep).join('/')}`)
    .filter((f) => f.endsWith('.js'));
}

test('every js module is precached by the service worker', () => {
  listFiles('js').forEach((f) => assert.ok(listed.indexOf(f) !== -1, `${f} is missing from SHELL in sw.js`));
});

test('every literal file listed in sw.js exists', () => {
  // OPTIONAL entries (e.g. data/interview.enc) are only fetched best-effort at
  // install time; they ship as build output, never committed, so they are not
  // required to exist in the repo checkout.
  const optional = optionalEntries();
  listed.filter((f) => optional.indexOf(f) === -1)
    .forEach((f) => assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} is listed in sw.js but missing on disk`));
});

test('OPTIONAL entries are not part of the required install addAll list', () => {
  const optional = optionalEntries();
  assert.ok(optional.length > 0, 'sw.js must declare const OPTIONAL = [...] with at least one entry');
  const shellBlock = sw.match(/const SHELL = \[([\s\S]*?)\];/);
  const dataBlock = sw.match(/const DATA = \[([\s\S]*?)\);/);
  assert.ok(shellBlock, 'sw.js must declare const SHELL = [...]');
  optional.forEach((entry) => {
    assert.ok(shellBlock[1].indexOf(`'${entry}'`) === -1, `${entry} must not be a required SHELL entry`);
    assert.ok(!dataBlock || dataBlock[1].indexOf(`'${entry}'`) === -1, `${entry} must not be a required DATA entry`);
  });
});

test('every domain in domains.json is precached', () => {
  const domains = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'domains.json'), 'utf8'));
  const block = sw.match(/const DOMAINS = \[([^\]]*)\]/);
  assert.ok(block, 'sw.js must declare const DOMAINS = [...]');
  domains.forEach((d) => assert.ok(block[1].includes(`'${d.id}'`), `${d.id} missing from DOMAINS in sw.js`));
});
