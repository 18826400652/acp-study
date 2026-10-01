import { h, emptyState } from '../ui.js';
import { reviewDetails } from './question.js';
import { renderPractice } from './practice.js';

// 按题库顺序排列，练习时题目顺序固定
function wrongQuestions(ctx) {
  const wrong = ctx.getProgress().wrong;
  return ctx.data.questions.filter((q) => q.id in wrong);
}

export function renderWrong(ctx) {
  const root = h('div', { class: 'stack' });
  let filter = 'all';

  function chip(label, value, n) {
    return h('button', {
      class: 'chip chip-filter', type: 'button', 'aria-pressed': String(filter === value),
      onClick: () => { filter = value; draw(); },
    }, `${label} ${n}`);
  }

  function draw() {
    const progress = ctx.getProgress();
    const all = wrongQuestions(ctx);
    const shown = filter === 'all' ? all : all.filter((q) => q.domain === filter);
    root.textContent = '';
    if (!all.length) {
      root.append(emptyState('错题本是空的。答错的题会自动收进来。', ctx.link('learn'), '去练习'));
      return;
    }
    root.append(
      h('div', { class: 'chips', role: 'toolbar', 'aria-label': '按考点筛选' },
        chip('全部', 'all', all.length),
        ctx.data.domains.map((d) => {
          const n = all.filter((q) => q.domain === d.id).length;
          return n ? chip(d.short, d.id, n) : null;
        })),
      h('a', { class: 'btn btn-primary btn-block', href: filter === 'all' ? ctx.link('wrong/practice') : ctx.link(`wrong/practice/${filter}`) },
        `只刷错题（${shown.length} 道）`),
      h('p', { class: 'muted' }, '连续答对 2 次后自动移出错题本。点开题目可看答案和解析。'),
      h('ol', { class: 'review-list' }, shown.map((q) => h('li', {}, reviewDetails(q, [], [
        h('span', { class: 'review-stem' }, q.stem),
        progress.wrong[q.id] ? h('span', { class: 'chip chip-accent' }, `已连对 ${progress.wrong[q.id]} 次`) : '',
      ], 'is-wrong')))));
  }

  draw();
  return root;
}

export function renderWrongPractice(ctx, domainId) {
  const questions = wrongQuestions(ctx).filter((q) => !domainId || q.domain === domainId);
  return renderPractice(ctx, {
    title: '错题练习',
    questions,
    emptyText: '没有需要复习的错题。',
    doneHref: ctx.link('wrong'),
  });
}
