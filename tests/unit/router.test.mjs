import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, linkFor, TAB_OF } from '../../js/router.js';

const cases = [
  ['', 'acp', 'home', {}],
  ['#/', 'acp', 'home', {}],
  ['#/settings', 'acp', 'settings', {}],
  ['#/learn', 'acp', 'learn', {}],
  ['#/learn/', 'acp', 'learn', {}],
  ['#/learn/rag', 'acp', 'cards', { domain: 'rag' }],
  ['#/learn/agent-mm', 'acp', 'cards', { domain: 'agent-mm' }],
  ['#/learn/rag/weak', 'acp', 'cards', { domain: 'rag', filter: 'weak' }],
  ['#/practice/app-dev', 'acp', 'practice', { domain: 'app-dev' }],
  ['#/exam', 'acp', 'exam', {}],
  ['#/exam/result/1727400000000', 'acp', 'examResult', { id: '1727400000000' }],
  ['#/wrong', 'acp', 'wrong', {}],
  ['#/wrong/practice', 'acp', 'wrongPractice', {}],
  ['#/wrong/practice/rag', 'acp', 'wrongPractice', { domain: 'rag' }],
  ['#/mock', 'acp', 'home', {}],
  ['#/nope', 'acp', 'home', {}],
  ['#/learn/../x', 'acp', 'home', {}],
  ['#/ivx', 'acp', 'home', {}],
  ['#/iv', 'interview', 'home', {}],
  ['#/iv/', 'interview', 'home', {}],
  ['#/iv/settings', 'interview', 'settings', {}],
  ['#/iv/learn', 'interview', 'learn', {}],
  ['#/iv/learn/iv-a', 'interview', 'cards', { domain: 'iv-a' }],
  ['#/iv/learn/iv-a/weak', 'interview', 'cards', { domain: 'iv-a', filter: 'weak' }],
  ['#/iv/practice/iv-b', 'interview', 'practice', { domain: 'iv-b' }],
  ['#/iv/mock', 'interview', 'mock', {}],
  ['#/iv/mock/result/123', 'interview', 'mockResult', { id: '123' }],
  ['#/iv/wrong', 'interview', 'wrong', {}],
  ['#/iv/wrong/practice/iv-a', 'interview', 'wrongPractice', { domain: 'iv-a' }],
  ['#/iv/exam', 'interview', 'home', {}],
  ['#/iv/nope', 'interview', 'home', {}],
];

cases.forEach(([hash, bank, name, params]) => {
  test(`parseHash(${JSON.stringify(hash)}) -> ${bank}/${name}`, () => {
    assert.deepEqual(parseHash(hash), { bank, name, params });
  });
});

test('linkFor builds hashes that parse back to the same bank', () => {
  assert.equal(linkFor('acp', ''), '#/');
  assert.equal(linkFor('acp', 'learn'), '#/learn');
  assert.equal(linkFor('interview', ''), '#/iv');
  assert.equal(linkFor('interview', 'learn/iv-a'), '#/iv/learn/iv-a');
  assert.deepEqual(parseHash(linkFor('interview', 'mock')), { bank: 'interview', name: 'mock', params: {} });
});

test('every route maps to a tab', () => {
  const names = ['home', 'settings', 'learn', 'cards', 'practice', 'exam', 'examResult', 'mock', 'mockResult', 'wrong', 'wrongPractice'];
  names.forEach((n) => assert.ok(['home', 'learn', 'exam', 'wrong'].indexOf(TAB_OF[n]) !== -1, n));
});
