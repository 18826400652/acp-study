# 官方风格模拟题库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 150 道官方风格场景题，模拟考每场从这套题抽 75 道并避开上一场，模考错题进错题本；现有 300 道练习题保持不变。

**Architecture:**
- 新增 `data/mock/<domain>.json`，与练习题分开；id 为 `<domain>-mNNN`。
- `loadData()` 同时加载练习题和模拟题，`questionById` 覆盖两套题；练习仍只用练习题。
- `buildExam` 增加 `excludeIds` 和 `reusedCount`；模拟考只从模拟题库抽题。
- 新增 `validateMockData` 校验模拟题库；`sw.js` 预缓存模拟题库。
- 代码完成后先写 12 道样题给用户确认，再按考点补齐剩余 138 道。

**Tech Stack:** 原生 ES 模块 + JSON；Node 26 `node:test`；Playwright（4 个安卓视口）。

**Spec:** `docs/specs/2026-10-29-mock-exam-bank-design.md`

## Global Constraints

**数据：**
- 模拟题库共 150 道：单选 100、多选 50。各考点数量：

  | 考点 | 单选 | 多选 |
  |---|---|---|
  | app-dev | 18 | 8 |
  | prompt | 14 | 8 |
  | rag | 20 | 10 |
  | finetune | 16 | 8 |
  | agent-mm | 16 | 8 |
  | production | 16 | 8 |

- id 格式 `<domain>-mNNN`，每考点从 `m001` 连续编号；发布后不改。
- 每题 4 个选项；单选恰好 1 个答案；多选 2 或 3 个答案。
- `explanation` 必填，至少 20 字，说明正确项为什么对、干扰项错在哪里。
- `source` 用已知章节；可用「、」连接多个章节。已知章节 = 任一考点 `chapters` 中的章节，或 `EXTRA_CHAPTERS`（`5_2_总结与展望`）。
- 现有 `data/questions/*.json`、`data/cards/*.json`、`data/maps/*.json` 一律不改（代码任务除外）。

**内容风格（Task 3–9 适用，审查逐题检查）：**
- 题干公式：「具体角色/业务场景 + 一个明确问题 + 以下哪种做法最合理/最有效/最合适/最稳定？」
- 不出现「按课程」「课程指出」；不照搬官方样题原文。
- 选项是具体可执行的工程动作；干扰项用常见错误做法（换更大模型、调高温度、全量微调、加大上下文窗口、堆更多数据等）。
- 解析先说正确项为什么对，再逐条说干扰项错在哪里。
- 内容必须能在课程笔记中找到依据；数字、参数名、产品名与笔记一致。
- 中文全角标点；英文术语和代码名照原文写。

**工程：**
- 所有命令在 `acp-study-app/` 下执行。笔记在 `../大模型ACP认证教程/`，用 `node scripts/nb-text.mjs <路径> > <系统临时目录文件>` 取正文。
- DOM 只用 `h()`，不引入库，不写 `console.log`（现有 `console.error` 可用于加载失败）。
- 不要推送；推送由用户决定。
- 每次提交都用：`git commit -m "<type>: <desc>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"`

## Review Focus

1. **第二场模考重复上一场的题**：题库是两整卷，排除上一场后每个考点/题型的剩余题应恰好够配额。Task 1 的 e2e 连开两场，断言无交集。
2. **错题本找不到模拟题**：`wrong` 只存 id，模拟题必须能被 `questionById` 和错题本解析。Task 1 的 e2e 在模考后打开错题本，断言能看到模拟题。
3. **模拟题污染练习题**：学习页统计、分考点练习、练习续做都只能看到 300 道练习题。Task 1 的 e2e 断言 RAG 练习仍是 `1/60`。
4. **校验放过题量或答案分布问题**：模拟题库少一道、答案全堆在 A、多选全 2 个答案，都应报错。Task 2 的单元测试逐条覆盖。
5. **内容退回知识复述或事实错误**：每题必须有场景、有具体做法、解析能对上笔记。Task 3–9 的核查子代理逐题检查；Task 3 的 12 道样题先由用户确认风格。

---

### Task 1: 模拟题数据接入与组卷

**Files:**
- Create: `data/mock/app-dev.json`、`prompt.json`、`rag.json`、`finetune.json`、`agent-mm.json`、`production.json`（先写 `[]`）
- Modify: `js/data.js`、`js/exam.js`、`js/views/exam.js`、`js/views/wrong.js`、`sw.js`
- Test: `tests/unit/exam.test.mjs`、`tests/e2e/mock-exam.spec.mjs`、`tests/e2e/helpers.mjs`、`tests/e2e/exam.spec.mjs`、`tests/e2e/full-bank.spec.mjs`

**Interfaces:**
- Produces:
  - `loadData()` 返回新增 `mockQuestions`（数组）和 `allQuestions`（练习题 + 模拟题）；`questionById` 由 `allQuestions` 建立。
  - `buildExam(domains, pool, rng = Math.random, { excludeIds = [] } = {}) → { questionIds, shortfall, reusedCount }`。
  - `tests/e2e/helpers.mjs` 新增 `serveMockPool(page)`：为 6 个考点注入符合真实配额的模拟题 fixture。

- [ ] **Step 1: 写 `buildExam` 排除逻辑的失败单元测试**

在 `tests/unit/exam.test.mjs` 末尾追加：

```js
const allocation = (total) => allocate(W, total);
const fullMockPool = () => DOMAINS.flatMap((d, i) => makeQuestions(
  d.id,
  allocation(50)[i] * 2,
  allocation(25)[i] * 2,
));

test('buildExam: the second paper excludes the first and two papers are complementary', () => {
  const pool = fullMockPool();
  const first = buildExam(DOMAINS, pool, seededRng(11));
  const second = buildExam(DOMAINS, pool, seededRng(12), { excludeIds: first.questionIds });
  assert.equal(second.questionIds.length, 75);
  assert.equal(second.reusedCount, 0);
  assert.deepEqual(second.questionIds.filter((id) => first.questionIds.includes(id)), []);
  const third = buildExam(DOMAINS, pool, seededRng(13), { excludeIds: second.questionIds });
  assert.deepEqual([...third.questionIds].sort(), [...first.questionIds].sort());
});

test('buildExam: falls back to repeated questions when every fresh question is excluded', () => {
  const pool = DOMAINS.flatMap((d, i) => makeQuestions(d.id, allocation(50)[i], allocation(25)[i]));
  const { questionIds, reusedCount } = buildExam(DOMAINS, pool, seededRng(14), {
    excludeIds: pool.map((q) => q.id),
  });
  assert.equal(questionIds.length, 75);
  assert.equal(reusedCount, 75);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `node --test tests/unit/exam.test.mjs`
Expected: FAIL——`buildExam` 忽略第四个参数，`reusedCount` 为 undefined，第二场与第一场有交集。

- [ ] **Step 3: 实现 `buildExam` 的排除逻辑**

在 `js/exam.js` 中把 `buildExam` 签名改为：

```js
export function buildExam(domains, questions, rng = Math.random, { excludeIds = [] } = {}) {
```

抽取每个考点/题型的候选池：先过滤掉 `excludeIds`；如果剩余数量小于配额，改用未过滤的完整池。返回值增加 `reusedCount`：

```js
const questionIds = [].concat(...blocks);
const excluded = new Set(excludeIds);
return { questionIds, shortfall, reusedCount: questionIds.filter((id) => excluded.has(id)).length };
```

保持现有行为：先 50 道单选、再 25 道多选，每个 block 内部打乱；题库不足时仍记录 `shortfall`。

- [ ] **Step 4: 运行单元测试**

Run: `node --test tests/unit/exam.test.mjs`
Expected: PASS，包含新增的两条。

- [ ] **Step 5: 写模拟考 e2e 的失败测试**

在 `tests/e2e/helpers.mjs` 追加：

```js
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
```

新建 `tests/e2e/mock-exam.spec.mjs`：

```js
import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, serveMockPool } from './helpers.mjs';

test.use({ serviceWorkers: 'block' });

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

  await page.goto('./#/exam');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  const second = await page.evaluate(() => JSON.parse(localStorage.getItem('acp-progress-v1')).examDraft.questionIds);
  expect(second.length).toBe(75);
  expect(second.filter((id) => first.includes(id))).toEqual([]);

  await page.goto('./#/practice/rag');
  await expect(page.locator('.crumb')).toHaveText(new RegExp(` · 1/${practiceCount}$`));
  await expectNoHorizontalOverflow(page);
});
```

同时修改现有两个会开考的 e2e：
- `tests/e2e/exam.spec.mjs`：文件顶部加 `test.use({ serviceWorkers: 'block' })`，每个用例开头调用 `await serveMockPool(page)`（import 自 helpers）。
- `tests/e2e/full-bank.spec.mjs`：同样加 `test.use({ serviceWorkers: 'block' })` 并注入 fixture，测试名和断言改为「模拟题库满配额时开考 75 题、不弹补题确认」。

Run: `npx playwright test tests/e2e/mock-exam.spec.mjs --project=android-360-light`
Expected: FAIL——模拟考仍从练习题抽题，第一题的 id 不是 `-m`。

- [ ] **Step 6: 接入模拟题数据**

修改 `js/data.js`：增加 `getMock(domainId)`，单个文件缺失或损坏时 `console.error` 并返回 `[]`（同 `getMap` 的容错方式）。`loadData` 并行加载练习题和模拟题：

```js
const [cardLists, questionLists, mapList, mockList] = await Promise.all([
  Promise.all(domains.map((d) => getJson(`data/cards/${d.id}.json`))),
  Promise.all(domains.map((d) => getJson(`data/questions/${d.id}.json`))),
  Promise.all(domains.map((d) => getMap(d.id))),
  Promise.all(domains.map((d) => getMock(d.id))),
]);
const mockQuestions = [].concat(...mockList);
const allQuestions = questions.concat(mockQuestions);
```

返回 `{ domains, cards, questions, mockQuestions, allQuestions, maps, questionById: new Map(allQuestions.map((q) => [q.id, q])) }`。

修改 `js/views/wrong.js`：`wrongQuestions` 改用 `ctx.data.allQuestions || ctx.data.questions`。面试题库的数据没有 `allQuestions`，回退到它自己的 `questions`，面试错题本不受影响。

修改 `sw.js`：`DATA` 增加 `DOMAINS.map((d) => \`data/mock/${d.id}.json\`)`。

- [ ] **Step 7: 模拟考改用模拟题库**

修改 `js/views/exam.js`：
- 先在模块内取 `const mock = ctx.data.mockQuestions || []`（兼容旧缓存数据）。
- `start()` 改用 `mock`；先取 `progress.exams` 最后一条的 `questionIds` 作为 `excludeIds`。
- `mock` 为空时不开始，`window.alert('模拟题库还没有生成。')`。
- `reusedCount > 0` 时，开始前 `window.confirm(\`本次有 ${reusedCount} 道是上一场做过的题，仍然开始吗？\`)`。
- `intro()` 在规则列表后加一行：`每次从 ${mock.length} 道模拟题中抽 75 道，并避开上一场做过的题。`；模拟题库为空时显示「模拟题库还没有生成」，不显示开始按钮。
- `submitExam()` 不用改，`questionById` 已包含模拟题。

- [ ] **Step 8: 跑代码相关测试**

```bash
node --test tests/unit/exam.test.mjs
npx playwright test tests/e2e/mock-exam.spec.mjs tests/e2e/exam.spec.mjs tests/e2e/full-bank.spec.mjs --project=android-360-light
```

Expected: 全部 PASS。若模拟考仍从练习题抽题，检查 `start()` 是否真的传了 `ctx.data.mockQuestions`。

- [ ] **Step 9: 提交**

```bash
git add data/mock js/data.js js/exam.js js/views/exam.js js/views/wrong.js sw.js tests/unit/exam.test.mjs tests/e2e/mock-exam.spec.mjs tests/e2e/helpers.mjs tests/e2e/exam.spec.mjs tests/e2e/full-bank.spec.mjs
git commit -m "feat: draw mock exams from a separate mock bank" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

---

### Task 2: 模拟题库校验

**Files:**
- Modify: `scripts/validate-lib.mjs`、`scripts/validate-data.mjs`
- Test: `tests/unit/validate-mock.test.mjs`、`tests/unit/validate-lib.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `data/mock/*.json`。
- Produces:
  - `MOCK_TARGETS`：`{ [domainId]: { single, multi } }`，值见 Global Constraints 表。
  - `validateMockData({ domains, mock }, { strictDomains = null, allowPartial = false }) → string[]`。
  - `validate-data.mjs` 同时校验练习题和模拟题；`--domain <id>` 严格检查该考点的模拟题数量，`--allow-partial` 跳过数量检查。

- [ ] **Step 1: 写失败测试**

新建 `tests/unit/validate-mock.test.mjs`。用一个生成器造 rag 的合法模拟题库（单选 20、多选 10），再逐条破坏规则：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateMockData } from '../../scripts/validate-lib.mjs';

const DOMAINS = [{ id: 'rag', name: '检索增强', short: 'RAG', weight: 100, chapters: ['2_5_x'], target: { single: 5, multi: 3 } }];
const EXPLAIN = '正确项因为符合场景约束；其余选项分别错在扩大范围、增加成本或改变数据范围。';
const single = (n, over = {}) => ({
  id: `rag-m${String(n).padStart(3, '0')}`, domain: 'rag', type: 'single',
  stem: `场景 ${n}：以下哪种做法最合理？`, options: ['做甲', '做乙', '做丙', '做丁'],
  answer: [n % 4], explanation: EXPLAIN, source: '2_5_x', ...over,
});
const multi = (n, over = {}) => ({
  ...single(n, over), type: 'multi',
  answer: n % 10 < 7
    ? [n % 4, (n + 1) % 4]
    : [n % 4, (n + 1) % 4, (n + 2) % 4],
});
const valid = () => ({
  domains: DOMAINS,
  mock: { rag: [...Array.from({ length: 20 }, (_, i) => single(i + 1)), ...Array.from({ length: 10 }, (_, i) => multi(i + 21))] },
});
const bad = (over) => {
  const data = valid();
  data.mock.rag[0] = { ...data.mock.rag[0], ...over };
  return data;
};
const expectError = (data, fragment, opts) => {
  const errors = validateMockData(data, opts);
  assert.ok(errors.some((e) => e.includes(fragment)), `expected "${fragment}" in:\n${errors.join('\n')}`);
};

test('a valid mock bank passes', () => assert.deepEqual(validateMockData(valid()), []));
test('id, domain, type, options, answers and explanation are checked', () => {
  expectError(bad({ id: 'rag-001' }), 'id 格式');
  expectError(bad({ domain: 'prompt' }), 'domain 应为 rag');
  expectError(bad({ type: 'judge' }), 'type 必须是');
  expectError(bad({ options: ['甲', '乙', '丙'] }), '选项必须是 4 个');
  expectError(bad({ options: ['甲', '甲', '丙', '丁'] }), '选项有重复');
  expectError(bad({ answer: [] }), '单选题必须恰好 1 个答案');
  expectError(bad({ answer: [0, 1] }), '单选题必须恰好 1 个答案');
  expectError(bad({ explanation: '太短' }), '解析至少 20 字');
  expectError(bad({ source: '9_9_不存在' }), 'source 不是已知章节');
});
test('multi answers must be 2 or 3', () => {
  const data = valid();
  data.mock.rag[20] = { ...data.mock.rag[20], answer: [0] };
  expectError(data, '多选题必须有 2 或 3 个答案');
});
test('counts are exact in strict mode and skipped in partial mode', () => {
  const data = valid();
  data.mock.rag = data.mock.rag.slice(0, 29);
  assert.deepEqual(validateMockData(data, { allowPartial: true }), []);
  expectError(data, 'rag 多选题 9，应为 10');
  const fewer = valid();
  fewer.mock.rag = fewer.mock.rag.filter((q) => q.type === 'single');
  expectError(fewer, 'rag 多选题 0，应为 10');
});
test('answer distribution is balanced', () => {
  const data = valid();
  data.mock.rag.slice(0, 20).forEach((q) => { q.answer = [0]; });
  expectError(data, '正确答案 A 占');
  const multis = valid();
  multis.mock.rag = multis.mock.rag.map((q, i) => (q.type === 'multi' ? { ...q, answer: [0, 1] } : q));
  expectError(multis, '多选题 2 个答案的题占 100%');
});
test('multiple chapters may be joined with 、', () => {
  const data = valid();
  data.mock.rag[0] = { ...data.mock.rag[0], source: '2_5_x、5_2_总结与展望' };
  assert.deepEqual(validateMockData(data), []);
});
```

在 `tests/unit/validate-lib.test.mjs` 增加一条：练习题也允许多章节来源。

```js
test('question sources may join several known chapters', () => {
  assert.deepEqual(validateData(withQuestion({ source: '2_5_x、5_2_总结与展望' })), []);
  expectError(withQuestion({ source: '2_5_x、9_9_不存在' }), 'source 不是已知章节');
});
```

Run: `node --test tests/unit/validate-mock.test.mjs` → FAIL（函数不存在）。

- [ ] **Step 2: 实现 `validateMockData`**

在 `scripts/validate-lib.mjs` 增加：

```js
export const MOCK_TARGETS = {
  'app-dev': { single: 18, multi: 8 }, prompt: { single: 14, multi: 8 }, rag: { single: 20, multi: 10 },
  finetune: { single: 16, multi: 8 }, 'agent-mm': { single: 16, multi: 8 }, production: { single: 16, multi: 8 },
};
export const MOCK_EXPLAIN_MIN_CHARS = 20;
```

`validateMockData` 逐题检查：
- id 匹配 `^<domain>-m\d{3}$` 且不重复；
- `domain` 一致、`type` 合法；
- 选项恰好 4 个、非空、不重复；
- 单选恰好 1 个答案；多选 2 或 3 个；下标不越界、不重复；
- `stem` 非空、`explanation` ≥20 字；
- `source` 用 `isKnownSource`（已支持「、」）。

数量：`countsFor` 逻辑与 `validateData` 相同（`strictDomains` 或默认严格）；严格时与 `MOCK_TARGETS` 完全相等，报错文案用 `rag 单选题 19，应为 20`。

答案分布（每个考点）：
- 单选正确字母占比 >40% 报错；
- 多选 2 个答案的占比 <60% 或 >90% 报错；
- 任一选项作为正确答案出现在 >70% 的多选题中报错；
- 单选正确答案是严格最长选项的占比 >35% 报错（复用 `isKeyStrictlyLongest` / `checkKeyLength` 的思路）。
- 样本量不足时跳过分布检查：单选少于 8 道、多选少于 6 道时只查单题规则，避免 `--allow-partial` 下空库或只有样题时报除零错误。

同时把 `checkQuestion` 的 `chapters.has(q.source)` 改成 `isKnownSource(q.source, chapters)`；在 `validateData` 中把 `cardChapters`（含 `EXTRA_CHAPTERS`）传给 `checkQuestion`，让练习题也能用多章节来源。

- [ ] **Step 3: 接入 CLI**

修改 `scripts/validate-data.mjs`：
- 读取 `mock/<domain>.json` 到 `mock` 对象。
- 调用 `validateMockData({ domains, mock }, options)`，把错误并入输出。
- 成功输出改为：`题库校验通过：300 道练习题，150 道模拟题，157 张卡片，6 张知识地图`（数字动态计算）。
- `--domain` 时只严格检查该考点的模拟题数量；`--allow-partial` 跳过数量。

Run:
```bash
npm run validate -- --allow-partial
```
Expected: PASS（此时模拟题文件为空，数量不检查）。

- [ ] **Step 4: 跑测试**

```bash
npm test
```
Expected: 全部 PASS。注意 `npm run validate`（不带 `--allow-partial`）此时会因模拟题数量不足而失败，这是预期的，Task 10 才会通过。

- [ ] **Step 5: 提交**

```bash
git add scripts/validate-lib.mjs scripts/validate-data.mjs tests/unit/validate-mock.test.mjs tests/unit/validate-lib.test.mjs
git commit -m "feat: validate the mock exam bank" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

---

### Task 3: 12 道样题（用户确认风格）

**Files:**
- Modify: `data/mock/<domain>.json`（每考点 1 单选 + 1 多选）
- Create: `docs/coverage/mock.md`

**Interfaces:**
- Consumes: Task 1 的数据加载与组卷、Task 2 的校验（`npm run validate -- --allow-partial`）。
- Produces: 12 道通过校验的样题；`docs/coverage/mock.md` 记录官方主题与题号；用户确认后的风格基线。

- [ ] **Step 1: 读材料**
  - 读 `docs/specs/2026-10-29-mock-exam-bank-design.md` 第 6 节（风格与覆盖清单）。
  - 读对应章节笔记（每考点至少读该题涉及的小节）。
  - 读 `data/questions/<domain>.json`，避免和练习题问法重复。

- [ ] **Step 2: 写 12 道样题**

每个考点 1 道单选 + 1 道多选，id 从 `m001` 开始。每题满足 Global Constraints 的风格和解析要求。建议覆盖以下 12 个官方主题（各考点 2 个）：

| 考点 | 样题主题 |
|---|---|
| app-dev | 分词与词表对 Input Token 的影响；逐 Token 采样导致输出差异 |
| prompt | 少样本示例 / 结构化输出约束；专业术语翻译 |
| rag | 相似度阈值过高导致召回不足；表格内容解析与保结构入库 |
| finetune | 过拟合与验证损失 / checkpoint 选择；微调前的数据质量评估 |
| agent-mm | 敏感操作封装为 MCP 工具；多 Agent 职责边界 |
| production | 数据不出公有云的本地部署；关键词拦截误拦与语义意图识别 |

- [ ] **Step 3: 写覆盖表**

`docs/coverage/mock.md`：列出官方 20 个主题、对应考点、题号；已写的填 id，未写的写「待补」。

- [ ] **Step 4: 校验和测试**

```bash
npm run validate -- --allow-partial
npm test
npx playwright test tests/e2e/mock-exam.spec.mjs tests/e2e/exam.spec.mjs --project=android-360-light
```

Expected: 全部 PASS。`npm run validate` 不带 `--allow-partial` 仍会因数量不足失败，属预期。

- [ ] **Step 5: 提交并停下来等用户确认**

```bash
git add data/mock docs/coverage/mock.md
git commit -m "feat: add 12 sample mock questions for style review" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

**STOP：把 12 道样题（题干、选项、答案、解析）整理给用户确认。用户确认风格后再执行 Task 4–9。** 如果用户要求调整，先改这 12 道，再继续。

---

### 内容任务的统一步骤（Task 4–9 适用）

每个考点任务的 Files 都是：
- Modify: `data/mock/<domain>.json`、`docs/coverage/mock.md`

**Interfaces:**
- Consumes: Task 1 的组卷、Task 2 的校验、Task 3 确认后的风格基线。
- Produces: 该考点达到精确题量；每道题有解析、来源、覆盖表记录。

- [ ] **Step 1: 读材料**
  - `docs/coverage/mock.md` 中本考点待补的主题。
  - 本考点章节笔记（用 `nb-text.mjs` 取正文）。
  - 现有 `data/mock/<domain>.json` 的 2 道样题，避免重复。

- [ ] **Step 2: 写题**

按 Global Constraints 的场景公式写题，id 接续现有最大编号。每题记录：题号、考点、主题、来源章节、正确项依据。多选答案 2 或 3 个，整体保持约 70% 为 2 个答案。

- [ ] **Step 3: 更新覆盖表**

把本考点负责的官方主题填上题号；新增题目如果不是官方主题，也记在表末「其他」区。

- [ ] **Step 4: 自查**
  - 每题是否场景化、是否出现「按课程」、选项是否具体；
  - 解析是否说清正确项和干扰项；
  - 数字、产品名和笔记一致；
  - id 连续、无重复。

- [ ] **Step 5: 校验**

```bash
npm run validate -- --domain <domain>
npm test
npx playwright test tests/e2e/mock-exam.spec.mjs --project=android-360-light
```

Expected: 该考点严格数量通过（其他考点未完成不影响 `--domain`）；测试 PASS。

- [ ] **Step 6: 提交**

```bash
git add data/mock/<domain>.json docs/coverage/mock.md
git commit -m "feat(<domain>): complete the mock exam bank" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

**每个内容任务都要经过核查审查。** 审查子代理逐题核对：场景化、无「按课程」、正确项有笔记依据、解析能排除干扰项、来源章节正确、覆盖表无误。找不到依据的事实按 Important 处理。

---

### Task 4: rag 补到 30 道

`<domain>` = `rag`。已有 2 道样题（1 单选 + 1 多选），需补 28 道（19 单选 + 9 多选）。章节：`2_2_扩展答疑机器人的知识范围`、`2_4_自动化评测答疑机器人的表现`、`2_5_优化RAG应用提升问答准确度`。

必须覆盖的官方主题：RAG 权限控制、关键词+向量混合检索、重排序、表格解析、相似度阈值、复杂文档解析、Context Precision/Recall、RAG 幻觉控制。其余题目围绕切片、Embedding、问题改写、评测、GraphRAG 等课程内容出场景题。

### Task 5: app-dev 补到 26 道

`<domain>` = `app-dev`。已有 2 道，补 24 道（17 单选 + 7 多选）。章节：`2_1_用大模型构建新人答疑机器人`、`3_1_Agent基础与工具调用`。必须覆盖：分词与词表、逐 Token 采样。其余围绕大模型工作流程、参数（temperature/top_p/top_k/seed）、流式输出、Function Calling、上下文工程、MCP 等。

### Task 6: finetune 补到 24 道

`<domain>` = `finetune`。已有 2 道，补 22 道（15 单选 + 7 多选）。章节：`4_1_用蒸馏让小模型掌握专业能力`、`4_2_部署模型`。必须覆盖：过拟合与 checkpoint、微调前数据质量评估。其余围绕 LoRA、蒸馏、训练数据格式、loss 曲线、合并参数、部署与成本。

### Task 7: agent-mm 补到 24 道

`<domain>` = `agent-mm`。已有 2 道，补 22 道（15 单选 + 7 多选）。章节：`3_2`～`3_8`；多模态题可从 `2_1`、`2_3`、`3_1`、`4_3`、`4_4`、`5_2` 取材，`source` 照实写。必须覆盖：敏感操作封装为 MCP 工具、多 Agent 职责边界。其余围绕规划执行、Memory、Skill、评测驱动、多模态、Harness Loop。

### Task 8: prompt 补到 22 道

`<domain>` = `prompt`。已有 2 道，补 20 道（13 单选 + 7 多选）。章节：`2_3_优化提示词改善答疑机器人回答质量`。必须覆盖：少样本/结构化输出、专业术语翻译。其余围绕提示词模板、分隔符、角色与受众、CoT、Meta Prompting、AI 裁判、自动化优化。

### Task 9: production 补到 24 道

`<domain>` = `production`。已有 2 道，补 22 道（15 单选 + 7 多选）。章节：`4_3_大模型应用生产实践`、`4_4_大模型应用安全合规`。必须覆盖：本地部署（数据不出公有云）、语义拦截/误拦。其余围绕成本与性能、稳定性、SLO、内容安全、权限、合规、提示词注入。

---

### Task 10: 收尾

**Files:**
- Modify: `README.md`、`sw.js`（由 `npm run bump` 改）、`tests/unit/bank.test.mjs`

- [ ] **Step 1: 全量严格校验**

Run: `npm run validate`
Expected: PASS，输出「300 道练习题，150 道模拟题，157 张卡片，6 张知识地图」。同时检查 `docs/coverage/mock.md`：官方 20 个主题都填了题号，没有「待补」。

- [ ] **Step 2: 把题库多样性测试改为模拟题库**

`tests/unit/bank.test.mjs` 当前检查练习题是否达到 2 倍抽题量。改为读取 `data/mock/<domain>.json`，断言每考点/题型的数量 ≥ `allocate(...) × 2`；测试名改为 `every domain has enough mock questions for two full papers`。

Run: `node --test tests/unit/bank.test.mjs` → PASS。

- [ ] **Step 3: 更新 README**

把「题库：约 300 道题……」改成：「题库：300 道练习题 + 150 道官方风格模拟题（50 单选 + 25 多选/场，连续两场不重复），157 张速记卡片，按考试大纲权重覆盖 6 个考点。」数据一节增加 `data/mock/<考点>.json` 一行。

- [ ] **Step 4: 全部测试和体积**

```bash
npm run test:cov
npx playwright test
npm run size
```

Expected: 全部 PASS；gzip < 500 KB，把实际数值写进报告。

- [ ] **Step 5: 缓存版本和提交**

```bash
npm run bump
git add README.md sw.js tests/unit/bank.test.mjs
git commit -m "chore: document the mock bank and bump cache version" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

不要推送。
