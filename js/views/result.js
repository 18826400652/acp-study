import { h, emptyState } from '../ui.js';
import { formatDuration } from '../exam.js';
import { isCorrect, PASS_RATIO } from '../scoring.js';
import { reviewDetails } from './question.js';

function reviewItem(q, selected, i) {
  if (!q) return h('li', { class: 'muted' }, `第 ${i + 1} 题已从题库移除`);
  const ok = isCorrect(q, selected);
  return h('li', {}, reviewDetails(q, selected, [
    h('span', { class: 'review-mark' }, ok ? '✓' : '✗'),
    h('span', { class: 'review-stem' }, `${i + 1}. ${q.stem}`),
  ], ok ? 'is-correct' : 'is-wrong'));
}

export function renderResult(ctx, id) {
  const record = ctx.getProgress().exams.filter((e) => e.id === id)[0];
  if (!record) return emptyState('没有找到这次考试记录。', '#/exam', '返回模拟考');
  const { domains, questionById } = ctx.data;
  const rows = domains.filter((d) => record.byDomain[d.id]).map((d) => {
    const s = record.byDomain[d.id];
    return h('tr', { class: s.score < s.max * PASS_RATIO ? 'is-weak' : '' }, h('td', {}, d.name), h('td', {}, `${s.score}/${s.max}`));
  });
  return [
    h('section', { class: record.passed ? 'result-hero is-pass' : 'result-hero' },
      h('p', { class: 'result-score' }, String(record.score), h('span', { class: 'result-max' }, ` / ${record.max}`)),
      h('p', { class: 'result-badge' }, record.passed ? '通过' : '未通过'),
      h('p', { class: 'muted' }, `及格线 ${Math.ceil(record.max * PASS_RATIO)} 分 · 用时 ${formatDuration(record.finishedAt - record.startedAt)}`)),
    h('table', { class: 'domain-table' },
      h('thead', {}, h('tr', {}, h('th', {}, '考点'), h('th', {}, '得分'))),
      h('tbody', {}, rows)),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '逐题回看'),
      h('ol', { class: 'review-list' }, record.questionIds.map((qid, i) => reviewItem(questionById.get(qid), record.responses[qid] || [], i)))),
    h('a', { class: 'btn btn-secondary btn-block', href: '#/exam' }, '返回模拟考'),
  ];
}
