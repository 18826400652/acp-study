import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap } from './helpers.mjs';

test('knowledge map opens from the learn list and the cards page', async ({ page }) => {
  await page.goto('./#/learn');
  await page.locator('.map-link[href="#/map/rag"]').click();
  await expect(page.locator('.crumb')).toHaveText(/^大模型检索增强 · 已掌握 0\/\d+$/);
  await page.goto('./#/learn/rag');
  await page.getByRole('link', { name: '知识地图' }).click();
  await expect(page).toHaveURL(/#\/map\/rag$/);
});

test('tapping a card node opens that card and the position survives a reload', async ({ page }, testInfo) => {
  const res = await page.request.get('data/cards/rag.json');
  const cards = await res.json();
  const target = cards[2];
  await page.goto('./#/map/rag');
  await expect(page.locator('.map-tree details').first()).toHaveAttribute('open', '');
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'map');
  await page.locator(`.map-card[data-card="${target.id}"]`).first().click();
  await expect(page).toHaveURL(/#\/learn\/rag$/);
  await expect(page.locator('.flashcard-title')).toHaveText(target.title);
  await expect(page.locator('.crumb')).toHaveText(/ · 3\/\d+$/);
  await page.reload();
  await expect(page.locator('.crumb')).toHaveText(/ · 3\/\d+$/);
});

test('mastered cards are marked on the map and counted', async ({ page }) => {
  await page.goto('./#/learn/rag');
  const first = await page.locator('.flashcard-title').textContent();
  await page.getByRole('button', { name: '已掌握' }).click();
  await page.goto('./#/map/rag');
  await expect(page.locator('.crumb')).toHaveText(/已掌握 1\/\d+$/);
  const node = page.locator('.map-card').filter({ hasText: first }).first();
  await expect(node.locator('.chip')).toHaveText('已掌握');
});

test('branches collapse and expand', async ({ page }) => {
  await page.goto('./#/map/rag');
  const branch = page.locator('.map-tree > .map-branch > details').first();
  await expect(branch).toHaveAttribute('open', '');
  await branch.locator('summary').first().click();
  await expect(branch).not.toHaveAttribute('open', '');
  await branch.locator('summary').first().click();
  await expect(branch).toHaveAttribute('open', '');
});

test('an unknown domain shows an empty state', async ({ page }) => {
  await page.goto('./#/map/nope');
  await expect(page.locator('.empty')).toContainText('没有找到这个考点的知识地图');
});
