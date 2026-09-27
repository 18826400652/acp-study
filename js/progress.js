import { isCorrect, scoreExam } from './scoring.js';
import { shuffle } from './exam.js';

export const SCHEMA_VERSION = 1;
export const MAX_ATTEMPTS = 10;
export const MAX_EXAMS = 20;
export const WRONG_CLEAR_STREAK = 2;
export const WEAK_THRESHOLD = 0.8;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CARD_STATES = ['known', 'review'];

export function emptyProgress() {
  return { schemaVersion: SCHEMA_VERSION, answers: {}, wrong: {}, cards: {}, exams: [], examDraft: null, examDate: null };
}

// ---------- 作答与错题本 ----------

function nextWrong(wrong, id, correct) {
  if (!correct) return { ...wrong, [id]: 0 };
  if (!(id in wrong)) return wrong;
  const streak = wrong[id] + 1;
  if (streak < WRONG_CLEAR_STREAK) return { ...wrong, [id]: streak };
  const rest = { ...wrong };
  delete rest[id];
  return rest;
}

export function recordAnswer(progress, questionId, correct, t) {
  const history = (progress.answers[questionId] || []).concat([{ t, correct }]).slice(-MAX_ATTEMPTS);
  return {
    ...progress,
    answers: { ...progress.answers, [questionId]: history },
    wrong: nextWrong(progress.wrong, questionId, correct),
  };
}

// ---------- 卡片与设置 ----------

export function setCardState(progress, cardId, state) {
  if (CARD_STATES.indexOf(state) === -1) throw new Error(`invalid card state: ${state}`);
  return { ...progress, cards: { ...progress.cards, [cardId]: state } };
}

export function setExamDate(progress, date) {
  if (date !== null && !DATE_RE.test(date)) throw new Error(`invalid exam date: ${date}`);
  return { ...progress, examDate: date };
}

// ---------- 模拟考 ----------

export function startExam(progress, questionIds, startedAt) {
  return { ...progress, examDraft: { startedAt, questionIds: questionIds.slice(), responses: {} } };
}

export function answerExam(progress, questionId, selected) {
  const draft = progress.examDraft;
  if (!draft) return progress;
  return { ...progress, examDraft: { ...draft, responses: { ...draft.responses, [questionId]: selected.slice() } } };
}

export function finishExam(progress, questions, finishedAt) {
  const draft = progress.examDraft;
  if (!draft) return progress;
  const record = {
    id: String(finishedAt),
    startedAt: draft.startedAt,
    finishedAt,
    questionIds: draft.questionIds,
    responses: draft.responses,
    ...scoreExam(questions, draft.responses),
  };
  const answered = questions.reduce(
    (p, q) => recordAnswer(p, q.id, isCorrect(q, draft.responses[q.id] || []), finishedAt),
    progress,
  );
  return { ...answered, examDraft: null, exams: progress.exams.concat([record]).slice(-MAX_EXAMS) };
}

// ---------- 统计与推荐 ----------

export function statsFor(progress, pool) {
  let attempts = 0;
  let correct = 0;
  let answered = 0;
  pool.forEach((q) => {
    const history = progress.answers[q.id] || [];
    if (history.length) answered += 1;
    attempts += history.length;
    correct += history.filter((a) => a.correct).length;
  });
  return { total: pool.length, answered, accuracy: attempts ? correct / attempts : null };
}

export function domainStats(progress, questions, domainId) {
  return statsFor(progress, questions.filter((q) => q.domain === domainId));
}

export function practiceOrder(progress, pool, rng = Math.random) {
  const seen = (q) => (progress.answers[q.id] || []).length > 0;
  const unanswered = pool.filter((q) => !seen(q));
  const wrong = pool.filter((q) => seen(q) && q.id in progress.wrong);
  const rest = pool.filter((q) => seen(q) && !(q.id in progress.wrong));
  return shuffle(unanswered, rng).concat(shuffle(wrong, rng), shuffle(rest, rng)).map((q) => q.id);
}

export function recommend(progress, domains, questions) {
  if (Object.keys(progress.wrong).length > 0) return { kind: 'wrong' };
  const stats = domains
    .map((d) => ({ id: d.id, ...domainStats(progress, questions, d.id) }))
    .filter((s) => s.total > 0);
  const studied = stats.filter((s) => s.accuracy !== null).sort((a, b) => a.accuracy - b.accuracy);
  if (studied.length && studied[0].accuracy < WEAK_THRESHOLD) return { kind: 'domain', domain: studied[0].id };
  const fresh = stats.filter((s) => s.accuracy === null)[0];
  if (fresh) return { kind: 'domain', domain: fresh.id };
  if (studied.length) return { kind: 'domain', domain: studied[0].id };
  return { kind: 'exam' };
}

// ---------- 日期与文件 ----------

export function daysUntil(dateStr, nowMs) {
  const parts = dateStr.split('-').map(Number);
  const target = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
  const now = new Date(nowMs);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / DAY_MS);
}

export function exportFileName(date) {
  const p2 = (n) => String(n).padStart(2, '0');
  return `acp-progress-${date.getFullYear()}${p2(date.getMonth() + 1)}${p2(date.getDate())}.json`;
}

// ---------- 导入校验 ----------

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isAttempt = (a) => isObject(a) && typeof a.t === 'number' && typeof a.correct === 'boolean';
const isDraft = (d) => isObject(d) && typeof d.startedAt === 'number' && Array.isArray(d.questionIds) && isObject(d.responses);
const isExamRecord = (e) => isDraft(e) && typeof e.id === 'string' && typeof e.score === 'number'
  && typeof e.max === 'number' && typeof e.passed === 'boolean' && isObject(e.byDomain);

function findProblem(raw) {
  const values = (o) => Object.keys(o).map((k) => o[k]);
  if (!isObject(raw.answers) || !values(raw.answers).every((h) => Array.isArray(h) && h.every(isAttempt))) {
    return '作答记录（answers）格式错误';
  }
  if (!isObject(raw.wrong) || !values(raw.wrong).every((s) => Number.isInteger(s) && s >= 0)) {
    return '错题本（wrong）格式错误';
  }
  if (!isObject(raw.cards) || !values(raw.cards).every((s) => CARD_STATES.indexOf(s) !== -1)) {
    return '卡片状态（cards）格式错误';
  }
  if (!Array.isArray(raw.exams) || !raw.exams.every(isExamRecord)) return '考试记录（exams）格式错误';
  if (raw.examDraft != null && !isDraft(raw.examDraft)) return '考试草稿（examDraft）格式错误';
  if (raw.examDate != null && !(typeof raw.examDate === 'string' && DATE_RE.test(raw.examDate))) {
    return '考试日期（examDate）格式错误';
  }
  return null;
}

export function validateImport(raw) {
  if (!isObject(raw)) return { ok: false, error: '文件内容不是进度数据' };
  if (raw.schemaVersion !== SCHEMA_VERSION) return { ok: false, error: `不支持的进度版本：${raw.schemaVersion}` };
  const problem = findProblem(raw);
  if (problem) return { ok: false, error: problem };
  return {
    ok: true,
    value: {
      schemaVersion: SCHEMA_VERSION,
      answers: raw.answers,
      wrong: raw.wrong,
      cards: raw.cards,
      exams: raw.exams.slice(-MAX_EXAMS),
      examDraft: raw.examDraft || null,
      examDate: raw.examDate || null,
    },
  };
}
