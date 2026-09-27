import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, expectTabbarVisible, snap } from './helpers.mjs';

test('home shows six domains, recommendation and a visible tab bar', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('.domain-row')).toHaveCount(6);
  await expect(page.locator('.recommend')).toBeVisible();
  await expect(page.locator('.hero')).toContainText('还没设置考试日期');
  await expect(page.locator('.tab[aria-current="page"]')).toHaveAttribute('data-tab', 'home');
  await expectTabbarVisible(page);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'home');
});

test('tabs change the route, highlight, and back button returns', async ({ page }) => {
  await page.goto('./');
  await page.locator('.tab[data-tab="wrong"]').click();
  await expect(page).toHaveURL(/#\/wrong$/);
  await expect(page.locator('.tab[data-tab="wrong"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#settings-link')).toBeHidden();
  await page.goBack();
  await expect(page.locator('.tab[data-tab="home"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#settings-link')).toBeVisible();
});
