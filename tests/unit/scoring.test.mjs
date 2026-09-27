import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCorrect, scoreExam } from '../../js/scoring.js';

const single = { id: 'rag-001', domain: 'rag', type: 'single', answer: [1] };
const multi = { id: 'rag-002', domain: 'rag', type: 'multi', answer: [0, 2, 3] };
const other = { id: 'prompt-001', domain: 'prompt', type: 'single', answer: [0] };

test('isCorrect: single choice must match the one answer', () => {
  assert.equal(isCorrect(single, [1]), true);
  assert.equal(isCorrect(single, [0]), false);
  assert.equal(isCorrect(single, []), false);
});

test('isCorrect: multi choice needs the exact set in any order', () => {
  assert.equal(isCorrect(multi, [3, 0, 2]), true);
  assert.equal(isCorrect(multi, [0, 2]), false);
  assert.equal(isCorrect(multi, [0, 1, 2, 3]), false);
  assert.equal(isCorrect(multi, [0, 0, 2]), false);
});

test('isCorrect: a missing selection is wrong', () => {
  assert.equal(isCorrect(single, undefined), false);
});

test('scoreExam: 1 point per single, 2 per multi, all-or-nothing', () => {
  const r = scoreExam([single, multi, other], { 'rag-001': [1], 'rag-002': [0, 2], 'prompt-001': [0] });
  assert.equal(r.score, 2);
  assert.equal(r.max, 4);
  assert.deepEqual(r.byDomain, { rag: { score: 1, max: 3 }, prompt: { score: 1, max: 1 } });
});

test('scoreExam: exactly 80% passes, below fails', () => {
  const qs = Array.from({ length: 5 }, (_, i) => ({ id: `q${i}`, domain: 'rag', type: 'single', answer: [0] }));
  assert.equal(scoreExam(qs, { q0: [0], q1: [0], q2: [0], q3: [0] }).passed, true);
  assert.equal(scoreExam(qs, { q0: [0], q1: [0], q2: [0] }).passed, false);
});

test('scoreExam: an empty exam does not pass', () => {
  assert.deepEqual(scoreExam([], {}), { score: 0, max: 0, passed: false, byDomain: {} });
});
