import { h } from '../ui.js';

const BANKS = [['acp', '#/', 'ACP 认证'], ['interview', '#/iv', 'Agent 面试']];

export function bankSwitch(current) {
  return h('nav', { class: 'bank-switch', 'aria-label': '切换题库' },
    BANKS.map(([bank, href, label]) => h('a', { class: 'bank-tab', href, 'aria-current': bank === current ? 'page' : false }, label)));
}
