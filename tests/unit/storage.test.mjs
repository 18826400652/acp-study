import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORAGE_KEY, CORRUPT_KEY, STORAGE_UNAVAILABLE } from '../../js/storage.js';
import { emptyProgress, recordAnswer } from '../../js/progress.js';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    peek: (k) => map.get(k),
  };
}
const throwing = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
};

test('first run loads an empty progress', () => {
  assert.deepEqual(createStore(fakeStorage()).load(), { progress: emptyProgress(), ok: true });
});

test('save then load round-trips', () => {
  const storage = fakeStorage();
  const store = createStore(storage);
  const p = recordAnswer(emptyProgress(), 'rag-001', true, 1);
  assert.equal(store.save(p), true);
  assert.deepEqual(store.load().progress, p);
});

test('corrupt JSON is backed up and reset with a message', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{oops' });
  const res = createStore(storage).load();
  assert.deepEqual(res.progress, emptyProgress());
  assert.equal(res.ok, true);
  assert.match(res.error, /已备份并重置/);
  assert.equal(storage.peek(CORRUPT_KEY), '{oops');
});

test('a valid JSON with a bad shape is also backed up and reset', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{"schemaVersion":42}' });
  const res = createStore(storage).load();
  assert.match(res.error, /不支持的进度版本/);
  assert.equal(storage.peek(CORRUPT_KEY), '{"schemaVersion":42}');
});

test('unavailable storage reports ok:false and save returns false', (t) => {
  const errorSpy = t.mock.method(console, 'error', () => {});
  for (const s of [throwing, null]) {
    const store = createStore(s);
    const res = store.load();
    assert.equal(res.ok, false);
    assert.equal(res.error, STORAGE_UNAVAILABLE);
    assert.equal(store.save(emptyProgress()), false);
  }
  assert.ok(errorSpy.mock.callCount() >= 4);
});
