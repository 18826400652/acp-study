import { h } from '../ui.js';
import { flowChart } from './flow.js';

const SECTIONS = [['plain', '大白话'], ['analogy', '打个比方'], ['exam', '考法'], ['confuse', '易混点']];
const LABEL = { closed: '看讲解 ▾', open: '收起讲解 ▴' };

// 卡片下方的可展开讲解；每次渲染新卡片都重新创建，所以翻卡后自动收起
export function explainPanel(explain) {
  if (!explain) return null;
  const body = h('div', { class: 'explain-body', id: 'explain-body', hidden: true },
    SECTIONS.filter(([key]) => explain[key]).map(([key, label]) => h('section', { class: `explain-sec explain-${key}` },
      h('h3', { class: 'explain-label' }, label),
      h('p', {}, explain[key]))),
    explain.flow ? flowChart(explain.flow) : null);
  const toggle = h('button', {
    class: 'btn btn-ghost btn-block explain-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'explain-body',
    onClick: () => {
      const willOpen = body.hidden;
      body.hidden = !willOpen;
      toggle.setAttribute('aria-expanded', String(willOpen));
      toggle.textContent = willOpen ? LABEL.open : LABEL.closed;
    },
  }, LABEL.closed);
  return h('div', { class: 'explain' }, toggle, body);
}
