import { expect } from '@playwright/test';

export async function expectNoHorizontalOverflow(page) {
  const overflowing = await page.evaluate(() => [document.documentElement, document.body, document.querySelector('.view')]
    .filter(Boolean)
    .some((el) => el.scrollWidth > el.clientWidth + 1));
  expect(overflowing).toBe(false);
}

export async function expectTabbarVisible(page) {
  const box = await page.locator('.tabbar').boundingBox();
  const vp = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
  expect(box.y).toBeGreaterThan(vp.height / 2);
}

export async function snap(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
}

export async function loadQuestions(page, domain) {
  const res = await page.request.get(`data/questions/${domain}.json`);
  expect(res.ok()).toBe(true);
  return res.json();
}

export function wrongChoice(question) {
  const idx = question.options.findIndex((_, i) => question.answer.indexOf(i) === -1);
  return [idx];
}

// 练习时选项会打乱，按原题的选项序号（data-opt）点击
export async function choose(page, indexes) {
  for (const i of indexes) await page.locator(`.question .option[data-opt="${i}"]`).click();
}

// 当前显示顺序：第 k 个位置对应原题第几个选项
export async function shownOrder(page) {
  await expect(page.locator('.question .option').first()).toBeVisible();
  const opts = await page.locator('.question .option').evaluateAll((els) => els.map((el) => el.dataset.opt));
  return opts.map(Number);
}

export async function currentQid(page) {
  return page.locator('.question').first().getAttribute('data-qid');
}
