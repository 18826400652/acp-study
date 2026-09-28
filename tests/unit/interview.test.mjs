import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyInterviewProgress, gradeCard, gradeOf, isWeakGrade, cardSummary, buildMock, startMock, gradeMock,
  nextMockIndex, countGrades, finishMock, pruneMockDraft, recommendInterview, interviewExportFileName,
  validateInterviewImport, toBankData, MOCK_SIZE, MAX_MOCKS, IV_STORAGE_KEY,
} from '../../js/interview.js';
import { allocate } from '../../js/exam.js';
import { emptyProgress, validateImport, recordAnswer } from '../../js/progress.js';
import { seededRng } from './helpers.mjs';

const DOMAINS = [
  { id: 'iv-a', weight: 20 }, { id: 'iv-b', weight: 18 }, { id: 'iv-c', weight: 8 }, { id: 'iv-d', weight: 12 },
  { id: 'iv-e', weight: 10 }, { id: 'iv-f', weight: 8 }, { id: 'iv-g', weight: 18 }, { id: 'iv-h', weight: 6 },
];
const cardsFor = (domain, n) => Array.from({ length: n }, (_, i) => ({ id: `${domain}-c${String(i + 1).padStart(2, '0')}`, domain }));
const CARDS = [].concat(...DOMAINS.map((d) => cardsFor(d.id, 10)));

test('empty progress has the interview shape and storage key', () => {
  assert.deepEqual(emptyInterviewProgress(), {
    schemaVersion: 1, bank: 'interview', answers: {}, wrong: {}, cards: {}, mocks: [], mockDraft: null,
  });
  assert.equal(IV_STORAGE_KEY, 'acp-interview-progress-v1');
});

test('gradeCard stores the latest grade without mutating', () => {
  const p0 = emptyInterviewProgress();
  const p1 = gradeCard(p0, 'iv-a-c01', 'fuzzy', 10);
  const p2 = gradeCard(p1, 'iv-a-c01', 'known', 20);
  assert.deepEqual(p0.cards, {});
  assert.deepEqual(p1.cards, { 'iv-a-c01': { grade: 'fuzzy', t: 10 } });
  assert.equal(gradeOf(p2, 'iv-a-c01'), 'known');
  assert.equal(gradeOf(p2, 'nope'), null);
  assert.throws(() => gradeCard(p0, 'x', 'maybe', 1), /invalid grade/);
});

test('isWeakGrade and cardSummary', () => {
  assert.deepEqual([null, 'known', 'fuzzy', 'unknown'].map(isWeakGrade), [false, false, true, true]);
  let p = emptyInterviewProgress();
  p = gradeCard(p, 'iv-a-c01', 'known', 1);
  p = gradeCard(p, 'iv-a-c02', 'fuzzy', 1);
  p = gradeCard(p, 'iv-a-c03', 'unknown', 1);
  assert.deepEqual(cardSummary(p, cardsFor('iv-a', 5)), { total: 5, known: 1, fuzzy: 1, unknown: 1, unseen: 2 });
});

test('buildMock picks 12 unique cards following the weights', () => {
  const ids = buildMock(DOMAINS, CARDS, seededRng(1));
  assert.equal(ids.length, MOCK_SIZE);
  assert.equal(new Set(ids).size, MOCK_SIZE);
  const expected = allocate(DOMAINS.map((d) => d.weight), MOCK_SIZE);
  DOMAINS.forEach((d, i) => assert.equal(ids.filter((id) => id.startsWith(`${d.id}-`)).length, expected[i], d.id));
});

test('buildMock takes what exists when a category is small', () => {
  const ids = buildMock([{ id: 'iv-a', weight: 20 }, { id: 'iv-b', weight: 18 }], cardsFor('iv-a', 3).concat(cardsFor('iv-b', 3)), seededRng(2));
  assert.equal(ids.length, 6);
});

test('a mock records grades, updates cards and finishes with counts', () => {
  let p = startMock(emptyInterviewProgress(), ['iv-a-c01', 'iv-b-c01', 'iv-c-c01'], 100);
  assert.equal(nextMockIndex(p.mockDraft), 0);
  p = gradeMock(p, 'iv-a-c01', 'known', 30000, 200);
  p = gradeMock(p, 'iv-b-c01', 'unknown', 90000, 300);
  assert.equal(nextMockIndex(p.mockDraft), 2);
  assert.equal(gradeOf(p, 'iv-b-c01'), 'unknown');
  assert.equal(gradeMock(p, 'not-in-mock', 'known', 1, 1), p);
  p = gradeMock(p, 'iv-c-c01', 'fuzzy', 150000, 400);
  assert.equal(nextMockIndex(p.mockDraft), -1);
  const done = finishMock(p, 500);
  assert.equal(done.mockDraft, null);
  assert.deepEqual(done.mocks[0].counts, { known: 1, fuzzy: 1, unknown: 1 });
  assert.equal(done.mocks[0].id, '500');
  assert.deepEqual(done.mocks[0].results['iv-c-c01'], { grade: 'fuzzy', ms: 150000 });
  assert.equal(finishMock(done, 600), done);
  assert.equal(gradeMock(done, 'iv-a-c01', 'known', 1, 1), done);
});

test('countGrades counts each grade', () => {
  assert.deepEqual(countGrades({}), { known: 0, fuzzy: 0, unknown: 0 });
  assert.deepEqual(countGrades({ a: { grade: 'fuzzy', ms: 1 }, b: { grade: 'fuzzy', ms: 1 } }), { known: 0, fuzzy: 2, unknown: 0 });
});

test('only the latest 20 mocks are kept', () => {
  let p = emptyInterviewProgress();
  for (let i = 0; i < MAX_MOCKS + 1; i += 1) p = finishMock(startMock(p, ['x'], i), 1000 + i);
  assert.equal(p.mocks.length, MAX_MOCKS);
  assert.equal(p.mocks[0].id, '1001');
});

test('pruneMockDraft drops cards that left the bank and keeps the rest', () => {
  let p = startMock(emptyInterviewProgress(), ['a', 'gone', 'b'], 1);
  p = gradeMock(p, 'gone', 'known', 5, 2);
  const has = (id) => id !== 'gone';
  const pruned = pruneMockDraft(p, has);
  assert.deepEqual(pruned.mockDraft.cardIds, ['a', 'b']);
  assert.deepEqual(pruned.mockDraft.results, {});
  assert.equal(pruneMockDraft(pruned, has), pruned);
  assert.equal(pruneMockDraft(emptyInterviewProgress(), has).mockDraft, null);
});

test('recommendation order: unknown cards > wrong MCQs > fuzzy cards > unseen category > mock', () => {
  const domains = [{ id: 'iv-a' }, { id: 'iv-b' }];
  const cards = cardsFor('iv-a', 2).concat(cardsFor('iv-b', 2));
  let p = emptyInterviewProgress();
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'domain', domain: 'iv-a' });
  cards.forEach((c) => { p = gradeCard(p, c.id, 'known', 1); });
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'mock' });
  p = gradeCard(p, 'iv-b-c01', 'fuzzy', 2);
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'review', domain: 'iv-b', grade: 'fuzzy' });
  p = recordAnswer(p, 'iv-a-001', false, 3);
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'wrong' });
  p = gradeCard(p, 'iv-b-c02', 'unknown', 4);
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'review', domain: 'iv-b', grade: 'unknown' });
});

test('interviewExportFileName pads the date', () => {
  assert.equal(interviewExportFileName(new Date(2026, 0, 5)), 'interview-progress-20260105.json');
});

test('validateInterviewImport accepts a real progress object', () => {
  let p = startMock(emptyInterviewProgress(), ['a'], 1);
  p = gradeMock(p, 'a', 'fuzzy', 10, 2);
  p = recordAnswer(p, 'iv-a-001', true, 3);
  const res = validateInterviewImport(JSON.parse(JSON.stringify(p)));
  assert.equal(res.ok, true);
  assert.deepEqual(res.value, p);
});

test('validateInterviewImport rejects the other bank and malformed parts', () => {
  const good = emptyInterviewProgress();
  const cases = [
    [null, '文件内容不是进度数据'],
    [emptyProgress(), '这不是面试题库的进度文件'],
    [{ ...good, schemaVersion: 9 }, '不支持的进度版本：9'],
    [{ ...good, answers: [] }, '作答记录（answers）格式错误'],
    [{ ...good, wrong: { x: -1 } }, '错题本（wrong）格式错误'],
    [{ ...good, cards: { x: 'known' } }, '卡片自评（cards）格式错误'],
    [{ ...good, cards: { x: { grade: 'meh', t: 1 } } }, '卡片自评（cards）格式错误'],
    [{ ...good, mocks: [{ id: 1 }] }, '模拟面试记录（mocks）格式错误'],
    [{ ...good, mockDraft: { startedAt: 1, cardIds: [], results: { a: { grade: 'known' } } } }, '模拟面试草稿（mockDraft）格式错误'],
  ];
  cases.forEach(([raw, error]) => assert.deepEqual(validateInterviewImport(raw), { ok: false, error }, error));
});

test('validateInterviewImport keeps only the latest 20 mocks', () => {
  let p = emptyInterviewProgress();
  for (let i = 0; i < MAX_MOCKS; i += 1) p = finishMock(startMock(p, ['x'], i), 1000 + i);
  const raw = { ...p, mocks: p.mocks.concat(p.mocks.slice(0, 3)) };
  assert.equal(validateInterviewImport(raw).value.mocks.length, MAX_MOCKS);
});

test('ACP import rejects an interview progress file', () => {
  assert.deepEqual(validateImport(emptyInterviewProgress()), { ok: false, error: '这不是 ACP 题库的进度文件' });
});

test('toBankData flattens the payload and indexes cards and questions', () => {
  const payload = {
    version: 1,
    domains: [{ id: 'iv-a', letter: 'A', name: '甲', intro: [], weight: 20 }, { id: 'iv-b', letter: 'B', name: '乙', intro: [], weight: 18 }],
    cards: { 'iv-a': cardsFor('iv-a', 2), 'iv-b': cardsFor('iv-b', 1) },
    questions: { 'iv-a': [{ id: 'iv-a-001', domain: 'iv-a' }] },
  };
  const data = toBankData(payload);
  assert.deepEqual(data.cards.map((c) => c.id), ['iv-a-c01', 'iv-a-c02', 'iv-b-c01']);
  assert.equal(data.domains[1].short, 'B 类');
  assert.equal(data.cardById.get('iv-b-c01').domain, 'iv-b');
  assert.equal(data.questionById.get('iv-a-001').domain, 'iv-a');
  assert.deepEqual(toBankData({ ...payload, questions: undefined }).questions, []);
  assert.throws(() => toBankData({ version: 2 }), /面试题库数据格式不正确/);
  assert.throws(() => toBankData(null), /面试题库数据格式不正确/);
});
