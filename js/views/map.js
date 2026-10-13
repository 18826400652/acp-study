import { h, emptyState } from '../ui.js';
import { setCardPos } from '../progress.js';
import { mapStats } from '../knowledge-map.js';

// 前两层分支默认展开，更深的默认折叠
const OPEN_DEPTH = 2;
const STATE_CHIP = { known: ['chip chip-accent', '已掌握'], review: ['chip chip-warn', '再看看'] };

function cardNode(card, state, onOpen) {
  const chip = STATE_CHIP[state];
  return h('li', { class: 'map-leaf' },
    h('button', { class: 'map-card', type: 'button', 'data-card': card.id, onClick: () => onOpen(card.id) },
      h('span', { class: 'map-card-title' }, card.title),
      chip ? h('span', { class: chip[0] }, chip[1]) : null));
}

function branchNode(node, depth, renderChild) {
  return h('li', { class: 'map-branch' },
    h('details', { open: depth <= OPEN_DEPTH },
      h('summary', {}, node.label),
      h('ul', { class: 'map-list' }, node.children.map((child) => renderChild(child, depth + 1)))));
}

export function renderMap(ctx, domainId) {
  const domain = ctx.data.domains.filter((d) => d.id === domainId)[0];
  const map = domain ? ctx.data.maps[domainId] : null;
  if (!map) return emptyState('没有找到这个考点的知识地图。', '#/learn', '返回考点列表');
  const cardById = new Map(ctx.data.cards.map((c) => [c.id, c]));
  const states = ctx.getProgress().cards;
  const open = (cardId) => {
    ctx.update((p) => setCardPos(p, domainId, cardId));
    ctx.navigate(`#/learn/${domainId}`);
  };
  const renderNode = (node, depth) => {
    if (!node.card) return branchNode(node, depth, renderNode);
    const card = cardById.get(node.card);
    return card ? cardNode(card, states[card.id], open) : null;
  };
  const { known, total } = mapStats(map, states);
  return h('div', { class: 'stack' },
    h('p', { class: 'crumb' }, `${domain.name} · 已掌握 ${known}/${total}`),
    h('ul', { class: 'map-tree' }, map.children.map((node) => renderNode(node, 1))),
    h('a', { class: 'btn btn-outline btn-block', href: `#/learn/${domainId}` }, '去看卡片'));
}
