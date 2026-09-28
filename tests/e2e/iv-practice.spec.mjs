import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap, choose, currentQid, wrongChoice } from './helpers.mjs';
import { serveEnvelope, unlock, FIXTURE_PAYLOAD } from './iv-helpers.mjs';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await serveEnvelope(page);
  await unlock(page);
});

const questionById = (id) => FIXTURE_PAYLOAD.questions['iv-a'].filter((q) => q.id === id)[0];

test('practising interview MCQs feeds the interview wrong book only', async ({ page }, testInfo) => {
  await page.goto('./#/iv/learn/iv-a');
  await page.getByRole('link', { name: '开始练习（4 题）' }).click();
  await expect(page).toHaveURL(/#\/iv\/practice\/iv-a$/);
  const qid = await currentQid(page);
  await choose(page, wrongChoice(questionById(qid)));
  await page.getByRole('button', { name: '提交答案' }).click();
  await expect(page.locator('.feedback-verdict')).toContainText('回答错误');
  await expect(page.locator('.question .source')).toHaveText(/^出处：A\d\. /);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-practice');
  await page.locator('.tab[data-tab="wrong"]').click();
  await expect(page).toHaveURL(/#\/iv\/wrong$/);
  await expect(page.locator('.review-list > li')).toHaveCount(1);
  await expect(page.locator('.chip-filter').nth(1)).toHaveText('A 类 1');
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.recommend')).toContainText('复习选择题错题（1 道）');
  await expect(page.locator('.domain-row').first()).toContainText('选择题正确率 0%');
  await page.getByRole('link', { name: 'ACP 认证' }).click();
  await page.locator('.tab[data-tab="wrong"]').click();
  await expect(page.locator('.empty')).toContainText('错题本是空的');
});

test('a category without questions still offers no practice link', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-b');
  await expect(page.getByRole('link', { name: /开始练习/ })).toHaveCount(0);
});
