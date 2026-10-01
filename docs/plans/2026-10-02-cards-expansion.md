# ACP 备考站 · 速记卡片扩充 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 ACP 题库的速记卡片从 72 张补到约 116 张，按内容量分配到 6 个考点，大章节不再被压缩成 1–2 张。

**Architecture:** 应用代码不改。先放宽并加强卡片校验（每考点 15–25 张、每条要点不超过 40 字、同考点标题不重复），再按考点逐个补卡：读覆盖表找出没有卡片或卡片过少的小节，读笔记原文写新卡，按章节顺序排好，更新覆盖表。最后更新 README、全量校验、提高缓存版本。

**Tech Stack:** 原生 JS + JSON 数据 + Node 26 `node:test` + Playwright。

**Spec:** 没有单独的 spec 文件。设计已于 2026-10-02 在对话中确认，要点如下，作为本计划的约束依据：
- 每个有题目的小节至少对应一张卡，大约每 2.5–3 道题 1 张；目标见下表，合计约 116 张。
- 格式不变：每张 3–5 条要点，每条不超过 40 字；内容必须能在对应章节原文里找到，不和已有卡片重复。
- 现有 72 张卡的 `id` 不变（用户的「已掌握/待复习」标记和卡片位置都按 id 记录）；新卡从 `c13` 起编号；文件内按章节和小节顺序排列。
- 校验规则：每考点卡片数从 10–15 改为 15–25；覆盖表补上卡片编号。
- 3_8 只有课程预览：据预览做 1 张概念卡，标题注明「（课程预览）」。5_1 只有 RIDE 四阶段的名字，不做卡。

## Global Constraints

**写卡规则（每个内容任务都适用，审查时逐张检查）：**
- 只写笔记原文里有的内容，不编造参数、数值、产品名或结论。每条要点都要能在 `source` 章节里找到依据。
- 每张卡 3–5 条要点，每条不超过 40 个字（按字符数计，中英文都算 1 个）。标题不超过 24 个字（现有标题最长 22 字），同一考点内不能重复。
- 新卡不能和同考点已有卡片讲同一件事。可以讲同一主题的不同侧面（例如已有「LoRA 与训练状态判断」，新卡可以写「LoRA 关键参数」，但不能再列一遍训练状态）。
- `id` 格式 `<domain>-cNN`，从 `c13` 起连续编号。**已有卡片的 `id`、`title`、`points` 一律不改**（发现事实错误时停下来报告，不要自行改）。
- `source` 填该卡实际依据的章节名，必须出现在 `data/domains.json` 该考点的 `chapters` 里。
- 文件内顺序：先按 `domains.json` 里 `chapters` 的顺序，同一章内按覆盖表小节顺序。已有卡片可以挪位置，但内容不变。
- `3_0`、`4_0`、`5_1` 不能作为卡片来源。`3_8` 只允许 agent-mm 任务做 1 张，标题以「（课程预览）」结尾，内容只取预览里写到的东西。
- 数据文件用 UTF-8、LF、2 空格缩进、中文，结构与现有卡片完全一致：`{ "id", "domain", "title", "points": [...], "source" }`。

**各考点目标：**

| 考点 | 现有 | 目标 | 重点补哪里 |
|---|---|---|---|
| rag | 12 | 22 | 2_4 评测、2_5 优化 |
| app-dev | 12 | 18 | 2_1 文本生成细节、3_1 工具调用 |
| prompt | 12 | 18 | 4.7 AI 裁判的训练与停止、自动化优化、小结 |
| finetune | 12 | 18 | 4_1 蒸馏流程、4_2 部署细节 |
| agent-mm | 12 | 22 | 3_5 Skill、3_6 评测、3_7 Qwen Code，外加 3_8 预览卡 1 张 |
| production | 12 | 18 | 4_4 安全合规细节 |

目标可以 ±1，但必须落在 15–25 之间。

**工程规则：**
- 所有命令在 `acp-study-app/` 目录下执行。笔记在 `../大模型ACP认证教程/` 下（`C2_构造问答系统/`、`C3_构建Agent系统/`、`C4_交付上线/`），文件名 = 章节名 + `.ipynb`。用 `node scripts/nb-text.mjs <笔记路径> > <临时文件>` 取出正文再读。
- 每个考点任务结束时 `npm run validate -- --domain <id>` 必须通过；全量 `npm run validate` 要等最后一个考点完成后才会通过（其余考点卡片数还不到 15）。
- 不写 `console.log`。不要推送；推送由用户决定。
- 每次提交都用：`git commit -m "<type>: <desc>" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"`

## Review Focus

1. **要点超长或计数偏差**：中英混排时肉眼看不出是否超过 40 字。Task 1 的校验按 `[...text].length` 计数，超出即报错。
2. **新旧卡重复**：新卡换个标题重讲已有卡片的内容。每个考点任务的自查步骤要逐张对照已有卡片，审查也按此检查。
3. **编造细节**：数值、参数名、产品名写错或笔记里根本没有。每个考点任务的自查步骤要给每张新卡记下原文出处（小节标题），写进覆盖表。
4. **改动了已有卡片**：重新排序时不小心改了已有卡片的文字。每个考点任务用 Step「已有卡片未改动」的脚本检查。
5. **排序打乱了用户进度**：id 不变，进度就不受影响。卡片位置按 id 记录，挪位置不会丢；只要 id 不变即可，由第 4 条的检查保证。

---

### Task 1: 卡片校验调整

**Files:**
- Modify: `scripts/validate-lib.mjs`
- Test: `tests/unit/validate-lib.test.mjs`

**Interfaces:**
- Produces: `CARD_RANGE = { min: 15, max: 25 }`、`POINT_MAX_CHARS = 40`、`TITLE_MAX_CHARS = 24`（均从 `scripts/validate-lib.mjs` 导出）。`checkCard` 新增两条错误信息：`第 N 条要点超过 40 字`、`title 超过 24 字`；`validateData` 新增：`cards/<id>.json: 卡片标题重复：<title>`。

- [ ] **Step 1: 改测试数据，让它符合新规则**

`tests/unit/validate-lib.test.mjs` 里的 `card()` 目前所有卡片标题都是 `'标题'`，`valid()` 造 10 张。新规则下这会因「标题重复」和「卡片数 10」而失败。改成：

```js
const card = (n, over = {}) => ({
  id: `rag-c${String(n).padStart(2, '0')}`, domain: 'rag', title: `标题${n}`, points: ['一', '二', '三'], source: '2_5_x', ...over,
});
```

并把 `valid()` 里的 `Array.from({ length: 10 }, ...)` 改成 `Array.from({ length: 15 }, ...)`。

Run: `node --test tests/unit/validate-lib.test.mjs` → 旧范围是 10–15，15 张仍在范围内，所有现有用例应 PASS。

- [ ] **Step 2: 写失败的测试**

在 `tests/unit/validate-lib.test.mjs` 末尾追加：

```js
test('card points over 40 characters and titles over 24 are rejected', () => {
  const data = valid();
  const long = '一'.repeat(41);
  const cards = data.cards.rag.map((c, i) => (i === 0 ? { ...c, points: [long, '二', '三'] } : c));
  expectError({ ...data, cards: { ...data.cards, rag: cards } }, '第 1 条要点超过 40 字');
  const exact = data.cards.rag.map((c, i) => (i === 0 ? { ...c, points: ['一'.repeat(40), '二', '三'] } : c));
  assert.deepEqual(validateData({ ...data, cards: { ...data.cards, rag: exact } }), []);
  const titled = data.cards.rag.map((c, i) => (i === 0 ? { ...c, title: '题'.repeat(25) } : c));
  expectError({ ...data, cards: { ...data.cards, rag: titled } }, 'title 超过 24 字');
});

test('duplicate card titles within a domain are rejected', () => {
  const data = valid();
  const cards = data.cards.rag.map((c, i) => (i === 1 ? { ...c, title: data.cards.rag[0].title } : c));
  expectError({ ...data, cards: { ...data.cards, rag: cards } }, `卡片标题重复：${data.cards.rag[0].title}`);
});

test('card count must be 15 to 25 in strict mode', () => {
  const data = valid();
  const more = Array.from({ length: 26 }, (_, i) => ({ ...data.cards.rag[0], id: `rag-c${String(i + 1).padStart(2, '0')}`, title: `卡片 ${i + 1}` }));
  expectError({ ...data, cards: { ...data.cards, rag: more } }, '卡片数 26，应在 15–25 之间');
  expectError({ ...data, cards: { ...data.cards, rag: data.cards.rag.slice(0, 14) } }, '卡片数 14');
});
```

- [ ] **Step 3: 运行，确认失败**

Run: `node --test tests/unit/validate-lib.test.mjs`
Expected: 新增的 3 个用例 FAIL（没有对应的错误信息 / 卡片数 26 未报错）。

- [ ] **Step 4: 实现**

在 `scripts/validate-lib.mjs`：

```js
export const CARD_RANGE = { min: 15, max: 25 };
export const POINT_MAX_CHARS = 40;
export const TITLE_MAX_CHARS = 24;
const charCount = (s) => [...s].length;
```

`checkCard` 里在 points 数量检查之后追加：

```js
  if (nonEmpty(c.title) && charCount(c.title) > TITLE_MAX_CHARS) add(`title 超过 ${TITLE_MAX_CHARS} 字`);
  if (Array.isArray(c.points)) {
    c.points.forEach((p, i) => {
      if (nonEmpty(p) && charCount(p) > POINT_MAX_CHARS) add(`第 ${i + 1} 条要点超过 ${POINT_MAX_CHARS} 字`);
    });
  }
```

在 `validateData` 遍历每个考点卡片的地方（`const cs = ...` 之后）追加标题重复检查：

```js
    const titles = new Set();
    cs.forEach((c) => {
      if (!isObject(c) || !nonEmpty(c.title)) return;
      if (titles.has(c.title)) errs.push(`cards/${d.id}.json: 卡片标题重复：${c.title}`);
      titles.add(c.title);
    });
```

（变量名按该函数里现有的错误数组名调整；读一下 `validateData` 的写法再放。）

- [ ] **Step 5: 运行，确认通过；确认真实数据只报卡片数**

Run: `node --test tests/unit/validate-lib.test.mjs` → 全部 PASS。
Run: `npm run validate` → 只应出现 6 条「卡片数 12，应在 15–25 之间」，不应有要点超长或标题重复（现有卡片已核对：要点最长 40 字）。若出现其他错误，停下来报告。
Run: `npm test` → 全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add scripts/validate-lib.mjs tests/unit/validate-lib.test.mjs
git commit -m "feat: allow 15-25 cards per domain and check point length and duplicate titles" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

---

### 考点任务的统一步骤（Task 2–7 都按这个做）

每个考点任务的 Files 都是：
- Modify: `data/cards/<domain>.json`、`docs/coverage/<domain>.md`

**Interfaces:**
- Consumes: Task 1 的校验（`npm run validate -- --domain <domain>`）。
- Produces: `<domain>` 达到目标张数；新卡 id 从 `<domain>-c13` 起连续。

步骤：

- [ ] **Step 1: 保存已有卡片快照**

```bash
node -e "const fs=require('fs'),os=require('os'),path=require('path');fs.writeFileSync(path.join(os.tmpdir(),'<domain>-cards-before.json'),fs.readFileSync('data/cards/<domain>.json'))"
```

（快照放系统临时目录，不进仓库。）

- [ ] **Step 2: 读材料**
  - `docs/coverage/<domain>.md`：找出「卡片 id」一列为 `—` 的小节，以及一张卡覆盖了 3 个以上小节的地方。这些就是补卡候选。
  - `data/cards/<domain>.json`：已有 12 张卡，记住每张讲了什么，避免重复。
  - 对应章节的笔记正文（`node scripts/nb-text.mjs ../大模型ACP认证教程/<目录>/<章节>.ipynb > <临时文件>` 后读取）。只读候选小节附近即可，但要读原文，不要凭题目解析推断。

- [ ] **Step 3: 列出新卡清单**

在开始写 JSON 前，先在报告里列出：每张新卡的标题、依据的小节、和哪张已有卡片最接近以及区别在哪。数量按该任务的目标。

- [ ] **Step 4: 写卡并排序**

新卡追加 id `c13`、`c14`……；然后把整个数组按「`chapters` 顺序 → 覆盖表小节顺序」排好。已有卡片只挪位置，不改内容。

- [ ] **Step 5: 更新覆盖表**

在 `docs/coverage/<domain>.md` 的「卡片 id」列填上新卡 id；末尾「合计」行的卡片数改成新的总数。

- [ ] **Step 6: 自查**

逐张核对：要点是否都能在原文找到；有没有和已有卡片重复；数值和名称是否与原文一致。然后运行：

```bash
node -e "
const before=require(require('path').join(require('os').tmpdir(),'<domain>-cards-before.json'));
const after=require('./data/cards/<domain>.json');
const byId=new Map(after.map(c=>[c.id,c]));
const changed=before.filter(c=>JSON.stringify(byId.get(c.id))!==JSON.stringify(c)).map(c=>c.id);
const ids=after.map(c=>c.id).filter(id=>!before.some(b=>b.id===id));
console.log('已有卡片被改动：',changed.length?changed:'无');
console.log('新卡：',ids.join(' '),'共',after.length,'张');
"
npm run validate -- --domain <domain>
```

Expected: 「已有卡片被改动：无」；新卡从 c13 连续编号；`--domain` 校验对该考点无报错（其他考点的卡片数报错可以忽略）。

- [ ] **Step 7: 跑测试**

```bash
npm test
npx playwright test tests/e2e/learn.spec.mjs tests/e2e/card-resume.spec.mjs tests/e2e/long-text.spec.mjs --project=android-360-light
```

Expected: 全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add data/cards/<domain>.json docs/coverage/<domain>.md
git commit -m "feat(<domain>): add cards for uncovered sections" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

---

### Task 2: rag 补到 22 张

按「考点任务的统一步骤」执行，`<domain>` = `rag`。章节：`2_2_扩展答疑机器人的知识范围`、`2_4_自动化评测答疑机器人的表现`、`2_5_优化RAG应用提升问答准确度`（都在 `C2_构造问答系统/`）。新增 10 张，主要放在 2_4（评测方法、Ragas 各指标的含义与适用场景、评测集构建）和 2_5（检索前/检索/检索后/生成各环节的具体优化手段）。

### Task 3: app-dev 补到 18 张

`<domain>` = `app-dev`。章节：`2_1_用大模型构建新人答疑机器人`（C2）、`3_1_Agent基础与工具调用`（C3）。`2_2` 已归 rag 使用，`3_0` 不能作为来源。新增 6 张，2_1 与 3_1 大致各 3 张。

### Task 4: prompt 补到 18 张

`<domain>` = `prompt`。章节：`2_3_优化提示词改善答疑机器人回答质量`（C2）。新增 6 张，优先覆盖覆盖表里卡片列为 `—` 的小节：「前言/课程目标」除外，重点是 4.7.3 停止训练的判断、4.7.4 用 AI 裁判指导自动化优化、2. 拼接补丁的问题、本节小结；其余从被一张卡覆盖多个小节的地方拆出。

### Task 5: finetune 补到 18 张

`<domain>` = `finetune`。章节：`4_1_用蒸馏让小模型掌握专业能力`、`4_2_部署模型`（都在 `C4_交付上线/`）。新增 6 张，4_1 约 4 张、4_2 约 2 张。

### Task 6: agent-mm 补到 22 张

`<domain>` = `agent-mm`。章节：`3_2`～`3_7`（`C3_构建Agent系统/`）。新增 10 张：
- `3_5_用Skill将能力固化为可复用流程` 约 3 张、`3_7_Qwen_Code实践` 约 3 张、`3_6_用评测驱动Agent开发` 约 2 张、`3_3`/`3_4` 合计约 1 张。
- `3_8_Harness_Loop打造可上线业务能力` 恰好 1 张，标题以「（课程预览）」结尾（总长不超过 24 字，例如「Harness 与 Loop 闭环（课程预览）」），要点只取预览里的内容：课程目标、核心闭环「标准 → Skill → 测试样本 → 截图验证 → 问题记录 → 写回规则 → 新主题验证」、Harness/Loop Engineering 要解决的问题（从「这一次能跑」到「换主题后也能稳定复用」）。不得补充预览之外的细节。

### Task 7: production 补到 18 张

`<domain>` = `production`。章节：`4_3_大模型应用生产实践`、`4_4_大模型应用安全合规`（`C4_交付上线/`）。`4_0` 和 `5_1` 不能作为来源。新增 6 张，4_4 约 4 张、4_3 约 2 张。

---

### Task 8: 收尾

**Files:**
- Modify: `README.md`（第 5 行的卡片总数）、`sw.js`（由 `npm run bump` 改）

- [ ] **Step 1: 全量校验**

Run: `npm run validate` → 无错误，并输出总卡片数（约 116）。

- [ ] **Step 2: 改 README**

把 `README.md` 第 5 行的「72 张速记卡片」改成实际总数，例如「116 张速记卡片」。

- [ ] **Step 3: 全部测试和体积**

```bash
npm run test:cov
npx playwright test
npm run size
```

Expected: 全部 PASS；体积仍在预算内（gzip < 500 KB）。

- [ ] **Step 4: 提高缓存版本并提交**

```bash
npm run bump
git add README.md sw.js
git commit -m "chore: update card count and bump cache version" --trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" --trailer "Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL"
```

不要推送。
