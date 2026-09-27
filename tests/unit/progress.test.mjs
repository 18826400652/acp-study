import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../../js/progress.js';
import { seededRng } from './helpers.mjs';

const q = (id, domain = 'rag', type = 'single', answer = [0]) => ({ id, domain, type, answer });
const answerSeq = (p, id, results) => results.reduce((acc, ok, i) => P.recordAnswer(acc, id, ok, i + 1), p);

test('emptyProgress has the v1 shape', () => {
  assert.deepEqual(P.emptyProgress(), {
    schemaVersion: 1, answers: {}, wrong: {}, cards: {}, exams: [], examDraft: null, examDate: null,
  });
});

test('recordAnswer appends an attempt without mutating the input', () => {
  const before = P.emptyProgress();
  const after = P.recordAnswer(before, 'rag-001', true, 1);
  assert.deepEqual(before.answers, {});
  assert.deepEqual(after.answers['rag-001'], [{ t: 1, correct: true }]);
});

test('recordAnswer keeps only the last 10 attempts', () => {
  const p = answerSeq(P.emptyProgress(), 'rag-001', Array(12).fill(true));
  assert.equal(p.answers['rag-001'].length, 10);
  assert.equal(p.answers['rag-001'][0].t, 3);
});

test('a wrong answer adds the question to the wrong book with streak 0', () => {
  assert.deepEqual(P.recordAnswer(P.emptyProgress(), 'rag-001', false, 1).wrong, { 'rag-001': 0 });
});

test('two correct answers in a row clear a wrong question', () => {
  const once = answerSeq(P.emptyProgress(), 'rag-001', [false, true]);
  assert.equal(once.wrong['rag-001'], 1);
  const twice = P.recordAnswer(once, 'rag-001', true, 9);
  assert.equal('rag-001' in twice.wrong, false);
});

test('answering wrong again resets the streak to 0', () => {
  const p = answerSeq(P.emptyProgress(), 'rag-001', [false, true, false]);
  assert.equal(p.wrong['rag-001'], 0);
});

test('a correct answer on a question not in the wrong book does not add it', () => {
  assert.deepEqual(P.recordAnswer(P.emptyProgress(), 'rag-001', true, 1).wrong, {});
});

test('setCardState stores known/review and rejects anything else', () => {
  const p = P.setCardState(P.emptyProgress(), 'rag-c01', 'known');
  assert.equal(p.cards['rag-c01'], 'known');
  assert.throws(() => P.setCardState(p, 'rag-c01', 'maybe'), /invalid card state/);
});

test('setExamDate accepts YYYY-MM-DD or null and rejects other formats', () => {
  assert.equal(P.setExamDate(P.emptyProgress(), '2026-11-01').examDate, '2026-11-01');
  assert.equal(P.setExamDate(P.emptyProgress(), null).examDate, null);
  assert.throws(() => P.setExamDate(P.emptyProgress(), '11/01/2026'), /invalid exam date/);
});

test('exam lifecycle: start, answer, finish', () => {
  const qs = [q('rag-001'), q('rag-002', 'rag', 'multi', [0, 1]), q('prompt-001', 'prompt')];
  let p = P.startExam(P.emptyProgress(), qs.map((x) => x.id), 1000);
  p = P.answerExam(p, 'rag-001', [0]);
  p = P.answerExam(p, 'rag-002', [0]);
  p = P.finishExam(p, qs, 5000);
  assert.equal(p.examDraft, null);
  const rec = p.exams[0];
  assert.equal(rec.id, '5000');
  assert.equal(rec.startedAt, 1000);
  assert.deepEqual([rec.score, rec.max, rec.passed], [1, 4, false]);
  assert.deepEqual(rec.responses, { 'rag-001': [0], 'rag-002': [0] });
  assert.deepEqual(Object.keys(p.wrong).sort(), ['prompt-001', 'rag-002']);
  assert.equal(p.answers['rag-001'][0].correct, true);
});

test('answerExam and finishExam do nothing without a draft', () => {
  const p = P.emptyProgress();
  assert.equal(P.answerExam(p, 'rag-001', [0]), p);
  assert.equal(P.finishExam(p, [q('rag-001')], 1), p);
});

test('finishExam keeps only the last 20 exams', () => {
  let p = P.emptyProgress();
  for (let i = 0; i < 22; i += 1) {
    p = P.startExam(p, ['rag-001'], i);
    p = P.finishExam(p, [q('rag-001')], 100 + i);
  }
  assert.equal(p.exams.length, 20);
  assert.equal(p.exams[0].id, '102');
});

test('statsFor counts distinct answered questions and accuracy over all attempts', () => {
  let p = answerSeq(P.emptyProgress(), 'rag-001', [false, true]);
  p = P.recordAnswer(p, 'rag-002', false, 3);
  assert.deepEqual(P.statsFor(p, [q('rag-001'), q('rag-002'), q('rag-003')]), { total: 3, answered: 2, accuracy: 1 / 3 });
  assert.deepEqual(P.statsFor(P.emptyProgress(), [q('rag-001')]), { total: 1, answered: 0, accuracy: null });
});

test('domainStats only looks at one domain', () => {
  const p = P.recordAnswer(P.emptyProgress(), 'prompt-001', true, 1);
  const qs = [q('rag-001'), q('prompt-001', 'prompt')];
  assert.deepEqual(P.domainStats(p, qs, 'prompt'), { total: 1, answered: 1, accuracy: 1 });
  assert.deepEqual(P.domainStats(p, qs, 'rag'), { total: 1, answered: 0, accuracy: null });
});

test('practiceOrder puts unanswered first, then wrong, then the rest', () => {
  const pool = ['a', 'b', 'c', 'd'].map((id) => q(id));
  let p = P.recordAnswer(P.emptyProgress(), 'a', true, 1);
  p = P.recordAnswer(p, 'b', false, 2);
  const order = P.practiceOrder(p, pool, seededRng(7));
  assert.deepEqual(order.slice(0, 2).sort(), ['c', 'd']);
  assert.deepEqual(order.slice(2), ['b', 'a']);
});

const DOMS = [{ id: 'rag', weight: 60 }, { id: 'prompt', weight: 40 }];
const BANK = [q('rag-001'), q('rag-002'), q('prompt-001', 'prompt'), q('prompt-002', 'prompt')];

test('recommend: the wrong book comes first', () => {
  const p = P.recordAnswer(P.emptyProgress(), 'rag-001', false, 1);
  assert.deepEqual(P.recommend(p, DOMS, BANK), { kind: 'wrong' });
});

test('recommend: then the weakest domain below 80%', () => {
  let p = answerSeq(P.emptyProgress(), 'rag-001', [false, true, true]);
  p = P.recordAnswer(p, 'prompt-001', true, 9);
  assert.deepEqual(P.recommend(p, DOMS, BANK), { kind: 'domain', domain: 'rag' });
});

test('recommend: then a domain not studied yet', () => {
  const p = P.recordAnswer(P.emptyProgress(), 'rag-001', true, 1);
  assert.deepEqual(P.recommend(p, DOMS, BANK), { kind: 'domain', domain: 'prompt' });
});

test('recommend: all strong -> the weakest domain; empty bank -> exam', () => {
  let p = answerSeq(P.emptyProgress(), 'rag-001', [true]);
  p = answerSeq(p, 'prompt-001', [true, true, true, true]);
  p = answerSeq(p, 'prompt-002', [false, true, true]);
  assert.deepEqual(P.recommend(p, DOMS, BANK), { kind: 'domain', domain: 'prompt' });
  assert.deepEqual(P.recommend(P.emptyProgress(), DOMS, []), { kind: 'exam' });
});

test('daysUntil counts local calendar days', () => {
  const now = new Date(2026, 8, 27, 23, 30).getTime();
  assert.equal(P.daysUntil('2026-09-27', now), 0);
  assert.equal(P.daysUntil('2026-10-07', now), 10);
  assert.equal(P.daysUntil('2026-09-26', now), -1);
});

test('exportFileName uses the local date', () => {
  assert.equal(P.exportFileName(new Date(2026, 0, 5)), 'acp-progress-20260105.json');
});

test('validateImport accepts a valid export and drops unknown keys', () => {
  const p = P.recordAnswer(P.emptyProgress(), 'rag-001', false, 1);
  const res = P.validateImport(JSON.parse(JSON.stringify({ ...p, extra: 1 })));
  assert.equal(res.ok, true);
  assert.deepEqual(res.value, p);
});

test('validateImport rejects wrong shapes with a readable reason', () => {
  const good = P.emptyProgress();
  const cases = [
    [null, /不是进度数据/],
    [[], /不是进度数据/],
    [{ ...good, schemaVersion: 99 }, /不支持的进度版本/],
    [{ ...good, answers: { a: [{ t: 'x', correct: true }] } }, /answers/],
    [{ ...good, wrong: { a: -1 } }, /wrong/],
    [{ ...good, cards: { c: 'maybe' } }, /cards/],
    [{ ...good, exams: [{}] }, /exams/],
    [{ ...good, examDraft: { startedAt: 1 } }, /examDraft/],
    [{ ...good, examDate: '2026/1/1' }, /examDate/],
  ];
  cases.forEach(([raw, re]) => {
    const res = P.validateImport(raw);
    assert.equal(res.ok, false);
    assert.match(res.error, re);
  });
});

test('validateImport trims exam history to 20', () => {
  let p = P.emptyProgress();
  for (let i = 0; i < 20; i += 1) {
    p = P.startExam(p, ['rag-001'], i);
    p = P.finishExam(p, [q('rag-001')], 100 + i);
  }
  const raw = { ...p, exams: [...p.exams, ...p.exams.slice(0, 5)] };
  assert.equal(P.validateImport(raw).value.exams.length, 20);
});
