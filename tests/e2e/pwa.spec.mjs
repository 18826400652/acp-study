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
