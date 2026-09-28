import { loadData } from './data.js';
import { createStore, browserStorage } from './storage.js';
import { parseHash, linkFor, TAB_OF } from './router.js';
import { h, showBanner, emptyState } from './ui.js';
import { renderHome } from './views/home.js';
import { renderLearnIndex, renderCards } from './views/learn.js';
import { renderDomainPractice } from './views/practice.js';
import { renderExam } from './views/exam.js';
import { renderResult } from './views/result.js';
import { renderWrong, renderWrongPractice } from './views/wrong.js';
import { renderSettings } from './views/settings.js';
import { renderIvHome } from './views/iv-home.js';
import { renderIvLearnIndex, renderIvCards } from './views/iv-learn.js';
import { renderUnlock } from './views/iv-unlock.js';
import { bankSwitch } from './views/bank-switch.js';
import { setupPwa, offerPendingUpdate, requestPersist, isWeChat } from './pwa.js';
import { remainingMs } from './exam.js';
import { isCryptoSupported } from './crypto.js';
import { IV_STORAGE_KEY, emptyInterviewProgress, validateInterviewImport } from './interview.js';
import { createInterviewSession } from './iv-session.js';

// 每个题库一张视图表；没注册的路由回退到该题库首页
const VIEWS = {
  acp: {
    home: (ctx) => renderHome(ctx),
    learn: (ctx) => renderLearnIndex(ctx),
    cards: (ctx, p) => renderCards(ctx, p.domain),
    practice: (ctx, p) => renderDomainPractice(ctx, p.domain),
    exam: (ctx) => renderExam(ctx),
    examResult: (ctx, p) => renderResult(ctx, p.id),
    settings: (ctx) => renderSettings(ctx),
    wrong: (ctx) => renderWrong(ctx),
    wrongPractice: (ctx, p) => renderWrongPractice(ctx, p.domain),
  },
  interview: {
    home: (ctx) => renderIvHome(ctx),
    learn: (ctx) => renderIvLearnIndex(ctx),
    cards: (ctx, p) => renderIvCards(ctx, p.domain, p.filter),
    practice: (ctx, p) => renderDomainPractice(ctx, p.domain),
    settings: (ctx) => renderSettings(ctx),
    wrong: (ctx) => renderWrong(ctx),
    wrongPractice: (ctx, p) => renderWrongPractice(ctx, p.domain),
  },
};

const BANK_TITLE = { acp: 'ACP 备考', interview: '面试备考' };
const EXAM_TAB_LABEL = { acp: '模拟考', interview: '模拟面试' };
const TAB_PATHS = {
  acp: { home: '', learn: 'learn', exam: 'exam', wrong: 'wrong' },
  interview: { home: '', learn: 'learn', exam: 'mock', wrong: 'wrong' },
};
const TITLES = {
  settings: '设置',
  learn: '学习',
  cards: '速记卡片',
  practice: '练习',
  exam: '模拟考',
  examResult: '考试结果',
  mock: '模拟面试',
  mockResult: '面试结果',
  wrong: '错题本',
  wrongPractice: '错题练习',
};
const BANK_KEY = 'acp-bank';
const LEAVE_EXAM_CONFIRM = '考试进行中，确定离开吗？作答已自动保存，回到「模拟考」可继续。';

const storage = browserStorage();
const banks = {
  acp: { store: createStore(storage), progress: null, data: null },
  interview: {
    store: createStore(storage, { key: IV_STORAGE_KEY, empty: emptyInterviewProgress, validate: validateInterviewImport }),
    progress: null,
    data: null,
  },
};
const session = createInterviewSession();
const state = { route: null, cleanups: [] };

function update(bank, fn) {
  const b = banks[bank];
  b.progress = fn(b.progress);
  if (!b.store.save(b.progress)) showBanner('storage', '无法写入本地存储，本次进度不会保存');
  return b.progress;
}

function navigate(hash) {
  window.location.hash = hash;
}

function lockInterview() {
  return session.lock().then(() => {
    banks.interview.data = null;
    navigate(linkFor('interview', ''));
  });
}

function makeContext(bank) {
  return {
    bank,
    data: banks[bank].data,
    getProgress: () => banks[bank].progress,
    update: (fn) => update(bank, fn),
    navigate,
    link: (path) => linkFor(bank, path),
    onLeave: (fn) => { state.cleanups.push(fn); },
    lock: lockInterview,
  };
}

function hasActiveExam() {
  const draft = banks.acp.progress.examDraft;
  return draft !== null && remainingMs(draft.startedAt, Date.now()) > 0;
}

function isLeavingExam(route) {
  const prev = state.route;
  const stays = route.bank === 'acp' && (route.name === 'exam' || route.name === 'examResult');
  return prev !== null && prev.bank === 'acp' && prev.name === 'exam' && hasActiveExam() && !stays;
}

function runCleanups() {
  state.cleanups.forEach((fn) => fn());
  state.cleanups = [];
}

function rememberBank(bank) {
  try {
    if (storage) storage.setItem(BANK_KEY, bank);
  } catch (err) {
    console.error('保存当前题库失败：', err);
  }
}

function lastBank() {
  try {
    return storage ? storage.getItem(BANK_KEY) : null;
  } catch {
    return null;
  }
}

function updateChrome(route) {
  const bankTitle = BANK_TITLE[route.bank];
  const title = route.name === 'home' ? bankTitle : (TITLES[route.name] || bankTitle);
  document.getElementById('title').textContent = title;
  document.title = route.name === 'home' ? bankTitle : `${title} · ${bankTitle}`;
  const settings = document.getElementById('settings-link');
  settings.hidden = route.name !== 'home';
  settings.setAttribute('href', linkFor(route.bank, 'settings'));
  const tab = TAB_OF[route.name] || 'home';
  document.querySelectorAll('.tab').forEach((el) => {
    const name = el.getAttribute('data-tab');
    el.setAttribute('href', linkFor(route.bank, TAB_PATHS[route.bank][name]));
    if (name === tab) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
  document.querySelector('.tab[data-tab="exam"] span').textContent = EXAM_TAB_LABEL[route.bank];
}

function mount(nodes) {
  const view = document.getElementById('view');
  view.textContent = '';
  view.append(...[].concat(nodes).filter(Boolean));
  view.scrollTop = 0;
}

function showFatal(err) {
  mount(h('div', { class: 'empty' },
    h('p', {}, `页面出错：${err.message}`),
    h('button', { class: 'btn btn-primary', type: 'button', onClick: () => window.location.reload() }, '重试')));
}

function stillOnInterview() {
  return parseHash(window.location.hash).bank === 'interview';
}

function onUnlocked() {
  banks.interview.data = session.getData();
  render();
}

function openInterview() {
  if (!isCryptoSupported()) {
    mount(renderUnlock({ supported: false }));
    return;
  }
  mount(h('p', { class: 'loading' }, '正在打开面试题库…'));
  session.tryStoredKey().then((ok) => {
    if (!stillOnInterview()) return;
    if (ok) {
      onUnlocked();
      return;
    }
    mount(renderUnlock({ supported: true, onUnlock: (password) => session.unlock(password).then(onUnlocked) }));
  }).catch((err) => {
    console.error(err);
    if (stillOnInterview()) mount([bankSwitch('interview'), emptyState(err.message, '#/', '回到 ACP 题库')]);
  });
}

function render() {
  const route = parseHash(window.location.hash);
  if (isLeavingExam(route) && !window.confirm(LEAVE_EXAM_CONFIRM)) {
    navigate('#/exam');
    return;
  }
  runCleanups();
  rememberBank(route.bank);
  state.route = route;
  updateChrome(route);
  try {
    if (!banks[route.bank].data) {
      openInterview();
      return;
    }
    const views = VIEWS[route.bank];
    const renderView = views[route.name] || views.home;
    mount(renderView(makeContext(route.bank), route.params));
    if (!(route.bank === 'acp' && route.name === 'exam')) offerPendingUpdate();
  } catch (err) {
    console.error(err);
    showFatal(err);
  }
}

async function boot() {
  Object.keys(banks).forEach((bank) => {
    const loaded = banks[bank].store.load();
    banks[bank].progress = loaded.progress;
    if (loaded.error) showBanner('storage', loaded.error);
  });
  try {
    banks.acp.data = await loadData();
  } catch (err) {
    console.error(err);
    showFatal(err);
    return;
  }
  if (!window.location.hash && lastBank() === 'interview') {
    window.history.replaceState(null, '', linkFor('interview', ''));
  }
  window.addEventListener('hashchange', render);
  render();
  requestPersist();
  if (isWeChat(navigator.userAgent)) {
    showBanner('wechat', '微信里无法添加到主屏：点右上角「···」选择「在浏览器打开」');
  }
  setupPwa({ isExamRunning: hasActiveExam });
}

boot();
