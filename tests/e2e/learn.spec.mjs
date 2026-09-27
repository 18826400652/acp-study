import { test, expect } from '@playwright/test';
import {
  expectNoHorizontalOverflow, snap, loadQuestions, wrongChoice, choose, currentQid,
} from './helpers.mjs';

test('cards: swipe and buttons move between cards; marking advances', async ({ page }, testInfo) => {
  await page.goto('./#/learn');
  await page.locator('.domain-link[href="#/learn/rag"]').click();
  await expect(page.locator('.crumb')).toContainText('1/3');

  const box = await page.locator('.flashcard').boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.85, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.15, y, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.crumb')).toContainText('2/3');

  await page.getByRole('button', { name: '上一张' }).click();
  await expect(page.locator('.crumb')).toContainText('1/3');
  await page.getByRole('button', { name: '已掌握' }).click();
  await expect(page.locator('.crumb')).toContainText('2/3');
  await page.getByRole('button', { name: '上一张' }).click();
  await expect(page.locator('.flashcard-state')).toHaveText('已掌握');
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'cards');
});

test('practice: a wrong answer shows the correct one and the explanation', async ({ page }, testInfo) => {
  await page.goto('./#/learn/rag');
  await page.getByRole('link', { name: /开始练习/ }).click();
  await expect(page).toHaveURL(/#\/practice\/rag$/);

  const qid = await currentQid(page);
  const q = (await loadQuestions(page, 'rag')).filter((x) => x.id === qid)[0];
  await expect(page.getByRole('button', { name: '提交答案' })).toBeDisabled();
  await choose(page, wrongChoice(q));
  await page.getByRole('button', { name: '提交答案' }).click();

  await expect(page.locator('.feedback-verdict')).toContainText('回答错误');
  await expect(page.locator('.explanation')).toHaveText(q.explanation);
  await expect(page.locator('.option.is-wrong')).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'practice-feedback');

  await page.getByRole('button', { name: '下一题' }).click();
  await expect(page.locator('.question')).not.toHaveAttribute('data-qid', qid);

  await page.goBack();
  await expect(page).toHaveURL(/#\/learn\/rag$/);
});

test('practice: multi-choice toggles options on and off', async ({ page }) => {
  const q = (await loadQuestions(page, 'rag')).filter((x) => x.type === 'multi')[0];
  await page.goto('./#/practice/rag');
  for (let i = 0; i < 5 && (await currentQid(page)) !== q.id; i += 1) {
    await choose(page, [0]);
    await page.getByRole('button', { name: '提交答案' }).click();
    await page.getByRole('button', { name: '下一题' }).click();
  }
  await expect(page.locator('.question')).toHaveAttribute('data-qid', q.id);
  await choose(page, [0, 1]);
  await expect(page.locator('.option[aria-checked="true"]')).toHaveCount(2);
  await choose(page, [1]);
  await expect(page.locator('.option[aria-checked="true"]')).toHaveCount(1);
});
