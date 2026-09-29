import { h, attachSwipe, emptyState, scrollViewTop } from '../ui.js';
import { gradeCard, gradeOf, isWeakGrade } from '../interview.js';
import { blocks, hasTodoSpan } from '../rich.js';
import { ivDomainRow } from './iv-domain-row.js';
import { setCardPos, resumeIndex } from '../progress.js';

const PARTS = [['conclusion', '结论'], ['principle', '原理'], ['practice', '项目做法'], ['tradeoff', '取舍与局限']];
export const GRADE_LABELS = { known: '会', fuzzy: '模糊', unknown: '不会' };
export const GRADE_CHIP = { known: 'chip-accent', fuzzy: 'chip-warn', unknown: 'chip-bad' };
const GRADE_ORDER = ['unknown', 'fuzzy', 'known'];

export function renderIvLearnIndex(ctx) {
  return [
    h('p', { class: 'muted' }, '选一个类别：先翻卡自测，再做选择题。'),
    h('ul', { class: 'domain-list' }, ctx.data.domains.map((d) => ivDomainRow(ctx, d))),
  ];
}

export function answerParts(card) {
  return PARTS.map(([key, label], i) => {
    const part = card.parts[key];
    return h('details', { class: 'iv-part', open: i === 0 || hasTodoSpan(part.blocks) },
      h('summary', {}, part.warn ? `${label} ⚠️` : label),
      h('div', { class: 'iv-part-body' }, blocks(part.blocks)));
  });
}

export function cardFace(card, opts) {
  return h('article', { class: 'flashcard iv-card', 'aria-live': 'polite' },
    opts.grade ? h('span', { class: `flashcard-state chip ${GRADE_CHIP[opts.grade]}` }, GRADE_LABELS[opts.grade]) : null,
    h('p', { class: 'iv-no' }, card.no, card.hasTodo ? h('span', { class: 'chip chip-warn' }, '有待补') : null),
    h('h2', { class: 'flashcard-title' }, card.title),
    opts.revealed
      ? answerParts(card)
      : h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: opts.onReveal }, '看答案'));
}

export function gradeButtons(current, onGrade) {
  return h('div', { class: 'grade-actions', role: 'group', 'aria-label': '自评' }, GRADE_ORDER.map((g) => h('button', {
    class: `btn grade-${g}`, type: 'button', 'aria-pressed': String(current === g), onClick: () => onGrade(g),
  }, GRADE_LABELS[g])));
}

export function renderIvCards(ctx, domainId, initialFilter) {
  const domain = ctx.data.domains.filter((d) => d.id === domainId)[0];
  if (!domain) return emptyState('没有找到这个类别。', ctx.link('learn'), '返回类别列表');
  const all = ctx.data.cards.filter((c) => c.domain === domainId);
  const count = ctx.data.questions.filter((q) => q.domain === domainId).length;
  const weakCards = () => all.filter((c) => isWeakGrade(gradeOf(ctx.getProgress(), c.id)));
  const root = h('div', { class: 'stack' });
  // 只在「全部」模式记住位置；「模糊 + 不会」列表随自评变化，每次从头开始
  const savedIndex = () => resumeIndex(all, (ctx.getProgress().cardPos || {})[domainId]);
  let filter = initialFilter === 'weak' ? 'weak' : 'all';
  let list = filter === 'weak' ? weakCards() : all;
  let index = filter === 'weak' ? 0 : savedIndex();
  let revealed = false;

  const show = (i) => {
    index = i;
    revealed = false;
    if (filter === 'all' && list[i]) ctx.update((p) => setCardPos(p, domainId, list[i].id));
    draw();
    scrollViewTop();
  };
  const go = (delta) => {
    const next = index + delta;
    if (next >= 0 && next < list.length) show(next);
  };
  const setFilter = (value) => {
    filter = value;
    list = value === 'weak' ? weakCards() : all;
    show(value === 'weak' ? 0 : savedIndex());
  };
  const grade = (value) => {
    const card = list[index];
    const followingId = list[index + 1] ? list[index + 1].id : null;
    ctx.update((p) => gradeCard(p, card.id, value, Date.now()));
    if (filter === 'weak') {
      list = weakCards();
      const followIdx = followingId === null ? -1 : list.findIndex((c) => c.id === followingId);
      show(list.length ? (followIdx !== -1 ? followIdx : Math.min(index, list.length - 1)) : 0);
      return;
    }
    if (index < list.length - 1) {
      show(index + 1);
      return;
    }
    ctx.update((p) => setCardPos(p, domainId, card.id));
    draw();
  };
  const chip = (label, value, n) => h('button', {
    class: 'chip chip-filter', type: 'button', 'aria-pressed': String(filter === value), onClick: () => setFilter(value),
  }, `${label} ${n}`);

  function cardArea() {
    if (!list.length) return [emptyState(filter === 'weak' ? '没有模糊或不会的卡片。' : '这个类别还没有卡片。')];
    const card = list[index];
    const current = gradeOf(ctx.getProgress(), card.id);
    const panel = cardFace(card, { revealed, grade: current, onReveal: () => { revealed = true; draw(); } });
    attachSwipe(panel, { onLeft: () => go(1), onRight: () => go(-1) });
    return [
      h('p', { class: 'crumb' }, `${domain.name} · ${index + 1}/${list.length}`),
      panel,
      revealed ? gradeButtons(current, grade) : null,
      h('div', { class: 'pager' },
        h('button', { class: 'btn btn-ghost', type: 'button', disabled: index === 0, onClick: () => go(-1) }, '‹ 上一张'),
        h('button', { class: 'btn btn-ghost', type: 'button', disabled: index === list.length - 1, onClick: () => go(1) }, '下一张 ›')),
      filter === 'all' && index > 0
        ? h('button', { class: 'btn btn-ghost btn-block', type: 'button', onClick: () => show(0) }, '从第 1 张开始') : null,
    ];
  }

  function draw() {
    root.textContent = '';
    root.append(...[
      domain.intro.length ? h('details', { class: 'iv-intro' }, h('summary', {}, '类别说明'), blocks(domain.intro)) : null,
      h('div', { class: 'chips', role: 'toolbar', 'aria-label': '筛选卡片' },
        chip('全部', 'all', all.length), chip('只看模糊 + 不会', 'weak', weakCards().length)),
    ].concat(cardArea(), [
      count ? h('a', { class: 'btn btn-outline btn-block', href: ctx.link(`practice/${domainId}`) }, `开始练习（${count} 题）`) : null,
    ]).filter(Boolean));
  }

  draw();
  return root;
}
