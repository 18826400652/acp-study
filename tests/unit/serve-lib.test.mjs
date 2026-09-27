import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveSafe, mimeFor } from '../../scripts/serve-lib.mjs';

const ROOT = path.resolve('/srv/app');
const BASE = '/acp-study';

test('base root maps to index.html', () => {
  assert.equal(resolveSafe(ROOT, '/acp-study/', BASE), path.join(ROOT, 'index.html'));
});

test('nested file resolves and query string is ignored', () => {
  assert.equal(resolveSafe(ROOT, '/acp-study/data/domains.json?v=2', BASE), path.join(ROOT, 'data', 'domains.json'));
});

test('percent-encoded names are decoded', () => {
  assert.equal(resolveSafe(ROOT, '/acp-study/a%20b.txt', BASE), path.join(ROOT, 'a b.txt'));
});

test('paths outside the base are rejected', () => {
  assert.equal(resolveSafe(ROOT, '/other/index.html', BASE), null);
  assert.equal(resolveSafe(ROOT, '/acp-studyX/index.html', BASE), null);
});

test('directory traversal is rejected', () => {
  assert.equal(resolveSafe(ROOT, '/acp-study/../secret.txt', BASE), null);
  assert.equal(resolveSafe(ROOT, '/acp-study/%2e%2e/secret.txt', BASE), null);
});

test('malformed percent-encoding is rejected', () => {
  assert.equal(resolveSafe(ROOT, '/acp-study/%E0%A4%A', BASE), null);
});

test('mimeFor maps known extensions and falls back to octet-stream', () => {
  assert.equal(mimeFor('a/b.js'), 'text/javascript; charset=utf-8');
  assert.equal(mimeFor('x.JSON'), 'application/json; charset=utf-8');
  assert.equal(mimeFor('x.bin'), 'application/octet-stream');
});
