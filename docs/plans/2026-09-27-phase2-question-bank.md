# ACP 备考站 · 第二阶段（补全题库）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把题库从 30 道样题补到约 300 道、卡片从 18 张补到 72 张。题量按大纲权重分配到 6 个考点。每完成一个考点就发布一次，用户在手机上随时能刷到新题。

**Architecture:** 应用代码不改，只改数据和工具。先加强题库校验和发布工具：答案位置分布检查、重复题检查、按考点严格校验、gzip 体积预算、缓存版本号自增。然后按 spec §10 的顺序逐个考点出题：rag → app-dev → prompt → finetune → agent-mm → production。每个考点先做覆盖表，再读笔记出题、自查、校验，最后发布。所有考点完成后，加一道「题量够组整卷」的测试作为最终检查。

**Tech Stack:** 与第一阶段相同，即原生 JS + JSON 数据 + Node 26 `node:test` + Playwright。

**Spec:** `docs/specs/2026-09-27-acp-study-app-design.md`（§4 题量表、§8 校验与内容质量、§9 风险、§10 交付节奏）

**不在本计划内：** 第一阶段最终审查时暂缓的几个代码小问题（取消离开考试后回到第一道未答题、未来的 schemaVersion 被当作数据损坏、`isExamRecord` 的校验深度、关掉的横幅会再次出现）。等题库补完后另外处理。

## Global Constraints

**出题规则（每个内容任务都适用，审查时逐题检查）：**
- 只考课程笔记里写到的内容，不编造笔记里没有的参数、数值或产品名。
- `explanation` 要讲三件事：为什么正确答案对、每个干扰项错在哪、对应笔记里的哪个概念。
- `source` 填这道题实际依据的章节名，必须出现在 `data/domains.json` 某个考点的 `chapters` 里。
- 干扰项要似是而非，不能一眼排除；干扰项最好取自同一笔记里的相邻概念。
- 单选题 4 个选项、恰好 1 个正确，选项里不能出现「以上都对」这类表述。多选题 4–5 个选项、2–4 个正确，每个正确项都必须无歧义地成立。
- 同一题库内不能有重复或近似重复的题（只换措辞、考同一个知识点的同一个角度也算）。
- **已发布题目的 `id` 不能改，题意也不能改。** 可以修正事实错误和措辞。新题从现有最大编号往后接：题目从 `-006` 开始，卡片从 `-c04` 开始。
- 每张卡片 3–5 条要点，每条不超过 40 个字；每个考点共 12 张卡片。
- `3_0`、`3_8`、`4_0`、`5_1` 这四个笔记基本没有正文（1–2KB），**不能作为出题来源**。
- agent-mm 考点以多 Agent 为主。多模态内容在课程里只零星出现，只能依据笔记原文出题，数量宁少勿编。
- 数据文件用 UTF-8、2 空格缩进、中文。

**工程规则：**
- 浏览器代码只用 ES2019 语法（本计划基本不改浏览器代码）。Node 脚本在 Node 26 下运行。
- 不要静默吞掉错误；不写 `console.log`（CLI 的正常输出用 `process.stdout.write`）。
- 每次提交都用：`git commit -m "<type>: <desc>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"`
- **推送到 GitHub 前必须得到用户同意。** 用户可以对「每完成一个考点就推送」给一次长期同意；没有这个同意时，每次推送前停下来问。
- 所有命令都在 `acp-study-app/` 目录下执行。笔记在 `../大模型ACP认证教程/` 下（`C2_构造问答系统/`、`C3_构建Agent系统/`、`C4_交付上线/`），文件名 = 章节名 + `.ipynb`。

**每个考点的目标（含第一阶段已有的 5 道样题和 3 张卡片）：**

| 考点 | 单选 | 多选 | 卡片 | 各章题量分配（约数，每章可 ±3） |
|---|---|---|---|---|
| rag | 40 | 20 | 12 | 2_2 ≈12、2_4 ≈20、2_5 ≈28 |
| app-dev | 34 | 17 | 12 | 2_1 ≈28、3_1 ≈23（2_2 最多用 4 道） |
| prompt | 30 | 15 | 12 | 2_3 全部 45 |
| finetune | 32 | 16 | 12 | 4_1 ≈34、4_2 ≈14 |
| agent-mm | 32 | 16 | 12 | 3_2 ≈12、3_3 ≈7、3_4 ≈7、3_5 ≈9、3_6 ≈6、3_7 ≈7 |
| production | 32 | 16 | 12 | 4_3 ≈20、4_4 ≈28 |

---

### Task 1: 题库工具加强

**Files:**
- Modify: `scripts/validate-lib.mjs`, `scripts/validate-data.mjs`, `scripts/check-size.mjs`, `scripts/nb-text.mjs`, `package.json`, `docs/specs/2026-09-27-acp-study-app-design.md`（体积预算那一行）, `tests/e2e/learn.spec.mjs`（去掉对样题规模的假设）
- Create: `scripts/release-lib.mjs`, `scripts/bump-cache.mjs`
- Test: `tests/unit/validate-lib.test.mjs`（追加用例）、`tests/unit/release-lib.test.mjs`

**Interfaces:**
- Produces:
  - `validateData(data, { allowPartial = false, strictDomains = null })`：`strictDomains` 是考点 id 数组，只对列出的考点检查题量和卡片数；为 `null` 时按 `allowPartial` 决定检查全部还是全部跳过。另外新增 3 项检查，在任何模式下都执行：全题库重复题干、单选答案位置分布、多选答案位置分布及正确项个数的变化。
  - CLI：`npm run validate -- --domain <id>`，对该考点严格检查，其余考点按部分模式检查。考点 id 不存在时报错并退出 1。
  - `bumpCacheVersion(text: string): { text, version }`；CLI `npm run bump` 把 `sw.js` 里的 `CACHE_VERSION` 加 1，并打印新版本号。
  - `npm run size`：总预算按 gzip 后的传输量算（< 500KB），JS+CSS 按未压缩算（< 150KB）。

- [ ] **Step 0: 让已有测试不依赖样题规模** 题库变大后，有两处已有测试会失败，先改掉：
  1. `tests/unit/validate-lib.test.mjs` 第 9 行，把 `q` 的默认题干 `stem: '题干'` 改为 `` stem: `题干${n}` ``。否则新加的重复题干检查会把样例数据判为重复。
  2. `tests/e2e/learn.spec.mjs`：
     - 第 9、17、20、22 行的 `toContainText('1/3')` / `toContainText('2/3')` 改为 `toHaveText(/ · 1\/\d+$/)` / `toHaveText(/ · 2\/\d+$/)`，不再假设只有 3 张卡片；
     - 把最后一个测试 'practice: multi-choice toggles options on and off' 整个替换为：
```js
test('practice: multi-choice toggles options on and off', async ({ page }) => {
  const bank = await loadQuestions(page, 'rag');
  await page.goto('./#/practice/rag');
  const typeChip = page.locator('.q-meta .chip').first();
  for (let i = 0; i < bank.length && (await typeChip.textContent()) !== '多选'; i += 1) {
    await choose(page, [0]);
    await page.getByRole('button', { name: '提交答案' }).click();
    await page.getByRole('button', { name: '下一题' }).click();
  }
  await expect(typeChip).toHaveText('多选');
  await choose(page, [0, 1]);
  await expect(page.locator('.option[aria-checked="true"]')).toHaveCount(2);
  await choose(page, [1]);
  await expect(page.locator('.option[aria-checked="true"]')).toHaveCount(1);
});
```
  改完运行 `npm test` 和 `npx playwright test tests/e2e/learn.spec.mjs`，确认在当前样题上仍然全部通过。

- [ ] **Step 1: 追加失败的校验测试** 在 `tests/unit/validate-lib.test.mjs` 末尾追加（文件里原有的 `DOMAINS`、`q`、`card`、`valid`、`expectError` 直接复用）：

```js
test('--domain style strict mode checks counts only for listed domains', () => {
  const data = valid();
  const two = {
    domains: [DOMAINS[0], { ...DOMAINS[0], id: 'prompt', weight: 0, chapters: ['2_5_x'] }],
    questions: { rag: data.questions.rag.slice(0, 1), prompt: [] },
    cards: { rag: data.cards.rag, prompt: [] },
  };
  const errors = validateData(two, { strictDomains: ['prompt'] });
  assert.ok(errors.some((e) => e.includes('questions/prompt.json: single 题数 0')), errors.join('\n'));
  assert.ok(!errors.some((e) => e.includes('questions/rag.json: single')), errors.join('\n'));
});

test('duplicate stems across the bank are rejected (whitespace-insensitive)', () => {
  const data = valid();
  const dup = { ...data, questions: { rag: data.questions.rag.concat([q(7, { stem: ' 题 干 1 ' })]) } };
  expectError(dup, '题干与 rag-001 重复');
});

test('single-choice answers must not pile up on one letter', () => {
  const singles = Array.from({ length: 10 }, (_, i) => q(i + 1, { stem: `题干${i}`, answer: [i < 5 ? 0 : i % 4] }));
  const multis = [q(11, { stem: 'm1', type: 'multi', answer: [0, 1] }), q(12, { stem: 'm2', type: 'multi', answer: [1, 2] })];
  const data = { ...valid(), questions: { rag: singles.concat(multis) } };
  expectError(data, '单选题正确答案 A 占', { allowPartial: true });
});

test('multi-choice answers must vary in position and count', () => {
  const multis = Array.from({ length: 6 }, (_, i) => q(i + 1, { stem: `多${i}`, type: 'multi', answer: [0, 1 + (i % 3)] }));
  const data = { ...valid(), questions: { rag: multis } };
  const errors = validateData(data, { allowPartial: true });
  assert.ok(errors.some((e) => e.includes('多选题选项 A 在 100% 的题目中为正确答案')), errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('多选题正确答案个数全部为 2 个')), errors.join('\n'));
});

test('balance checks stay quiet below their sample-size thresholds', () => {
  assert.deepEqual(validateData(valid(), { allowPartial: true }), []);
});
```

- [ ] **Step 2: 写失败的发布工具测试** `tests/unit/release-lib.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bumpCacheVersion } from '../../scripts/release-lib.mjs';

test('bumps the cache version and leaves the rest untouched', () => {
  const src = "const CACHE_VERSION = 'acp-v1';\nconst SHELL = ['./'];\n";
  assert.deepEqual(bumpCacheVersion(src), {
    text: "const CACHE_VERSION = 'acp-v2';\nconst SHELL = ['./'];\n",
    version: 'acp-v2',
  });
});

test('handles multi-digit versions', () => {
  assert.equal(bumpCacheVersion("const CACHE_VERSION = 'acp-v9';").version, 'acp-v10');
});

test('throws a readable error when the declaration is missing', () => {
  assert.throws(() => bumpCacheVersion('const X = 1;'), /找不到 CACHE_VERSION/);
});
```

Run: `npm test`
Expected: FAIL（新增的校验用例失败；找不到 `scripts/release-lib.mjs`）

- [ ] **Step 3: 实现校验加强** 修改 `scripts/validate-lib.mjs`

在常量区追加：
```js
export const BALANCE_MIN = { single: 8, multi: 6 };
export const SINGLE_LETTER_MAX_SHARE = 0.4;
export const MULTI_POSITION_MAX_SHARE = 0.75;
const LETTERS = 'ABCDEF';
const pct = (x) => Math.round(x * 100);
```

在 `validateData` 前面新增两个函数：
```js
function countBy(list, keyFn) {
  const counts = {};
  list.forEach((item) => [].concat(keyFn(item)).forEach((k) => { counts[k] = (counts[k] || 0) + 1; }));
  return counts;
}

function checkBalance(domainId, qs) {
  const errs = [];
  const where = `questions/${domainId}.json`;
  const withAnswer = qs.filter((q) => Array.isArray(q.answer) && q.answer.length);
  const singles = withAnswer.filter((q) => q.type === 'single');
  if (singles.length >= BALANCE_MIN.single) {
    const counts = countBy(singles, (q) => q.answer[0]);
    Object.keys(counts).forEach((i) => {
      const share = counts[i] / singles.length;
      if (share > SINGLE_LETTER_MAX_SHARE) {
        errs.push(`${where}: 单选题正确答案 ${LETTERS[i]} 占 ${pct(share)}%，超过 ${pct(SINGLE_LETTER_MAX_SHARE)}%`);
      }
    });
  }
  const multis = withAnswer.filter((q) => q.type === 'multi');
  if (multis.length >= BALANCE_MIN.multi) {
    const counts = countBy(multis, (q) => q.answer);
    Object.keys(counts).forEach((i) => {
      const share = counts[i] / multis.length;
      if (share > MULTI_POSITION_MAX_SHARE) {
        errs.push(`${where}: 多选题选项 ${LETTERS[i]} 在 ${pct(share)}% 的题目中为正确答案，超过 ${pct(MULTI_POSITION_MAX_SHARE)}%`);
      }
    });
    const sizes = Object.keys(countBy(multis, (q) => q.answer.length));
    if (sizes.length < 2) errs.push(`${where}: 多选题正确答案个数全部为 ${sizes[0]} 个，应有变化`);
  }
  return errs;
}

function checkDuplicateStems(domains, questions) {
  const errs = [];
  const seen = new Map();
  domains.forEach((d) => (questions[d.id] || []).forEach((q) => {
    if (!q || typeof q.stem !== 'string') return;
    const key = q.stem.replace(/\s+/g, '');
    if (seen.has(key)) errs.push(`questions/${d.id}.json ${q.id}: 题干与 ${seen.get(key)} 重复`);
    else seen.set(key, q.id);
  }));
  return errs;
}
```

把 `validateData` 替换为：
```js
export function validateData({ domains, cards, questions }, { allowPartial = false, strictDomains = null } = {}) {
  const errors = checkDomains(domains);
  const chapters = new Set([].concat(...domains.map((d) => d.chapters || [])));
  const seen = new Set();
  const countsFor = (id) => (strictDomains ? strictDomains.indexOf(id) !== -1 : !allowPartial);
  domains.forEach((d) => {
    const qs = questions[d.id] || [];
    const cs = cards[d.id] || [];
    qs.forEach((q) => errors.push(...checkQuestion(q, d.id, chapters, seen)));
    cs.forEach((c) => errors.push(...checkCard(c, d.id, chapters, seen)));
    errors.push(...checkBalance(d.id, qs));
    if (countsFor(d.id)) errors.push(...checkCounts(d, qs, cs));
  });
  return errors.concat(checkDuplicateStems(domains, questions));
}
```

- [ ] **Step 4: 修改 CLI** `scripts/validate-data.mjs`：把 `main()` 开头的 `const allowPartial = ...` 一行替换为下面的代码，再把 `validateData` 的调用改为传入 `options`，把成功输出里的 `mode` 改为按 `options` 生成：

```js
  const argv = process.argv.slice(2);
  const domainFlag = argv.indexOf('--domain');
  const strictDomain = domainFlag !== -1 ? argv[domainFlag + 1] : null;
  const allowPartial = argv.includes('--allow-partial');
```
在读取 `domains` 之后加：
```js
  if (domainFlag !== -1 && !domains.some((d) => d.id === strictDomain)) {
    console.error(`未知考点：${strictDomain}（可选：${domains.map((d) => d.id).join('、')}）`);
    process.exit(1);
  }
  const options = strictDomain ? { strictDomains: [strictDomain] } : { allowPartial };
```
调用改成 `validateData({ domains, cards, questions }, options)`。成功输出里的模式说明改为：
```js
  const mode = strictDomain ? `（严格检查 ${strictDomain}，其余考点未检查题量）` : allowPartial ? '（部分题库模式：未检查题量）' : '';
```

- [ ] **Step 5: 实现发布工具**

`scripts/release-lib.mjs`:
```js
const DECLARATION = /const CACHE_VERSION = 'acp-v(\d+)';/;

export function bumpCacheVersion(text) {
  const match = DECLARATION.exec(text);
  if (!match) throw new Error('sw.js 中找不到 CACHE_VERSION 声明');
  const version = `acp-v${Number(match[1]) + 1}`;
  return { text: text.replace(DECLARATION, `const CACHE_VERSION = '${version}';`), version };
}
```

`scripts/bump-cache.mjs`:
```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bumpCacheVersion } from './release-lib.mjs';

const SW = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'sw.js');

try {
  const { text, version } = bumpCacheVersion(await fs.readFile(SW, 'utf8'));
  await fs.writeFile(SW, text, 'utf8');
  process.stdout.write(`CACHE_VERSION 已更新为 ${version}\n`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
```

- [ ] **Step 6: 体积预算改为按 gzip 计算** 把 `scripts/check-size.mjs` 整个替换为：

```js
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHIPPED = ['index.html', 'manifest.json', 'sw.js', 'css', 'js', 'data', 'icons'];
const BUDGET_KB = { transfer: 500, code: 150 };

function walk(p) {
  return fs.statSync(p).isFile() ? [p] : fs.readdirSync(p).flatMap((name) => walk(path.join(p, name)));
}

const files = SHIPPED.flatMap((p) => walk(path.join(ROOT, p)));
const rawKb = (list) => list.reduce((n, f) => n + fs.statSync(f).size, 0) / 1024;
const gzipKb = (list) => list.reduce((n, f) => n + zlib.gzipSync(fs.readFileSync(f)).length, 0) / 1024;
const transfer = gzipKb(files);
const code = rawKb(files.filter((f) => /[\\/](js|css)[\\/]/.test(f)));

process.stdout.write(`站点传输体积（gzip）${transfer.toFixed(1)} KB（预算 ${BUDGET_KB.transfer}）；未压缩 JS+CSS ${code.toFixed(1)} KB（预算 ${BUDGET_KB.code}）；未压缩总计 ${rawKb(files).toFixed(1)} KB\n`);
if (transfer > BUDGET_KB.transfer || code > BUDGET_KB.code) {
  console.error('超出体积预算');
  process.exit(1);
}
```

同步修改 spec：把 `docs/specs/2026-09-27-acp-study-app-design.md` 中「- 体积预算：整站小于 500KB；…」这一行改为：
```
- 体积预算：整站 gzip 后的传输量小于 500KB（GitHub Pages 自动 gzip；300 道题的 JSON 未压缩约 420KB）；未压缩的 JS 加 CSS 小于 150KB。
```

- [ ] **Step 7: 修复 nb-text 被管道截断时的报错** 在 `scripts/nb-text.mjs` 的 import 之后加：
```js
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});
```

- [ ] **Step 8: package.json** 在 `scripts` 里加 `"bump": "node scripts/bump-cache.mjs"`，并在 `test:cov` 里加 `--test-coverage-include=scripts/release-lib.mjs`（插在其他 include 旁边）。

- [ ] **Step 9: 验证**

Run: `npm test`、`npm run test:cov`、`npm run validate -- --allow-partial`、`npm run validate -- --domain rag`（此时应失败：rag 题量不足，这是正常的）、`npm run validate -- --domain nope`（应报「未知考点」）、`npm run size`、`node scripts/nb-text.mjs "../大模型ACP认证教程/C2_构造问答系统/2_5_优化RAG应用提升问答准确度.ipynb" | head -3`（不应出现 EPIPE 报错）
Expected: 单元测试全部通过，覆盖率 ≥ 80%，部分模式校验通过，`--domain rag` 报题量不足并退出 1，`--domain nope` 报未知考点，size 输出三项数值且在预算内，nb-text 输出干净。**不要运行 `npm run bump`**（每个考点发布时才运行）。

- [ ] **Step 10: Commit**

```bash
git add scripts package.json tests/unit tests/e2e/learn.spec.mjs docs/specs
git commit -m "feat: strengthen bank validation and add release tooling" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

---

### Task 2: 考点 rag（大模型检索增强，20%）

**Files:**
- Modify: `data/questions/rag.json`, `data/cards/rag.json`, `sw.js`（仅 CACHE_VERSION）
- Create: `docs/coverage/rag.md`

**Interfaces:**
- Consumes: Task 1 的 `npm run validate -- --domain rag`、`npm run bump`、`scripts/nb-text.mjs`
- Produces: `rag` 考点达到 40 道单选、20 道多选、12 张卡片；新题 id 为 `rag-006` 起、卡片为 `rag-c04` 起，编号连续

**来源章节与分配：** `2_2_扩展答疑机器人的知识范围` 约 12 道、`2_4_自动化评测答疑机器人的表现` 约 20 道、`2_5_优化RAG应用提升问答准确度` 约 28 道（含已有 5 道样题，每章可 ±3）。笔记路径：`../大模型ACP认证教程/C2_构造问答系统/<章节名>.ipynb`。

- [ ] **Step 1: 做覆盖表** 对每个来源章节运行 `node scripts/nb-text.mjs "<笔记路径>" | grep -E '^#{1,3} '`，列出小节标题。然后写 `docs/coverage/rag.md`：

```markdown
# 大模型检索增强（rag）覆盖表

| 章节 | 小节（笔记标题） | 计划题数 | 题目 id | 卡片 id |
|---|---|---|---|---|
| 2_5_… | … | 3 | rag-006, rag-007, rag-008 | rag-c04 |
```
按小节的内容量分配题数，各章合计符合上面的分配。纯环境配置、安装依赖这类没有考点的小节写 0。先把已有的 `rag-001`～`rag-005`、`rag-c01`～`rag-c03` 填进对应小节。

- [ ] **Step 2: 按章出题** 按覆盖表逐章阅读笔记原文（`node scripts/nb-text.mjs "<路径>"`，用 `sed -n` 分段读，不要一次全部输出），把题目和卡片追加到 `data/questions/rag.json` 和 `data/cards/rag.json`，编号连续。每写完一章：
  - 运行 `npm run validate -- --allow-partial` 确认格式没问题（中途出现的答案位置分布类报错可以留到 Step 4 统一处理，其他报错要立即修）；
  - 用下面的命令提交一次，防止中断后丢失进度：
```bash
git add data/questions/rag.json data/cards/rag.json docs/coverage/rag.md
git commit -m "feat: add rag questions from <章节号>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 3: 逐题自查** 对照 Global Constraints 的出题规则，逐题检查：答案唯一且无歧义、多选题每个正确项都成立、内容没有超出笔记、解析说清了干扰项错在哪、没有近似重复题。发现问题直接修改。回填覆盖表，确保每个题目 id 和卡片 id 都恰好出现一次。

- [ ] **Step 4: 严格校验**

Run: `npm run validate -- --domain rag`
Expected: `题库校验通过：…（严格检查 rag，其余考点未检查题量）`。如果答案位置分布不达标，调整**新题**的选项顺序，并同步修改 `answer` 和 `explanation` 中提到的字母；不要改已发布的题。

- [ ] **Step 5: 回归测试**

Run: `npm test`，然后 `npx playwright test`，然后 `npm run size`
Expected: 全部通过，体积在预算内。

- [ ] **Step 6: 发布准备**

```bash
npm run bump
git add data docs/coverage sw.js
git commit -m "feat: complete rag question bank (60 questions, 12 cards)" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 7: 推送（需要用户同意）** 确认已获得用户同意（长期同意或本次同意）后执行 `git push`。推送后运行 `curl -s https://18826400652.github.io/acp-study/sw.js | head -1`，1–2 分钟内应显示新的 CACHE_VERSION。

---

### Task 3: 考点 app-dev（大模型应用开发，17%）

**Files:**
- Modify: `data/questions/app-dev.json`, `data/cards/app-dev.json`, `sw.js`（仅 CACHE_VERSION）
- Create: `docs/coverage/app-dev.md`

**Interfaces:**
- Consumes: Task 1 的 `npm run validate -- --domain app-dev`、`npm run bump`、`scripts/nb-text.mjs`
- Produces: `app-dev` 考点达到 34 道单选、17 道多选、12 张卡片；新题 id 为 `app-dev-006` 起、卡片为 `app-dev-c04` 起，编号连续

**来源章节与分配：** `2_1_用大模型构建新人答疑机器人` 约 28 道（C2_构造问答系统）、`3_1_Agent基础与工具调用` 约 23 道（C3_构建Agent系统），合计含已有 5 道样题，每章可 ±3。`2_2_扩展答疑机器人的知识范围` 最多用 4 道，而且只能考应用开发角度的内容（例如多轮对话的上下文管理），与 rag 考点已有的题不能重复。`3_0` 没有正文，不作为来源。

- [ ] **Step 1: 做覆盖表** 对每个来源章节运行 `node scripts/nb-text.mjs "<笔记路径>" | grep -E '^#{1,3} '`，列出小节标题。然后写 `docs/coverage/app-dev.md`，格式与下面相同：

```markdown
# 大模型应用开发（app-dev）覆盖表

| 章节 | 小节（笔记标题） | 计划题数 | 题目 id | 卡片 id |
|---|---|---|---|---|
| 2_1_… | … | 3 | app-dev-006, app-dev-007, app-dev-008 | app-dev-c04 |
```
按小节的内容量分配题数，没有考点的小节写 0。先填入已有的 `app-dev-001`～`app-dev-005`、`app-dev-c01`～`app-dev-c03`。

- [ ] **Step 2: 按章出题** 按覆盖表逐章阅读笔记原文（用 `sed -n` 分段读），把题目和卡片追加到 `data/questions/app-dev.json` 和 `data/cards/app-dev.json`，编号连续。每写完一章：
  - 运行 `npm run validate -- --allow-partial`（中途出现的答案位置分布类报错可以留到 Step 4 统一处理，其他报错要立即修）；
  - 用下面的命令提交一次：
```bash
git add data/questions/app-dev.json data/cards/app-dev.json docs/coverage/app-dev.md
git commit -m "feat: add app-dev questions from <章节号>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 3: 逐题自查** 对照 Global Constraints 逐题检查（答案唯一且无歧义、多选题每个正确项都成立、不超出笔记、解析说清干扰项、无近似重复，也不能与 rag 考点的题重复），直接修正问题，并回填覆盖表。

- [ ] **Step 4: 严格校验**

Run: `npm run validate -- --domain app-dev`
Expected: 通过（严格检查 app-dev）。答案位置分布不达标时只调整新题的选项顺序，并同步修改 `answer` 和解析。

- [ ] **Step 5: 回归测试**

Run: `npm test`，然后 `npx playwright test`，然后 `npm run size`
Expected: 全部通过，体积在预算内。

- [ ] **Step 6: 发布准备**

```bash
npm run bump
git add data docs/coverage sw.js
git commit -m "feat: complete app-dev question bank (51 questions, 12 cards)" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 7: 推送（需要用户同意）** 确认已获同意后执行 `git push`，然后运行 `curl -s https://18826400652.github.io/acp-study/sw.js | head -1` 确认线上已是新的 CACHE_VERSION。

---

### Task 4: 考点 prompt（大模型提示词工程，15%）

**Files:**
- Modify: `data/questions/prompt.json`, `data/cards/prompt.json`, `sw.js`（仅 CACHE_VERSION）
- Create: `docs/coverage/prompt.md`

**Interfaces:**
- Consumes: Task 1 的 `npm run validate -- --domain prompt`、`npm run bump`、`scripts/nb-text.mjs`
- Produces: `prompt` 考点达到 30 道单选、15 道多选、12 张卡片；新题 id 为 `prompt-006` 起、卡片为 `prompt-c04` 起，编号连续

**来源章节与分配：** 只有 `2_3_优化提示词改善答疑机器人回答质量`（C2_构造问答系统），全部 45 道都出自这一章（含已有 5 道样题）。这一章约 72KB、有 100 个小节，按小节均匀覆盖，不要集中在前半部分。

- [ ] **Step 1: 做覆盖表** 运行 `node scripts/nb-text.mjs "../大模型ACP认证教程/C2_构造问答系统/2_3_优化提示词改善答疑机器人回答质量.ipynb" | grep -E '^#{1,3} '`，列出小节标题。然后写 `docs/coverage/prompt.md`：

```markdown
# 大模型提示词工程（prompt）覆盖表

| 章节 | 小节（笔记标题） | 计划题数 | 题目 id | 卡片 id |
|---|---|---|---|---|
| 2_3_… | … | 2 | prompt-006, prompt-007 | prompt-c04 |
```
按小节的内容量分配题数，没有考点的小节写 0。先填入已有的 `prompt-001`～`prompt-005`、`prompt-c01`～`prompt-c03`。

- [ ] **Step 2: 分段出题** 按覆盖表把笔记分成前、中、后三段阅读（用 `sed -n` 分段），把题目和卡片追加到 `data/questions/prompt.json` 和 `data/cards/prompt.json`，编号连续。每完成一段：
  - 运行 `npm run validate -- --allow-partial`（中途出现的答案位置分布类报错可以留到 Step 4 统一处理，其他报错要立即修）；
  - 用下面的命令提交一次：
```bash
git add data/questions/prompt.json data/cards/prompt.json docs/coverage/prompt.md
git commit -m "feat: add prompt questions (part <n>/3)" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 3: 逐题自查** 对照 Global Constraints 逐题检查（答案唯一且无歧义、多选题每个正确项都成立、不超出笔记、解析说清干扰项、无近似重复），直接修正问题，并回填覆盖表。

- [ ] **Step 4: 严格校验**

Run: `npm run validate -- --domain prompt`
Expected: 通过（严格检查 prompt）。答案位置分布不达标时只调整新题的选项顺序，并同步修改 `answer` 和解析。

- [ ] **Step 5: 回归测试**

Run: `npm test`，然后 `npx playwright test`，然后 `npm run size`
Expected: 全部通过，体积在预算内。

- [ ] **Step 6: 发布准备**

```bash
npm run bump
git add data docs/coverage sw.js
git commit -m "feat: complete prompt question bank (45 questions, 12 cards)" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 7: 推送（需要用户同意）** 确认已获同意后执行 `git push`，然后运行 `curl -s https://18826400652.github.io/acp-study/sw.js | head -1` 确认线上已是新的 CACHE_VERSION。

---

### Task 5: 考点 finetune（大模型微调，16%）

**Files:**
- Modify: `data/questions/finetune.json`, `data/cards/finetune.json`, `sw.js`（仅 CACHE_VERSION）
- Create: `docs/coverage/finetune.md`

**Interfaces:**
- Consumes: Task 1 的 `npm run validate -- --domain finetune`、`npm run bump`、`scripts/nb-text.mjs`
- Produces: `finetune` 考点达到 32 道单选、16 道多选、12 张卡片；新题 id 为 `finetune-006` 起、卡片为 `finetune-c04` 起，编号连续

**来源章节与分配：** `4_1_用蒸馏让小模型掌握专业能力` 约 34 道、`4_2_部署模型` 约 14 道（都在 C4_交付上线，合计含已有 5 道样题，每章可 ±3）。4_1 讲的是用蒸馏和 LoRA 微调来提升小模型，要覆盖其中的训练参数含义、训练状态判断、评测方法、适用与不适用的场景。4_2 要覆盖各种部署方式的取舍、压测结论和限流。

- [ ] **Step 1: 做覆盖表** 对每个来源章节运行 `node scripts/nb-text.mjs "<笔记路径>" | grep -E '^#{1,3} '`，列出小节标题。然后写 `docs/coverage/finetune.md`：

```markdown
# 大模型微调（finetune）覆盖表

| 章节 | 小节（笔记标题） | 计划题数 | 题目 id | 卡片 id |
|---|---|---|---|---|
| 4_1_… | … | 2 | finetune-006, finetune-007 | finetune-c04 |
```
按小节的内容量分配题数，没有考点的小节写 0。先填入已有的 `finetune-001`～`finetune-005`、`finetune-c01`～`finetune-c03`。

- [ ] **Step 2: 按章出题** 按覆盖表逐章阅读笔记原文（用 `sed -n` 分段读），把题目和卡片追加到 `data/questions/finetune.json` 和 `data/cards/finetune.json`，编号连续。每写完一章：
  - 运行 `npm run validate -- --allow-partial`（中途出现的答案位置分布类报错可以留到 Step 4 统一处理，其他报错要立即修）；
  - 用下面的命令提交一次：
```bash
git add data/questions/finetune.json data/cards/finetune.json docs/coverage/finetune.md
git commit -m "feat: add finetune questions from <章节号>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 3: 逐题自查** 对照 Global Constraints 逐题检查（答案唯一且无歧义、多选题每个正确项都成立、不超出笔记、解析说清干扰项、无近似重复）。特别注意：题目里出现的数值，比如训练参数、显存、参数量占比，必须能在笔记原文中找到。直接修正问题，并回填覆盖表。

- [ ] **Step 4: 严格校验**

Run: `npm run validate -- --domain finetune`
Expected: 通过（严格检查 finetune）。答案位置分布不达标时只调整新题的选项顺序，并同步修改 `answer` 和解析。

- [ ] **Step 5: 回归测试**

Run: `npm test`，然后 `npx playwright test`，然后 `npm run size`
Expected: 全部通过，体积在预算内。

- [ ] **Step 6: 发布准备**

```bash
npm run bump
git add data docs/coverage sw.js
git commit -m "feat: complete finetune question bank (48 questions, 12 cards)" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 7: 推送（需要用户同意）** 确认已获同意后执行 `git push`，然后运行 `curl -s https://18826400652.github.io/acp-study/sw.js | head -1` 确认线上已是新的 CACHE_VERSION。

---

### Task 6: 考点 agent-mm（多Agent及多模态应用，16%）

**Files:**
- Modify: `data/questions/agent-mm.json`, `data/cards/agent-mm.json`, `sw.js`（仅 CACHE_VERSION）
- Create: `docs/coverage/agent-mm.md`

**Interfaces:**
- Consumes: Task 1 的 `npm run validate -- --domain agent-mm`、`npm run bump`、`scripts/nb-text.mjs`
- Produces: `agent-mm` 考点达到 32 道单选、16 道多选、12 张卡片；新题 id 为 `agent-mm-006` 起、卡片为 `agent-mm-c04` 起，编号连续

**来源章节与分配（都在 C3_构建Agent系统）：** `3_2_让Agent学会规划与执行` 约 12、`3_3_用多Agent实现团队协作` 约 7、`3_4_用Memory让Agent积累经验` 约 7、`3_5_用Skill将能力固化为可复用流程` 约 9、`3_6_用评测驱动Agent开发` 约 6、`3_7_Qwen_Code实践` 约 7（合计 48，含已有 5 道样题，每章可 ±3）。`3_8` 没有正文，不作为来源。多模态内容只能依据笔记原文出题，没有就不出，并在覆盖表末尾注明「多模态：课程内容不足，未出题」或列出实际出了哪些题。

- [ ] **Step 1: 做覆盖表** 对每个来源章节运行 `node scripts/nb-text.mjs "<笔记路径>" | grep -E '^#{1,3} '`，列出小节标题。然后写 `docs/coverage/agent-mm.md`：

```markdown
# 多Agent及多模态应用（agent-mm）覆盖表

| 章节 | 小节（笔记标题） | 计划题数 | 题目 id | 卡片 id |
|---|---|---|---|---|
| 3_3_… | … | 2 | agent-mm-006, agent-mm-007 | agent-mm-c04 |
```
按小节的内容量分配题数，没有考点的小节写 0。先填入已有的 `agent-mm-001`～`agent-mm-005`、`agent-mm-c01`～`agent-mm-c03`。

- [ ] **Step 2: 按章出题** 按覆盖表逐章阅读笔记原文（用 `sed -n` 分段读），把题目和卡片追加到 `data/questions/agent-mm.json` 和 `data/cards/agent-mm.json`，编号连续。每写完一章：
  - 运行 `npm run validate -- --allow-partial`（中途出现的答案位置分布类报错可以留到 Step 4 统一处理，其他报错要立即修）；
  - 用下面的命令提交一次：
```bash
git add data/questions/agent-mm.json data/cards/agent-mm.json docs/coverage/agent-mm.md
git commit -m "feat: add agent-mm questions from <章节号>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 3: 逐题自查** 对照 Global Constraints 逐题检查（答案唯一且无歧义、多选题每个正确项都成立、不超出笔记、解析说清干扰项、无近似重复）。特别注意：框架名、类名、命令名（例如 AgentScope、Qwen Code 的命令）必须与笔记原文完全一致。直接修正问题，并回填覆盖表。

- [ ] **Step 4: 严格校验**

Run: `npm run validate -- --domain agent-mm`
Expected: 通过（严格检查 agent-mm）。答案位置分布不达标时只调整新题的选项顺序，并同步修改 `answer` 和解析。

- [ ] **Step 5: 回归测试**

Run: `npm test`，然后 `npx playwright test`，然后 `npm run size`
Expected: 全部通过，体积在预算内。

- [ ] **Step 6: 发布准备**

```bash
npm run bump
git add data docs/coverage sw.js
git commit -m "feat: complete agent-mm question bank (48 questions, 12 cards)" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 7: 推送（需要用户同意）** 确认已获同意后执行 `git push`，然后运行 `curl -s https://18826400652.github.io/acp-study/sw.js | head -1` 确认线上已是新的 CACHE_VERSION。

---

### Task 7: 考点 production（生产环境应用实践，16%）

**Files:**
- Modify: `data/questions/production.json`, `data/cards/production.json`, `sw.js`（仅 CACHE_VERSION）
- Create: `docs/coverage/production.md`

**Interfaces:**
- Consumes: Task 1 的 `npm run validate -- --domain production`、`npm run bump`、`scripts/nb-text.mjs`
- Produces: `production` 考点达到 32 道单选、16 道多选、12 张卡片；新题 id 为 `production-006` 起、卡片为 `production-c04` 起，编号连续

**来源章节与分配（都在 C4_交付上线）：** `4_3_大模型应用生产实践` 约 20 道、`4_4_大模型应用安全合规` 约 28 道（合计 48，含已有 5 道样题，每章可 ±3）。`4_0` 和 `5_1` 没有正文，不作为来源。

- [ ] **Step 1: 做覆盖表** 对每个来源章节运行 `node scripts/nb-text.mjs "<笔记路径>" | grep -E '^#{1,3} '`，列出小节标题。然后写 `docs/coverage/production.md`：

```markdown
# 生产环境应用实践（production）覆盖表

| 章节 | 小节（笔记标题） | 计划题数 | 题目 id | 卡片 id |
|---|---|---|---|---|
| 4_4_… | … | 2 | production-006, production-007 | production-c04 |
```
按小节的内容量分配题数，没有考点的小节写 0。先填入已有的 `production-001`～`production-005`、`production-c01`～`production-c03`。

- [ ] **Step 2: 按章出题** 按覆盖表逐章阅读笔记原文（用 `sed -n` 分段读），把题目和卡片追加到 `data/questions/production.json` 和 `data/cards/production.json`，编号连续。每写完一章：
  - 运行 `npm run validate -- --allow-partial`（中途出现的答案位置分布类报错可以留到 Step 4 统一处理，其他报错要立即修）；
  - 用下面的命令提交一次：
```bash
git add data/questions/production.json data/cards/production.json docs/coverage/production.md
git commit -m "feat: add production questions from <章节号>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 3: 逐题自查** 对照 Global Constraints 逐题检查（答案唯一且无歧义、多选题每个正确项都成立、不超出笔记、解析说清干扰项、无近似重复）。特别注意：安全攻击的类型名称和合规要求（例如备案、加密）要使用笔记原文的中文术语，不要自己加英文标签。直接修正问题，并回填覆盖表。

- [ ] **Step 4: 严格校验**

Run: `npm run validate -- --domain production`
Expected: 通过（严格检查 production）。答案位置分布不达标时只调整新题的选项顺序，并同步修改 `answer` 和解析。

- [ ] **Step 5: 回归测试**

Run: `npm test`，然后 `npx playwright test`，然后 `npm run size`
Expected: 全部通过，体积在预算内。

- [ ] **Step 6: 发布准备**

```bash
npm run bump
git add data docs/coverage sw.js
git commit -m "feat: complete production question bank (48 questions, 12 cards)" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

- [ ] **Step 7: 推送（需要用户同意）** 确认已获同意后执行 `git push`，然后运行 `curl -s https://18826400652.github.io/acp-study/sw.js | head -1` 确认线上已是新的 CACHE_VERSION。

---

### Task 8: 整卷检查、全量校验与收尾

**Files:**
- Create: `tests/unit/bank.test.mjs`, `tests/e2e/full-bank.spec.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 2–7 完成的全部题库；Task 2 的 `allocate`、`EXAM_SIZE`（`js/exam.js`）
- Produces: 严格模式下的全量校验通过；模拟考能抽满 75 道题，而且不会弹出「题库尚未补全」的提示

- [ ] **Step 1: 写题量充足性测试** `tests/unit/bank.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { allocate, EXAM_SIZE } from '../../js/exam.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
// 每个考点的题量至少是一套模拟考抽题数的 2 倍，保证每次抽到的题有变化
const VARIETY_FACTOR = 2;

test('every domain has enough questions for varied full mock exams', () => {
  const domains = read('data/domains.json');
  const weights = domains.map((d) => d.weight);
  ['single', 'multi'].forEach((type) => {
    const need = allocate(weights, EXAM_SIZE[type]);
    domains.forEach((d, i) => {
      const have = read(`data/questions/${d.id}.json`).filter((q) => q.type === type).length;
      assert.ok(have >= need[i] * VARIETY_FACTOR, `${d.id} ${type}: ${have} < ${need[i] * VARIETY_FACTOR}`);
    });
  });
});
```

- [ ] **Step 2: 写整卷 e2e** `tests/e2e/full-bank.spec.mjs`

```js
import { test, expect } from '@playwright/test';

test('a full bank starts a standard 75-question exam without a shortfall prompt', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', (d) => { dialogs += 1; return d.accept(); });
  await page.goto('./#/exam');
  await page.getByRole('button', { name: '开始模拟考' }).click();
  await expect(page.locator('.exam-progress')).toHaveText('第 1/75 题');
  await page.getByRole('button', { name: '答题卡' }).click();
  await expect(page.locator('.sheet-cell')).toHaveCount(75);
  await expect(page.locator('.sheet .muted')).toHaveText('第 1–50 题单选，第 51–75 题多选');
  expect(dialogs).toBe(0);
});
```

- [ ] **Step 3: 全量验证**

依次运行，每一条都必须成功：
```bash
npm run validate
npm test
npm run test:cov
npm run size
npx playwright test
```
Expected:
- 严格模式校验通过，并输出「300 道题，72 张卡片」左右；
- 单元测试（含 bank.test）全部通过，覆盖率 ≥ 80%；
- 体积在预算内；
- e2e 全部通过（含 full-bank）。

- [ ] **Step 4: 更新 README** 修改 `README.md`：
  - 开头的功能说明后面加一句：「题库：约 300 道题（单选约 200、多选约 100），72 张速记卡片，按考试大纲权重覆盖 6 个考点。」
  - 本地开发一节里，把 `npm run validate` 那一行的注释改为 `# 题库校验（单个考点：-- --domain <id>）`。
  - 发布一节的第 1 步改为：「修改题库或代码后运行 `npm run bump`，把 `sw.js` 的 `CACHE_VERSION` 加 1，否则手机上不会提示更新。」
  - 删掉所有「题库补全前」的说明。

- [ ] **Step 5: 发布**

```bash
npm run bump
git add tests README.md sw.js
git commit -m "test: guard full-exam bank size and finish phase 2" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```
确认已获用户同意后执行 `git push`。然后请用户在手机上打开站点：页面顶部应提示「内容已更新」，点击刷新后开始一套模拟考，确认抽满 75 题、没有弹出「题库尚未补全」。
