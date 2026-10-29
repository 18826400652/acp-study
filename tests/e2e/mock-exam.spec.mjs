import { test, expect } from '@playwright/test';
import {
  currentQid, expectNoHorizontalOverflow, serveMockPool,
} from './helpers.mjs';

test.use({ serviceWorkers: 'block' });

test('mock exam uses the mock bank, avoids the previous paper and feeds the wrong book', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await serveMockPool(page);
  const res = await page.request.get('data/questions/rag.json');
  const practiceCount = (await res.json()).length;

  await page.goto('./#/exam');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  await expect(page.locator('.exam-timer')).toBeVisible();
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft.questionIds);
  expect(first.length).toBe(75);
  expect(first.every((id) => /-m\d{3}$/.test(id))).toBe(true);

  await page.getByRole('button', { name: '答题卡' }).click();
  await expect(page.locator('.sheet-cell')).toHaveCount(75);
  await page.locator('.sheet').getByRole('button', { name: '交卷' }).click();
  await expect(page).toHaveURL(/#\/exam\/result\/\d+$/);

  const wrong = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('acp-progress-v1')).wrong));
  expect(wrong.some((id) => /-m\d{3}$/.test(id))).toBe(true);
  await page.goto('./#/wrong');
  await expect(page.locator('.review-list > li').first()).toBeVisible();

  await page.getByRole('link', { name: /只刷错题/ }).click();
  await expect(page.locator('.crumb')).toHaveText(/^错题练习 · 1\/\d+$/);
  expect(await currentQid(page)).toMatch(/-m\d{3}$/);

  await page.goto('./#/exam');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  const second = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft.questionIds);
  expect(second.length).toBe(75);
  expect(second.filter((id) => first.includes(id))).toEqual([]);

  await page.goto('./#/practice/rag');
  await expect(page.locator('.crumb')).toHaveText(new RegExp(` · 1/${practiceCount}$`));
  await expectNoHorizontalOverflow(page);
});

test('a missing mock file only shrinks that domain and leaves practice untouched', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', (d) => { dialogs.push(d.message()); return d.accept(); });
  await serveMockPool(page);
  // 模拟题库 rag 文件损坏：只丢 rag 的 30 道，其余 120 道照常可用
  await page.route('**/data/mock/rag.json', (route) => route.fulfill({ status: 500, body: 'server error' }));

  await page.goto('./#/exam');
  await expect(page.locator('.rules')).toContainText('每次从 120 道模拟题中最多抽 75 道');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  await expect(page.locator('.exam-timer')).toBeVisible();
  expect(dialogs.some((m) => m.includes('题库尚未补全') && m.includes('60 题'))).toBe(true);

  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft.questionIds);
  expect(ids.length).toBe(60);
  expect(ids.every((id) => /-m\d{3}$/.test(id))).toBe(true);
  expect(ids.some((id) => id.startsWith('rag-m'))).toBe(false);

  await page.goto('./#/practice/rag');
  await expect(page.locator('.crumb')).toHaveText(/ · 1\/60$/);
  await expectNoHorizontalOverflow(page);
});
