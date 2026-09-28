import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, expectTabbarVisible, snap } from './helpers.mjs';
import { serveEnvelope, unlock, IV_PASSWORD, FIXTURE_PAYLOAD } from './iv-helpers.mjs';
import { encryptPayload } from '../../js/crypto.js';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await serveEnvelope(page); });

test('switching banks asks for the password and rejects a wrong one', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('.bank-tab[aria-current="page"]')).toHaveText('ACP 认证');
  await page.getByRole('link', { name: 'Agent 面试' }).click();
  await expect(page).toHaveURL(/#\/iv$/);
  await page.locator('#iv-password').fill('wrong-password-000');
  await page.getByRole('button', { name: '解锁' }).click();
  await expect(page.getByRole('alert')).toHaveText('密码不对');
  await expect(page.getByRole('button', { name: '解锁' })).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await expectTabbarVisible(page);
  await snap(page, testInfo, 'iv-unlock');
});

test('unlocking shows the interview home, relabels tabs and survives a reload', async ({ page }, testInfo) => {
  await unlock(page);
  await expect(page.locator('#title')).toHaveText('面试备考');
  await expect(page.locator('.tab[data-tab="exam"]')).toHaveAttribute('href', '#/iv/mock');
  await expect(page.locator('.tab[data-tab="exam"] span')).toHaveText('模拟面试');
  await expect(page.locator('.recommend')).toContainText('示例类别甲');
  await expect(page.locator('#settings-link')).toHaveAttribute('href', '#/iv/settings');
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-home');
  await page.reload();
  await expect(page.locator('.domain-row')).toHaveCount(2);
  await expect(page.locator('#iv-password')).toHaveCount(0);
});

test('the app reopens in the bank used last time', async ({ page }) => {
  await unlock(page);
  await page.goto('./');
  await expect(page).toHaveURL(/#\/iv$/);
  await page.getByRole('link', { name: 'ACP 认证' }).click();
  await expect(page.locator('.domain-row')).toHaveCount(6);
  await page.goto('./');
  await expect(page.locator('.domain-row')).toHaveCount(6);
  await expect(page).not.toHaveURL(/#\/iv/);
});

test('a rebuilt bank with a new salt asks for the password again', async ({ page }) => {
  await unlock(page);
  await serveEnvelope(page, encryptPayload(FIXTURE_PAYLOAD, IV_PASSWORD, { iter: 1000 }));
  await page.reload();
  await expect(page.locator('#iv-password')).toBeVisible();
  await page.locator('#iv-password').fill(IV_PASSWORD);
  await page.getByRole('button', { name: '解锁' }).click();
  await expect(page.locator('.domain-row')).toHaveCount(2);
});

test('a missing bank file explains itself and offers a way back', async ({ page }) => {
  await page.unroute('**/data/interview.enc');
  await page.route('**/data/interview.enc', (route) => route.fulfill({ status: 404, body: 'Not found' }));
  await page.goto('./#/iv');
  await expect(page.locator('.empty')).toContainText('面试题库还没有生成');
  await page.getByRole('link', { name: '回到 ACP 题库' }).click();
  await expect(page.locator('.domain-row')).toHaveCount(6);
});

test('locking returns to the password page and leaves ACP progress untouched', async ({ page }) => {
  await page.goto('./#/learn/rag');
  await page.getByRole('button', { name: '已掌握' }).click();
  const before = await page.evaluate(() => localStorage.getItem('acp-progress-v1'));
  await unlock(page);
  await page.locator('#settings-link').click();
  await expect(page).toHaveURL(/#\/iv\/settings$/);
  await expect(page.locator('#exam-date')).toHaveCount(0);
  await page.getByRole('button', { name: '锁定面试题库' }).click();
  await expect(page).toHaveURL(/#\/iv$/);
  await expect(page.locator('#iv-password')).toBeVisible();
  await page.reload();
  await expect(page.locator('#iv-password')).toBeVisible();
  await page.getByRole('link', { name: 'ACP 认证' }).click();
  await expect(page.locator('.domain-row')).toHaveCount(6);
  expect(await page.evaluate(() => localStorage.getItem('acp-progress-v1'))).toBe(before);
});
