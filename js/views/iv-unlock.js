import { h, emptyState } from '../ui.js';
import { WrongKeyError } from '../crypto.js';
import { bankSwitch } from './bank-switch.js';

export function renderUnlock({ supported, onUnlock }) {
  if (!supported) {
    return [bankSwitch('interview'), emptyState('当前浏览器不支持解密，请用 Chrome 或系统浏览器打开。', '#/', '回到 ACP 题库')];
  }
  const input = h('input', { class: 'field-input', type: 'password', id: 'iv-password', autocomplete: 'current-password' });
  const button = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, '解锁');
  const status = h('p', { class: 'unlock-status', role: 'alert' });
  const form = h('form', { class: 'settings-group unlock' },
    h('h2', {}, '面试题库已加密'),
    h('label', { class: 'field-label', for: 'iv-password' }, '输入密码后在本机解密，之后这台手机不用再输'),
    input, button, status);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input.value) return;
    button.disabled = true;
    button.textContent = '解锁中…';
    status.textContent = '';
    onUnlock(input.value).catch((err) => {
      if (!(err instanceof WrongKeyError)) console.error(err);
      status.textContent = err instanceof WrongKeyError ? '密码不对' : `解锁失败：${err.message}`;
      button.disabled = false;
      button.textContent = '解锁';
    });
  });
  return [bankSwitch('interview'), form];
}
