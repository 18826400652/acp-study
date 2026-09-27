import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, expectTabbarVisible, snap } from './helpers.mjs';

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
  let asked = 0;
  acceptStartDialogs(page, (d) => { asked += 1; return d.dismiss(); });
  await startExam(page);
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page).toHaveURL(/#\/exam$/);
  await expect(page.locator('.exam-timer')).toBeVisible();
  expect(asked).toBe(1);
});

test('reloading mid-exam keeps the answers and the clock', async ({ page }) => {
  acceptStartDialogs(page, (d) => d.accept());
  await startExam(page);
  await page.locator('.question .option').first().click();
  await page.reload();
  await expect(page.locator('.exam-timer')).toHaveText(/^1[12]\d:\d{2}$/);
  await page.getByRole('button', { name: '答题卡' }).click();
  await expect(page.locator('.sheet-cell.is-answered')).toHaveCount(1);
});
