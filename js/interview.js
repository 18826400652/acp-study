import { allocate, shuffle } from './exam.js';
import { answersProblem, positionsProblem } from './progress.js';

export const IV_SCHEMA_VERSION = 1;
export const IV_BANK = 'interview';
export const IV_STORAGE_KEY = 'acp-interview-progress-v1';
export const GRADES = ['known', 'fuzzy', 'unknown'];
export const MOCK_SIZE = 12;
export const MOCK_SOFT_LIMIT_MS = 2 * 60 * 1000;
export const MAX_MOCKS = 20;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const values = (o) => Object.keys(o).map((k) => o[k]);

export function emptyInterviewProgress() {
  return { schemaVersion: IV_SCHEMA_VERSION, bank: IV_BANK, answers: {}, wrong: {}, cards: {}, cardPos: {}, practicePos: {}, mocks: [], mockDraft: null };
}

// ---------- 卡片自评 ----------

function checkGrade(grade) {
  if (GRADES.indexOf(grade) === -1) throw new Error(`invalid grade: ${grade}`);
}

export function gradeCard(progress, cardId, grade, t) {
  checkGrade(grade);
  return { ...progress, cards: { ...progress.cards, [cardId]: { grade, t } } };
}

export function gradeOf(progress, cardId) {
  const entry = progress.cards[cardId];
  return entry ? entry.grade : null;
}

export function isWeakGrade(grade) {
  return grade === 'fuzzy' || grade === 'unknown';
}

export function cardSummary(progress, cards) {
  const out = { total: cards.length, known: 0, fuzzy: 0, unknown: 0, unseen: 0 };
  cards.forEach((c) => {
    out[gradeOf(progress, c.id) || 'unseen'] += 1;
  });
  return out;
}

// ---------- 模拟面试 ----------

export function buildMock(domains, cards, rng = Math.random) {
  const counts = allocate(domains.map((d) => d.weight), MOCK_SIZE);
  const picked = domains.map((d, i) => shuffle(cards.filter((c) => c.domain === d.id), rng).slice(0, counts[i]).map((c) => c.id));
  return shuffle([].concat(...picked), rng);
}

export function startMock(progress, cardIds, startedAt) {
  return { ...progress, mockDraft: { startedAt, cardIds: cardIds.slice(), results: {} } };
}

export function gradeMock(progress, cardId, grade, ms, t) {
  const draft = progress.mockDraft;
  if (!draft || draft.cardIds.indexOf(cardId) === -1) return progress;
  const graded = gradeCard(progress, cardId, grade, t);
  return { ...graded, mockDraft: { ...draft, results: { ...draft.results, [cardId]: { grade, ms } } } };
}

export function nextMockIndex(draft) {
  return draft.cardIds.findIndex((id) => !draft.results[id]);
}

export function countGrades(results) {
  const counts = { known: 0, fuzzy: 0, unknown: 0 };
  Object.keys(results).forEach((id) => {
    counts[results[id].grade] += 1;
  });
  return counts;
}

export function finishMock(progress, finishedAt) {
  const draft = progress.mockDraft;
  if (!draft) return progress;
  const record = {
    id: String(finishedAt),
    startedAt: draft.startedAt,
    finishedAt,
    cardIds: draft.cardIds,
    results: draft.results,
    counts: countGrades(draft.results),
  };
  return { ...progress, mockDraft: null, mocks: progress.mocks.concat([record]).slice(-MAX_MOCKS) };
}

export function pruneMockDraft(progress, hasCard) {
  const draft = progress.mockDraft;
  if (!draft) return progress;
  const cardIds = draft.cardIds.filter(hasCard);
  if (cardIds.length === draft.cardIds.length) return progress;
  const results = Object.keys(draft.results).filter(hasCard)
    .reduce((acc, id) => ({ ...acc, [id]: draft.results[id] }), {});
  return { ...progress, mockDraft: { ...draft, cardIds, results } };
}

// ---------- 推荐 ----------

export function recommendInterview(progress, domains, cards) {
  const firstWith = (test) => domains.filter((d) => cards.some((c) => c.domain === d.id && test(gradeOf(progress, c.id))))[0];
  const unknown = firstWith((g) => g === 'unknown');
  if (unknown) return { kind: 'review', domain: unknown.id, grade: 'unknown' };
  if (Object.keys(progress.wrong).length > 0) return { kind: 'wrong' };
  const fuzzy = firstWith((g) => g === 'fuzzy');
  if (fuzzy) return { kind: 'review', domain: fuzzy.id, grade: 'fuzzy' };
  const fresh = firstWith((g) => g === null);
  if (fresh) return { kind: 'domain', domain: fresh.id };
  return { kind: 'mock' };
}

// ---------- 文件与导入 ----------

export function interviewExportFileName(date) {
  const p2 = (n) => String(n).padStart(2, '0');
  return `interview-progress-${date.getFullYear()}${p2(date.getMonth() + 1)}${p2(date.getDate())}.json`;
}

const isCardEntry = (e) => isObject(e) && GRADES.indexOf(e.grade) !== -1 && typeof e.t === 'number';
const isResult = (r) => isObject(r) && GRADES.indexOf(r.grade) !== -1 && typeof r.ms === 'number';
const isMockDraft = (d) => isObject(d) && typeof d.startedAt === 'number' && Array.isArray(d.cardIds)
  && isObject(d.results) && values(d.results).every(isResult);
const isMockRecord = (m) => isMockDraft(m) && typeof m.id === 'string' && typeof m.finishedAt === 'number' && isObject(m.counts);

function interviewProblem(raw) {
  const base = answersProblem(raw);
  if (base) return base;
  if (!isObject(raw.cards) || !values(raw.cards).every(isCardEntry)) return '卡片自评（cards）格式错误';
  const pos = positionsProblem(raw);
  if (pos) return pos;
  if (!Array.isArray(raw.mocks) || !raw.mocks.every(isMockRecord)) return '模拟面试记录（mocks）格式错误';
  if (raw.mockDraft != null && !isMockDraft(raw.mockDraft)) return '模拟面试草稿（mockDraft）格式错误';
  return null;
}

export function validateInterviewImport(raw) {
  if (!isObject(raw)) return { ok: false, error: '文件内容不是进度数据' };
  if (raw.bank !== IV_BANK) return { ok: false, error: '这不是面试题库的进度文件' };
  if (raw.schemaVersion !== IV_SCHEMA_VERSION) return { ok: false, error: `不支持的进度版本：${raw.schemaVersion}` };
  const problem = interviewProblem(raw);
  if (problem) return { ok: false, error: problem };
  return {
    ok: true,
    value: {
      schemaVersion: IV_SCHEMA_VERSION,
      bank: IV_BANK,
      answers: raw.answers,
      wrong: raw.wrong,
      cards: raw.cards,
      cardPos: raw.cardPos || {},
      practicePos: raw.practicePos || {},
      mocks: raw.mocks.slice(-MAX_MOCKS),
      mockDraft: raw.mockDraft || null,
    },
  };
}

// ---------- 解密后的数据 ----------

export function toBankData(payload) {
  if (!isObject(payload) || payload.version !== 1 || !Array.isArray(payload.domains) || !isObject(payload.cards)) {
    throw new Error('面试题库数据格式不正确');
  }
  const questionMap = isObject(payload.questions) ? payload.questions : {};
  const domains = payload.domains.map((d) => ({ ...d, short: `${d.letter} 类` }));
  const cards = [].concat(...domains.map((d) => payload.cards[d.id] || []));
  const titleByNo = new Map(cards.map((c) => [c.no, c.title]));
  const label = (q) => (titleByNo.has(q.source) ? { ...q, source: `${q.source}. ${titleByNo.get(q.source)}` } : q);
  const questions = [].concat(...domains.map((d) => (questionMap[d.id] || []).map(label)));
  return {
    domains,
    cards,
    questions,
    questionById: new Map(questions.map((q) => [q.id, q])),
    cardById: new Map(cards.map((c) => [c.id, c])),
  };
}
