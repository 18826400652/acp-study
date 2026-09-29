import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap } from './helpers.mjs';
import { serveEnvelope, unlock } from './iv-helpers.mjs';

async function nextCard(page, times) {
  for (let i = 0; i < times; i += 1) await page.getByRole('button', { name: '下一张 ›' }).click();
}

test('ACP cards reopen at the last card viewed, per domain', async ({ page }, testInfo) => {
  await page.goto('./#/learn/rag');
  await expect(page.locator('.crumb')).toHaveText(/ · 1\/\d+$/);
  await expect(page.getByRole('button', { name: '从第 1 张开始' })).toHaveCount(0);
  await nextCard(page, 2);
  await expect(page.locator('.crumb')).toHaveText(/ · 3\/\d+$/);
  await page.locator('.tab[data-tab="learn"]').click();
  await page.locator('.domain-link[href="#/learn/prompt"]').click();
  await expect(page.locator('.crumb')).toHaveText(/ · 1\/\d+$/);
  await page.goBack();
  await page.locator('.domain-link[href="#/learn/rag"]').click();
  await expect(page.locator('.crumb')).toHaveText(/ · 3\/\d+$/);
  await page.getByRole('button', { name: '已掌握' }).click();
  await page.reload();
  await expect(page.locator('.crumb')).toHaveText(/ · 4\/\d+$/);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'card-resume');
  await page.getByRole('button', { name: '从第 1 张开始' }).click();
  await expect(page.locator('.crumb')).toHaveText(/ · 1\/\d+$/);
  await expect(page.getByRole('button', { name: '从第 1 张开始' })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.crumb')).toHaveText(/ · 1\/\d+$/);
});

test.describe('interview bank', () => {
  test.use({ serviceWorkers: 'block' });
  test.beforeEach(async ({ page }) => {
    await serveEnvelope(page);
    await unlock(page);
  });

  test('interview cards resume in "all" mode; the weak filter starts at its first card', async ({ page }) => {
    await page.goto('./#/iv/learn/iv-a');
    await page.getByRole('button', { name: '看答案' }).click();
    await page.getByRole('button', { name: '模糊', exact: true }).click();
    await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 2/3');
    await nextCard(page, 1);
    await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 3/3');
    await page.reload();
    await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 3/3');
    await page.getByRole('button', { name: /只看模糊 \+ 不会/ }).click();
    await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/1');
    await page.getByRole('button', { name: /^全部/ }).click();
    await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 3/3');
    await page.goto('./#/iv/learn/iv-b');
    await expect(page.locator('.crumb')).toHaveText('示例类别乙 · 1/3');
    await page.goto('./#/iv/learn/iv-a/weak');
    await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/1');
    await expect(page.getByRole('button', { name: '从第 1 张开始' })).toHaveCount(0);
    await page.goto('./#/iv/learn/iv-a');
    await page.getByRole('button', { name: '从第 1 张开始' }).click();
    await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/3');
    await expectNoHorizontalOverflow(page);
  });
});
