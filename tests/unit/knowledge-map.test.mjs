import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapCardIds, mapStats } from '../../js/knowledge-map.js';

const MAP = {
  domain: 'rag',
  title: '检索增强',
  children: [
    { label: '原理', children: [{ card: 'rag-c01' }, { label: '索引', children: [{ card: 'rag-c02' }] }] },
    { label: '评测', children: [{ card: 'rag-c03' }, { card: 'rag-c01' }] },
  ],
};

test('mapCardIds lists card ids depth-first, keeping repeats', () => {
  assert.deepEqual(mapCardIds(MAP), ['rag-c01', 'rag-c02', 'rag-c03', 'rag-c01']);
});

test('mapCardIds ignores malformed nodes', () => {
  assert.deepEqual(mapCardIds({ children: [null, 3, { label: 'x' }, { card: 'a' }] }), ['a']);
  assert.deepEqual(mapCardIds(null), []);
});

test('mapStats counts each card once', () => {
  assert.deepEqual(mapStats(MAP, { 'rag-c01': 'known', 'rag-c03': 'review' }), { known: 1, total: 3 });
  assert.deepEqual(mapStats(MAP, {}), { known: 0, total: 3 });
});
