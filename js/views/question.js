import { h } from '../ui.js';
import { isCorrect } from '../scoring.js';

const LETTERS = 'ABCDEF';

export function letters(indexes) {
  return indexes.map((i) => LETTERS[i]).join('、');
}

function optionItem(q, text, i, selected, submitted, onClick) {
  const isSel = selected.indexOf(i) !== -1;
  const isAns = q.answer.indexOf(i) !== -1;
  const cls = ['option'];
  if (isSel) cls.push('is-selected');
  if (submitted && isAns) cls.push(isSel ? 'is-correct' : 'is-missed');
  if (submitted && isSel && !isAns) cls.push('is-wrong');
  return h('li', {}, h('button', {
    class: cls.join(' '),
    type: 'button',
    role: q.type === 'single' ? 'radio' : 'checkbox',
    'aria-checked': String(isSel),
    disabled: submitted,
    onClick,
  }, h('span', { class: 'option-letter' }, LETTERS[i]), h('span', { class: 'option-text' }, text)));
}

function feedback(q, selected) {
  const ok = isCorrect(q, selected);
  let cls = 'feedback';
  let verdict = `正确答案：${letters(q.answer)}`;
  if (selected.length) {
    cls = ok ? 'feedback feedback-ok' : 'feedback feedback-bad';
    verdict = ok ? '回答正确' : `回答错误，正确答案：${letters(q.answer)}`;
  }
  return h('div', { class: cls, role: 'status' },
    h('p', { class: 'feedback-verdict' }, verdict),
    h('p', { class: 'explanation' }, q.explanation),
    h('p', { class: 'source' }, `出处：${q.source}`));
}

export function questionCard(q, opts) {
  const mode = opts.mode;
  let selected = (opts.selected || []).slice();
  let submitted = mode === 'review';
  const root = h('article', { class: 'question', 'data-qid': q.id });

  function toggle(i) {
    if (submitted) return;
    if (q.type === 'single') selected = [i];
    else if (selected.indexOf(i) !== -1) selected = selected.filter((x) => x !== i);
    else selected = selected.concat([i]).sort((a, b) => a - b);
    if (opts.onChange) opts.onChange(selected);
    draw();
  }

  function submit() {
    if (!selected.length || submitted) return;
    submitted = true;
    opts.onSubmit(selected);
    draw();
  }

  function actions() {
    if (mode !== 'practice') return null;
    const button = submitted
      ? h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: opts.onNext }, '下一题')
      : h('button', { class: 'btn btn-primary btn-block', type: 'button', disabled: !selected.length, onClick: submit }, '提交答案');
    return h('div', { class: 'q-actions' }, button);
  }

  function draw() {
    root.textContent = '';
    root.append(
      h('div', { class: 'q-meta' },
        h('span', { class: q.type === 'multi' ? 'chip chip-accent' : 'chip' }, q.type === 'single' ? '单选' : '多选'),
        q.type === 'multi' ? h('span', { class: 'muted' }, '全部选对才得分') : ''),
      h('p', { class: 'q-stem' }, q.stem),
      h('ul', { class: 'options', role: q.type === 'single' ? 'radiogroup' : 'group' },
        q.options.map((text, i) => optionItem(q, text, i, selected, submitted, () => toggle(i)))),
      submitted && mode !== 'exam' ? feedback(q, selected) : '',
      actions() || '');
  }

  draw();
  return root;
}

export function reviewDetails(q, selected, summaryNodes, extraClass) {
  const details = h('details', { class: `review-item ${extraClass}` }, h('summary', {}, summaryNodes));
  details.addEventListener('toggle', () => {
    if (details.open && !details.querySelector('.question')) {
      details.append(questionCard(q, { mode: 'review', selected }));
    }
  });
  return details;
}
