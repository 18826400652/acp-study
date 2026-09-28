import { h, formatPercent } from '../ui.js';
import { statsFor, domainStats, recommend, daysUntil } from '../progress.js';
import { domainRow } from './domain-row.js';

function stat(value, label) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, value), h('span', { class: 'stat-label' }, label));
}

function countdown(examDate) {
  if (!examDate) {
    return h('a', { class: 'hero-countdown', href: '#/settings' },
      h('span', { class: 'hero-label' }, '还没设置考试日期'),
      h('span', { class: 'hero-link' }, '去设置 ›'));
  }
  const days = daysUntil(examDate, Date.now());
  return h('div', { class: 'hero-countdown' },
    h('span', { class: 'hero-label' }, days >= 0 ? '距离考试' : '考试已过'),
    h('span', { class: 'hero-number' }, String(Math.abs(days)), h('span', { class: 'hero-unit' }, '天')));
}

function recommendLink(rec, ctx) {
  const link = (href, title, sub) => h('a', { class: 'recommend', href },
    h('span', { class: 'recommend-kicker' }, '今日推荐'),
    h('span', { class: 'recommend-title' }, title),
    h('span', { class: 'recommend-sub' }, sub));
  if (rec.kind === 'wrong') {
    const n = Object.keys(ctx.getProgress().wrong).length;
    return link('#/wrong/practice', `复习错题（${n} 道）`, '连续答对 2 次即移出错题本');
  }
  if (rec.kind === 'domain') {
    const d = ctx.data.domains.filter((x) => x.id === rec.domain)[0];
    return link(`#/learn/${d.id}`, `学习：${d.name}`, '先过速记卡片，再做练习');
  }
  return link('#/exam', '来一套模拟考', '75 题 · 120 分钟 · 80 分及格');
}

export function renderHome(ctx) {
  const progress = ctx.getProgress();
  const { domains, questions } = ctx.data;
  const overall = statsFor(progress, questions);
  return [
    h('section', { class: 'hero' }, countdown(progress.examDate),
      h('div', { class: 'hero-stats' },
        stat(formatPercent(overall.accuracy), '整体正确率'),
        stat(`${overall.answered}/${overall.total}`, '已做题数'))),
    progress.examDraft ? h('a', { class: 'notice notice-warn', href: '#/exam' }, '有一场模拟考尚未交卷，点此继续 ›') : null,
    recommendLink(recommend(progress, domains, questions), ctx),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '考点进度'),
      h('ul', { class: 'domain-list' },
        domains.map((d) => domainRow(d, domainStats(progress, questions, d.id), `#/learn/${d.id}`)))),
    h('p', { class: 'disclaimer' }, '题目依据课程笔记编写，并非官方题库；每题标注出处章节，便于回原文核对。 多模态内容在课程中较少，题量有限，建议结合官方文档学习。'),
  ].filter(Boolean);
}
