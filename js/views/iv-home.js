import { h } from '../ui.js';
import { cardSummary, recommendInterview, MOCK_SIZE } from '../interview.js';
import { stat, recommendCard } from './home.js';
import { bankSwitch } from './bank-switch.js';
import { ivDomainRow } from './iv-domain-row.js';

function recommendLink(ctx, rec) {
  const nameOf = (id) => ctx.data.domains.filter((d) => d.id === id)[0].name;
  if (rec.kind === 'review') {
    const sub = rec.grade === 'unknown' ? '先把「不会」的卡片过一遍' : '再过一遍「模糊」的卡片';
    return recommendCard(ctx.link(`learn/${rec.domain}/weak`), `复习：${nameOf(rec.domain)}`, sub);
  }
  if (rec.kind === 'wrong') {
    const n = Object.keys(ctx.getProgress().wrong).length;
    return recommendCard(ctx.link('wrong/practice'), `复习选择题错题（${n} 道）`, '连续答对 2 次即移出错题本');
  }
  if (rec.kind === 'domain') return recommendCard(ctx.link(`learn/${rec.domain}`), `学习：${nameOf(rec.domain)}`, '先翻卡自测，再做选择题');
  return recommendCard(ctx.link('mock'), '来一轮模拟面试', `${MOCK_SIZE} 题 · 每题约 2 分钟`);
}

export function renderIvHome(ctx) {
  const progress = ctx.getProgress();
  const { domains, cards } = ctx.data;
  const all = cardSummary(progress, cards);
  const last = progress.mocks[progress.mocks.length - 1];
  return [
    bankSwitch('interview'),
    h('section', { class: 'hero' },
      h('div', { class: 'hero-countdown' },
        h('span', { class: 'hero-label' }, '卡片已掌握'),
        h('span', { class: 'hero-number' }, String(all.known), h('span', { class: 'hero-unit' }, `/ ${all.total}`))),
      h('div', { class: 'hero-stats' },
        stat(String(all.fuzzy + all.unknown), '待复习'),
        stat(last ? `${last.counts.known}/${last.cardIds.length}` : '—', '上次模拟面试「会」'))),
    progress.mockDraft ? h('a', { class: 'notice notice-warn', href: ctx.link('mock') }, '有一轮模拟面试还没完成，点此继续 ›') : null,
    recommendLink(ctx, recommendInterview(progress, domains, cards)),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '类别进度'),
      h('ul', { class: 'domain-list' }, domains.map((d) => ivDomainRow(ctx, d)))),
    h('p', { class: 'disclaimer' }, '内容由本人整理并加密发布；答案仅供参考，面试前请核对原始资料。'),
  ].filter(Boolean);
}
