import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap } from './helpers.mjs';
import { serveEnvelope, unlock } from './iv-helpers.mjs';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await serveEnvelope(page);
  await unlock(page);
});

async function answer(page, grade) {
  await page.getByRole('button', { name: '看答案' }).click();
  await page.getByRole('button', { name: grade, exact: true }).click();
}

test('a mock interview resumes after reload and ends on a result page', async ({ page }, testInfo) => {
  await page.locator('.tab[data-tab="exam"]').click();
  await expect(page).toHaveURL(/#\/iv\/mock$/);
  await expect(page.locator('.alloc-table tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: '开始模拟面试' }).click();
  await expect(page.locator('.exam-progress')).toHaveText('第 1/6 题');
  await expect(page.locator('.exam-timer')).toHaveText(/^0[12]:\d\d$/);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-mock');
  await answer(page, '会');
  await expect(page.locator('.exam-progress')).toHaveText('第 2/6 题');
  await page.reload();
  await expect(page.locator('.exam-progress')).toHaveText('第 2/6 题');
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.notice-warn')).toContainText('模拟面试还没完成');
  await page.locator('.notice-warn').click();
  for (let i = 0; i < 5; i += 1) await answer(page, '模糊');
  await expect(page).toHaveURL(/#\/iv\/mock\/result\/\d+$/);
  await expect(page.locator('.iv-result .grade-summary .stat-value')).toHaveText(['1', '5', '0']);
  await expect(page.locator('.review-list > li')).toHaveCount(6);
  await page.locator('.review-item summary').first().click();
  await expect(page.locator('.review-item[open] .iv-part')).toHaveCount(4);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-mock-result');
  await page.getByRole('link', { name: /^复习 .+：模糊和不会的卡片$/ }).first().click();
  await expect(page).toHaveURL(/#\/iv\/learn\/iv-[ab]\/weak$/);
});

test('ending early keeps the graded answers', async ({ page }) => {
  await page.goto('./#/iv/mock');
  await page.getByRole('button', { name: '开始模拟面试' }).click();
  await answer(page, '不会');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: '结束' }).click();
  await expect(page.locator('.iv-result .grade-summary .stat-value')).toHaveText(['0', '0', '1']);
  await page.getByRole('link', { name: '返回模拟面试' }).click();
  await expect(page.locator('.history li')).toHaveCount(1);
});

test('result time sums per-card durations instead of wall time across a pause', async ({ page }) => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  await page.clock.install();
  await page.goto('./#/iv/mock');
  await page.getByRole('button', { name: '开始模拟面试' }).click();
  for (let i = 0; i < 3; i += 1) {
    await page.clock.fastForward(1000);
    await answer(page, '会');
  }
  // 离开模拟面试页面先停掉倒计时定时器，再快进两天虚拟时间，模拟中途搁置后回来继续答
  await page.goto('./#/iv');
  await page.clock.fastForward(DAY_MS * 2);
  await page.goto('./#/iv/mock');
  for (let i = 0; i < 3; i += 1) {
    await page.clock.fastForward(1000);
    await answer(page, '会');
  }
  await expect(page).toHaveURL(/#\/iv\/mock\/result\/\d+$/);
  await expect(page.locator('.iv-result .muted')).toHaveText('共 6 题 · 用时 0 分 6 秒');
});

test('the soft timer turns red after two minutes', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/iv/mock');
  await page.reload();
  await page.getByRole('button', { name: '开始模拟面试' }).click();
  await page.clock.fastForward('02:05');
  await expect(page.locator('.exam-timer')).toHaveClass(/is-urgent/);
  await expect(page.locator('.exam-timer')).toHaveText(/^\+00:0\d$/);
});
