import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap } from './helpers.mjs';

const TEN = '十个字的流程步骤名称';
const FULL = {
  plain: '大白话讲解内容',
  analogy: '打个比方的内容',
  exam: '考法提示内容',
  confuse: '易混点内容',
  flow: [[TEN, TEN, TEN, TEN, TEN, TEN], [TEN, TEN, TEN, TEN, TEN, TEN], [TEN, TEN, TEN, TEN, TEN, TEN]],
};
const MINIMAL = { plain: '第二张的大白话', exam: '第二张的考法' };

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await page.route('**/data/cards/rag.json', async (route) => {
    const res = await route.fetch();
    const list = await res.json();
    list[0] = { ...list[0], explain: FULL };
    list[1] = { ...list[1], explain: MINIMAL };
    await route.fulfill({ response: res, json: list });
  });
});

test('the explanation opens and closes, and shows every section', async ({ page }, testInfo) => {
  await page.goto('./#/learn/rag');
  const toggle = page.getByRole('button', { name: '看讲解 ▾' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.explain-body')).toBeHidden();
  await toggle.click();
  await expect(page.getByRole('button', { name: '收起讲解 ▴' })).toHaveAttribute('aria-expanded', 'true');
  for (const label of ['大白话', '打个比方', '考法', '易混点']) {
    await expect(page.locator('.explain-label', { hasText: label })).toBeVisible();
  }
  await expect(page.locator('.flow')).toHaveAttribute('aria-label', /^流程图：十个字/);
  await expect(page.locator('.flow-lane')).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'explain-flow');
  await page.getByRole('button', { name: '收起讲解 ▴' }).click();
  await expect(page.locator('.explain-body')).toBeHidden();
});

test('moving to another card collapses the explanation and hides missing sections', async ({ page }) => {
  await page.goto('./#/learn/rag');
  await page.getByRole('button', { name: '看讲解 ▾' }).click();
  await page.getByRole('button', { name: '下一张 ›' }).click();
  await expect(page.locator('.explain-body')).toBeHidden();
  await page.getByRole('button', { name: '看讲解 ▾' }).click();
  await expect(page.locator('.explain-body')).toContainText('第二张的大白话');
  await expect(page.locator('.explain-label', { hasText: '打个比方' })).toHaveCount(0);
  await expect(page.locator('.flow')).toHaveCount(0);
});

test('a card without an explanation shows no toggle', async ({ page }) => {
  await page.goto('./#/learn/rag');
  await page.getByRole('button', { name: '下一张 ›' }).click();
  await page.getByRole('button', { name: '下一张 ›' }).click();
  await expect(page.locator('.crumb')).toHaveText(/ · 3\/\d+$/);
  const res = await page.request.get('data/cards/rag.json');
  const third = (await res.json())[2];
  await expect(page.locator('.explain-toggle')).toHaveCount(third.explain ? 1 : 0);
});
