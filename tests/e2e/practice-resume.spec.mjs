import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap, loadQuestions, choose, currentQid, shownOrder } from './helpers.mjs';
import { serveEnvelope, unlock, FIXTURE_PAYLOAD } from './iv-helpers.mjs';

const RESET = '从第 1 题开始';

async function answerCorrectly(page, bank) {
  const qid = await currentQid(page);
  const q = bank.filter((x) => x.id === qid)[0];
  await choose(page, q.answer);
  await page.getByRole('button', { name: '提交答案' }).click();
  await expect(page.locator('.feedback-verdict')).toHaveText('回答正确');
  return q;
}

async function answerAndNext(page, bank) {
  await answerCorrectly(page, bank);
  await page.getByRole('button', { name: '下一题' }).click();
}

test('ACP practice follows bank order and resumes where you left off', async ({ page }, testInfo) => {
  const bank = await loadQuestions(page, 'rag');
  await page.goto('./#/practice/rag');
  await expect(page.locator('.crumb')).toHaveText(new RegExp(` · 1/${bank.length}$`));
  expect(await currentQid(page)).toBe(bank[0].id);
  await expect(page.getByRole('button', { name: RESET })).toHaveCount(0);

  await answerAndNext(page, bank);
  expect(await currentQid(page)).toBe(bank[1].id);
  // 交卷后不点「下一题」直接离开，也算做完这题
  await answerCorrectly(page, bank);
  await page.goto('./#/learn/rag');
  await page.goto('./#/practice/rag');
  await expect(page.locator('.crumb')).toHaveText(new RegExp(` · 3/${bank.length}$`));
  expect(await currentQid(page)).toBe(bank[2].id);

  await page.reload();
  await expect(page.locator('.crumb')).toHaveText(new RegExp(` · 3/${bank.length}$`));
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'practice-resume');

  await page.goto('./#/practice/prompt');
  await expect(page.locator('.crumb')).toHaveText(/ · 1\/\d+$/);

  await page.goto('./#/practice/rag');
  await page.getByRole('button', { name: RESET }).click();
  await expect(page.locator('.crumb')).toHaveText(new RegExp(` · 1/${bank.length}$`));
  await expect(page.getByRole('button', { name: RESET })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.crumb')).toHaveText(new RegExp(` · 1/${bank.length}$`));
});

test('options are shuffled each time and still graded against the right answer', async ({ page }) => {
  const bank = await loadQuestions(page, 'rag');
  await page.goto('./#/practice/rag');
  const orders = new Set();
  for (let i = 0; i < 8; i += 1) {
    await page.reload();
    const order = await shownOrder(page);
    expect([...order].sort()).toEqual(bank[0].options.map((_, k) => k));
    orders.add(order.join());
  }
  expect(orders.size).toBeGreaterThan(1);
  await answerCorrectly(page, bank);
  const letters = await page.locator('.question .option.is-correct .option-letter').allTextContents();
  const order = await shownOrder(page);
  expect(letters).toEqual(bank[0].answer.map((i) => 'ABCDEF'[order.indexOf(i)]).sort());
});

test.describe('interview practice', () => {
  test.use({ serviceWorkers: 'block' });
  test.beforeEach(async ({ page }) => {
    await serveEnvelope(page);
    await unlock(page);
  });

  test('finishing a round clears the saved position', async ({ page }) => {
    const bank = FIXTURE_PAYLOAD.questions['iv-a'];
    await page.goto('./#/iv/practice/iv-a');
    await answerAndNext(page, bank);
    await page.goto('./#/iv/learn/iv-a');
    await page.goto('./#/iv/practice/iv-a');
    await expect(page.locator('.crumb')).toHaveText(`示例类别甲 · 2/${bank.length}`);
    for (let i = 1; i < bank.length; i += 1) await answerAndNext(page, bank);
    await expect(page.locator('.summary-score')).toHaveText(`${bank.length - 1}/${bank.length - 1}`);
    await expect(page.locator('.summary')).toContainText('本次答对题数');
    await page.goto('./#/iv/learn/iv-a');
    await page.goto('./#/iv/practice/iv-a');
    await expect(page.locator('.crumb')).toHaveText(`示例类别甲 · 1/${bank.length}`);
  });
});

test('wrong-book practice starts from the first wrong question with no reset button', async ({ page }) => {
  const bank = await loadQuestions(page, 'rag');
  await page.goto('./#/practice/rag');
  for (let i = 0; i < 2; i += 1) {
    const q = bank[i];
    const wrong = q.options.findIndex((_, k) => q.answer.indexOf(k) === -1);
    await choose(page, [wrong]);
    await page.getByRole('button', { name: '提交答案' }).click();
    await page.getByRole('button', { name: '下一题' }).click();
  }
  await page.goto('./#/wrong/practice');
  await expect(page.locator('.crumb')).toHaveText('错题练习 · 1/2');
  expect(await currentQid(page)).toBe(bank[0].id);
  await answerAndNext(page, bank);
  await expect(page.getByRole('button', { name: RESET })).toHaveCount(0);
  await page.goto('./#/wrong');
  await page.goto('./#/wrong/practice');
  await expect(page.locator('.crumb')).toHaveText('错题练习 · 1/2');
});
