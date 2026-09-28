# 加密面试题库 第二阶段（选择题）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为面试题库 A–F 类出约 120 道选择题（明文只在本机 prep 目录），构建时校验并随密文发布，手机上可以分类练习、进错题本。

**Architecture:** Task 1 扩展构建工具链：
- `scripts/interview-lib.mjs` 读取 `<prep>/qbank-app/questions/iv-*.json`，复用 `scripts/validate-lib.mjs` 的题目规则做校验（新增只校验题目的 `questionsOnly` 模式），再并入 payload。
- 新增不需要密码的 `npm run validate:interview`，供出题批次自检。

App 端的练习、错题本、首页正确率在第一阶段已经按题库区分，这里只做一处小改进：出处显示成「A3. 题目标题」。

Task 2–4 是内容任务：子代理阅读本机问答原文，把题目写进 prep 目录，**不写入本仓库**。

**Tech Stack:** Node 26 `node:test`、Playwright；原生 ES2019 浏览器模块。

**Spec:** `docs/specs/2026-09-28-interview-bank-design.md`（§1 题量表、§3.1、§3.4、§7 第 2 条）；ACP 题目格式见 `docs/specs/2026-09-27-acp-study-app-design.md` §4。

**分支：** `feat/interview-mcq`，基于 `main`。

## Global Constraints

- 浏览器端代码（`js/**`）只用 ES2019 语法：不用 `?.`、`??`、类字段、`replaceAll`；禁止 `innerHTML`；DOM 一律用 `h()` 构建；更新状态时返回新对象，不修改原对象。
- 每个文件不超过 400 行；320–412px 宽度下没有横向滚动。
- **仓库中不得出现真实面试内容**：测试夹具只用虚构内容；不写本地面试准备目录的路径，也不写目标单位名、个人项目名或它们的拼音。选择题明文只存在于 `<prep>/qbank-app/questions/`。
- 提交信息使用 conventional commits 格式，并以这两行结尾：
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL
  ```
- 选择题题量（spec §1，单选 : 多选约为 2 : 1）：

  | 类别 | 单选 | 多选 |
  |---|---|---|
  | A | 20 | 10 |
  | B | 17 | 8 |
  | C | 10 | 5 |
  | D | 13 | 7 |
  | E | 10 | 5 |
  | F | 10 | 5 |
  | G、H | 0 | 0 |

  每项允许偏差 ±3。

- 题目格式与 ACP 相同：`{id:'iv-a-001', domain:'iv-a', type:'single'|'multi', stem, options:[3–6 项], answer:[下标], explanation, source:'A3'}`。`source` 必须是**本类别**里存在的问答编号。

## Review Focus

1. **prep 目录里还没有 `qbank-app/questions/` 目录**（第一阶段的状态）：构建和校验都照常进行，选择题数为 0。由 Task 1 的单元测试覆盖。
2. **选择题文件不是合法 JSON，或文件名写错**（例如 `iv-A.json`、`a.json`）：报错信息要写明文件名，并且不生成密文。由 Task 1 覆盖。
3. **某题的 `source` 指向别的类别，或指向不存在的编号**（例如 A 类题写成 `B3` 或 `A99`）：必须被拒绝。由 Task 1 覆盖。
4. **只出了部分类别的题**（出题期间的中间状态）：`validate:interview` 默认只对已有题目的类别检查题量，还没出题的类别不报错。由 Task 1 覆盖。
5. **题目里混入个人经历或项目细节**，例如取材自「我在项目里怎么做」一段：内容审查必须逐题检查。由 Task 2–4 的内容审查覆盖。

---

### Task 1: 构建工具链支持选择题

**Files:**
- Modify: `scripts/validate-lib.mjs`（新增 `questionsOnly` 选项）
- Modify: `scripts/interview-lib.mjs`（新增 `IV_MCQ_TARGETS`、`loadQuestions`、`validateInterviewQuestions`；`buildPayload` 增加第三个参数）
- Create: `scripts/validate-interview.mjs`
- Modify: `scripts/build-interview.mjs`
- Modify: `js/interview.js`（`toBankData` 把出处显示成「编号. 标题」）
- Create: `tests/fixtures/interview/qbank-app/questions/iv-a.json`
- Modify: `tests/unit/validate-lib.test.mjs`、`tests/unit/interview-lib.test.mjs`、`tests/unit/interview-cli.test.mjs`、`tests/unit/interview.test.mjs`
- Modify: `tests/e2e/iv-helpers.mjs`
- Create: `tests/e2e/iv-practice.spec.mjs`
- Modify: `package.json`（`scripts` 加 `validate:interview`）、`README.md`

**Interfaces:**
- Produces（供 Task 2–4 使用）：
  - 命令：`INTERVIEW_SRC=<prep> npm run validate:interview [-- --domains iv-a,iv-b | --allow-partial]`
    - 退出码：0 表示通过，1 表示有问题并列出错误。
    - 通过时逐类打印一行，格式为「iv-a 单选 20 / 多选 10」。
  - `validateData(data, { questionsOnly: true, strictDomains })`：不检查卡片，也不检查权重之和。
  - `loadQuestions(srcDir) → {[domainId]: Question[]}`：目录不存在时返回 `{}`。
  - `validateInterviewQuestions(payload, questions, { strictDomains?, targets? }) → string[]`：`strictDomains` 默认为已有题目的类别。
  - `buildPayload(sources, builtAt, questions = {})`

- [ ] **Step 1: 写虚构的选择题夹具** `tests/fixtures/interview/qbank-app/questions/iv-a.json`（内容全部虚构，对应第一阶段的 A-sample.md）

```json
[
  {
    "id": "iv-a-001", "domain": "iv-a", "type": "single",
    "stem": "按示例题库的说法，示例循环和普通调用最主要的区别是什么？",
    "options": ["示例循环由模型决定下一步", "示例循环只调用一次模型", "普通调用会自动重试", "两者没有区别"],
    "answer": [0], "explanation": "示例题库的结论写明：示例循环由模型决定下一步；普通调用是一问一答。", "source": "A1"
  },
  {
    "id": "iv-a-002", "domain": "iv-a", "type": "single",
    "stem": "示例题库建议工具名字采用哪种结构？",
    "options": ["纯名词", "动宾结构", "缩写", "随机编号"],
    "answer": [1], "explanation": "原理部分写明：名字用动宾结构。", "source": "A2"
  },
  {
    "id": "iv-a-003", "domain": "iv-a", "type": "single",
    "stem": "示例题库把记忆分成哪两类？",
    "options": ["缓存和日志", "输入和输出", "短期记忆和长期记忆", "本地和远程"],
    "answer": [2], "explanation": "结论写明：分短期记忆和长期记忆两类。", "source": "A3"
  },
  {
    "id": "iv-a-004", "domain": "iv-a", "type": "multi",
    "stem": "关于示例循环的代价，下列哪些说法符合示例题库？",
    "options": ["每一步都要调用一次模型", "成本随步数增长", "完全不需要设置最大步数", "需要设置最大步数"],
    "answer": [0, 1, 3], "explanation": "取舍部分说每步都要调用模型、成本随步数增长；原理部分说需要设置最大步数。", "source": "A1"
  }
]
```

- [ ] **Step 2: 先写失败的测试**

在 `tests/unit/validate-lib.test.mjs` 末尾追加：

```js
test('questionsOnly mode skips card rules, card counts and the weight sum', () => {
  const domains = [{ id: 'iv-a', name: '甲', short: 'A', weight: 20, target: { single: 6, multi: 2 }, chapters: ['A1', 'A2'] }];
  const qs = [1, 2, 3, 4].map((n) => q(n, { id: `iv-a-00${n}`, domain: 'iv-a', source: 'A1', stem: `题${n}` }))
    .concat([5, 6].map((n) => q(n, { id: `iv-a-00${n}`, domain: 'iv-a', source: 'A2', stem: `题${n}`, type: 'multi', answer: n === 5 ? [0, 1] : [1, 2, 3] })));
  const data = { domains, cards: {}, questions: { 'iv-a': qs } };
  assert.ok(validateData(data).some((e) => e.includes('权重之和')));
  assert.deepEqual(validateData(data, { questionsOnly: true }), []);
  const few = { ...data, questions: { 'iv-a': qs.slice(0, 1) } };
  assert.ok(validateData(few, { questionsOnly: true }).some((e) => e.includes('single 题数 1')));
  assert.ok(!validateData(few, { questionsOnly: true }).some((e) => e.includes('卡片数')));
});
```

在 `tests/unit/interview-lib.test.mjs` 追加（import 中补上 `loadQuestions, validateInterviewQuestions, IV_MCQ_TARGETS`）：

```js
test('loadQuestions reads iv-*.json files and returns {} without a questions folder', (t) => {
  assert.deepEqual(Object.keys(loadQuestions(FIXTURE)), ['iv-a']);
  assert.equal(loadQuestions(FIXTURE)['iv-a'].length, 4);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iv-q-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.deepEqual(loadQuestions(dir), {});
  fs.mkdirSync(path.join(dir, 'qbank-app', 'questions'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'qbank-app', 'questions', 'iv-b.json'), '{oops');
  assert.throws(() => loadQuestions(dir), /iv-b\.json: JSON 解析失败/);
  fs.writeFileSync(path.join(dir, 'qbank-app', 'questions', 'iv-b.json'), '{}');
  assert.throws(() => loadQuestions(dir), /iv-b\.json: 内容应为数组/);
  fs.writeFileSync(path.join(dir, 'qbank-app', 'questions', 'iv-b.json'), '[]');
  fs.writeFileSync(path.join(dir, 'qbank-app', 'questions', 'iv-A.json'), '[]');
  assert.throws(() => loadQuestions(dir), /选择题文件名不对：iv-A\.json/);
});

test('buildPayload attaches questions and keeps empty lists for the rest', () => {
  const payload = buildPayload(loadSources(FIXTURE), 'x', loadQuestions(FIXTURE));
  assert.equal(payload.questions['iv-a'].length, 4);
  assert.deepEqual(payload.questions['iv-b'], []);
  assert.deepEqual(buildPayload(loadSources(FIXTURE), 'x').questions['iv-a'], []);
});

test('validateInterviewQuestions checks format, sources and counts of banks that have questions', () => {
  const questions = loadQuestions(FIXTURE);
  const payload = buildPayload(loadSources(FIXTURE), 'x', questions);
  const small = { A: { single: 3, multi: 1 }, B: { single: 0, multi: 0 } };
  assert.deepEqual(validateInterviewQuestions(payload, questions, { targets: small }), []);
  assert.ok(validateInterviewQuestions(payload, questions).some((e) => e.includes('single 题数 3，目标 20±3')));
  assert.deepEqual(validateInterviewQuestions(payload, questions, { strictDomains: [] }), []);
  const moved = { 'iv-a': questions['iv-a'].map((q, i) => (i === 0 ? { ...q, source: 'B1' } : q)) };
  assert.ok(validateInterviewQuestions(payload, moved, { targets: small }).some((e) => e.includes('iv-a-001') && e.includes('source 应为本类别的问答编号')));
  const missing = { 'iv-a': questions['iv-a'].map((q, i) => (i === 0 ? { ...q, source: 'A99' } : q)) };
  assert.ok(validateInterviewQuestions(payload, missing, { targets: small }).some((e) => e.includes('source 不是已知章节：A99')));
  assert.ok(validateInterviewQuestions(payload, { 'iv-z': [] }).some((e) => e.includes('iv-z')));
  assert.equal(IV_MCQ_TARGETS.A.single, 20);
});
```

在 `tests/unit/interview.test.mjs` 追加：

```js
test('toBankData labels question sources with the card number and title', () => {
  const payload = {
    version: 1,
    domains: [{ id: 'iv-a', letter: 'A', name: '甲', intro: [], weight: 20 }],
    cards: { 'iv-a': [{ id: 'iv-a-c01', domain: 'iv-a', no: 'A1', title: '示例标题' }] },
    questions: { 'iv-a': [{ id: 'iv-a-001', domain: 'iv-a', source: 'A1' }, { id: 'iv-a-002', domain: 'iv-a', source: 'A9' }] },
  };
  const data = toBankData(payload);
  assert.equal(data.questionById.get('iv-a-001').source, 'A1. 示例标题');
  assert.equal(data.questionById.get('iv-a-002').source, 'A9');
  assert.equal(payload.questions['iv-a'][0].source, 'A1');
});
```

在 `tests/unit/interview-cli.test.mjs` 追加（放在已有的辅助函数之后）：

```js
test('validate:interview passes the fixture in partial mode and fails strict counts', (t) => {
  const dir = tempDir(t);
  fs.cpSync(FIXTURE, dir, { recursive: true });
  const partial = run('validate-interview.mjs', { INTERVIEW_SRC: dir }, ['--allow-partial']);
  assert.equal(partial.status, 0, partial.stderr);
  assert.match(partial.stdout, /iv-a 单选 3 \/ 多选 1/);
  const strict = run('validate-interview.mjs', { INTERVIEW_SRC: dir });
  assert.notEqual(strict.status, 0);
  assert.match(strict.stderr, /single 题数 3，目标 20±3/);
  const unknown = run('validate-interview.mjs', { INTERVIEW_SRC: dir }, ['--domains', 'iv-z']);
  assert.match(unknown.stderr, /未知类别：iv-z/);
  assert.match(run('validate-interview.mjs', { INTERVIEW_SRC: '' }).stderr, /INTERVIEW_SRC/);
});
```

再在同一文件里修改已有的「build writes a working envelope…」测试：`assert.match(build.stdout, /8 个类别，8 张卡片/)` 之后加一行 `assert.match(build.stdout, /0 道选择题/);`。

- [ ] **Step 3: 运行测试，确认失败**

Run: `npm test`
Expected: 新增的测试失败（`questionsOnly` 不生效、`loadQuestions` 未导出、`validate-interview.mjs` 不存在、出处没有加标题、构建输出里没有「0 道选择题」）。

- [ ] **Step 4: 修改 `scripts/validate-lib.mjs`**

`checkCounts` 增加参数 `questionsOnly`，为 true 时跳过卡片数检查；`validateData` 的实现改为：

```js
function checkCounts(domain, qs, cs, questionsOnly) {
  const errs = [];
  ['single', 'multi'].forEach((type) => {
    const have = qs.filter((q) => q.type === type).length;
    const want = domain.target[type];
    if (Math.abs(have - want) > COUNT_TOLERANCE) {
      errs.push(`questions/${domain.id}.json: ${type} 题数 ${have}，目标 ${want}±${COUNT_TOLERANCE}`);
    }
  });
  if (!questionsOnly && !inRange(cs.length, CARD_RANGE)) {
    errs.push(`cards/${domain.id}.json: 卡片数 ${cs.length}，应在 ${CARD_RANGE.min}–${CARD_RANGE.max} 之间`);
  }
  return errs;
}

// questionsOnly：面试题库只校验选择题，卡片与权重由 interview-lib 自己负责
export function validateData({ domains, cards, questions }, { allowPartial = false, strictDomains = null, questionsOnly = false } = {}) {
  const errors = checkDomains(domains).filter((e) => !(questionsOnly && e.includes('权重之和')));
  const chapters = new Set([].concat(...domains.map((d) => d.chapters || [])));
  const seen = new Set();
  const countsFor = (id) => (strictDomains ? strictDomains.indexOf(id) !== -1 : !allowPartial);
  domains.forEach((d) => {
    const qs = questions[d.id] || [];
    const cs = questionsOnly ? [] : (cards[d.id] || []);
    qs.forEach((q) => errors.push(...checkQuestion(q, d.id, chapters, seen)));
    cs.forEach((c) => errors.push(...checkCard(c, d.id, chapters, seen)));
    errors.push(...checkBalance(d.id, qs));
    if (countsFor(d.id)) errors.push(...checkCounts(d, qs, cs, questionsOnly));
  });
  return errors.concat(checkDuplicateStems(domains, questions));
}
```

- [ ] **Step 5: 修改 `scripts/interview-lib.mjs`**

在文件顶部的 import 中加入 `import { validateData } from './validate-lib.mjs';`，然后新增以下代码，并修改 `buildPayload`：

```js
export const IV_MCQ_TARGETS = {
  A: { single: 20, multi: 10 },
  B: { single: 17, multi: 8 },
  C: { single: 10, multi: 5 },
  D: { single: 13, multi: 7 },
  E: { single: 10, multi: 5 },
  F: { single: 10, multi: 5 },
  G: { single: 0, multi: 0 },
  H: { single: 0, multi: 0 },
};
const QUESTION_FILE_RE = /^(iv-[a-h])\.json$/;

export function loadQuestions(srcDir) {
  const dir = path.join(srcDir, 'qbank-app', 'questions');
  if (!fs.existsSync(dir)) return {};
  const out = {};
  fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().forEach((name) => {
    const m = QUESTION_FILE_RE.exec(name);
    if (!m) throw new Error(`选择题文件名不对：${name}（应为 iv-a.json … iv-h.json）`);
    let list;
    try {
      list = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    } catch (err) {
      throw new Error(`${name}: JSON 解析失败 - ${err.message}`);
    }
    if (!Array.isArray(list)) throw new Error(`${name}: 内容应为数组`);
    out[m[1]] = list;
  });
  return out;
}

function sourceLetterErrors(payload, questions) {
  const errs = [];
  payload.domains.forEach((d) => (questions[d.id] || []).forEach((q) => {
    if (q && typeof q.source === 'string' && q.source.charAt(0) !== d.letter) {
      errs.push(`questions/${d.id}.json ${q.id}: source 应为本类别的问答编号（${d.letter}n），实际 ${q.source}`);
    }
  }));
  return errs;
}

export function validateInterviewQuestions(payload, questions, options = {}) {
  const targets = options.targets || IV_MCQ_TARGETS;
  const known = new Set(payload.domains.map((d) => d.id));
  const stray = Object.keys(questions).filter((id) => !known.has(id))
    .map((id) => `questions/${id}.json: 没有对应的问答类别`);
  const domains = payload.domains.map((d) => ({
    id: d.id,
    weight: d.weight,
    target: targets[d.letter] || { single: 0, multi: 0 },
    chapters: payload.cards[d.id].map((c) => c.no),
  }));
  const strictDomains = options.strictDomains
    || domains.filter((d) => (questions[d.id] || []).length > 0).map((d) => d.id);
  return stray
    .concat(sourceLetterErrors(payload, questions))
    .concat(validateData({ domains, cards: {}, questions }, { strictDomains, questionsOnly: true }));
}
```

把 `buildPayload` 的签名改为 `export function buildPayload(sources, builtAt, questions = {})`，并把其中的 `questions[p.domain.id] = [];` 改为 `out[p.domain.id] = questions[p.domain.id] || [];`。函数内原来的局部变量 `questions` 需要改名为 `out`，以免和参数重名；return 时返回 `questions: out`。

- [ ] **Step 6: 写** `scripts/validate-interview.mjs`

```js
import { loadSources, loadQuestions, buildPayload, validateInterviewQuestions } from './interview-lib.mjs';

// 用法：INTERVIEW_SRC=<prep 目录> npm run validate:interview [-- --domains iv-a,iv-b | --allow-partial]
function strictFrom(argv, payload) {
  if (argv.includes('--allow-partial')) return [];
  const flag = argv.indexOf('--domains');
  if (flag === -1) return undefined;
  const ids = String(argv[flag + 1] || '').split(',').filter(Boolean);
  const known = payload.domains.map((d) => d.id);
  const unknown = ids.filter((id) => known.indexOf(id) === -1);
  if (unknown.length) throw new Error(`未知类别：${unknown.join('、')}（可选：${known.join('、')}）`);
  return ids;
}

function main() {
  const src = process.env.INTERVIEW_SRC;
  if (!src) throw new Error('请设置环境变量 INTERVIEW_SRC（面试准备目录）');
  const questions = loadQuestions(src);
  const payload = buildPayload(loadSources(src), 'validate', questions);
  const errors = validateInterviewQuestions(payload, questions, { strictDomains: strictFrom(process.argv.slice(2), payload) });
  if (errors.length) {
    console.error(`选择题校验失败，共 ${errors.length} 个问题：`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  payload.domains.forEach((d) => {
    const qs = payload.questions[d.id];
    const count = (type) => qs.filter((q) => q.type === type).length;
    process.stdout.write(`${d.id} 单选 ${count('single')} / 多选 ${count('multi')}\n`);
  });
  process.stdout.write('选择题校验通过\n');
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
```

在 `package.json` 的 `scripts` 中加上 `"validate:interview": "node scripts/validate-interview.mjs",`。

- [ ] **Step 7: 修改 `scripts/build-interview.mjs`**

- import 中加入 `loadQuestions, validateInterviewQuestions`。
- 改为 `const questions = loadQuestions(src);` 和 `const payload = buildPayload(sources, new Date().toISOString(), questions);`。
- **在防泄漏扫描之后、加密之前**插入：

```js
  const questionErrors = validateInterviewQuestions(payload, questions);
  if (questionErrors.length) {
    throw new Error(`选择题校验失败，共 ${questionErrors.length} 个问题：\n${questionErrors.map((e) => `  - ${e}`).join('\n')}`);
  }
```

- 成功信息改为 `…${cards.length} 张卡片（${todo} 张含待补），${nq} 道选择题，密文 … KB`，其中 `const nq = [].concat(...payload.domains.map((d) => payload.questions[d.id])).length;`。

- [ ] **Step 8: 修改 `js/interview.js` 的 `toBankData`**：给有对应卡片的题目换上带标题的出处，不修改原 payload。

```js
  const cards = [].concat(...domains.map((d) => payload.cards[d.id] || []));
  const titleByNo = new Map(cards.map((c) => [c.no, c.title]));
  const label = (q) => (titleByNo.has(q.source) ? { ...q, source: `${q.source}. ${titleByNo.get(q.source)}` } : q);
  const questions = [].concat(...domains.map((d) => (questionMap[d.id] || []).map(label)));
```

（以上三行替换原来 `cards` 与 `questions` 两个变量的定义，其余不变。）

- [ ] **Step 9: e2e**

`tests/e2e/iv-helpers.mjs`：import 中加入 `loadQuestions`，并改为 `export const FIXTURE_PAYLOAD = buildPayload(loadSources(FIXTURE_SRC), '2026-01-01T00:00:00Z', loadQuestions(FIXTURE_SRC));`

新建 `tests/e2e/iv-practice.spec.mjs`：

```js
import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap, choose, currentQid, wrongChoice } from './helpers.mjs';
import { serveEnvelope, unlock, FIXTURE_PAYLOAD } from './iv-helpers.mjs';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await serveEnvelope(page);
  await unlock(page);
});

const questionById = (id) => FIXTURE_PAYLOAD.questions['iv-a'].filter((q) => q.id === id)[0];

test('practising interview MCQs feeds the interview wrong book only', async ({ page }, testInfo) => {
  await page.goto('./#/iv/learn/iv-a');
  await page.getByRole('link', { name: '开始练习（4 题）' }).click();
  await expect(page).toHaveURL(/#\/iv\/practice\/iv-a$/);
  const qid = await currentQid(page);
  await choose(page, wrongChoice(questionById(qid)));
  await page.getByRole('button', { name: '提交答案' }).click();
  await expect(page.locator('.feedback-verdict')).toContainText('回答错误');
  await expect(page.locator('.question .source')).toHaveText(/^出处：A\d\. /);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-practice');
  await page.locator('.tab[data-tab="wrong"]').click();
  await expect(page).toHaveURL(/#\/iv\/wrong$/);
  await expect(page.locator('.review-list > li')).toHaveCount(1);
  await expect(page.locator('.chip-filter').nth(1)).toHaveText('A 类 1');
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.recommend')).toContainText('复习选择题错题（1 道）');
  await expect(page.locator('.domain-row').first()).toContainText('选择题正确率 0%');
  await page.getByRole('link', { name: 'ACP 认证' }).click();
  await page.locator('.tab[data-tab="wrong"]').click();
  await expect(page.locator('.empty')).toContainText('错题本是空的');
});

test('a category without questions still offers no practice link', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-b');
  await expect(page.getByRole('link', { name: /开始练习/ })).toHaveCount(0);
});
```

- [ ] **Step 10: README** 在「面试题库（加密）」一节追加：

````markdown
**选择题**：放在 `<prep 目录>/qbank-app/questions/iv-a.json` … `iv-f.json`（格式与 ACP 题目相同，`source` 写问答编号，如 `A3`）。不用密码就能先校验：

```powershell
$env:INTERVIEW_SRC = "<prep 目录>"
npm run validate:interview                     # 只对已有题目的类别检查题量
npm run validate:interview -- --domains iv-a,iv-b
```

`build:interview` 会先做同样的校验，不通过就不生成密文。
````

- [ ] **Step 11: 运行全部测试**

Run: `npm test && npm run test:cov && npm run validate && npx playwright test && npm run size`
Expected: 全部通过。已有的面试 e2e 不受影响：iv-b 仍然没有题目，iv-a 的练习入口显示 4 题。

- [ ] **Step 12: 提交**

```bash
git add scripts js/interview.js tests package.json README.md
git commit -m "feat: validate and bundle interview multiple-choice questions"
```

---

### Task 2–4: 出题（内容任务）

三个任务结构相同，只是范围不同：

| 任务 | 类别 | 单选 / 多选 | 写入文件 |
|---|---|---|---|
| Task 2 | A、B | A 20/10，B 17/8 | `iv-a.json`、`iv-b.json` |
| Task 3 | C、D | C 10/5，D 13/7 | `iv-c.json`、`iv-d.json` |
| Task 4 | E、F | E 10/5，F 10/5 | `iv-e.json`、`iv-f.json` |

**Files（全部在 prep 目录，不在本仓库）:**
- 读：`<prep>/qbank/<字母>-*.md`
- 写：`<prep>/qbank-app/questions/iv-<字母>.json`（目录不存在就新建）

**出题规则：**

1. **取材范围**：只依据问答的「结论」「原理」「取舍与局限」三段。**不得**使用「我在项目里怎么做」一段的内容；**不得**出现个人经历、项目名、代码路径、目标单位名或任何人名。
2. **覆盖面**：每道问答至少出 1 题，题量表剩余的名额分给内容更多的问答。`source` 填对应的问答编号。
3. **不出题的内容**：
   - 含【待补】或【待 Task 12】的片段不出题。
   - F 类中标了 ⚠️ 的法规和时限细节不出题。
   - 问答原文没有写到的事实不出题，宁可少出，不要编造。
4. **题干和选项**：
   - 题干写成独立完整的问题，不要写「根据上文」。
   - 干扰项要似是而非，最好取自相邻概念的常见混淆。
   - 选项 3–6 个，通常 4 个。
   - 单选题不得出现「以上都对」这类选项。
   - 否定式题干（「哪项不正确」）每类最多 20%，并把「不」字加粗写成「**不**正确」。
5. **答案分布**：
   - 单选题的正确选项在 A、B、C、D 之间大致均匀，任一字母不超过 40%。
   - **正确选项严格最长的单选题，占比目标不超过 25%**（校验上限是 35%）。可以把干扰项写得和正确项一样具体，也可以把正确项写短。
   - 多选题的正确个数在 2、3、4 之间变化，同一选项位置作为正确答案的比例不超过 75%。
6. **解析**：说明为什么对，并点出主要干扰项错在哪里，依据要能在对应问答原文中找到。
7. **格式**：
   - id 从 `iv-<字母>-001` 开始连续编号。
   - 字段、类型与 Task 1 的夹具完全一致。
   - 文件是 UTF-8 编码的 JSON 数组，缩进 2 空格。

**步骤：**
- [ ] 通读该批次两个类别的 md。
- [ ] 按上面的规则写题。
- [ ] 校验：`INTERVIEW_SRC=<prep> npm run validate:interview -- --domains iv-<x>,iv-<y>`，直到通过。
- [ ] 自查：
  - 逐题核对原文依据；
  - 统计每类「正确项严格最长」的单选题占比（应不超过 25%）；
  - 全文搜索确认没有个人项目名、代码路径或单位名。
- [ ] **不在本仓库提交任何东西**。在报告中写明题数、各字母的分布、正确项最长的占比，以及跳过了哪些问答或片段、原因是什么。

**内容审查（由控制方派发）：** 审查者对照 md 原文逐题检查：
- 答案唯一且正确；
- 题目没有超出原文范围；
- 干扰项合理；
- 解析准确；
- 没有取材于「项目做法」段落，也没有个人信息；
- 近似重复的题目；
- 正确项长度这条线索。

---

### Task 5（控制方与用户）：发布

1. 控制方运行 `INTERVIEW_SRC=<prep> npm run validate:interview`，对全部类别做严格校验，必须通过。
2. 控制方询问用户：是否把 `<prep>/qbank-app/questions/` 提交到用户本地的面试准备仓库，作为备份。
3. 用户在自己的 PowerShell 里运行 `npm run build:interview`，然后运行 `npm test`（设置了 `INTERVIEW_SRC`，会跑真实题库的防泄漏检查）。
4. 控制方检查密文，运行 `npm run bump`，提交 `data/interview.enc` 和 `sw.js`，征得用户同意后推送，再请用户真机验收。
