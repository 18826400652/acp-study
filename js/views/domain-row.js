import { h, formatPercent } from '../ui.js';
import { WEAK_THRESHOLD } from '../progress.js';

export function domainRow(domain, stats, href, note) {
  const weak = stats.accuracy !== null && stats.accuracy < WEAK_THRESHOLD;
  const pct = stats.total ? Math.round((stats.answered / stats.total) * 100) : 0;
  return h('li', { class: weak ? 'domain-row is-weak' : 'domain-row' },
    h('a', { class: 'domain-link', href },
      h('div', { class: 'domain-head' },
        h('span', { class: 'domain-name' }, domain.name),
        h('span', { class: 'domain-weight' }, `权重 ${domain.weight}%`)),
      h('div', {
        class: 'bar', role: 'progressbar', 'aria-label': `${domain.name}完成度`,
        'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct,
      }, h('span', { class: 'bar-fill', style: `width:${pct}%` })),
      h('div', { class: 'domain-meta' },
        h('span', {}, `已做 ${stats.answered}/${stats.total}`),
        note ? h('span', {}, note) : null,
        h('span', { class: 'domain-acc' }, `正确率 ${formatPercent(stats.accuracy)}`))));
}
