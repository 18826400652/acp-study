import { expect } from '@playwright/test';

export async function expectNoHorizontalOverflow(page) {
  const overflowing = await page.evaluate(() => [document.documentElement, document.body, document.querySelector('.view')]
    .filter(Boolean)
    .some((el) => el.scrollWidth > el.clientWidth + 1));
  expect(overflowing).toBe(false);
}

export async function expectTabbarVisible(page) {
  const box = await page.locator('.tabbar').boundingBox();
  const vp = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
  expect(box.y).toBeGreaterThan(vp.height / 2);
}

export async function snap(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
}

export async function loadQuestions(page, domain) {
  const res = await page.request.get(`data/questions/${domain}.json`);
  expect(res.ok()).toBe(true);
  return res.json();
}

export function wrongChoice(question) {
  const idx = question.options.findIndex((_, i) => question.answer.indexOf(i) === -1);
  return [idx];
}

// 练习时选项会打乱，按原题的选项序号（data-opt）点击
export async function choose(page, indexes) {
  for (const i of indexes) await page.locator(`.question .option[data-opt="${i}"]`).click();
}

// 当前显示顺序：第 k 个位置对应原题第几个选项
export async function shownOrder(page) {
  await expect(page.locator('.question .option').first()).toBeVisible();
  const opts = await page.locator('.question .option').evaluateAll((els) => els.map((el) => el.dataset.opt));
  return opts.map(Number);
}

export async function currentQid(page) {
  return page.locator('.question').first().getAttribute('data-qid');
}

const MOCK_COUNTS = {
  'app-dev': [18, 8], prompt: [14, 8], rag: [20, 10],
  finetune: [16, 8], 'agent-mm': [16, 8], production: [16, 8],
};

// 注入一套满配额的模拟题库，避免 e2e 依赖真实内容进度
export async function serveMockPool(page) {
  for (const [domain, [singles, multis]] of Object.entries(MOCK_COUNTS)) {
    const list = Array.from({ length: singles + multis }, (_, i) => {
      const type = i < singles ? 'single' : 'multi';
      const n = i + 1;
      return {
        id: `${domain}-m${String(n).padStart(3, '0')}`,
        domain,
        type,
        stem: `模拟题 ${n}：场景问题？`,
        options: ['做甲', '做乙', '做丙', '做丁'],
        answer: type === 'single' ? [n % 4] : (i % 5 === 0 ? [0, 1, 2] : [0, 1]),
        explanation: '正确项因为符合场景约束；其余选项分别错在扩大范围、增加成本或改变数据。',
        source: '2_5_优化RAG应用提升问答准确度',
      };
    });
    await page.route(`**/data/mock/${domain}.json`, (route) => route.fulfill({ json: list }));
  }
}
