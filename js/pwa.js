import { showBanner } from './ui.js';

let pendingWorker = null;
let userAccepted = false;
let examRunning = () => false;

export function isWeChat(ua) {
  return /MicroMessenger/i.test(ua || '');
}

export function offerPendingUpdate() {
  if (!pendingWorker || examRunning()) return;
  const worker = pendingWorker;
  showBanner('update', '内容已更新', {
    label: '点击刷新',
    onClick: () => {
      userAccepted = true;
      worker.postMessage('SKIP_WAITING');
    },
  });
}

function watchInstalling(reg) {
  const worker = reg.installing;
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      pendingWorker = worker;
      offerPendingUpdate();
    }
  });
}

export function setupPwa(options) {
  if (!('serviceWorker' in navigator)) return;
  examRunning = options.isExamRunning;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (userAccepted) window.location.reload();
  });
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) {
      pendingWorker = reg.waiting;
      offerPendingUpdate();
    }
    reg.addEventListener('updatefound', () => watchInstalling(reg));
  }).catch((err) => {
    console.error('Service Worker 注册失败：', err);
  });
}

export function requestPersist() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch((err) => console.error('申请持久化存储失败：', err));
  }
}
