import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, serveMockPool } from './helpers.mjs';

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

  await page.goto('./#/exam');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  const second = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft.questionIds);
  expect(second.length).toBe(75);
  expect(second.filter((id) => first.includes(id))).toEqual([]);

  await page.goto('./#/practice/rag');
  await expect(page.locator('.crumb')).toHaveText(new RegExp(` · 1/${practiceCount}$`));
  await expectNoHorizontalOverflow(page);
});
