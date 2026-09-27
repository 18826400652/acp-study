import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  allocate, shuffle, buildExam, remainingMs, formatClock, formatDuration, EXAM_DURATION_MS,
} from '../../js/exam.js';
import { seededRng, DOMAINS, makeQuestions } from './helpers.mjs';

const W = DOMAINS.map((d) => d.weight);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

test('allocate: single-choice split matches the spec (9/7/10/8/8/8)', () => {
  assert.deepEqual(allocate(W, 50), [9, 7, 10, 8, 8, 8]);
});

test('allocate: multi-choice split matches the spec (4/4/5/4/4/4)', () => {
  assert.deepEqual(allocate(W, 25), [4, 4, 5, 4, 4, 4]);
});

test('allocate: always sums to the requested total', () => {
  for (const total of [1, 7, 13, 75, 100]) assert.equal(sum(allocate(W, total)), total);
});

test('allocate: remainder ties go to higher weight, then lower index', () => {
  assert.deepEqual(allocate([1, 3], 2), [0, 2]);
  assert.deepEqual(allocate([1, 1], 1), [1, 0]);
});

test('shuffle: returns a permutation and leaves the input untouched', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, seededRng(3));
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
});

test('buildExam: a full bank gives 50 singles then 25 multis, no duplicates', () => {
  const bank = DOMAINS.flatMap((d) => makeQuestions(d.id, 40, 20));
  const byId = new Map(bank.map((q) => [q.id, q]));
  const { questionIds, shortfall } = buildExam(DOMAINS, bank, seededRng(1));
  assert.equal(questionIds.length, 75);
  assert.equal(new Set(questionIds).size, 75);
  assert.deepEqual(shortfall, []);
  const types = questionIds.map((id) => byId.get(id).type);
  assert.deepEqual(types, [...Array(50).fill('single'), ...Array(25).fill('multi')]);
  const ragSingles = questionIds.filter((id) => byId.get(id).domain === 'rag' && byId.get(id).type === 'single');
  assert.equal(ragSingles.length, 10);
});

test('buildExam: reports a shortfall when a pool is too small', () => {
  const bank = DOMAINS.flatMap((d) => makeQuestions(d.id, 3, 2));
  const { questionIds, shortfall } = buildExam(DOMAINS, bank, seededRng(2));
  assert.equal(questionIds.length, 30);
  assert.deepEqual(
    shortfall.find((s) => s.domain === 'rag' && s.type === 'single'),
    { domain: 'rag', type: 'single', need: 10, have: 3 },
  );
});

test('buildExam: the same seed gives the same exam', () => {
  const bank = DOMAINS.flatMap((d) => makeQuestions(d.id, 40, 20));
  assert.deepEqual(buildExam(DOMAINS, bank, seededRng(9)), buildExam(DOMAINS, bank, seededRng(9)));
});

test('remainingMs counts down and never goes below zero', () => {
  assert.equal(remainingMs(0, 0), EXAM_DURATION_MS);
  assert.equal(remainingMs(0, 60000), EXAM_DURATION_MS - 60000);
  assert.equal(remainingMs(0, EXAM_DURATION_MS + 5), 0);
});

test('formatClock shows mm:ss, rounding seconds up', () => {
  assert.equal(formatClock(EXAM_DURATION_MS), '120:00');
  assert.equal(formatClock(65000), '01:05');
  assert.equal(formatClock(999), '00:01');
  assert.equal(formatClock(0), '00:00');
});

test('formatDuration shows minutes and seconds, rounding down', () => {
  assert.equal(formatDuration(65999), '1 分 5 秒');
  assert.equal(formatDuration(30000), '0 分 30 秒');
});
