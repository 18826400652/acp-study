# ACP 备考站 · 卡片讲解、知识地图与查漏补缺 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 每张 ACP 卡片都能展开讲解，关键卡片配流程图；每个考点有一张可折叠的知识地图；按课程笔记补齐漏掉的知识点，卡片从约 116 张增加到约 145 张。

**Architecture:**
- 卡片 JSON 增加可选字段 `explain`。新增 `data/maps/<domain>.json`，存放知识地图的树。
- 新增 4 个前端模块：
  - `js/knowledge-map.js`：纯函数；
  - `js/views/explain.js`：讲解面板；
  - `js/views/flow.js`：流程图；
  - `js/views/map.js`：地图页，路由 `#/map/<domain>`。
- 校验脚本按「严格考点」强制两件事：每张卡都有讲解，每张卡都在地图中。严格考点沿用现有题量检查的开关。
- 先完成代码（Task 1–3），再按考点逐个补内容（Task 4–10），最后收尾（Task 11）。

**Tech Stack:** 原生 ES 模块 + JSON 数据；Node 26 `node:test`；Playwright（4 个安卓视口）。

**Spec:** `docs/specs/2026-10-13-cards-explain-map-design.md`

**对 spec 的两处细化（已裁定）：**
1. 地图里的卡片节点写成 `{ "card": "<id>" }`，只有这一个字段，显示文字直接用卡片标题，避免和标题不一致。分支节点是 `{ "label", "children" }`，`label` 上限从 20 字放宽到 24 字。原因：章节名去掉编号后最长 22 字，而 Task 1 的骨架地图要用章节名作分支。
2. Task 1 会用脚本为每个考点生成一张「按章节分组」的骨架地图，所以从 Task 1 起每个考点就有一张合法地图。之后各考点任务把骨架改写成按主题组织的树。

## Global Constraints

**工程规则：**
- 所有命令在 `acp-study-app/` 目录下执行。
- 课程笔记在 `../大模型ACP认证教程/` 下（`C2_构造问答系统/`、`C3_构建Agent系统/`、`C4_交付上线/`、`C5_总结与展望/`），文件名是「章节名 + `.ipynb`」。取正文用 `node scripts/nb-text.mjs <笔记路径> > <临时文件>`，再读临时文件。临时文件放系统临时目录，不进仓库。
- DOM 只用 `js/ui.js` 的 `h()` 创建，不用 innerHTML，不引入第三方库。不写 `console.log`。数据更新保持不可变：用 `ctx.update(fn)` 返回新对象。
- 移动端 360px 宽不允许横向溢出。所有颜色、间距只用 `css/app.css` 里 `:root` 已有的变量。
- 面试题库（`#/iv/...`）的卡片和页面一律不改。
- 不要推送，推送由用户决定。
- 每次提交都用：`git commit -m "<type>: <desc>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"`

**数据规则（逐字照抄这些数值）：**
- 每个考点的卡片数为 15–35 张（`CARD_RANGE = { min: 15, max: 35 }`）。
- `explain` 字段：

  | 字段 | 是否必填 | 上限 |
  |---|---|---|
  | `plain` | 必填 | 150 字 |
  | `analogy` | 可选 | 60 字 |
  | `exam` | 必填 | 80 字 |
  | `confuse` | 可选 | 60 字 |
  | `flow` | 可选 | 1–3 条泳道，每条 2–6 步，每步 ≤10 字 |

  除这 5 个字段外不允许有其他字段。字数一律按 `[...s].length` 计。
- 地图：顶层是 `{ "domain", "title", "children" }`。分支节点是 `{ "label", "children" }`，`label` ≤24 字，`children` 不能为空。卡片节点是 `{ "card" }`。根节点算第 0 层，最深到第 4 层。
- 卡片的 `source` 可以用「、」连接多个章节。每个章节必须是任一考点 `chapters` 里的章节，或者在 `EXTRA_CHAPTERS = ['5_2_总结与展望']` 里。题目的 `source` 规则不变。

**写内容的规则（Task 4–10 适用，审查时逐张检查）：**
- **只写笔记里有的事实。** 数值、参数名、产品名、结论都必须能在 `source` 章节原文中找到。`analogy` 是比喻，可以用生活中的事物，但不能借比喻引入新的技术事实。
- **`plain`（大白话）：** 给第一次学的人讲清这张卡讲什么、为什么需要、大致怎么做。术语第一次出现时用一句话解释。不要照抄要点。
- **`exam`（考法）：** 先读本考点 `data/questions/<domain>.json` 里与这张卡相关的题，写出常见问法和判断关键。不能虚构题目。
- **`confuse`（易混点）：** 写最容易和它混淆的概念或常见错误选项，依据是相关题目的错误选项或解析。找不到依据就不写这个字段。
- **`flow`（流程图）：** 只给有明确先后顺序的知识加，例如 RAG 两阶段、工具调用循环、蒸馏流程、评测先行流程。每个考点 3–6 张，不要硬套。
- **已有卡片：** `id`、`title`、`points`、`source` 一律不改，只新增 `explain`。发现原有内容有事实错误时，停下来报告，不要自己改。
- **新卡：** id 接续本考点当前最大编号（例如 rag 当前最大是 `rag-c22`，新卡从 `rag-c23` 开始）。每张 3–5 条要点，每条 ≤40 字，标题 ≤24 字，同一考点内标题不重复，不能和已有卡片讲同一件事。文件内顺序为：先按 `domains.json` 中 `chapters` 的顺序，同一章内按覆盖表的小节顺序。
- **不补卡的情况：** 前言、课程目标、环境准备、纯操作步骤（如「确认 Python 环境」）、课后小测验、评价反馈不补卡。补卡数以逐节对照的结果为准，不为凑数补卡。
- **标点和格式：** 中文全角标点；英文术语和代码名照原文写。不要用 ASCII 引号 `"` 包中文，引用用「」。数据文件为 UTF-8、LF、2 空格缩进。

## Review Focus

1. **讲解与原文不符，或比喻里夹带了笔记没有的事实**：这是最难发现、也最伤人的错误，学错了比没学更糟。每个内容任务的审查必须对照笔记原文逐张核对 `plain`、`exam`、`confuse`。审查子代理的说明里要写明：只要找不到原文依据，就判为不通过。
2. **已有卡片的要点被改动**（有人顺手「优化」了要点）：各内容任务的 Step 8 用脚本检查已有卡片除 `explain` 外完全不变。
3. **流程图在窄屏上溢出**：3 条泳道且每步都是 10 字时，360px 宽可能撑破。Task 3 的 e2e 用「3 条泳道 × 6 步 × 10 字」的数据，在 4 个视口下检查不横向溢出。
4. **地图跳卡后位置不对**：点地图节点后卡片页没停在那张卡；或者同一张卡在地图里出现两次时跳错。Task 2 的 e2e 覆盖「点第 N 张卡 → 停在 N → 刷新后仍在 N」。
5. **离线时地图打不开**：漏把 `data/maps/*.json` 或新的 js 模块加入 Service Worker 预缓存。Task 2 加入，`sw-manifest` 单元测试检查 js 模块；e2e 的 pwa 用例照常运行。

---

### Task 1: 校验规则与骨架地图

**Files:**
- Modify: `scripts/validate-lib.mjs`、`scripts/validate-data.mjs`
- Create: `data/maps/app-dev.json`、`prompt.json`、`rag.json`、`finetune.json`、`agent-mm.json`、`production.json`（都在 `data/maps/` 下，由脚本生成）
- Create: `js/knowledge-map.js`
- Test: `tests/unit/validate-lib.test.mjs`、`tests/unit/knowledge-map.test.mjs`
- Modify: `package.json`（`test:cov` 增加 `--test-coverage-include=js/knowledge-map.js`）

**Interfaces:**
- Produces:
  - `js/knowledge-map.js`：
    - `mapCardIds(node) → string[]`：深度优先、按出现顺序，可以有重复；遇到非对象节点返回 `[]`。
    - `mapStats(map, cardStates) → { known, total }`：按去重后的卡片 id 统计；`cardStates` 就是 `progress.cards`。
  - `validateData({ domains, cards, questions, maps }, opts)`：`maps` 是可选参数，形如 `{ [domainId]: mapJson }`。
  - 导出常量：`EXPLAIN_LIMITS`、`EXPLAIN_REQUIRED`、`FLOW_LIMITS`、`MAP_LABEL_MAX_CHARS`、`MAP_MAX_DEPTH`、`EXTRA_CHAPTERS`。

- [ ] **Step 1: 写 knowledge-map 的失败测试**

`tests/unit/knowledge-map.test.mjs`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapCardIds, mapStats } from '../../js/knowledge-map.js';

const MAP = {
  domain: 'rag',
  title: '检索增强',
  children: [
    { label: '原理', children: [{ card: 'rag-c01' }, { label: '索引', children: [{ card: 'rag-c02' }] }] },
    { label: '评测', children: [{ card: 'rag-c03' }, { card: 'rag-c01' }] },
  ],
};

test('mapCardIds lists card ids depth-first, keeping repeats', () => {
  assert.deepEqual(mapCardIds(MAP), ['rag-c01', 'rag-c02', 'rag-c03', 'rag-c01']);
});

test('mapCardIds ignores malformed nodes', () => {
  assert.deepEqual(mapCardIds({ children: [null, 3, { label: 'x' }, { card: 'a' }] }), ['a']);
  assert.deepEqual(mapCardIds(null), []);
});

test('mapStats counts each card once', () => {
  assert.deepEqual(mapStats(MAP, { 'rag-c01': 'known', 'rag-c03': 'review' }), { known: 1, total: 3 });
  assert.deepEqual(mapStats(MAP, {}), { known: 0, total: 3 });
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `node --test tests/unit/knowledge-map.test.mjs`
Expected: FAIL，报找不到模块 `js/knowledge-map.js`。

- [ ] **Step 3: 实现 `js/knowledge-map.js`**

```js
// 知识地图的纯数据工具：校验脚本和地图页共用
const isNode = (n) => n !== null && typeof n === 'object' && !Array.isArray(n);

export function mapCardIds(node) {
  if (!isNode(node)) return [];
  if (typeof node.card === 'string') return [node.card];
  return Array.isArray(node.children) ? [].concat(...node.children.map(mapCardIds)) : [];
}

export function mapStats(map, cardStates) {
  const ids = [...new Set(mapCardIds(map))];
  return { known: ids.filter((id) => cardStates[id] === 'known').length, total: ids.length };
}
```

Run: `node --test tests/unit/knowledge-map.test.mjs` → PASS

- [ ] **Step 4: 写校验规则的失败测试**

在 `tests/unit/validate-lib.test.mjs` 中做三件事：

1. 把 import 改成：

```js
import { validateData, EXTRA_CHAPTERS } from '../../scripts/validate-lib.mjs';
```

2. 让 fixture 自带讲解和地图，`valid()` 在严格模式下仍要通过。把 `card` 和 `valid` 改成：

```js
const EXPLAIN = { plain: '大白话', exam: '考法' };
const card = (n, over = {}) => ({
  id: `rag-c${String(n).padStart(2, '0')}`, domain: 'rag', title: `标题${n}`, points: ['一', '二', '三'], source: '2_5_x', explain: EXPLAIN, ...over,
});
const mapOf = (cards) => ({ domain: 'rag', title: '检索增强', children: [{ label: '全部', children: cards.map((c) => ({ card: c.id })) }] });
function valid() {
  const cards = Array.from({ length: 15 }, (_, i) => card(i + 1));
  return {
    domains: DOMAINS,
    questions: { rag: [q(1), q(2), q(3), q(4), q(5, { type: 'multi', answer: [0, 1] }), q(6, { type: 'multi', answer: [1, 2] })] },
    cards: { rag: cards },
    maps: { rag: mapOf(cards) },
  };
}
```

3. 在文件末尾追加：

```js
const withCard = (over) => {
  const data = valid();
  return { ...data, cards: { rag: [card(1, over)].concat(data.cards.rag.slice(1)) } };
};
const withMap = (map) => ({ ...valid(), maps: { rag: map } });
const LONG = (n) => '字'.repeat(n);

test('card source may join several known chapters with 、', () => {
  assert.deepEqual(validateData(withCard({ source: `2_5_x、${EXTRA_CHAPTERS[0]}` })), []);
  expectError(withCard({ source: '2_5_x、9_9_不存在' }), 'source 不是已知章节');
  expectError(withCard({ source: '2_5_x、' }), 'source 不是已知章节');
});

test('explain rules', () => {
  expectError(withCard({ explain: undefined }), '缺少 explain');
  expectError(withCard({ explain: '文字' }), 'explain 必须是对象');
  expectError(withCard({ explain: { exam: '考法' } }), 'explain.plain 不能为空');
  expectError(withCard({ explain: { plain: '大白话', exam: ' ' } }), 'explain.exam 不能为空');
  expectError(withCard({ explain: { ...EXPLAIN, plain: LONG(151) } }), 'explain.plain 超过 150 字');
  expectError(withCard({ explain: { ...EXPLAIN, exam: LONG(81) } }), 'explain.exam 超过 80 字');
  expectError(withCard({ explain: { ...EXPLAIN, analogy: LONG(61) } }), 'explain.analogy 超过 60 字');
  expectError(withCard({ explain: { ...EXPLAIN, confuse: LONG(61) } }), 'explain.confuse 超过 60 字');
  expectError(withCard({ explain: { ...EXPLAIN, confuse: '' } }), 'explain.confuse 不能为空');
  expectError(withCard({ explain: { ...EXPLAIN, note: 'x' } }), 'explain 有未知字段：note');
  assert.deepEqual(validateData(withCard({ explain: { ...EXPLAIN, plain: LONG(150), exam: LONG(80), analogy: LONG(60), confuse: LONG(60) } })), []);
});

test('flow rules', () => {
  const flow = (f) => withCard({ explain: { ...EXPLAIN, flow: f } });
  assert.deepEqual(validateData(flow([['甲', '乙'], ['丙', '丁', '戊'], [LONG(10), '己']])), []);
  expectError(flow([]), 'explain.flow');
  expectError(flow([['甲', '乙'], ['甲', '乙'], ['甲', '乙'], ['甲', '乙']]), 'explain.flow');
  expectError(flow([['甲']]), 'explain.flow');
  expectError(flow([['1', '2', '3', '4', '5', '6', '7']]), 'explain.flow');
  expectError(flow([['甲', LONG(11)]]), 'explain.flow');
  expectError(flow([['甲', '']]), 'explain.flow');
  expectError(flow('甲→乙'), 'explain.flow');
});

test('map rules', () => {
  const base = valid().maps.rag;
  expectError({ ...valid(), maps: {} }, '缺少知识地图');
  expectError(withMap({ ...base, domain: 'prompt' }), 'domain 应为 rag');
  expectError(withMap({ ...base, title: '' }), 'title 不能为空');
  expectError(withMap({ ...base, children: [] }), 'children 不能为空');
  expectError(withMap({ ...base, children: base.children.concat({ label: LONG(25), children: [{ card: 'rag-c01' }] }) }), 'label 超过 24 字');
  expectError(withMap({ ...base, children: base.children.concat({ label: '空', children: [] }) }), '分支节点 children 不能为空');
  expectError(withMap({ ...base, children: base.children.concat({ card: 'rag-c01', label: '多余' }) }), '卡片节点只能有 card 字段');
  expectError(withMap({ ...base, children: base.children.concat({ card: 'prompt-c01' }) }), '引用了不属于本考点的卡片：prompt-c01');
  expectError(withMap({ ...base, children: [{ label: '少', children: [{ card: 'rag-c01' }] }] }), '卡片未出现在地图中：rag-c02');
  const deep = { label: '1', children: [{ label: '2', children: [{ label: '3', children: [{ label: '4', children: [{ label: '5', children: [{ card: 'rag-c01' }] }] }] }] }] };
  expectError(withMap({ ...base, children: base.children.concat(deep) }), '层级超过 4 层');
  const fourLevels = { label: '1', children: [{ label: '2', children: [{ label: '3', children: [{ card: 'rag-c01' }] }] }] };
  assert.deepEqual(validateData(withMap({ ...base, children: base.children.concat(fourLevels) })), []);
});

test('explain and full map coverage are only required for strict domains', () => {
  const data = valid();
  const loose = { ...data, cards: { rag: data.cards.rag.map((c) => ({ ...c, explain: undefined })) }, maps: {} };
  assert.deepEqual(validateData(loose, { allowPartial: true }), []);
  expectError(loose, '缺少 explain');
  const badExplain = withCard({ explain: { plain: '' } });
  expectError(badExplain, 'explain.plain 不能为空', { allowPartial: true });
});
```

注意：现有的 `count rules apply in strict mode only` 用例里，`few` 只截了 3 张卡，但地图仍引用 15 张卡，会多报「引用了不属于本考点的卡片」，导致 `allowPartial` 断言失败。把该用例里 `few` 的定义改成同时裁剪地图：

```js
const few = { ...data, questions: { rag: data.questions.rag.slice(0, 1) }, cards: { rag: data.cards.rag.slice(0, 3) }, maps: { rag: mapOf(data.cards.rag.slice(0, 3)) } };
```

文件里其他用到 `valid()` 后再截卡的用例也照此处理。改完后，现有用例都不应因为地图出现新的报错。

把现有用例 `card count must be 15 to 25 in strict mode` 整体替换为下面的版本（上限从 25 改为 35）：

```js
test('card count must be 15 to 35 in strict mode', () => {
  const data = valid();
  const many = Array.from({ length: 36 }, (_, i) => card(i + 1));
  expectError({ ...data, cards: { rag: many }, maps: { rag: mapOf(many) } }, '卡片数 36，应在 15–35 之间');
  const ok = many.slice(0, 35);
  assert.deepEqual(validateData({ ...data, cards: { rag: ok }, maps: { rag: mapOf(ok) } }), []);
  const fewer = data.cards.rag.slice(0, 14);
  expectError({ ...data, cards: { rag: fewer }, maps: { rag: mapOf(fewer) } }, '卡片数 14');
});
```

- [ ] **Step 5: 运行，确认失败**

Run: `node --test tests/unit/validate-lib.test.mjs`
Expected: 新增用例 FAIL，例如「expected "缺少 explain"」或 `EXTRA_CHAPTERS` 为 undefined。

- [ ] **Step 6: 实现校验**

修改 `scripts/validate-lib.mjs`。

（1）文件顶部加 import，并替换和新增常量：

```js
import { mapCardIds } from '../js/knowledge-map.js';
```

```js
export const CARD_RANGE = { min: 15, max: 35 };
export const EXPLAIN_LIMITS = { plain: 150, analogy: 60, exam: 80, confuse: 60 };
export const EXPLAIN_REQUIRED = ['plain', 'exam'];
export const FLOW_LIMITS = { lanes: 3, minSteps: 2, maxSteps: 6, stepChars: 10 };
export const MAP_LABEL_MAX_CHARS = 24;
export const MAP_MAX_DEPTH = 4;
// 不属于任何考点、但允许作为卡片出处的章节
export const EXTRA_CHAPTERS = ['5_2_总结与展望'];
```

（2）在 `checkCard` 之前加入：

```js
function checkFlow(flow, add) {
  const steps = { min: FLOW_LIMITS.minSteps, max: FLOW_LIMITS.maxSteps };
  const ok = Array.isArray(flow) && inRange(flow.length, { min: 1, max: FLOW_LIMITS.lanes })
    && flow.every((lane) => Array.isArray(lane) && inRange(lane.length, steps)
      && lane.every((s) => nonEmpty(s) && charCount(s) <= FLOW_LIMITS.stepChars));
  if (!ok) {
    add(`explain.flow 应为 1–${FLOW_LIMITS.lanes} 条泳道，每条 ${steps.min}–${steps.max} 步，每步 1–${FLOW_LIMITS.stepChars} 字`);
  }
}

function checkExplain(ex, add, required) {
  if (ex === undefined) {
    if (required) add('缺少 explain');
    return;
  }
  if (!isObject(ex)) {
    add('explain 必须是对象');
    return;
  }
  Object.keys(ex).filter((k) => !(k in EXPLAIN_LIMITS) && k !== 'flow').forEach((k) => add(`explain 有未知字段：${k}`));
  Object.keys(EXPLAIN_LIMITS).forEach((k) => {
    const v = ex[k];
    if (v === undefined && EXPLAIN_REQUIRED.indexOf(k) === -1) return;
    if (!nonEmpty(v)) add(`explain.${k} 不能为空`);
    else if (charCount(v) > EXPLAIN_LIMITS[k]) add(`explain.${k} 超过 ${EXPLAIN_LIMITS[k]} 字`);
  });
  if (ex.flow !== undefined) checkFlow(ex.flow, add);
}

const isKnownSource = (source, chapters) => typeof source === 'string'
  && source.split('、').every((ch) => chapters.has(ch));
```

（3）修改 `checkCard`：签名改为 `checkCard(c, domainId, chapters, seen, strict)`，然后：
- 把 `if (!chapters.has(c.source)) add(...)` 改成 `if (!isKnownSource(c.source, chapters)) add(\`source 不是已知章节：${c.source}\`);`
- 在 `return errs;` 之前加 `checkExplain(c.explain, add, strict);`

（4）在 `checkCounts` 之前加入地图校验：

```js
function checkMapNode(node, depth, ctx) {
  if (!isObject(node)) {
    ctx.add('地图节点必须是对象');
    return;
  }
  if (depth > MAP_MAX_DEPTH) {
    ctx.add(`层级超过 ${MAP_MAX_DEPTH} 层`);
    return;
  }
  if ('card' in node) {
    if (Object.keys(node).length !== 1) ctx.add(`卡片节点只能有 card 字段：${node.card}`);
    if (!ctx.ids.has(node.card)) ctx.add(`引用了不属于本考点的卡片：${node.card}`);
    return;
  }
  if (!nonEmpty(node.label)) ctx.add('分支节点 label 不能为空');
  else if (charCount(node.label) > MAP_LABEL_MAX_CHARS) ctx.add(`label 超过 ${MAP_LABEL_MAX_CHARS} 字：${node.label}`);
  if (!Array.isArray(node.children) || !node.children.length) ctx.add(`分支节点 children 不能为空：${node.label}`);
  else node.children.forEach((child) => checkMapNode(child, depth + 1, ctx));
}

function checkMap(map, domainId, cs, strict) {
  const where = `maps/${domainId}.json`;
  if (map === undefined) return strict ? [`${where}: 缺少知识地图`] : [];
  if (!isObject(map)) return [`${where}: 必须是对象`];
  const errs = [];
  const add = reporter(where, errs);
  if (map.domain !== domainId) add(`domain 应为 ${domainId}`);
  if (!nonEmpty(map.title)) add('title 不能为空');
  if (!Array.isArray(map.children) || !map.children.length) {
    add('children 不能为空');
    return errs;
  }
  const ids = new Set(cs.filter(isObject).map((c) => c.id));
  map.children.forEach((node) => checkMapNode(node, 1, { add, ids }));
  if (strict) {
    const listed = new Set(mapCardIds(map));
    ids.forEach((id) => { if (!listed.has(id)) add(`卡片未出现在地图中：${id}`); });
  }
  return errs;
}
```

（5）修改 `validateData`：

```js
export function validateData({ domains, cards, questions, maps = {} }, { allowPartial = false, strictDomains = null, questionsOnly = false } = {}) {
  const errors = checkDomains(domains, questionsOnly);
  const chapters = new Set([].concat(...domains.map((d) => d.chapters || [])));
  const cardChapters = new Set([...chapters, ...EXTRA_CHAPTERS]);
```

在 `domains.forEach` 内部：
- 在 `const titles` 之前加 `const strict = !questionsOnly && countsFor(d.id);`
- 把卡片那一行改成 `cs.forEach((c) => errors.push(...checkCard(c, d.id, cardChapters, seen, strict)));`
- 在 `checkBalance` 那行之后加 `if (!questionsOnly) errors.push(...checkMap(maps[d.id], d.id, cs, strict));`

题目仍用 `chapters`，不用 `cardChapters`。

- [ ] **Step 7: 运行单元测试**

Run: `npm test`
Expected: 全部 PASS，包括 interview-lib 等其他用到 `validateData` 的测试。面试题库走 `questionsOnly`，不检查卡片和地图。

- [ ] **Step 8: 让 CLI 读取地图**

修改 `scripts/validate-data.mjs`：
- 在 `const questions = {};` 之后加 `const maps = {};`
- 在 for 循环里，读完 questions 之后加：

```js
    const mapRel = `maps/${d.id}.json`;
    if (await exists(mapRel)) maps[d.id] = await readJson(mapRel);
```

- 在 `readJson` 函数之后加：

```js
async function exists(rel) {
  try {
    await fs.access(path.join(DATA, rel));
    return true;
  } catch {
    return false;
  }
}
```

- 调用改成 `validateData({ domains, cards, questions, maps }, options)`。
- 成功输出的最后一行改成：

```js
  process.stdout.write(`题库校验通过：${count(questions)} 道题，${count(cards)} 张卡片，${Object.keys(maps).length} 张知识地图${mode}\n`);
```

- [ ] **Step 9: 生成骨架地图**

运行下面这段一次性脚本：每个考点按 `chapters` 顺序为有卡片的章节建一个分支，分支下列出 `source` 包含该章节的卡片。

```bash
node -e "
const fs=require('fs');
const domains=JSON.parse(fs.readFileSync('data/domains.json','utf8'));
fs.mkdirSync('data/maps',{recursive:true});
for(const d of domains){
  const cards=JSON.parse(fs.readFileSync('data/cards/'+d.id+'.json','utf8'));
  const children=d.chapters.map(ch=>({label:ch.replace(/^\d_\d_/,'').replace(/_/g,' '),children:cards.filter(c=>c.source.split('、').includes(ch)).map(c=>({card:c.id}))})).filter(n=>n.children.length);
  fs.writeFileSync('data/maps/'+d.id+'.json',JSON.stringify({domain:d.id,title:d.name,children},null,2)+'\n');
}
"
npm run validate -- --allow-partial
```

Expected：输出「题库校验通过：… 张卡片，6 张知识地图（部分题库模式：未检查题量）」。

再运行 `npm run validate`。Expected：只报「缺少 explain」一类错误，没有地图错误。这些错误要到 Task 4–10 完成后才会消失。

- [ ] **Step 10: 覆盖率与提交**

在 `package.json` 的 `test:cov` 中，在 `--test-coverage-include=js/options.js` 之后加 `--test-coverage-include=js/knowledge-map.js`。

Run: `npm run test:cov` → PASS，覆盖率 ≥80%。

```bash
git add scripts/validate-lib.mjs scripts/validate-data.mjs js/knowledge-map.js data/maps tests/unit/validate-lib.test.mjs tests/unit/knowledge-map.test.mjs package.json
git commit -m "feat: validate card explanations and knowledge maps" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

---

### Task 2: 知识地图页

**Files:**
- Create: `js/views/map.js`
- Modify: `js/data.js`、`js/router.js`、`js/main.js`、`js/views/learn.js`、`sw.js`、`css/app.css`
- Test: `tests/unit/router.test.mjs`、`tests/e2e/map.spec.mjs`

**Interfaces:**
- Consumes: Task 1 的 `mapStats(map, cardStates)`；Task 1 生成的 `data/maps/<domain>.json`。
- Produces:
  - `loadData()` 的返回值新增 `maps: { [domainId]: mapJson }`。
  - 路由 `{ bank: 'acp', name: 'map', params: { domain } }`，只在 ACP 题库生效；`TAB_OF.map = 'learn'`。
  - `renderMap(ctx, domainId)`。
  - CSS 类名：`.map-tree`、`.map-list`、`.map-branch`、`.map-leaf`、`.map-card`、`.map-link`。

- [ ] **Step 1: 路由失败测试**

在 `tests/unit/router.test.mjs` 的 `cases` 数组中加入（放在 `['#/wrong', ...]` 之前）：

```js
  ['#/map/rag', 'acp', 'map', { domain: 'rag' }],
  ['#/map/agent-mm', 'acp', 'map', { domain: 'agent-mm' }],
  ['#/map', 'acp', 'home', {}],
  ['#/iv/map/iv-a', 'interview', 'home', {}],
```

在文件末尾加：

```js
test('the knowledge map lives under the learn tab', () => {
  assert.equal(TAB_OF.map, 'learn');
});
```

Run: `node --test tests/unit/router.test.mjs` → FAIL

- [ ] **Step 2: 实现路由**

在 `js/router.js` 的 `ROUTES` 中，`practice` 一行之后加：

```js
  { name: 'map', pattern: /^map\/([\w-]+)$/, keys: ['domain'], bank: 'acp' },
```

在 `TAB_OF` 中 `practice: 'learn',` 之后加 `map: 'learn',`。

Run: `node --test tests/unit/router.test.mjs` → PASS

- [ ] **Step 3: 加载地图数据**

把 `js/data.js` 的 `loadData` 改成：

```js
export async function loadData() {
  const domains = await getJson('data/domains.json');
  const lists = await Promise.all(['cards', 'questions', 'maps'].map((kind) => Promise.all(domains.map((d) => getJson(`data/${kind}/${d.id}.json`)))));
  const cards = [].concat(...lists[0]);
  const questions = [].concat(...lists[1]);
  const maps = {};
  domains.forEach((d, i) => { maps[d.id] = lists[2][i]; });
  return { domains, cards, questions, maps, questionById: new Map(questions.map((q) => [q.id, q])) };
}
```

- [ ] **Step 4: 写 e2e 失败测试**

`tests/e2e/map.spec.mjs`：

```js
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
```

Run: `npx playwright test tests/e2e/map.spec.mjs --project=android-360-light` → FAIL

- [ ] **Step 5: 实现地图页 `js/views/map.js`**

```js
import { h, emptyState } from '../ui.js';
import { setCardPos } from '../progress.js';
import { mapStats } from '../knowledge-map.js';

// 前两层分支默认展开，更深的默认折叠
const OPEN_DEPTH = 2;
const STATE_CHIP = { known: ['chip chip-accent', '已掌握'], review: ['chip chip-warn', '再看看'] };

function cardNode(card, state, onOpen) {
  const chip = STATE_CHIP[state];
  return h('li', { class: 'map-leaf' },
    h('button', { class: 'map-card', type: 'button', 'data-card': card.id, onClick: () => onOpen(card.id) },
      h('span', { class: 'map-card-title' }, card.title),
      chip ? h('span', { class: chip[0] }, chip[1]) : null));
}

function branchNode(node, depth, renderChild) {
  return h('li', { class: 'map-branch' },
    h('details', { open: depth <= OPEN_DEPTH },
      h('summary', {}, node.label),
      h('ul', { class: 'map-list' }, node.children.map((child) => renderChild(child, depth + 1)))));
}

export function renderMap(ctx, domainId) {
  const domain = ctx.data.domains.filter((d) => d.id === domainId)[0];
  const map = domain ? ctx.data.maps[domainId] : null;
  if (!map) return emptyState('没有找到这个考点的知识地图。', '#/learn', '返回考点列表');
  const cardById = new Map(ctx.data.cards.map((c) => [c.id, c]));
  const states = ctx.getProgress().cards;
  const open = (cardId) => {
    ctx.update((p) => setCardPos(p, domainId, cardId));
    window.location.hash = `#/learn/${domainId}`;
  };
  const renderNode = (node, depth) => {
    if (!node.card) return branchNode(node, depth, renderNode);
    const card = cardById.get(node.card);
    return card ? cardNode(card, states[card.id], open) : null;
  };
  const { known, total } = mapStats(map, states);
  return h('div', { class: 'stack' },
    h('p', { class: 'crumb' }, `${domain.name} · 已掌握 ${known}/${total}`),
    h('ul', { class: 'map-tree' }, map.children.map((node) => renderNode(node, 1))),
    h('a', { class: 'btn btn-outline btn-block', href: `#/learn/${domainId}` }, '去看卡片'));
}
```

- [ ] **Step 6: 接入路由视图与入口**

在 `js/main.js` 中：
- import 区加 `import { renderMap } from './views/map.js';`
- `VIEWS.acp` 中 `practice` 之后加 `map: (ctx, p) => renderMap(ctx, p.domain),`
- `TITLES` 中 `practice: '练习',` 之后加 `map: '知识地图',`

在 `js/views/learn.js` 中：
- `renderLearnIndex` 里给每行加地图入口。把 `return domainRow(...)` 改成：

```js
      const row = domainRow(d, domainStats(progress, questions, d.id), `#/learn/${d.id}`, `卡片 ${known}/${own.length}`);
      row.append(h('a', { class: 'map-link', href: `#/map/${d.id}` }, '知识地图 ›'));
      return row;
```

- `renderCards` 的 `draw()` 里，在最后的 `practiceLink(domainId, count)` 之前加：

```js
      h('a', { class: 'btn btn-ghost btn-block', href: `#/map/${domainId}` }, '知识地图'),
```

- [ ] **Step 7: 样式**

在 `css/app.css` 的「卡片」区块之后追加：

```css
/* ===== 知识地图 ===== */
.map-link { justify-self: end; padding: var(--space-2) var(--space-1); font-size: 13px; font-weight: 700; color: var(--accent); text-decoration: none; }
.domain-row { display: grid; }
.map-tree, .map-list { margin: 0; padding: 0; list-style: none; display: grid; gap: var(--space-2); }
.map-list { padding: var(--space-2) 0 var(--space-1) var(--space-4); border-left: 2px solid var(--line); margin-left: var(--space-2); }
.map-branch > details > summary { display: flex; align-items: center; min-height: var(--tap); font-weight: 800; cursor: pointer; overflow-wrap: anywhere; }
.map-tree > .map-branch > details > summary { font-size: 17px; }
.map-card {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); width: 100%; min-height: var(--tap);
  padding: var(--space-2) var(--space-3); border: 1px solid var(--line); border-radius: var(--radius-s);
  background: var(--surface); color: var(--ink); font: inherit; text-align: left; cursor: pointer;
}
.map-card:active { background: var(--surface-2); }
.map-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.map-card-title { min-width: 0; overflow-wrap: anywhere; }
.map-card .chip { flex: none; }
```

如果 `.domain-row` 已经有 `display` 规则，就合并进去，不要重复定义。改完确认考点列表的原样式（卡片外框、进度条）不受影响。

- [ ] **Step 8: Service Worker 预缓存**

在 `sw.js` 中：
- `SHELL` 数组加入 `'js/knowledge-map.js'` 和 `'js/views/map.js'`，放在 `'js/views/learn.js'` 附近。
- `DATA` 改为：

```js
const DATA = ['data/domains.json'].concat(
  DOMAINS.map((d) => `data/cards/${d}.json`),
  DOMAINS.map((d) => `data/questions/${d}.json`),
  DOMAINS.map((d) => `data/maps/${d}.json`),
);
```

（Task 3 还会往 SHELL 里加 `js/views/explain.js` 和 `js/views/flow.js`。）

- [ ] **Step 9: 测试**

```bash
npm test
npx playwright test tests/e2e/map.spec.mjs tests/e2e/learn.spec.mjs tests/e2e/card-resume.spec.mjs tests/e2e/pwa.spec.mjs
```

Expected：全部 PASS，覆盖 4 个视口。

- [ ] **Step 10: 提交**

```bash
git add js/views/map.js js/data.js js/router.js js/main.js js/views/learn.js sw.js css/app.css tests/unit/router.test.mjs tests/e2e/map.spec.mjs
git commit -m "feat: add collapsible knowledge map per domain" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

---

### Task 3: 讲解面板与流程图

**Files:**
- Create: `js/views/explain.js`、`js/views/flow.js`
- Modify: `js/views/learn.js`、`sw.js`、`css/app.css`
- Test: `tests/unit/flow.test.mjs`、`tests/e2e/explain.spec.mjs`

**Interfaces:**
- Consumes: 卡片的 `explain` 字段（结构见 Global Constraints）。
- Produces:
  - `flowLabel(flow) → string`：泳道内用「→」连接，泳道之间用「；」连接。
  - `flowChart(flow) → HTMLElement`。
  - `explainPanel(explain) → HTMLElement | null`。
  - CSS 类名：`.explain`、`.explain-toggle`、`.explain-body`、`.explain-sec`、`.explain-label`、`.flow`、`.flow-lane`、`.flow-step`。

- [ ] **Step 1: 失败的单元测试**

`tests/unit/flow.test.mjs`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flowLabel } from '../../js/views/flow.js';

test('flowLabel reads lanes in order for screen readers', () => {
  assert.equal(flowLabel([['文档', '切片'], ['问题', '检索', '生成']]), '文档→切片；问题→检索→生成');
  assert.equal(flowLabel([['甲', '乙']]), '甲→乙');
});
```

Run: `node --test tests/unit/flow.test.mjs` → FAIL

- [ ] **Step 2: 实现 `js/views/flow.js`**

```js
import { h } from '../ui.js';

export function flowLabel(flow) {
  return flow.map((lane) => lane.join('→')).join('；');
}

// 竖向流程图：每条泳道是一列方框，多条泳道并排；箭头由 CSS 画
export function flowChart(flow) {
  return h('div', { class: 'flow', role: 'img', 'aria-label': `流程图：${flowLabel(flow)}`, style: `--lanes:${flow.length}` },
    flow.map((lane) => h('ol', { class: 'flow-lane' }, lane.map((step) => h('li', { class: 'flow-step' }, step)))));
}
```

Run: `node --test tests/unit/flow.test.mjs` → PASS。`js/ui.js` 在模块顶层不访问 `document`，所以在 Node 里可以导入。

- [ ] **Step 3: 写 e2e 失败测试**

`tests/e2e/explain.spec.mjs`：用 `page.route` 给 rag 前两张卡注入讲解，不依赖真实内容的进度。

```js
import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap } from './helpers.mjs';

const TEN = '十个字的流程步骤名称';
const FULL = {
  plain: '大白话讲解内容',
  analogy: '打个比方的内容',
  exam: '考法提示内容',
  confuse: '易混点内容',
  flow: [[TEN, TEN, TEN, TEN, TEN, TEN], [TEN, TEN, TEN, TEN, TEN, TEN], [TEN, TEN, TEN, TEN, TEN, TEN]],
};
const MINIMAL = { plain: '第二张的大白话', exam: '第二张的考法' };

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await page.route('**/data/cards/rag.json', async (route) => {
    const res = await route.fetch();
    const list = await res.json();
    list[0] = { ...list[0], explain: FULL };
    list[1] = { ...list[1], explain: MINIMAL };
    await route.fulfill({ response: res, json: list });
  });
});

test('the explanation opens and closes, and shows every section', async ({ page }, testInfo) => {
  await page.goto('./#/learn/rag');
  const toggle = page.getByRole('button', { name: '看讲解 ▾' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.explain-body')).toBeHidden();
  await toggle.click();
  await expect(page.getByRole('button', { name: '收起讲解 ▴' })).toHaveAttribute('aria-expanded', 'true');
  for (const label of ['大白话', '打个比方', '考法', '易混点']) {
    await expect(page.locator('.explain-label', { hasText: label })).toBeVisible();
  }
  await expect(page.locator('.flow')).toHaveAttribute('aria-label', /^流程图：十个字/);
  await expect(page.locator('.flow-lane')).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'explain-flow');
  await page.getByRole('button', { name: '收起讲解 ▴' }).click();
  await expect(page.locator('.explain-body')).toBeHidden();
});

test('moving to another card collapses the explanation and hides missing sections', async ({ page }) => {
  await page.goto('./#/learn/rag');
  await page.getByRole('button', { name: '看讲解 ▾' }).click();
  await page.getByRole('button', { name: '下一张 ›' }).click();
  await expect(page.locator('.explain-body')).toBeHidden();
  await page.getByRole('button', { name: '看讲解 ▾' }).click();
  await expect(page.locator('.explain-body')).toContainText('第二张的大白话');
  await expect(page.locator('.explain-label', { hasText: '打个比方' })).toHaveCount(0);
  await expect(page.locator('.flow')).toHaveCount(0);
});

test('a card without an explanation shows no toggle', async ({ page }) => {
  await page.goto('./#/learn/rag');
  await page.getByRole('button', { name: '下一张 ›' }).click();
  await page.getByRole('button', { name: '下一张 ›' }).click();
  await expect(page.locator('.crumb')).toHaveText(/ · 3\/\d+$/);
  const res = await page.request.get('data/cards/rag.json');
  const third = (await res.json())[2];
  await expect(page.locator('.explain-toggle')).toHaveCount(third.explain ? 1 : 0);
});
```

Run: `npx playwright test tests/e2e/explain.spec.mjs --project=android-360-light` → FAIL

- [ ] **Step 4: 实现 `js/views/explain.js`**

```js
import { h } from '../ui.js';
import { flowChart } from './flow.js';

const SECTIONS = [['plain', '大白话'], ['analogy', '打个比方'], ['exam', '考法'], ['confuse', '易混点']];
const LABEL = { closed: '看讲解 ▾', open: '收起讲解 ▴' };

// 卡片下方的可展开讲解；每次渲染新卡片都重新创建，所以翻卡后自动收起
export function explainPanel(explain) {
  if (!explain) return null;
  const body = h('div', { class: 'explain-body', id: 'explain-body', hidden: true },
    SECTIONS.filter(([key]) => explain[key]).map(([key, label]) => h('section', { class: `explain-sec explain-${key}` },
      h('h3', { class: 'explain-label' }, label),
      h('p', {}, explain[key]))),
    explain.flow ? flowChart(explain.flow) : null);
  const toggle = h('button', {
    class: 'btn btn-ghost btn-block explain-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'explain-body',
    onClick: () => {
      const willOpen = body.hidden;
      body.hidden = !willOpen;
      toggle.setAttribute('aria-expanded', String(willOpen));
      toggle.textContent = willOpen ? LABEL.open : LABEL.closed;
    },
  }, LABEL.closed);
  return h('div', { class: 'explain' }, toggle, body);
}
```

- [ ] **Step 5: 接入卡片页**

在 `js/views/learn.js` 中：
- 加 `import { explainPanel } from './explain.js';`
- 在 `renderCards` 的 `draw()` 里，`root.append(` 的参数中，`panel,` 之后紧接着加 `explainPanel(card.explain),`。面板放在卡片外面作为兄弟节点，所以不在 `aria-live` 区域内，也不影响卡片上的滑动手势。

- [ ] **Step 6: 样式**

在 `css/app.css` 的「知识地图」区块之前追加：

```css
/* ===== 卡片讲解 ===== */
.explain { display: grid; gap: var(--space-2); }
.explain-body {
  display: grid; gap: var(--space-4); padding: var(--space-4);
  border-radius: var(--radius-m); background: var(--surface-2); line-height: 1.7; overflow-wrap: anywhere;
}
.explain-body[hidden] { display: none; }
.explain-sec { display: grid; gap: var(--space-1); }
.explain-sec p { margin: 0; }
.explain-label { margin: 0; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; color: var(--accent); }
.explain-exam .explain-label { color: var(--warn); }
.explain-confuse .explain-label { color: var(--bad); }

/* 流程图：每条泳道一列，方框之间用 CSS 箭头连接 */
.flow { display: grid; grid-template-columns: repeat(var(--lanes), minmax(0, 1fr)); gap: var(--space-2); }
.flow-lane { margin: 0; padding: 0; list-style: none; display: grid; align-content: start; gap: var(--space-5); }
.flow-step {
  position: relative; padding: var(--space-2); border: 1.5px solid var(--accent); border-radius: var(--radius-s);
  background: var(--surface); font-size: 13px; line-height: 1.4; text-align: center; overflow-wrap: anywhere;
}
.flow-step + .flow-step::before {
  content: "↓"; position: absolute; left: 50%; bottom: 100%; transform: translateX(-50%);
  height: var(--space-5); line-height: var(--space-5); color: var(--accent); font-weight: 800;
}
```

- [ ] **Step 7: Service Worker**

在 `sw.js` 的 `SHELL` 中加入 `'js/views/explain.js'` 和 `'js/views/flow.js'`。

- [ ] **Step 8: 测试**

```bash
npm test
npx playwright test tests/e2e/explain.spec.mjs tests/e2e/learn.spec.mjs tests/e2e/long-text.spec.mjs tests/e2e/card-resume.spec.mjs
```

Expected：全部 PASS，覆盖 4 个视口，3 条泳道 × 6 步 × 10 字在 360px 宽下不横向溢出。如果溢出，先把 `.flow-step` 的 `font-size` 降到 12px、`padding` 改为 `var(--space-1)` 再试；仍然溢出就报告，不要改数据上限。

再打开 `test-results` 里的 `explain-flow.png` 截图看一眼，确认箭头位于方框之间。

- [ ] **Step 9: 提交**

```bash
git add js/views/explain.js js/views/flow.js js/views/learn.js sw.js css/app.css tests/unit/flow.test.mjs tests/e2e/explain.spec.mjs
git commit -m "feat: add expandable explanations with flow charts to cards" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

---

### 内容任务的统一步骤（Task 4–10 都按这个做）

每个内容任务修改的文件都是：
- `data/cards/<domain>.json`
- `data/maps/<domain>.json`
- `docs/coverage/<domain>.md`

**Interfaces:**
- Consumes: Task 1 的校验（`npm run validate -- --domain <domain>` 会严格检查该考点的讲解和地图）；Task 2、3 的页面。
- Produces: `<domain>` 补齐缺口，每张卡都有 `explain`，地图按主题组织。

- [ ] **Step 1: 保存快照**

```bash
node -e "const fs=require('fs'),os=require('os'),path=require('path');fs.writeFileSync(path.join(os.tmpdir(),'<domain>-cards-before.json'),fs.readFileSync('data/cards/<domain>.json'))"
```

- [ ] **Step 2: 读材料**
  - `docs/coverage/<domain>.md`：找出「卡片 id」一列为 `—` 的小节。
  - `data/cards/<domain>.json`：已有的卡片。
  - `data/questions/<domain>.json`：写「考法」和「易混点」时的依据。
  - 本任务列出的各章节笔记正文（用 `nb-text.mjs` 取出）。要读原文，不能只凭题目解析推断。

- [ ] **Step 3: 列缺口清单（写进报告）**

对每个「卡片 id 为 `—`」的小节，写一行：补 / 不补，以及理由（不补的理由只能是 Global Constraints 里列出的那些情况，或者「内容已被某张卡完整覆盖」并写明卡片 id）。对要补的小节，写出新卡标题，以及它和最接近的已有卡片有什么区别。

- [ ] **Step 4: 写新卡并排序**

新卡 id 接续当前最大编号。整个数组按「`chapters` 顺序 → 覆盖表小节顺序」排列。已有卡片只能挪位置，不改内容。

- [ ] **Step 5: 给本考点每张卡写 `explain`**

新卡和已有卡都要写。每张卡写完后，在报告里记一行：卡片 id、讲解依据的笔记小节、考法依据的题目 id。流程图只加在有先后顺序的卡上，每个考点 3–6 张。

- [ ] **Step 6: 改写知识地图**

把骨架地图（按章节分组）改成按主题组织的树：
- 第 1 层是 3–6 个主题，比如 RAG 可以分成「工作原理 / 评测 / 优化：文档准备 / 优化：检索召回 / 优化：生成」；
- 第 2–3 层是子主题或卡片；
- 每张卡至少出现一次；
- 同一张卡只有在确实属于两个主题时才重复出现。

分支 `label` ≤24 字。地图的 `title` 保持为考点名。

- [ ] **Step 7: 更新覆盖表**

在「卡片 id」列填上新卡 id，同时更新「合计」行的卡片数。

- [ ] **Step 8: 自查**

逐张核对：讲解中的事实能否在原文找到、比喻有没有夹带新事实、考法能否对上题目。然后运行：

```bash
node -e "
const strip=({explain,...rest})=>JSON.stringify(rest);
const before=require(require('path').join(require('os').tmpdir(),'<domain>-cards-before.json'));
const after=require('./data/cards/<domain>.json');
const byId=new Map(after.map(c=>[c.id,c]));
const changed=before.filter(c=>!byId.has(c.id)||strip(byId.get(c.id))!==strip(c)).map(c=>c.id);
const added=after.filter(c=>!before.some(b=>b.id===c.id)).map(c=>c.id);
console.log('已有卡片被改动：',changed.length?changed:'无');
console.log('新卡：',added.join(' ')||'无','共',after.length,'张；有流程图',after.filter(c=>c.explain&&c.explain.flow).length,'张');
"
npm run validate -- --domain <domain>
```

Expected：
- 「已有卡片被改动：无」；
- 有流程图的卡为 3–6 张；
- `--domain` 校验对本考点没有报错。其他考点的「缺少 explain」可以忽略，那是还没轮到的考点。

- [ ] **Step 9: 跑测试**

```bash
npm test
npx playwright test tests/e2e/learn.spec.mjs tests/e2e/card-resume.spec.mjs tests/e2e/map.spec.mjs tests/e2e/explain.spec.mjs tests/e2e/long-text.spec.mjs --project=android-360-light
```

Expected：全部 PASS。

- [ ] **Step 10: 提交**

```bash
git add data/cards/<domain>.json data/maps/<domain>.json docs/coverage/<domain>.md
git commit -m "feat(<domain>): fill gaps, explain every card and map topics" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

**每个内容任务都要经过核查审查。** 审查子代理拿到的材料：本任务的报告、diff，以及对应章节的笔记正文。审查子代理逐张核对讲解是否有原文依据（见 Review Focus 第 1 条），并抽查缺口清单里标为「不补」的小节，确认理由成立。

---

### Task 4: rag

`<domain>` = `rag`。章节：`2_2_扩展答疑机器人的知识范围`、`2_4_自动化评测答疑机器人的表现`、`2_5_优化RAG应用提升问答准确度`（都在 `C2_构造问答系统/`）。当前最大编号是 `rag-c22`，共 22 张。

预计补 6–9 张，重点检查以下小节：
- 1.1 建立索引 / 1.2 检索生成的细节，以及 2.3 保存与加载索引（已有 rag-c01 概述，新卡讲细节，不要重复）；
- 3.2.2 context recall 与 context precision 的计算过程；
- 3.3 其他推荐了解的指标；
- 4.1 上下文是 RAG 的生命线；
- 2.2 给大模型结构更清晰的参考信息；
- 4.2.1 问题分类及改进策略；
- 4.3.1/4.3.2 Embedding 与模型选择；
- 4.4 检索前 / 检索后策略表；
- 本节小结（模块化 RAG、GraphRAG）。

流程图候选：RAG 两阶段（建立索引 / 检索生成）、多轮对话问题改写、评测先行的优化流程、RAG 各环节与改进策略。

完成后本考点不超过 35 张。

### Task 5: app-dev

`<domain>` = `app-dev`。章节：`2_1_用大模型构建新人答疑机器人`（C2）、`3_1_Agent基础与工具调用`（C3）。`2_2` 已归 rag 使用；`3_0` 不能作为卡片来源。当前最大编号是 `app-dev-c18`。

预计补 2–4 张，重点检查：
- 2_1 的「2. 大模型是如何工作的」（Token、自回归生成等）；
- 2_1 的「3.4 技术方案：RAG」：只写 2_1 视角的选型理由，原理已在 rag 考点，不要重复。

流程图候选：大模型逐 Token 生成、Function Calling 工具调用循环。

### Task 6: prompt

`<domain>` = `prompt`。章节：`2_3_优化提示词改善答疑机器人回答质量`（C2）。当前最大编号是 `prompt-c18`。

覆盖表中无卡的小节大多是前言或回顾，预计补 0–2 张。重点是给 18 张卡写讲解。

流程图候选：提示词迭代优化流程、AI 裁判（LLM-as-a-Judge）训练与使用流程。

### Task 7: finetune

`<domain>` = `finetune`。章节：`4_1_用蒸馏让小模型掌握专业能力`、`4_2_部署模型`（`C4_交付上线/`）。当前最大编号是 `finetune-c18`。

预计补 2–4 张，重点检查：
- 3.1 教师模型的 System Prompt；
- 3.6 训练数据格式；
- 6.3 训练结果观察；
- 6.4 合并 LoRA 参数；
- 4_2 的「2. 在测试环境中部署模型」。

流程图候选：蒸馏整体流程（教师生成数据 → 训练学生 → 评测）、LoRA 训练到合并再到部署。

### Task 8: agent-mm（原有内容）

`<domain>` = `agent-mm`。章节：`3_2`～`3_7`，以及 `3_8_Harness_Loop打造可上线业务能力`（`C3_构建Agent系统/`）。当前最大编号是 `agent-mm-c22`。

本任务不写多模态卡，多模态由 Task 9 负责。预计补 1–3 张，重点检查 3_7 的「6 用 Skill 固化专家经验」和「8 综合实践：Gradio Web UI」。纯操作步骤不补。

`agent-mm-c22`（3_8 课程预览卡）的讲解只能取预览里的内容。

流程图候选：Plan-and-Execute 规划执行、多 Agent 协作分工、Memory 读写流程、评测驱动开发闭环、Harness Loop 闭环。

地图的「多模态应用」分支由 Task 9 加入，本任务不加（空分支过不了校验）。

### Task 9: agent-mm（多模态）

`<domain>` = `agent-mm`。本任务只新增多模态卡片，并为它们写讲解、接入地图。不改 Task 8 写好的卡片和讲解。

来源章节：
- `C2_构造问答系统/` 下的 `2_1_用大模型构建新人答疑机器人`、`2_3_优化提示词改善答疑机器人回答质量`；
- `C3_构建Agent系统/` 下的 `3_1_Agent基础与工具调用`；
- `C4_交付上线/` 下的 `4_3_大模型应用生产实践`、`4_4_大模型应用安全合规`；
- `C5_总结与展望/5_2_总结与展望`。

先在这些笔记中搜索「多模态」「视觉」「图片」「图像」「语音」「音频」「视频」「VL」「Omni」，列出每一处的内容摘要。然后归并成 5–6 张卡，例如：多模态模型类型与能力、用视觉模型做信息提取、多模态提示词、多模态在 Agent 中的使用、多模态应用的生产与安全注意事项。具体分法以实际找到的内容为准。

- `source` 写实际依据的章节；跨章节时用「、」连接。
- 新卡放在 agent-mm 文件末尾，作为一组。
- 地图第 1 层新增分支「多模态应用」，把这些卡片挂在下面。
- 覆盖表 `docs/coverage/agent-mm.md` 末尾新增一节「多模态（跨章节）」，每张卡一行，写明来源章节和小节。

5_2 中的非多模态内容是课程回顾和方案推荐。逐条判断：确有考点价值，并且其他考点没有覆盖的，记进报告，由控制者裁定是否另补。本任务不改其他考点的文件。

完成后 agent-mm 不超过 35 张。

### Task 10: production

`<domain>` = `production`。章节：`4_3_大模型应用生产实践`、`4_4_大模型应用安全合规`（`C4_交付上线/`）。`4_0` 和 `5_1` 不能作为卡片来源。当前最大编号是 `production-c18`。

预计补 2–4 张，重点检查：
- 4_3 的「4. 稳定性 / 4.1 降低用户请求的资源消耗」；
- 4_4 的「3.4 大模型及 AI 应用安全风险总览」；
- 4_4 的间接提示词注入（覆盖表里标在课后小测验那一行）。

流程图候选：降低成本 / 提升性能的手段链、内容安全防护流程、提示词注入攻击路径。

---

### Task 11: 收尾

**Files:**
- Modify: `README.md`（卡片总数和功能说明）、`sw.js`（由 `npm run bump` 修改）

- [ ] **Step 1: 全量校验**

Run: `npm run validate`
Expected：没有错误，输出「… 张卡片，6 张知识地图」，卡片总数约 145。

- [ ] **Step 2: 更新 README**

把 `README.md` 中「116 张速记卡片」改成实际总数，并在同一段补一句：「每张卡可展开通俗讲解，关键卡片配流程图；每个考点有一张可折叠的知识地图。」

- [ ] **Step 3: 全部测试和体积**

```bash
npm run test:cov
npx playwright test
npm run size
```

Expected：全部 PASS；gzip 体积 < 500 KB，把实际数值写进报告。

- [ ] **Step 4: 提高缓存版本并提交**

```bash
npm run bump
git add README.md sw.js
git commit -m "chore: update card count and bump cache version" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

不要推送。
