import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, TAB_OF } from '../../js/router.js';

const cases = [
  ['', 'home', {}],
  ['#/', 'home', {}],
  ['#/settings', 'settings', {}],
  ['#/learn', 'learn', {}],
  ['#/learn/', 'learn', {}],
  ['#/learn/rag', 'cards', { domain: 'rag' }],
  ['#/learn/agent-mm', 'cards', { domain: 'agent-mm' }],
  ['#/practice/app-dev', 'practice', { domain: 'app-dev' }],
  ['#/exam', 'exam', {}],
  ['#/exam/result/1727400000000', 'examResult', { id: '1727400000000' }],
  ['#/wrong', 'wrong', {}],
  ['#/wrong/practice', 'wrongPractice', {}],
  ['#/wrong/practice/rag', 'wrongPractice', { domain: 'rag' }],
  ['#/nope', 'home', {}],
  ['#/learn/../x', 'home', {}],
];

cases.forEach(([hash, name, params]) => {
  test(`parseHash(${JSON.stringify(hash)}) -> ${name}`, () => {
    assert.deepEqual(parseHash(hash), { name, params });
  });
});

test('every route maps to a tab', () => {
  const names = ['home', 'settings', 'learn', 'cards', 'practice', 'exam', 'examResult', 'wrong', 'wrongPractice'];
  names.forEach((n) => assert.ok(['home', 'learn', 'exam', 'wrong'].indexOf(TAB_OF[n]) !== -1, n));
});
