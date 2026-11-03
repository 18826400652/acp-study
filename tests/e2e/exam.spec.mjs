import { test, expect } from '@playwright/test';
import {
  expectNoHorizontalOverflow, expectTabbarVisible, snap, serveMockPool,
} from './helpers.mjs';

test.use({ serviceWorkers: 'block' });

// 题库没补全时开考会弹确认框，一律接受；离开考试的确认框由各测试自己决定
function acceptStartDialogs(page, onLeave) {
  page.on('dialog', (d) => {
    if (d.message().includes('考试进行中')) return onLeave(d);
    return d.accept();
  });
}

async function startExam(page) {
  await page.goto('./#/exam');
  await expect(page.locator('.alloc-table tbody tr')).toHaveCount(6);
  await page.getByRole('button', { name: '开始模拟考' }).click();
  await expect(page.locator('.exam-timer')).toHaveText(/^1[12]\d:\d{2}$/);
}

test('mock exam: answer, submit, see result, wrong book filled', async ({ page }, testInfo) => {
  await serveMockPool(page);
  acceptStartDialogs(page, (d) => d.accept());
  await startExam(page);
  await page.locator('.question .option').first().click();
  await expect(page.locator('.question .option').first()).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.feedback')).toHaveCount(0);
  await expectTabbarVisible(page);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'exam-running');

  await page.getByRole('button', { name: '答题卡' }).click();
  await expect(page.locator('.sheet-cell.is-answered')).toHaveCount(1);
  await snap(page, testInfo, 'exam-sheet');
  await page.locator('.sheet').getByRole('button', { name: '交卷' }).click();

  await expect(page).toHaveURL(/#\/exam\/result\/\d+$/);
  await expect(page.locator('.result-badge')).toHaveText(/^(通过|未通过)$/);
  await page.locator('.review-item summary').first().click();
  await expect(page.locator('.review-item .question')).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'exam-result');

  const raw = await page.evaluate(() => window.localStorage.getItem('acp-progress-v1'));
  const progress = JSON.parse(raw);
  expect(Object.keys(progress.wrong).length).toBeGreaterThan(0);

  await page.locator('.tab[data-tab="wrong"]').click();
  await expect(page.locator('.review-list > li').first()).toBeVisible();

  await page.locator('.tab[data-tab="exam"]').click();
  await expect(page.locator('.history li')).toHaveCount(1);
});

test('leaving a running exam asks first; cancelling keeps you there', async ({ page }) => {
  await serveMockPool(page);
  let asked = 0;
  acceptStartDialogs(page, (d) => { asked += 1; return d.dismiss(); });
  await startExam(page);
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page).toHaveURL(/#\/exam$/);
  await expect(page.locator('.exam-timer')).toBeVisible();
  expect(asked).toBe(1);
});

test('reloading mid-exam keeps the answers and the clock', async ({ page }) => {
  await serveMockPool(page);
  acceptStartDialogs(page, (d) => d.accept());
  await startExam(page);
  await page.locator('.question .option').first().click();
  await page.reload();
  await expect(page.locator('.exam-timer')).toHaveText(/^1[12]\d:\d{2}$/);
  await page.getByRole('button', { name: '答题卡' }).click();
  await expect(page.locator('.sheet-cell.is-answered')).toHaveCount(1);
});

test('leaving pauses the clock across reloads and long absences, then resumes active time', async ({ page }) => {
  await serveMockPool(page);
  acceptStartDialogs(page, (d) => d.accept());
  const now = new Date('2026-11-03T02:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await startExam(page);
  await page.locator('.question .option').first().click();
  await page.clock.runFor(65000);
  await expect(page.locator('.exam-timer')).toHaveText('118:55');
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('.exam-timer')).toHaveCount(0);
  await expect(page.getByText('有一场模拟考尚未交卷，点此继续 ›')).toBeVisible();
  await page.clock.runFor(3 * 60 * 60 * 1000);
  await page.reload();
  await page.locator('.tab[data-tab="exam"]').click();
  await expect(page.locator('.exam-timer')).toHaveText('118:55');
  await page.clock.runFor(2000);
  await expect(page.locator('.exam-timer')).toHaveText('118:53');
  await page.getByRole('button', { name: '答题卡' }).click();
  await expect(page.locator('.sheet-cell.is-answered')).toHaveCount(1);
  await page.locator('.sheet').getByRole('button', { name: '交卷' }).click();
  await expect(page.locator('.result-hero')).toContainText('用时 1 分 7 秒');
});

test('backgrounding and page lifecycle events pause and resume without duplicate timers', async ({ page }) => {
  await serveMockPool(page);
  acceptStartDialogs(page, (d) => d.accept());
  const now = new Date('2026-11-03T02:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await startExam(page);
  await page.clock.runFor(5000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(3 * 60 * 60 * 1000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('.exam-timer')).toHaveText('119:55');
  await page.clock.runFor(2000);
  await expect(page.locator('.exam-timer')).toHaveText('119:53');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await page.clock.runFor(3 * 60 * 60 * 1000);
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(page.locator('.exam-timer')).toHaveText('119:53');
  await page.clock.runFor(1000);
  await expect(page.locator('.exam-timer')).toHaveText('119:52');
});

test('active exam time still expires and submits exactly once', async ({ page }) => {
  await serveMockPool(page);
  acceptStartDialogs(page, (d) => d.accept());
  const now = new Date('2026-11-03T02:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await startExam(page);
  await page.clock.fastForward(120 * 60 * 1000);
  await expect(page.locator('.result-hero')).toContainText('用时 120 分 0 秒');
  await page.clock.runFor(60000);
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')));
  expect(progress.examDraft).toBeNull();
  expect(progress.exams).toHaveLength(1);
  expect(progress.exams[0].durationMs).toBe(120 * 60 * 1000);
});

test('an old unsubmitted draft is preserved instead of timing out on upgrade', async ({ page }) => {
  await serveMockPool(page);
  acceptStartDialogs(page, (d) => d.accept());
  await page.addInitScript(() => {
    if (localStorage.getItem('acp-progress-v1')) return;
    localStorage.setItem('acp-progress-v1', JSON.stringify({
      schemaVersion: 1, answers: {}, wrong: {}, cards: {}, exams: [], examDate: null,
      examDraft: { startedAt: Date.now() - 3 * 60 * 60 * 1000, questionIds: ['rag-m001'], responses: { 'rag-m001': [0] } },
    }));
  });
  await page.goto('./#/exam');
  await expect(page.locator('.exam-timer')).toHaveText('120:00');
  await expect(page.locator('.question .option').first()).toHaveAttribute('aria-checked', 'true');
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')));
  expect(progress.exams).toHaveLength(0);
  expect(progress.examDraft.questionIds).toEqual(['rag-m001']);
});

test('an update offered while paused cannot refresh an exam after it resumes', async ({ page }) => {
  await serveMockPool(page);
  acceptStartDialogs(page, (d) => d.accept());
  await startExam(page);
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.exam-timer')).toHaveCount(0);
  await page.evaluate(async () => {
    window.updateMessages = [];
    const worker = { postMessage: (message) => window.updateMessages.push(message) };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
      controller: {}, addEventListener() {},
      register: async () => ({ waiting: worker, addEventListener() {} }),
    } });
    const { setupPwa } = await import('./js/pwa.js');
    setupPwa({ isExamRunning: () => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft?.runningSince != null });
  });
  const refresh = page.locator('#banner-update').getByRole('button', { name: '点击刷新' });
  await expect(refresh).toBeVisible();
  await page.locator('.tab[data-tab="exam"]').click();
  await expect(page.locator('.exam-timer')).toBeVisible();
  await refresh.click();
  expect(await page.evaluate(() => window.updateMessages)).toEqual([]);
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.exam-timer')).toHaveCount(0);
  await refresh.click();
  expect(await page.evaluate(() => window.updateMessages)).toEqual(['SKIP_WAITING']);
});
