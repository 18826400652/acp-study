import { h, emptyState, scrollViewTop } from '../ui.js';
import { isCorrect } from '../scoring.js';
import { recordAnswer, setPracticePos, resumeIndex } from '../progress.js';
import { shuffleOptions } from '../options.js';
import { questionCard } from './question.js';

// 题目按题库顺序出；传了 posKey 就记住下一道要做的题，下次从那里接着做。
// 选项每次显示都重新打乱。
export function renderPractice(ctx, { title, questions, emptyText, doneHref, posKey }) {
  const root = h('div', { class: 'stack' });
  const savedPos = () => (posKey ? resumeIndex(questions, (ctx.getProgress().practicePos || {})[posKey]) : 0);
  let pos = savedPos();
  let answered = 0;
  let correct = 0;

  // 回到第 1 题或做完一轮都清掉记录
  function savePos(next) {
    if (!posKey) return;
    const id = next > 0 && next < questions.length ? questions[next].id : null;
    ctx.update((p) => setPracticePos(p, posKey, id));
  }

  function onSubmit(view, selected) {
    const ok = isCorrect(view, selected);
    ctx.update((p) => recordAnswer(p, view.id, ok, Date.now()));
    savePos(pos + 1);
    answered += 1;
    if (ok) correct += 1;
  }

  function restart() {
    savePos(0);
    pos = 0;
    answered = 0;
    correct = 0;
    draw();
    scrollViewTop();
  }

  function summary() {
    return h('div', { class: 'summary' },
      h('p', { class: 'summary-score' }, `${correct}/${answered}`),
      h('p', { class: 'muted' }, '本次答对题数'),
      h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: restart }, '再练一轮'),
      h('a', { class: 'btn btn-secondary btn-block', href: doneHref }, '返回'));
  }

  function draw() {
    root.textContent = '';
    if (!questions.length) {
      root.append(emptyState(emptyText, doneHref, '返回'));
      return;
    }
    if (pos >= questions.length) {
      root.append(summary());
      return;
    }
    const view = shuffleOptions(questions[pos]);
    root.append(
      h('p', { class: 'crumb' }, `${title} · ${pos + 1}/${questions.length}`),
      questionCard(view, {
        mode: 'practice',
        onSubmit: (sel) => onSubmit(view, sel),
        onNext: () => { pos += 1; draw(); scrollViewTop(); },
      }),
      posKey && pos > 0
        ? h('button', { class: 'btn btn-ghost btn-block', type: 'button', onClick: restart }, '从第 1 题开始')
        : '');
  }

  draw();
  return root;
}

export function renderDomainPractice(ctx, domainId) {
  const domain = ctx.data.domains.filter((d) => d.id === domainId)[0];
  if (!domain) return emptyState('没有找到这个考点。', ctx.link('learn'), '返回考点列表');
  return renderPractice(ctx, {
    title: domain.name,
    questions: ctx.data.questions.filter((q) => q.domain === domainId),
    emptyText: '这个考点还没有题目。',
    doneHref: ctx.link(`learn/${domainId}`),
    posKey: domainId,
  });
}
