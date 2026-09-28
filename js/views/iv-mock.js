import { h, emptyState, scrollViewTop, formatDateTime } from '../ui.js';
import { allocate, formatClock, formatDuration } from '../exam.js';
import {
  buildMock, startMock, gradeMock, finishMock, pruneMockDraft, nextMockIndex, isWeakGrade,
  GRADES, MOCK_SIZE, MOCK_SOFT_LIMIT_MS,
} from '../interview.js';
import { cardFace, gradeButtons, answerParts, GRADE_LABELS, GRADE_CHIP } from './iv-learn.js';
import { stat } from './home.js';

const TICK_MS = 1000;
const RECENT_MOCKS = 5;
const RULES = [
  `按类别权重抽 ${MOCK_SIZE} 题，偏重 Agent 核心、RAG 和项目深挖`,
  '先口头作答，建议每题控制在 2 分钟内',
  '说完再看答案，自评：会 / 模糊 / 不会',
  '自评会同步到卡片，模糊和不会的题进入复习',
  '中途离开会自动保存，回来接着答',
];

function finish(ctx) {
  const next = ctx.update((p) => finishMock(p, Date.now()));
  ctx.navigate(ctx.link(`mock/result/${next.mocks[next.mocks.length - 1].id}`));
}

function start(ctx, show) {
  const ids = buildMock(ctx.data.domains, ctx.data.cards);
  if (!ids.length) {
    window.alert('还没有卡片，无法开始模拟面试。');
    return;
  }
  ctx.update((p) => startMock(p, ids, Date.now()));
  show();
}

function intro(ctx, show) {
  const { domains } = ctx.data;
  const counts = allocate(domains.map((d) => d.weight), MOCK_SIZE);
  const recent = ctx.getProgress().mocks.slice(-RECENT_MOCKS).reverse();
  return [
    h('section', { class: 'rules' }, h('h2', { class: 'section-title' }, '模拟面试规则'), h('ul', {}, RULES.map((r) => h('li', {}, r)))),
    h('table', { class: 'alloc-table' },
      h('thead', {}, h('tr', {}, h('th', {}, '类别'), h('th', {}, '题数'))),
      h('tbody', {}, domains.map((d, i) => h('tr', {}, h('td', {}, `${d.letter}. ${d.name}`), h('td', {}, String(counts[i])))))),
    h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: () => start(ctx, show) }, '开始模拟面试'),
    recent.length ? h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '最近记录'),
      h('ul', { class: 'history' }, recent.map((m) => h('li', {}, h('a', { href: ctx.link(`mock/result/${m.id}`) },
        h('span', {}, formatDateTime(m.finishedAt)),
        h('span', {}, `会 ${m.counts.known} · 模糊 ${m.counts.fuzzy} · 不会 ${m.counts.unknown}`)))))) : null,
  ].filter(Boolean);
}

function softClock(elapsed) {
  const left = MOCK_SOFT_LIMIT_MS - elapsed;
  return left >= 0 ? formatClock(left) : `+${formatClock(-left)}`;
}

function running(ctx, show) {
  const draft = ctx.getProgress().mockDraft;
  const index = nextMockIndex(draft);
  const card = ctx.data.cardById.get(draft.cardIds[index]);
  const shownAt = Date.now();
  let revealedMs = null;
  const timer = h('span', { class: 'exam-timer', role: 'timer', 'aria-label': '建议用时' });
  const body = h('div', { class: 'stack' });
  const tick = () => {
    const elapsed = revealedMs === null ? Date.now() - shownAt : revealedMs;
    timer.textContent = softClock(elapsed);
    timer.classList.toggle('is-urgent', elapsed > MOCK_SOFT_LIMIT_MS);
  };
  const handle = setInterval(tick, TICK_MS);
  ctx.onLeave(() => clearInterval(handle));
  const grade = (value) => {
    clearInterval(handle);
    ctx.update((p) => gradeMock(p, card.id, value, revealedMs, Date.now()));
    scrollViewTop();
    show();
  };
  const stop = () => {
    if (!window.confirm('提前结束本轮？已自评的题会计入结果。')) return;
    clearInterval(handle);
    finish(ctx);
  };
  function draw() {
    body.textContent = '';
    body.append(...[
      cardFace(card, { revealed: revealedMs !== null, onReveal: () => { revealedMs = Date.now() - shownAt; tick(); draw(); } }),
      revealedMs !== null ? gradeButtons(null, grade) : null,
    ].filter(Boolean));
  }
  tick();
  draw();
  return [
    h('div', { class: 'exam-bar' }, timer,
      h('span', { class: 'exam-progress' }, `第 ${index + 1}/${draft.cardIds.length} 题`),
      h('button', { class: 'btn btn-ghost btn-small', type: 'button', onClick: stop }, '结束')),
    body,
  ];
}

export function renderMock(ctx) {
  const root = h('div', { class: 'stack' });
  function show() {
    root.textContent = '';
    if (ctx.getProgress().mockDraft) ctx.update((p) => pruneMockDraft(p, (id) => ctx.data.cardById.has(id)));
    const draft = ctx.getProgress().mockDraft;
    if (!draft) root.append(...intro(ctx, show));
    else if (nextMockIndex(draft) === -1) finish(ctx);
    else root.append(...running(ctx, show));
  }
  show();
  return root;
}

function resultItem(card, result, i) {
  if (!card) return h('li', { class: 'muted' }, `第 ${i + 1} 题已从题库移除`);
  return h('li', {}, h('details', { class: result.grade === 'known' ? 'review-item is-correct' : 'review-item' },
    h('summary', {},
      h('span', { class: `review-mark chip ${GRADE_CHIP[result.grade]}` }, GRADE_LABELS[result.grade]),
      h('span', { class: 'review-stem' }, `${card.no}. ${card.title}`),
      h('span', { class: 'muted' }, formatClock(result.ms))),
    h('div', { class: 'iv-review-body' }, answerParts(card))));
}

export function renderMockResult(ctx, id) {
  const record = ctx.getProgress().mocks.filter((m) => m.id === id)[0];
  if (!record) return emptyState('没有找到这次模拟面试记录。', ctx.link('mock'), '返回模拟面试');
  const graded = record.cardIds.filter((cid) => record.results[cid]);
  const weak = graded.map((cid) => ctx.data.cardById.get(cid)).filter((c) => c && isWeakGrade(record.results[c.id].grade))[0];
  return [
    h('section', { class: 'result-hero iv-result' },
      h('div', { class: 'grade-summary' }, GRADES.map((g) => stat(String(record.counts[g]), GRADE_LABELS[g]))),
      h('p', { class: 'muted' }, `共 ${graded.length} 题 · 用时 ${formatDuration(record.finishedAt - record.startedAt)}`)),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '逐题回看'),
      h('ol', { class: 'review-list' }, graded.map((cid, i) => resultItem(ctx.data.cardById.get(cid), record.results[cid], i)))),
    weak ? h('a', { class: 'btn btn-primary btn-block', href: ctx.link(`learn/${weak.domain}/weak`) }, '去复习模糊和不会的卡片') : null,
    h('a', { class: 'btn btn-secondary btn-block', href: ctx.link('mock') }, '返回模拟面试'),
  ].filter(Boolean);
}
