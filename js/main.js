import { loadData } from './data.js';
import { createStore, browserStorage } from './storage.js';
import { parseHash, TAB_OF } from './router.js';
import { h, showBanner } from './ui.js';
import { renderHome } from './views/home.js';
import { renderLearnIndex, renderCards } from './views/learn.js';
import { renderDomainPractice } from './views/practice.js';
import { renderExam } from './views/exam.js';
import { renderResult } from './views/result.js';
import { renderWrong, renderWrongPractice } from './views/wrong.js';
import { renderSettings } from './views/settings.js';
import { setupPwa, offerPendingUpdate, requestPersist, isWeChat } from './pwa.js';
import { remainingMs } from './exam.js';

// 每个任务往这里注册自己的视图；没注册的路由回退到首页
const VIEWS = {
  home: (ctx) => renderHome(ctx),
  learn: (ctx) => renderLearnIndex(ctx),
  cards: (ctx, p) => renderCards(ctx, p.domain),
  practice: (ctx, p) => renderDomainPractice(ctx, p.domain),
  exam: (ctx) => renderExam(ctx),
  examResult: (ctx, p) => renderResult(ctx, p.id),
  settings: (ctx) => renderSettings(ctx),
  wrong: (ctx) => renderWrong(ctx),
  wrongPractice: (ctx, p) => renderWrongPractice(ctx, p.domain),
};

const TITLES = {
  home: 'ACP 备考',
  settings: '设置',
  learn: '学习',
  cards: '速记卡片',
  practice: '练习',
  exam: '模拟考',
  examResult: '考试结果',
  wrong: '错题本',
  wrongPractice: '错题练习',
};

const LEAVE_EXAM_CONFIRM = '考试进行中，确定离开吗？作答已自动保存，回到「模拟考」可继续。';

const store = createStore(browserStorage());
const state = { data: null, progress: null, routeName: null, cleanups: [] };

function update(fn) {
  state.progress = fn(state.progress);
  if (!store.save(state.progress)) showBanner('storage', '无法写入本地存储，本次进度不会保存');
  return state.progress;
}

function navigate(hash) {
  window.location.hash = hash;
}

function makeContext() {
  return {
    data: state.data,
    getProgress: () => state.progress,
    update,
    navigate,
    onLeave: (fn) => { state.cleanups.push(fn); },
  };
}

function hasActiveExam() {
  const draft = state.progress.examDraft;
  return draft !== null && remainingMs(draft.startedAt, Date.now()) > 0;
}

function isLeavingExam(route) {
  return state.routeName === 'exam' && hasActiveExam()
    && route.name !== 'exam' && route.name !== 'examResult';
}

function runCleanups() {
  state.cleanups.forEach((fn) => fn());
  state.cleanups = [];
}

function updateChrome(routeName) {
  const title = TITLES[routeName] || TITLES.home;
  document.getElementById('title').textContent = title;
  document.title = routeName === 'home' ? 'ACP 备考' : `${title} · ACP 备考`;
  document.getElementById('settings-link').hidden = routeName !== 'home';
  const tab = TAB_OF[routeName] || 'home';
  document.querySelectorAll('.tab').forEach((el) => {
    if (el.getAttribute('data-tab') === tab) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}

function render() {
  const route = parseHash(window.location.hash);
  if (isLeavingExam(route) && !window.confirm(LEAVE_EXAM_CONFIRM)) {
    navigate('#/exam');
    return;
  }
  runCleanups();
  try {
    const renderView = VIEWS[route.name] || VIEWS.home;
    const view = document.getElementById('view');
    view.textContent = '';
    view.append(...[].concat(renderView(makeContext(), route.params)).filter(Boolean));
    view.scrollTop = 0;
    state.routeName = route.name;
    updateChrome(route.name);
    if (route.name !== 'exam') offerPendingUpdate();
  } catch (err) {
    console.error(err);
    showFatal(err);
  }
}

function showFatal(err) {
  const view = document.getElementById('view');
  view.textContent = '';
  view.append(h('div', { class: 'empty' },
    h('p', {}, `页面出错：${err.message}`),
    h('button', { class: 'btn btn-primary', type: 'button', onClick: () => window.location.reload() }, '重试')));
}

async function boot() {
  const loaded = store.load();
  state.progress = loaded.progress;
  if (loaded.error) showBanner('storage', loaded.error);
  try {
    state.data = await loadData();
  } catch (err) {
    console.error(err);
    showFatal(err);
    return;
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
