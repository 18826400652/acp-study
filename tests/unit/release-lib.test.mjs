import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bumpCacheVersion } from '../../scripts/release-lib.mjs';

test('bumps the cache version and leaves the rest untouched', () => {
  const src = "const CACHE_VERSION = 'acp-v1';\nconst SHELL = ['./'];\n";
  assert.deepEqual(bumpCacheVersion(src), {
    text: "const CACHE_VERSION = 'acp-v2';\nconst SHELL = ['./'];\n",
    version: 'acp-v2',
  });
});

test('handles multi-digit versions', () => {
  assert.equal(bumpCacheVersion("const CACHE_VERSION = 'acp-v9';").version, 'acp-v10');
});

test('throws a readable error when the declaration is missing', () => {
  assert.throws(() => bumpCacheVersion('const X = 1;'), /找不到 CACHE_VERSION/);
});
