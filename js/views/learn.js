import { h, attachSwipe, emptyState } from '../ui.js';
import { domainStats, setCardState } from '../progress.js';
import { domainRow } from './domain-row.js';

export function renderLearnIndex(ctx) {
  const progress = ctx.getProgress();
  const { domains, questions, cards } = ctx.data;
  return [
    h('p', { class: 'muted' }, '选一个考点：先过速记卡片，再做练习题。'),
    h('ul', { class: 'domain-list' }, domains.map((d) => {
      const own = cards.filter((c) => c.domain === d.id);
      const known = own.filter((c) => progress.cards[c.id] === 'known').length;
      return domainRow(d, domainStats(progress, questions, d.id), `#/learn/${d.id}`, `卡片 ${known}/${own.length}`);
    })),
  ];
}

function flashcard(card, cardState) {
  const badge = cardState
    ? h('span', { class: cardState === 'known' ? 'flashcard-state chip chip-accent' : 'flashcard-state chip chip-warn' },
      cardState === 'known' ? '已掌握' : '再看看')
    : '';
  return h('article', { class: 'flashcard', 'aria-live': 'polite' },
    badge,
    h('h2', { class: 'flashcard-title' }, card.title),
    h('ul', { class: 'flashcard-points' }, card.points.map((p) => h('li', {}, p))),
    h('p', { class: 'flashcard-source' }, `出处：${card.source}`));
}

function practiceLink(domainId, count) {
  return h('a', { class: 'btn btn-outline btn-block', href: `#/practice/${domainId}` }, `开始练习（${count} 题）`);
}

export function renderCards(ctx, domainId) {
  const domain = ctx.data.domains.filter((d) => d.id === domainId)[0];
  if (!domain) return emptyState('没有找到这个考点。', '#/learn', '返回考点列表');
  const cards = ctx.data.cards.filter((c) => c.domain === domainId);
  const count = ctx.data.questions.filter((q) => q.domain === domainId).length;
  const root = h('div', { class: 'stack' });
  let index = 0;

  const go = (delta) => {
    const next = index + delta;
    if (next < 0 || next >= cards.length) return;
    index = next;
    draw();
  };
  const mark = (value) => {
    ctx.update((p) => setCardState(p, cards[index].id, value));
    if (index < cards.length - 1) index += 1;
    draw();
  };

  function draw() {
    root.textContent = '';
    if (!cards.length) {
      root.append(emptyState('这个考点还没有卡片。'), practiceLink(domainId, count));
      return;
    }
    const card = cards[index];
    const cardState = ctx.getProgress().cards[card.id];
    const panel = flashcard(card, cardState);
    attachSwipe(panel, { onLeft: () => go(1), onRight: () => go(-1) });
    root.append(
      h('p', { class: 'crumb' }, `${domain.name} · ${index + 1}/${cards.length}`),
      panel,
      h('div', { class: 'card-actions' },
        h('button', { class: 'btn btn-secondary', type: 'button', 'aria-pressed': String(cardState === 'review'), onClick: () => mark('review') }, '再看看'),
        h('button', { class: 'btn btn-primary', type: 'button', 'aria-pressed': String(cardState === 'known'), onClick: () => mark('known') }, '已掌握')),
      h('div', { class: 'pager' },
        h('button', { class: 'btn btn-ghost', type: 'button', disabled: index === 0, onClick: () => go(-1) }, '‹ 上一张'),
        h('button', { class: 'btn btn-ghost', type: 'button', disabled: index === cards.length - 1, onClick: () => go(1) }, '下一张 ›')),
      practiceLink(domainId, count));
  }

  draw();
  return root;
}
