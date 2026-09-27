import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap, loadQuestions, wrongChoice, choose, currentQid } from './helpers.mjs';

async function answerFirstWrong(page, domain) {
  await page.goto(`./#/practice/${domain}`);
  const qid = await currentQid(page);
  const q = (await loadQuestions(page, domain)).filter((x) => x.id === qid)[0];
  await choose(page, wrongChoice(q));
  await page.getByRole('button', { name: '提交答案' }).click();
  return q;
}

test('wrong book lists a wrong answer and clears it after two correct reviews', async ({ page }, testInfo) => {
  const q = await answerFirstWrong(page, 'prompt');
  await page.goto('./#/wrong');
  await expect(page.locator('.review-list > li')).toHaveCount(1);
  await expect(page.locator('.chip-filter[aria-pressed="true"]')).toContainText('全部 1');
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'wrong');

  for (let round = 0; round < 2; round += 1) {
    await page.goto('./#/wrong');
    await page.getByRole('link', { name: /只刷错题/ }).click();
    await choose(page, q.answer);
    await page.getByRole('button', { name: '提交答案' }).click();
    await expect(page.locator('.feedback-verdict')).toHaveText('回答正确');
  }
  await page.goto('./#/wrong');
  await expect(page.locator('.empty')).toContainText('错题本是空的');
});

test('exam date set in settings drives the home countdown', async ({ page }, testInfo) => {
  const d = new Date();
  d.setDate(d.getDate() + 10);
  const p2 = (n) => String(n).padStart(2, '0');
  const iso = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  await page.goto('./#/settings');
  await page.locator('#exam-date').fill(iso);
  await expect(page.locator('.settings-status')).toHaveText('考试日期已保存');
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'settings');
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.hero-number')).toContainText('10');
});

test('export, clear, reject a bad file, then import restores progress', async ({ page }, testInfo) => {
  page.on('dialog', (dlg) => dlg.accept());
  await answerFirstWrong(page, 'rag');
  await page.goto('./#/settings');
  await page.locator('#exam-date').fill('2026-12-20');
  await expect(page.locator('.settings-status')).toHaveText('考试日期已保存');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '导出进度' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^acp-progress-\d{8}\.json$/);
  const file = testInfo.outputPath('progress.json');
  await download.saveAs(file);

  await page.getByRole('button', { name: '清空全部进度' }).click();
  await expect(page.locator('.settings-status')).toHaveText('已清空全部进度');
  await expect(page.locator('#exam-date')).toHaveValue('');
  await page.goto('./#/wrong');
  await expect(page.locator('.empty')).toBeVisible();

  await page.goto('./#/settings');
  await page.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":99}') });
  await expect(page.locator('.settings-status')).toContainText('导入失败');
  await page.locator('#import-file').setInputFiles(file);
  await expect(page.locator('.settings-status')).toHaveText('导入成功');
  await expect(page.locator('#exam-date')).toHaveValue('2026-12-20');
  await page.goto('./#/wrong');
  await expect(page.locator('.review-list > li')).toHaveCount(1);
});
