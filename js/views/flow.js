import { h } from '../ui.js';

export function flowLabel(flow) {
  return flow.map((lane) => lane.join('→')).join('；');
}

// 竖向流程图：每条泳道是一列方框，多条泳道并排；箭头由 CSS 画
export function flowChart(flow) {
  return h('div', { class: 'flow', role: 'img', 'aria-label': `流程图：${flowLabel(flow)}`, style: `--lanes:${flow.length}` },
    flow.map((lane) => h('ol', { class: 'flow-lane' }, lane.map((step) => h('li', { class: 'flow-step' }, step)))));
}
