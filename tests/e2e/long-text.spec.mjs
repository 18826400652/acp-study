import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from './helpers.mjs';

const LONG = 'SentenceWindowNodeParserWithAnExtremelyLongIdentifierName_' + 'x'.repeat(40);

// 用 page.route 给题库和卡片注入超长不可断行的文本，验证各页面在窄屏下不出现横向滚动
test.beforeEach(async ({ page }) => {
  await page.route('**/data/questions/rag.json', async (route) => {
    const res = await route.fetch();
    const list = await res.json();
    list[0] = { ...list[0], stem: `${LONG} 是什么？`, options: list[0].options.map((o, i) => (i === 0 ? LONG : o)) };
    await route.fulfill({ response: res, json: list });
  });
  await page.route('**/data/cards/rag.json', async (route) => {
    const res = await route.fetch();
    const list = await res.json();
    list[0] = { ...list[0], title: LONG, points: [LONG].concat(list[0].points.slice(1)) };
    await route.fulfill({ response: res, json: list });
  });
});

test('long unbreakable text wraps on cards, practice and wrong-book review', async ({ page }) => {
  await page.goto('./#/learn/rag');
  await expect(page.locator('.flashcard-title')).toHaveText(LONG);
  await expectNoHorizontalOverflow(page);

  await page.goto('./#/practice/rag');
  for (let i = 0; i < 80 && !((await page.locator('.q-stem').textContent()) || '').includes(LONG); i += 1) {
    await page.locator('.question .option').first().click();
    await page.getByRole('button', { name: '提交答案' }).click();
    await page.getByRole('button', { name: '下一题' }).click();
  }
  await expect(page.locator('.q-stem')).toContainText(LONG);
  await expectNoHorizontalOverflow(page);
  // 选一个错误选项，让这道题进入错题本
  const wrong = await page.evaluate(async () => {
    const qs = await (await fetch('data/questions/rag.json')).json();
    return qs[0].options.findIndex((_, i) => qs[0].answer.indexOf(i) === -1);
  });
  await page.locator(`.question .option[data-opt="${wrong}"]`).click();
  await page.getByRole('button', { name: '提交答案' }).click();

  await page.goto('./#/wrong');
  await expect(page.locator('.review-stem', { hasText: LONG })).toBeVisible();
  await page.locator('.review-item summary', { hasText: LONG }).click();
  await expectNoHorizontalOverflow(page);
});
