import { test, expect } from '@playwright/test';

test('a full bank starts a standard 75-question exam without a shortfall prompt', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', (d) => { dialogs += 1; return d.accept(); });
  await page.goto('./#/exam');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  await expect(page.locator('.exam-progress')).toHaveText('第 1/75 题');
  await page.getByRole('button', { name: '答题卡' }).click();
  await expect(page.locator('.sheet-cell')).toHaveCount(75);
  await expect(page.locator('.sheet .muted')).toHaveText('第 1–50 题单选，第 51–75 题多选');
  expect(dialogs).toBe(0);
});
