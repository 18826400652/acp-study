import { h, emptyState, scrollViewTop, formatDateTime } from '../ui.js';
import { buildExam, allocate, remainingMs, formatClock, EXAM_SIZE } from '../exam.js';
import { startExam, answerExam, finishExam } from '../progress.js';
import { questionCard } from './question.js';

const TICK_MS = 1000;
const URGENT_MS = 10 * 60 * 1000;
const RECENT_EXAMS = 5;
const RULES = [
  '单选 50 题 × 1 分，多选 25 题 × 2 分',
  '限时 120 分钟，到时自动交卷',
  '满分 100 分，80 分及格',
  '多选题全部选对才得分',
  '交卷前不显示对错；中途退出可回来继续',
];

function submitExam(ctx) {
  const draft = ctx.getProgress().examDraft;
  const questions = draft.questionIds.map((id) => ctx.data.questionById.get(id)).filter(Boolean);
  const next = ctx.update((p) => finishExam(p, questions, Date.now()));
  ctx.navigate(`#/exam/result/${next.exams[next.exams.length - 1].id}`);
}

function start(ctx, show) {
  const { questionIds, shortfall } = buildExam(ctx.data.domains, ctx.data.questions);
  if (!questionIds.length) {
    window.alert('题库为空，无法开始模拟考。');
    return;
  }
  const standard = EXAM_SIZE.single + EXAM_SIZE.multi;
  if (shortfall.length && !window.confirm(`题库尚未补全，本次只能抽到 ${questionIds.length} 题（标准为 ${standard} 题），仍然开始吗？`)) return;
  ctx.update((p) => startExam(p, questionIds, Date.now()));
  show();
}

function intro(ctx, show) {
  const { domains } = ctx.data;
  const weights = domains.map((d) => d.weight);
  const singles = allocate(weights, EXAM_SIZE.single);
  const multis = allocate(weights, EXAM_SIZE.multi);
  const recent = ctx.getProgress().exams.slice(-RECENT_EXAMS).reverse();
  return [
    h('section', { class: 'rules' }, h('h2', { class: 'section-title' }, '考试规则'), h('ul', {}, RULES.map((r) => h('li', {}, r)))),
    h('table', { class: 'alloc-table' },
      h('thead', {}, h('tr', {}, h('th', {}, '考点'), h('th', {}, '单选'), h('th', {}, '多选'))),
      h('tbody', {}, domains.map((d, i) => h('tr', {}, h('td', {}, d.name), h('td', {}, String(singles[i])), h('td', {}, String(multis[i])))))),
    h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: () => start(ctx, show) }, '开始模拟考'),
    recent.length ? h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '最近成绩'),
      h('ul', { class: 'history' }, recent.map((e) => h('li', {}, h('a', { href: `#/exam/result/${e.id}` },
        h('span', {}, formatDateTime(e.finishedAt)),
        h('span', {}, `${e.score}/${e.max} · ${e.passed ? '通过' : '未通过'}`)))))) : null,
  ].filter(Boolean);
}

function answerSheet(ctx, ids, responses, current, onPick, onSubmit) {
  const singles = ids.filter((id) => {
    const q = ctx.data.questionById.get(id);
    return q && q.type === 'single';
  }).length;
  return h('div', { class: 'sheet' },
    h('p', { class: 'muted' }, `第 1–${singles} 题单选，第 ${singles + 1}–${ids.length} 题多选`),
    h('div', { class: 'sheet-grid' }, ids.map((id, i) => h('button', {
      class: `sheet-cell${(responses[id] || []).length ? ' is-answered' : ''}${i === current ? ' is-current' : ''}`,
      type: 'button',
      'aria-label': `第 ${i + 1} 题`,
      onClick: () => onPick(i),
    }, String(i + 1)))),
    h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: onSubmit }, '交卷'));
}

function running(ctx) {
  const draft = ctx.getProgress().examDraft;
  const ids = draft.questionIds;
  const responses = () => ctx.getProgress().examDraft.responses;
  let pos = Math.max(0, ids.findIndex((id) => !(draft.responses[id] || []).length));
  let sheetOpen = false;
  let handle = null;
  const timer = h('span', { class: 'exam-timer', role: 'timer', 'aria-label': '剩余时间' });
  const counter = h('span', { class: 'exam-progress' });
  const body = h('div', { class: 'stack' });
  const finish = () => { clearInterval(handle); submitExam(ctx); };
  const goTo = (i) => { pos = i; sheetOpen = false; draw(); scrollViewTop(); };
  const confirmSubmit = () => {
    const left = ids.filter((id) => !(responses()[id] || []).length).length;
    if (window.confirm(left ? `还有 ${left} 题未作答，确定交卷吗？` : '确定交卷吗？')) finish();
  };
  const sheetBtn = h('button', {
    class: 'btn btn-ghost btn-small', type: 'button', 'aria-expanded': 'false',
    onClick: () => { sheetOpen = !sheetOpen; draw(); },
  }, '答题卡');

  function draw() {
    counter.textContent = `第 ${pos + 1}/${ids.length} 题`;
    sheetBtn.setAttribute('aria-expanded', String(sheetOpen));
    const q = ctx.data.questionById.get(ids[pos]);
    const isLast = pos === ids.length - 1;
    body.textContent = '';
    body.append(...[
      sheetOpen ? answerSheet(ctx, ids, responses(), pos, goTo, confirmSubmit) : null,
      q ? questionCard(q, { mode: 'exam', selected: responses()[q.id] || [], onChange: (sel) => ctx.update((p) => answerExam(p, q.id, sel)) })
        : emptyState('这道题已从题库移除，按未作答计分。'),
      h('div', { class: 'exam-nav' },
        h('button', { class: 'btn btn-secondary', type: 'button', disabled: pos === 0, onClick: () => goTo(pos - 1) }, '‹ 上一题'),
        isLast
          ? h('button', { class: 'btn btn-primary', type: 'button', onClick: confirmSubmit }, '交卷')
          : h('button', { class: 'btn btn-primary', type: 'button', onClick: () => goTo(pos + 1) }, '下一题 ›')),
    ].filter(Boolean));
  }

  function tick() {
    const ms = remainingMs(draft.startedAt, Date.now());
    timer.textContent = formatClock(ms);
    timer.classList.toggle('is-urgent', ms <= URGENT_MS);
    if (ms === 0) finish();
  }

  draw();
  tick();
  handle = setInterval(tick, TICK_MS);
  ctx.onLeave(() => clearInterval(handle));
  return [h('div', { class: 'exam-bar' }, timer, counter, sheetBtn), body];
}

export function renderExam(ctx) {
  const root = h('div', { class: 'stack' });
  function show() {
    root.textContent = '';
    const draft = ctx.getProgress().examDraft;
    if (!draft) root.append(...intro(ctx, show));
    else if (remainingMs(draft.startedAt, Date.now()) === 0) submitExam(ctx);
    else root.append(...running(ctx));
  }
  show();
  return root;
}
