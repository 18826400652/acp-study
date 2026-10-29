import { test, expect } from '@playwright/test';

test('the app still opens offline after the first visit', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.domain-row')).toHaveCount(6);
  await page.goto('./#/learn/rag');
  await expect(page.locator('.flashcard')).toBeVisible();

  // 预缓存的模拟题库也要能在断网后开考
  page.on('dialog', (d) => d.accept());
  await page.goto('./#/exam');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  await expect(page.locator('.exam-timer')).toBeVisible();
  await page.getByRole('button', { name: '答题卡' }).click();
  await expect(page.locator('.sheet-cell')).toHaveCount(75);
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft.questionIds);
  expect(ids.length).toBe(75);
  expect(ids.every((id) => /-m\d{3}$/.test(id))).toBe(true);
});

test('manifest is installable-shaped and all icons are served', async ({ request }) => {
  const res = await request.get('manifest.json');
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.start_url).toBe('./');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
});

test.describe('inside WeChat', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/116 Mobile Safari/537.36 MicroMessenger/8.0.40' });

  test('shows the open-in-browser hint', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#banner-wechat')).toContainText('在浏览器打开');
  });
});
