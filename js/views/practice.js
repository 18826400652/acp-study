import { h, emptyState, scrollViewTop } from '../ui.js';
import { isCorrect } from '../scoring.js';
import { practiceOrder, recordAnswer } from '../progress.js';
import { questionCard } from './question.js';

export function renderPractice(ctx, { title, questions, emptyText, doneHref }) {
  const root = h('div', { class: 'stack' });
  let order = practiceOrder(ctx.getProgress(), questions);
  let pos = 0;
  let answered = 0;
  let correct = 0;

  function onSubmit(q, selected) {
    const ok = isCorrect(q, selected);
    ctx.update((p) => recordAnswer(p, q.id, ok, Date.now()));
    answered += 1;
    if (ok) correct += 1;
  }

  function restart() {
    order = practiceOrder(ctx.getProgress(), questions);
    pos = 0;
    answered = 0;
    correct = 0;
    draw();
  }

  function summary() {
    return h('div', { class: 'summary' },
      h('p', { class: 'summary-score' }, `${correct}/${answered}`),
      h('p', { class: 'muted' }, '本轮答对题数'),
      h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: restart }, '再练一轮'),
      h('a', { class: 'btn btn-secondary btn-block', href: doneHref }, '返回'));
  }

  function draw() {
    root.textContent = '';
    if (!order.length) {
      root.append(emptyState(emptyText, doneHref, '返回'));
      return;
    }
    if (pos >= order.length) {
      root.append(summary());
      return;
    }
    const q = ctx.data.questionById.get(order[pos]);
    root.append(
      h('p', { class: 'crumb' }, `${title} · ${pos + 1}/${order.length}`),
      questionCard(q, {
        mode: 'practice',
        onSubmit: (sel) => onSubmit(q, sel),
        onNext: () => { pos += 1; draw(); scrollViewTop(); },
      }));
  }

  draw();
  return root;
}

export function renderDomainPractice(ctx, domainId) {
  const domain = ctx.data.domains.filter((d) => d.id === domainId)[0];
  if (!domain) return emptyState('没有找到这个考点。', '#/learn', '返回考点列表');
  return renderPractice(ctx, {
    title: domain.name,
    questions: ctx.data.questions.filter((q) => q.domain === domainId),
    emptyText: '这个考点还没有题目。',
    doneHref: `#/learn/${domainId}`,
  });
}
