import { h } from './ui.js';

// 把构建脚本产出的片段 / 块数组渲染成 DOM；全部走 textContent，不解析 HTML
export function inline(spans) {
  return spans.map((s) => {
    if (s.t === 'b') return h('strong', {}, s.s);
    if (s.t === 'code') return h('code', {}, s.s);
    if (s.t === 'todo') return h('mark', { class: 'todo' }, s.s);
    return s.s;
  });
}

export function blocks(list) {
  return list.map((b) => (b.t === 'p'
    ? h('p', {}, inline(b.c))
    : h(b.t, {}, b.items.map((item) => h('li', {}, inline(item))))));
}

export function hasTodoSpan(list) {
  return list.some((b) => (b.t === 'p' ? b.c : [].concat(...b.items)).some((s) => s.t === 'todo'));
}
