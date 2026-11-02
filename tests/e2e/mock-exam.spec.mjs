import { test, expect } from '@playwright/test';
import {
  currentQid, expectNoHorizontalOverflow, serveMockPool,
} from './helpers.mjs';

test.use({ serviceWorkers: 'block' });

test('the real V4 bank exposes 225 questions and new questions reach results and the wrong book', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await page.addInitScript(() => {
    let seed = 231;
    Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  });
  const domains = await (await page.request.get('data/domains.json')).json();
  const bank = (await Promise.all(domains.map(async (d) => (await page.request.get(`data/mock/${d.id}.json`)).json()))).flat();
  expect(bank).toHaveLength(225);
  const legacySizes = { 'app-dev': 26, prompt: 22, rag: 30, finetune: 24, 'agent-mm': 24, production: 24 };

  await page.goto('./#/exam');
  await expect(page.locator('.rules')).toContainText('每次从 225 道模拟题中最多抽 75 道');
  await expect(page.locator('.alloc-table')).toContainText('智能体应用开发');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft.questionIds);
  const fresh = bank.find((q) => first.includes(q.id) && Number(q.id.slice(-3)) > legacySizes[q.domain]);
  expect(fresh).toBeTruthy();
  await page.getByRole('button', { name: '答题卡' }).click();
  await page.locator('.sheet-cell').nth(first.indexOf(fresh.id)).click();
  await expect(page.locator('.question')).toHaveAttribute('data-qid', fresh.id);
  await expect(page.locator('.question')).toContainText(fresh.stem);
  await expectNoHorizontalOverflow(page);

  // Leave this new question unanswered: it must be graded and enter the wrong book.
  await page.getByRole('button', { name: '答题卡' }).click();
  await page.locator('.sheet').getByRole('button', { name: '交卷' }).click();
  await expect(page).toHaveURL(/#\/exam\/result\/\d+$/);
  const wrong = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).wrong);
  expect(fresh.id in wrong).toBe(true);
  await page.goto('./#/wrong');
  const item = page.locator('.review-list > li').filter({ hasText: fresh.stem });
  await item.locator('summary').click();
  await expect(item).toContainText(fresh.explanation.slice(0, 20));
  await expectNoHorizontalOverflow(page);

  await page.goto('./#/exam');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  const second = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft.questionIds);
  expect(second).toHaveLength(75);
  expect(second.filter((id) => first.includes(id))).toEqual([]);
});

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
