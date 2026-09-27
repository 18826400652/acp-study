export const SWIPE_MIN_PX = 50;

function appendChildren(el, children) {
  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
}

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  Object.keys(attrs || {}).forEach((key) => {
    const value = attrs[key];
    if (value === false || value === null || value === undefined) return;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'class') el.className = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  });
  appendChildren(el, children);
  return el;
}

export function hideBanner(id) {
  const el = document.getElementById(`banner-${id}`);
  if (el) el.remove();
}

export function showBanner(id, text, action) {
  hideBanner(id);
  document.getElementById('banners').append(h('div', { class: 'banner', id: `banner-${id}`, role: 'status' },
    h('span', {}, text),
    action ? h('button', { class: 'banner-action', type: 'button', onClick: action.onClick }, action.label) : null,
    h('button', { class: 'banner-close', type: 'button', 'aria-label': '关闭提示', onClick: () => hideBanner(id) }, '×')));
}

export function emptyState(text, href, label) {
  return h('div', { class: 'empty' }, h('p', {}, text), href ? h('a', { class: 'btn btn-primary', href }, label) : null);
}

export function formatPercent(x) {
  return x === null ? '—' : `${Math.round(x * 100)}%`;
}

export function formatDateTime(ms) {
  const d = new Date(ms);
  const p2 = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export function scrollViewTop() {
  const view = document.getElementById('view');
  if (view) view.scrollTop = 0;
}

export function attachSwipe(el, handlers) {
  let start = null;
  el.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointercancel', () => { start = null; });
  el.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) handlers.onLeft();
    else handlers.onRight();
  });
}
