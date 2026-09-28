import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap } from './helpers.mjs';
import { serveEnvelope, unlock } from './iv-helpers.mjs';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await serveEnvelope(page);
  await unlock(page);
});

test('learn index lists both categories with card counts', async ({ page }) => {
  await page.locator('.tab[data-tab="learn"]').click();
  await expect(page).toHaveURL(/#\/iv\/learn$/);
  await expect(page.locator('.domain-row')).toHaveCount(2);
  await expect(page.locator('.domain-row').first()).toContainText('会 0/3');
});

test('a card reveals its answer, shows todo marks and records a grade', async ({ page }, testInfo) => {
  await page.goto('./#/iv/learn/iv-a');
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/3');
  await expect(page.locator('.iv-part')).toHaveCount(0);
  await page.getByRole('button', { name: '看答案' }).click();
  await expect(page.locator('.iv-part')).toHaveCount(4);
  await expect(page.locator('.iv-part').first()).toHaveAttribute('open', '');
  await expect(page.locator('mark.todo')).toHaveText('【待补：补一个真实例子】');
  await expect(page.locator('.iv-card .chip-warn')).toHaveText('有待补');
  await page.locator('.iv-part summary', { hasText: '项目做法' }).click();
  await expect(page.locator('.iv-part-body code').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-card-revealed');
  await page.getByRole('button', { name: '不会', exact: true }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 2/3');
  await expect(page.getByRole('button', { name: '看答案' })).toBeVisible();
});

test('the weak filter shows only fuzzy and unknown cards and is linked from home', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-a');
  await page.getByRole('button', { name: '看答案' }).click();
  await page.getByRole('button', { name: '模糊', exact: true }).click();
  await page.getByRole('button', { name: /只看模糊 \+ 不会 1/ }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/1');
  await expect(page.locator('.flashcard-state')).toHaveText('模糊');
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.recommend')).toContainText('复习：示例类别甲');
  await page.locator('.recommend').click();
  await expect(page).toHaveURL(/#\/iv\/learn\/iv-a\/weak$/);
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/1');
});

test('the weak queue re-syncs after grading instead of showing a stale card', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-a');
  await page.getByRole('button', { name: '看答案' }).click();
  await page.getByRole('button', { name: '模糊', exact: true }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 2/3');
  await page.getByRole('button', { name: '看答案' }).click();
  await page.getByRole('button', { name: '模糊', exact: true }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 3/3');

  await page.getByRole('button', { name: /只看模糊 \+ 不会 2/ }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/2');

  await page.getByRole('button', { name: '看答案' }).click();
  await page.getByRole('button', { name: '会', exact: true }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/1');
  await expect(page.getByRole('button', { name: /只看模糊 \+ 不会 1/ })).toBeVisible();

  await page.getByRole('button', { name: '看答案' }).click();
  await page.getByRole('button', { name: '会', exact: true }).click();
  await expect(page.locator('.empty')).toContainText('没有模糊或不会的卡片。');
});

test('swipe and pager move between cards; no practice link without questions', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-b');
  const box = await page.locator('.flashcard').boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.85, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.15, y, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.crumb')).toHaveText('示例类别乙 · 2/3');
  await page.getByRole('button', { name: '‹ 上一张' }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别乙 · 1/3');
  await expect(page.getByRole('link', { name: /开始练习/ })).toHaveCount(0);
  await expect(page.locator('.iv-intro')).toHaveCount(0);
});

test('an unknown category shows a way back', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-z');
  await expect(page.locator('.empty')).toContainText('没有找到这个类别');
});
