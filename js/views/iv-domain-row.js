import { h, formatPercent } from '../ui.js';
import { cardSummary } from '../interview.js';
import { domainStats } from '../progress.js';

export function ivDomainRow(ctx, domain) {
  const progress = ctx.getProgress();
  const s = cardSummary(progress, ctx.data.cards.filter((c) => c.domain === domain.id));
  const q = domainStats(progress, ctx.data.questions, domain.id);
  const pct = s.total ? Math.round((s.known / s.total) * 100) : 0;
  const weak = s.fuzzy + s.unknown;
  return h('li', { class: 'domain-row' },
    h('a', { class: 'domain-link', href: ctx.link(`learn/${domain.id}`) },
      h('div', { class: 'domain-head' },
        h('span', { class: 'domain-name' }, `${domain.letter}. ${domain.name}`),
        h('span', { class: 'domain-weight' }, `权重 ${domain.weight}%`)),
      h('div', {
        class: 'bar', role: 'progressbar', 'aria-label': `${domain.name}掌握度`,
        'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct,
      }, h('span', { class: 'bar-fill', style: `width:${pct}%` })),
      h('div', { class: 'domain-meta' },
        h('span', {}, `会 ${s.known}/${s.total}`),
        weak ? h('span', { class: 'domain-acc' }, `待复习 ${weak}`) : null,
        q.total ? h('span', {}, `选择题正确率 ${formatPercent(q.accuracy)}`) : null)));
}
