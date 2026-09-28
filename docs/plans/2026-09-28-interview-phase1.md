# 加密面试题库 第一阶段 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 acp-study App 里加入第二个题库「Agent 面试」：本地 md 问答经脚本解析、加密成 `data/interview.enc`，手机上输入密码后本机解密，提供翻卡自评和计时模拟面试（选择题留到第二阶段）。

**Architecture:** 加解密模块 `js/crypto.js` 只依赖 Web Crypto、CompressionStream 和 btoa，浏览器与 Node 共用；构建脚本 `scripts/interview-lib.mjs` 在内存中把 md 解析成 JSON，再调用它加密。App 端通过 hash 前缀 `#/iv` 区分题库，`main.js` 按题库分别持有数据、进度存储和视图表；面试进度使用独立的 localStorage 键，ACP 的数据与行为保持不变。

**Tech Stack:** 原生 ES2019 模块，无运行时依赖；Node 26 `node:test`；Playwright（沿用现有 4 个安卓视口配置）。

**Spec:** `docs/specs/2026-09-28-interview-bank-design.md`（下称「spec」）。ACP 的原始设计见 `docs/specs/2026-09-27-acp-study-app-design.md`。

**分支：** 在 `feat/interview-bank` 分支上开发，完成后合并回 `main`。

## Global Constraints

- 浏览器端代码（`js/**`）只用 ES2019 语法：不用 `?.`、`??`、类字段、`replaceAll`、顶层 `await`，也不引入任何第三方依赖。
- 所有 DOM 都通过 `js/ui.js` 的 `h()` 和 `textContent` 构建，**禁止 `innerHTML`**。
- 状态更新一律返回新对象，不修改原对象（沿用 `progress.js` 的写法）。
- 每个文件不超过 400 行；纯逻辑与 DOM 渲染分开写。
- 任何宽度（320–412px）都不允许出现横向滚动；可点击区域至少 48px（使用 `var(--tap)`）；颜色一律使用 `css/app.css` 里的 CSS 变量，深色与浅色模式都要定义。
- **仓库中不得出现真实面试内容**：测试夹具只用虚构内容。不得写入本地面试准备目录的路径，也不得写入目标单位名、个人项目名或它们的拼音。
- 每个新建的 `js/**/*.js` 文件都必须同时加进 `sw.js` 的 `SHELL` 列表，因为 `tests/unit/sw-manifest.test.mjs` 会检查这一点。
- 用户可见文案使用中文；代码标识符使用英文。
- 提交信息使用 conventional commits 格式，并以这两行结尾：
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01RWok8sU2hb3KXcrvTHbohL
  ```
- 每个任务完成时，下面几项都要通过：
  - `npm test`
  - `npx playwright test`（在该任务说明范围内运行）
  - `npm run validate`（ACP 题库校验，不应受影响）
  - 现有全部测试也必须保持通过。

## Review Focus

1. **Windows 换行符（CRLF）的 md 文件**（在 Windows 编辑器里保存过）：解析结果必须与 LF 版本完全一致。由 Task 2 覆盖。
2. **手机上已保存旧密钥，而密文已用新 salt 重建**（例如改过密码）：打开时自动解锁失败，应回到密码页，不能报错崩溃。由 Task 6 的 e2e 覆盖。
3. **`data/interview.enc` 不存在（404）或离线且没有缓存**：应显示友好提示，并提供回到 ACP 题库的入口，ACP 题库不受影响。由 Task 6 的 e2e 覆盖。
4. **模拟面试进行到一半，题库重建后某张卡片被删掉了**：模拟面试应能继续，并跳过这张卡片。由 Task 4 的单元测试（`pruneMockDraft`）覆盖，Task 8 的视图调用它。
5. **把 ACP 的进度文件导入到面试题库，或者反过来**：应拒绝导入，并明确说明是哪个题库的文件。由 Task 4 的单元测试覆盖。

---

## 文件结构

| 文件 | 职责 | 任务 |
|---|---|---|
| `js/crypto.js` | 加解密、gzip、base64、密文格式校验（浏览器 / Node 通用） | 1 |
| `scripts/interview-lib.mjs` | md 解析、payload 组装、防泄漏检测、带自检的加密 | 2 |
| `tests/fixtures/interview/qbank/A-sample.md`、`B-sample.md` | 虚构的测试题库 | 2 |
| `scripts/build-interview.mjs`、`scripts/decrypt-interview.mjs` | 命令行入口 | 3 |
| `tests/unit/no-plaintext.test.mjs` | 用真实源做防泄漏检查（设置了 `INTERVIEW_SRC` 时才运行） | 3 |
| `js/interview.js` | 面试进度的纯逻辑：自评、抽题、模拟面试、推荐、导入校验、payload 转换 | 4 |
| `js/storage.js`、`js/progress.js`（修改） | 存储键可配置；ACP 导入时拒绝面试进度文件 | 4 |
| `js/router.js`（修改） | 识别 `#/iv` 前缀，提供 `linkFor` | 5 |
| `js/views/practice.js`、`wrong.js`、`settings.js`（修改） | 链接按题库生成；设置页按题库区分 | 5 |
| `js/keystore.js` | 把 CryptoKey 存进 IndexedDB | 6 |
| `js/iv-session.js` | 面试题库会话：加载密文、用本机密钥解锁、用密码解锁、锁定 | 6 |
| `js/data.js`（修改） | 新增 `loadEnvelope` | 6 |
| `js/views/bank-switch.js`、`iv-unlock.js`、`iv-home.js`、`iv-domain-row.js` | 题库切换控件、解锁页、面试首页 | 6 |
| `js/main.js`（重写） | 按题库管理状态、页面框架、解锁门槛 | 6 |
| `js/rich.js` | 把块数组和片段数组渲染成 DOM | 7 |
| `js/views/iv-learn.js` | 类别列表、翻卡、自评 | 7 |
| `js/views/iv-mock.js` | 模拟面试与结果页 | 8 |
| `tests/e2e/iv-helpers.mjs`、`iv-unlock.spec.mjs`、`iv-learn.spec.mjs`、`iv-mock.spec.mjs` | 端到端测试 | 6–8 |

---

### Task 1: 加解密模块

**Files:**
- Create: `js/crypto.js`
- Create: `tests/unit/crypto.test.mjs`
- Modify: `sw.js`（`SHELL` 中加 `'js/crypto.js'`）
- Modify: `package.json`（在 `test:cov` 里加 `--test-coverage-include=js/crypto.js`）

**Interfaces:**
- Consumes: 无
- Produces（`js/crypto.js` 导出）:
  - 常量：`ENVELOPE_VERSION = 1`、`KDF_NAME = 'PBKDF2-SHA256'`、`PBKDF2_ITER = 600000`、`MIN_PASSWORD_LENGTH = 12`
  - `isCryptoSupported(): boolean`
  - `toBase64(bytes: Uint8Array): string`、`fromBase64(text: string): Uint8Array`
  - `deriveKey(password: string, salt: Uint8Array, iter: number): Promise<CryptoKey>`（不可导出，用途为 encrypt 和 decrypt）
  - `isEnvelope(v): boolean`
  - `encryptPayload(payload: object, password: string, options?: {iter?: number, salt?: Uint8Array}): Promise<Envelope>`
  - `decryptWithKey(envelope, key): Promise<object>`：密钥错误或密文被篡改时抛出 `WrongKeyError`
  - `unlockWithPassword(envelope, password): Promise<{key: CryptoKey, payload: object}>`
  - `class WrongKeyError extends Error`（message 为 `'密码不对'`）
  - Envelope 结构：`{v:1, kdf:'PBKDF2-SHA256', iter, salt, iv, ct}`，其中 salt、iv、ct 均为 base64

- [ ] **Step 1: 先写失败的测试** `tests/unit/crypto.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptPayload, unlockWithPassword, decryptWithKey, deriveKey, isEnvelope, isCryptoSupported,
  toBase64, fromBase64, WrongKeyError, PBKDF2_ITER, ENVELOPE_VERSION, KDF_NAME,
} from '../../js/crypto.js';

const FAST = { iter: 1000 };
const PASSWORD = 'correct horse battery';
const PAYLOAD = { version: 1, text: '中文内容 🙂', list: [1, 2, 3] };

test('round-trips a payload with the right password', async () => {
  const env = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  assert.equal(isEnvelope(env), true);
  assert.equal(env.v, ENVELOPE_VERSION);
  assert.equal(env.kdf, KDF_NAME);
  assert.equal(env.iter, 1000);
  assert.deepEqual((await unlockWithPassword(env, PASSWORD)).payload, PAYLOAD);
});

test('a wrong password raises WrongKeyError', async () => {
  const env = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  await assert.rejects(unlockWithPassword(env, 'not the password'), WrongKeyError);
});

test('tampered ciphertext raises WrongKeyError', async () => {
  const env = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  const bytes = fromBase64(env.ct);
  bytes[0] ^= 0xff;
  await assert.rejects(unlockWithPassword({ ...env, ct: toBase64(bytes) }, PASSWORD), WrongKeyError);
});

test('reusing the salt keeps a stored key valid across rebuilds', async () => {
  const first = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  const { key } = await unlockWithPassword(first, PASSWORD);
  const second = await encryptPayload({ ...PAYLOAD, rebuilt: true }, PASSWORD, { ...FAST, salt: fromBase64(first.salt) });
  assert.equal(second.salt, first.salt);
  assert.notEqual(second.iv, first.iv);
  assert.equal((await decryptWithKey(second, key)).rebuilt, true);
});

test('a new salt invalidates a stored key', async () => {
  const first = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  const { key } = await unlockWithPassword(first, PASSWORD);
  const second = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  assert.notEqual(second.salt, first.salt);
  await assert.rejects(decryptWithKey(second, key), WrongKeyError);
});

test('defaults to 600000 iterations, a 16-byte salt and a 12-byte iv', async () => {
  const env = await encryptPayload(PAYLOAD, PASSWORD);
  assert.equal(env.iter, PBKDF2_ITER);
  assert.equal(fromBase64(env.salt).length, 16);
  assert.equal(fromBase64(env.iv).length, 12);
});

test('non-ASCII passwords work', async () => {
  const env = await encryptPayload(PAYLOAD, '密码密码密码密码密码密码', FAST);
  assert.deepEqual((await unlockWithPassword(env, '密码密码密码密码密码密码')).payload, PAYLOAD);
});

test('isEnvelope rejects malformed input', async () => {
  const good = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  const bad = [null, 'x', {}, { ...good, v: 2 }, { ...good, kdf: 'scrypt' }, { ...good, iter: 0 }, { ...good, iter: 1.5 }, { ...good, ct: '' }, { ...good, salt: 1 }];
  bad.forEach((v) => assert.equal(isEnvelope(v), false, JSON.stringify(v)));
});

test('malformed envelopes fail with a clear message', async () => {
  await assert.rejects(unlockWithPassword({ v: 1 }, PASSWORD), /密文格式不正确/);
  const key = await deriveKey(PASSWORD, new Uint8Array(16), 1000);
  await assert.rejects(decryptWithKey({ v: 1 }, key), /密文格式不正确/);
});

test('base64 helpers round-trip every byte value', () => {
  const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
  assert.deepEqual(fromBase64(toBase64(bytes)), bytes);
});

test('derived keys are not extractable', async () => {
  const key = await deriveKey(PASSWORD, new Uint8Array(16), 1000);
  assert.equal(key.extractable, false);
});

test('Node provides every API the module needs', () => {
  assert.equal(isCryptoSupported(), true);
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `node --test tests/unit/crypto.test.mjs`
Expected: FAIL，报错 `Cannot find module ... js/crypto.js`

- [ ] **Step 3: 写实现** `js/crypto.js`

```js
// 浏览器与 Node 通用：只依赖 Web Crypto、CompressionStream、Blob/Response 和 btoa/atob
export const ENVELOPE_VERSION = 1;
export const KDF_NAME = 'PBKDF2-SHA256';
export const PBKDF2_ITER = 600000;
export const MIN_PASSWORD_LENGTH = 12;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const ENVELOPE_FIELDS = ['salt', 'iv', 'ct'];

const subtle = () => globalThis.crypto.subtle;

export class WrongKeyError extends Error {
  constructor() {
    super('密码不对');
    this.name = 'WrongKeyError';
  }
}

export function isCryptoSupported() {
  return Boolean(globalThis.crypto && globalThis.crypto.subtle
    && typeof globalThis.CompressionStream === 'function'
    && typeof globalThis.DecompressionStream === 'function');
}

export function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromBase64(text) {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

const gzip = (bytes) => pipe(bytes, new CompressionStream('gzip'));
const gunzip = (bytes) => pipe(bytes, new DecompressionStream('gzip'));
const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

export async function deriveKey(password, salt, iter) {
  const base = await subtle().importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function isEnvelope(v) {
  return v !== null && typeof v === 'object' && v.v === ENVELOPE_VERSION && v.kdf === KDF_NAME
    && Number.isInteger(v.iter) && v.iter > 0
    && ENVELOPE_FIELDS.every((k) => typeof v[k] === 'string' && v[k].length > 0);
}

export async function encryptPayload(payload, password, options = {}) {
  const iter = options.iter || PBKDF2_ITER;
  const salt = options.salt || randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveKey(password, salt, iter);
  const plain = await gzip(new TextEncoder().encode(JSON.stringify(payload)));
  const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, plain));
  return { v: ENVELOPE_VERSION, kdf: KDF_NAME, iter, salt: toBase64(salt), iv: toBase64(iv), ct: toBase64(ct) };
}

export async function decryptWithKey(envelope, key) {
  if (!isEnvelope(envelope)) throw new Error('密文格式不正确');
  let plain;
  try {
    plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.iv) }, key, fromBase64(envelope.ct));
  } catch {
    throw new WrongKeyError();
  }
  return JSON.parse(new TextDecoder().decode(await gunzip(new Uint8Array(plain))));
}

export async function unlockWithPassword(envelope, password) {
  if (!isEnvelope(envelope)) throw new Error('密文格式不正确');
  const key = await deriveKey(password, fromBase64(envelope.salt), envelope.iter);
  return { key, payload: await decryptWithKey(envelope, key) };
}
```

- [ ] **Step 4: 把 `'js/crypto.js'` 加进 `sw.js` 的 `SHELL`（放在 `'js/scoring.js'` 之后），再把 `--test-coverage-include=js/crypto.js` 加进 `package.json` 的 `test:cov`**

- [ ] **Step 5: 运行测试，确认通过**

Run: `npm test && npm run test:cov`
Expected: 全部通过，行覆盖率不低于 80%。

- [ ] **Step 6: 提交**

```bash
git add js/crypto.js tests/unit/crypto.test.mjs sw.js package.json
git commit -m "feat: add isomorphic AES-GCM envelope encryption"
```

---

### Task 2: md 解析、payload 组装与防泄漏检测

**Files:**
- Create: `scripts/interview-lib.mjs`
- Create: `tests/fixtures/interview/qbank/A-sample.md`
- Create: `tests/fixtures/interview/qbank/B-sample.md`
- Create: `tests/unit/interview-lib.test.mjs`
- Modify: `package.json`（`test:cov` 加 `--test-coverage-include=scripts/interview-lib.mjs`）

**Interfaces:**
- Consumes: Task 1 的 `encryptPayload`、`unlockWithPassword`、`isEnvelope`、`fromBase64`、`MIN_PASSWORD_LENGTH`、`PBKDF2_ITER`
- Produces（`scripts/interview-lib.mjs` 导出）:
  - `IV_WEIGHTS = {A:20,B:18,C:8,D:12,E:10,F:8,G:18,H:6}`，`REQUIRED_LETTERS = ['A',…,'H']`
  - `parseInline(text): Span[]`：Span 为 `{t:'text'|'b'|'code'|'todo', s}`
  - `parseBlocks(lines: string[]): Block[]`：Block 为 `{t:'p', c: Span[]}` 或 `{t:'ul'|'ol', items: Span[][]}`
  - `parseQbankFile(text, letter, fileName): {domain, cards}`
  - `buildPayload(sources: {letter, fileName, text}[], builtAt: string): Payload`
  - `loadSources(srcDir): {letter, fileName, text}[]`
  - `readExtraTerms(srcDir): string[]`
  - `leakTerms(payload, extra: string[]): string[]`
  - `findLeaks(files: {path, text}[], terms): {path, term}[]`
  - `repoTextFiles(root): {path, text}[]`
  - `isInside(root, target): boolean`
  - `checkPassword(password)`：不合格时抛错
  - `encryptInterview(payload, password, {existing?, newSalt?, iter?}): Promise<Envelope>`
- Payload 结构（spec §3.3，本计划细化如下）：
  ```
  {version:1, builtAt,
   domains:[{id:'iv-a', letter:'A', name, intro: Block[], weight}],
   cards:{'iv-a':[{id:'iv-a-c01', domain:'iv-a', no:'A1', title,
                   parts:{conclusion|principle|practice|tradeoff:{warn:boolean, blocks:Block[]}},
                   hasTodo}]},
   questions:{'iv-a':[]}}
  ```

- [ ] **Step 1: 写虚构的测试题库**（内容全部虚构，不要替换成真实题目）

`tests/fixtures/interview/qbank/A-sample.md`：

```markdown
# A. 示例类别甲（3 题）

> 这是测试用的虚构题库，只用于自动化测试。
> 代码路径都相对于 `demo/src/`。

### A1. 什么是示例循环？它和普通调用有什么区别？

**结论**：示例循环由模型决定下一步【待补：补一个真实例子】。

**原理**：普通调用是一问一答，示例循环会多轮交互。
需要设置最大步数。

**我在项目里怎么做**：示例项目在 `demo/src/very/long/path/that/needs/to/wrap/on/a/narrow/phone/screen/loop.py` 里实现。

**取舍与局限**：每一步都要调用一次模型，成本随步数增长。

### A2. 示例工具的描述应该怎么写？

**结论**：把工具当成给新同事写的文档。

**原理** ⚠️：
- **名字**：用动宾结构。
- **参数**：写明格式，
  并给出示例。

**我在项目里怎么做**：
1. 先写描述。
2. 再用测评验证。

**取舍与局限**：描述太长会占用上下文。

### A3. 示例记忆一般分成几类？

**结论**：分短期记忆和长期记忆两类。

**原理**：短期记忆在上下文里，长期记忆在外部存储里。

**我在项目里怎么做**：示例项目只用了短期记忆。

**取舍与局限**：长期记忆需要考虑隐私。
```

`tests/fixtures/interview/qbank/B-sample.md`：

```markdown
# B. 示例类别乙（3 题）

### B1. 示例检索为什么要做成混合检索？

**结论**：向量检索和关键词检索各有盲区。

**原理**：关键词检索擅长精确匹配 ID 和术语。

**我在项目里怎么做**：示例项目用 RRF 融合两路结果。

**取舍与局限**：多一路检索会增加延迟。

### B2. 示例文档的分块大小怎么选？

**结论**：先按标题切分，再控制长度。

**原理**：块太大噪声多，块太小丢上下文。

**我在项目里怎么做**：示例项目每块五百字左右。

**取舍与局限**：不同文档类型需要不同的参数。

### B3. 示例重排模型有什么代价？

**结论**：精度更高，但延迟更大。

**原理**：交叉编码器要逐对计算相关性。

**我在项目里怎么做**：示例项目只对前二十条重排。

**取舍与局限**：需要额外部署一个模型。
```

- [ ] **Step 2: 先写失败的测试** `tests/unit/interview-lib.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseInline, parseBlocks, parseQbankFile, buildPayload, loadSources, readExtraTerms,
  leakTerms, findLeaks, repoTextFiles, isInside, checkPassword, encryptInterview, IV_WEIGHTS,
} from '../../scripts/interview-lib.mjs';
import { unlockWithPassword, decryptWithKey } from '../../js/crypto.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'interview');
const A_TEXT = fs.readFileSync(path.join(FIXTURE, 'qbank', 'A-sample.md'), 'utf8');
const PASSWORD = 'fixture-password-2026';

test('parseInline recognises bold, code and todo spans', () => {
  assert.deepEqual(parseInline('先 **粗体** 再 `code` 然后【待补：例子】。'), [
    { t: 'text', s: '先 ' }, { t: 'b', s: '粗体' }, { t: 'text', s: ' 再 ' },
    { t: 'code', s: 'code' }, { t: 'text', s: ' 然后' }, { t: 'todo', s: '【待补：例子】' }, { t: 'text', s: '。' },
  ]);
  assert.deepEqual(parseInline('【待 Task 12】'), [{ t: 'todo', s: '【待 Task 12】' }]);
  assert.deepEqual(parseInline('没有格式'), [{ t: 'text', s: '没有格式' }]);
});

test('parseBlocks builds paragraphs and lists, joining wrapped lines', () => {
  assert.deepEqual(parseBlocks(['第一行，', '第二行。', '', '- 甲', '  续行', '- 乙', '', '1. 一', '2. 二', '', 'plain', 'text']), [
    { t: 'p', c: [{ t: 'text', s: '第一行，第二行。' }] },
    { t: 'ul', items: [[{ t: 'text', s: '甲续行' }], [{ t: 'text', s: '乙' }]] },
    { t: 'ol', items: [[{ t: 'text', s: '一' }], [{ t: 'text', s: '二' }]] },
    { t: 'p', c: [{ t: 'text', s: 'plain text' }] },
  ]);
});

test('parseQbankFile reads the domain header, intro and four parts', () => {
  const { domain, cards } = parseQbankFile(A_TEXT, 'A', 'A-sample.md');
  assert.equal(domain.id, 'iv-a');
  assert.equal(domain.letter, 'A');
  assert.equal(domain.name, '示例类别甲');
  assert.equal(domain.weight, IV_WEIGHTS.A);
  assert.equal(domain.intro.length, 2);
  assert.equal(cards.length, 3);
  const [a1, a2] = cards;
  assert.equal(a1.id, 'iv-a-c01');
  assert.equal(a1.domain, 'iv-a');
  assert.equal(a1.no, 'A1');
  assert.equal(a1.title, '什么是示例循环？它和普通调用有什么区别？');
  assert.equal(a1.hasTodo, true);
  assert.deepEqual(a1.parts.conclusion, { warn: false, blocks: [{ t: 'p', c: [
    { t: 'text', s: '示例循环由模型决定下一步' }, { t: 'todo', s: '【待补：补一个真实例子】' }, { t: 'text', s: '。' },
  ] }] });
  assert.deepEqual(a1.parts.principle.blocks, [{ t: 'p', c: [{ t: 'text', s: '普通调用是一问一答，示例循环会多轮交互。需要设置最大步数。' }] }]);
  assert.equal(a2.hasTodo, false);
  assert.equal(a2.parts.principle.warn, true);
  assert.deepEqual(a2.parts.principle.blocks, [{ t: 'ul', items: [
    [{ t: 'b', s: '名字' }, { t: 'text', s: '：用动宾结构。' }],
    [{ t: 'b', s: '参数' }, { t: 'text', s: '：写明格式，并给出示例。' }],
  ] }]);
  assert.deepEqual(a2.parts.practice.blocks, [{ t: 'ol', items: [[{ t: 'text', s: '先写描述。' }], [{ t: 'text', s: '再用测评验证。' }]] }]);
});

test('CRLF files parse exactly like LF files', () => {
  assert.deepEqual(parseQbankFile(A_TEXT.replace(/\n/g, '\r\n'), 'A', 'A.md'), parseQbankFile(A_TEXT, 'A', 'A.md'));
});

test('parseQbankFile reports structural errors with file and question', () => {
  const head = '# A. 甲（2 题）\n\n';
  const body = (n) => `### A${n}. 题目${n}\n\n**结论**：a\n\n**原理**：b\n\n**我在项目里怎么做**：c\n\n**取舍与局限**：d\n\n`;
  assert.throws(() => parseQbankFile(`# B. 乙\n\n${body(1)}`, 'A', 'x.md'), /x\.md:1: 第一行应为「# A\. 类别名」/);
  assert.throws(() => parseQbankFile(head, 'A', 'x.md'), /没有找到任何/);
  assert.throws(() => parseQbankFile(head + body(1) + body(3), 'A', 'x.md'), /题号应为 A2，实际 A3/);
  assert.throws(() => parseQbankFile(head + body(1).replace('**取舍与局限**：d', ''), 'A', 'x.md'), /x\.md A1: 缺少 取舍与局限/);
  assert.throws(() => parseQbankFile(head + body(1).replace('**原理**：b', '**结论**：b'), 'A', 'x.md'), /x\.md A1: 「结论」出现了两次/);
});

test('loadSources + buildPayload assemble the fixture bank', () => {
  const sources = loadSources(FIXTURE);
  assert.deepEqual(sources.map((s) => s.letter), ['A', 'B']);
  const payload = buildPayload(sources, '2026-01-01T00:00:00Z');
  assert.equal(payload.version, 1);
  assert.equal(payload.builtAt, '2026-01-01T00:00:00Z');
  assert.deepEqual(payload.domains.map((d) => d.id), ['iv-a', 'iv-b']);
  assert.deepEqual(payload.domains[1].intro, []);
  assert.equal(payload.cards['iv-b'].length, 3);
  assert.deepEqual(payload.questions, { 'iv-a': [], 'iv-b': [] });
});

test('buildPayload rejects two files for the same letter', () => {
  const [a] = loadSources(FIXTURE);
  assert.throws(() => buildPayload([a, { ...a, fileName: 'A-other.md' }], 'x'), /类别 A 有多个文件/);
});

test('loadSources fails clearly when the folder is missing', () => {
  assert.throws(() => loadSources(path.join(FIXTURE, 'nope')), /找不到题库目录/);
});

test('readExtraTerms reads one term per line, skipping blanks and comments', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iv-terms-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.deepEqual(readExtraTerms(dir), []);
  fs.mkdirSync(path.join(dir, 'qbank-app'));
  fs.writeFileSync(path.join(dir, 'qbank-app', 'leak-terms.txt'), '# 注释\n\n甲乙\r\n  丙丁  \n');
  assert.deepEqual(readExtraTerms(dir), ['甲乙', '丙丁']);
});

test('leakTerms uses long titles, conclusion prefixes and every extra term', () => {
  const payload = buildPayload(loadSources(FIXTURE), 'x');
  const terms = leakTerms(payload, ['XY']);
  assert.ok(terms.includes('什么是示例循环？它和普通调用有什么区别？'));
  assert.ok(terms.includes('示例循环由模型决定下一步【待补：补一个真'));
  assert.ok(terms.includes('XY'));
  const short = { cards: { 'iv-a': [{ title: '短标题', parts: { conclusion: { blocks: [] } } }] } };
  assert.deepEqual(leakTerms(short, []), []);
});

test('findLeaks reports each file and term that matched', () => {
  const files = [{ path: 'a.txt', text: '这里有甲乙丙' }, { path: 'b.txt', text: '干净' }];
  assert.deepEqual(findLeaks(files, ['甲乙', '丁']), [{ path: 'a.txt', term: '甲乙' }]);
});

test('repoTextFiles lists tracked text files and skips images', () => {
  const files = repoTextFiles(ROOT).map((f) => f.path);
  assert.ok(files.includes('package.json'));
  assert.ok(!files.some((p) => p.endsWith('.png')));
  assert.ok(!files.some((p) => p.startsWith('node_modules/')));
});

test('the leak scan finds fixture text inside this repo (proves the scan works)', () => {
  const payload = buildPayload(loadSources(FIXTURE), 'x');
  const paths = findLeaks(repoTextFiles(ROOT), leakTerms(payload, [])).map((l) => l.path);
  assert.ok(paths.includes('tests/fixtures/interview/qbank/A-sample.md'), paths.join('\n'));
  assert.ok(!paths.some((p) => p.startsWith('js/')), paths.join('\n'));
});

test('isInside detects paths inside a root, case-insensitively on Windows', () => {
  assert.equal(isInside(ROOT, path.join(ROOT, 'data', 'x')), true);
  assert.equal(isInside(ROOT, ROOT), true);
  assert.equal(isInside(ROOT, path.dirname(ROOT)), false);
  assert.equal(isInside(ROOT, path.join(path.dirname(ROOT), 'other')), false);
  if (process.platform === 'win32') assert.equal(isInside(ROOT, ROOT.toUpperCase()), true);
});

test('checkPassword requires at least 12 characters, counting CJK as one each', () => {
  assert.throws(() => checkPassword('short'), /至少 12 个字符/);
  assert.throws(() => checkPassword(undefined), /至少 12 个字符/);
  checkPassword('密码密码密码密码密码密码');
  checkPassword('abcdefghijkl');
});

test('encryptInterview self-checks, reuses the salt and can rotate it', async () => {
  const payload = buildPayload(loadSources(FIXTURE), 'x');
  const first = await encryptInterview(payload, PASSWORD, { iter: 1000 });
  assert.deepEqual((await unlockWithPassword(first, PASSWORD)).payload, payload);
  const { key } = await unlockWithPassword(first, PASSWORD);
  const reused = await encryptInterview(payload, PASSWORD, { existing: first, iter: 1000 });
  assert.equal(reused.salt, first.salt);
  assert.deepEqual(await decryptWithKey(reused, key), payload);
  const rotated = await encryptInterview(payload, PASSWORD, { existing: first, newSalt: true, iter: 1000 });
  assert.notEqual(rotated.salt, first.salt);
  const fresh = await encryptInterview(payload, PASSWORD, { existing: { broken: true }, iter: 1000 });
  assert.notEqual(fresh.salt, first.salt);
  await assert.rejects(encryptInterview(payload, 'short', { iter: 1000 }), /至少 12 个字符/);
});
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `node --test tests/unit/interview-lib.test.mjs`
Expected: FAIL，报错 `Cannot find module ... interview-lib.mjs`

- [ ] **Step 4: 写实现** `scripts/interview-lib.mjs`

```js
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  encryptPayload, unlockWithPassword, isEnvelope, fromBase64, MIN_PASSWORD_LENGTH, PBKDF2_ITER,
} from '../js/crypto.js';

export const IV_WEIGHTS = { A: 20, B: 18, C: 8, D: 12, E: 10, F: 8, G: 18, H: 6 };
export const REQUIRED_LETTERS = Object.keys(IV_WEIGHTS);
export const LEAK_PREFIX_CHARS = 20;
export const MIN_TERM_LENGTH = 8;
const PART_KEYS = [['结论', 'conclusion'], ['原理', 'principle'], ['我在项目里怎么做', 'practice'], ['取舍与局限', 'tradeoff']];
const FILE_RE = /^([A-H])-[\w-]+\.md$/;
const TITLE_RE = /^# ([A-H])\. (.+?)(?:（\d+ 题）)?\s*$/;
const QUESTION_RE = /^### ([A-H])(\d+)\. (.+?)\s*$/;
const LABEL_RE = /^\*\*(结论|原理|我在项目里怎么做|取舍与局限)\*\*\s*(⚠️)?\s*[：:]?\s*/;
const UL_RE = /^[-*] (.*)$/;
const OL_RE = /^\d+\. (.*)$/;
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|【待[^】]*】)/;
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2']);
const ASCII_END = /[\x21-\x7e]$/;
const ASCII_START = /^[\x21-\x7e]/;

// ---------- md 解析 ----------

export function parseInline(text) {
  return text.split(INLINE_RE).filter((s) => s !== '').map((s) => {
    if (/^\*\*[^*]+\*\*$/.test(s)) return { t: 'b', s: s.slice(2, -2) };
    if (/^`[^`]+`$/.test(s)) return { t: 'code', s: s.slice(1, -1) };
    if (/^【待[^】]*】$/.test(s)) return { t: 'todo', s };
    return { t: 'text', s };
  });
}

// 中文续行直接拼接；两侧都是 ASCII 时补一个空格，与 md 渲染一致
function joinLine(a, b) {
  return ASCII_END.test(a) && ASCII_START.test(b) ? `${a} ${b}` : a + b;
}

export function parseBlocks(lines) {
  const raw = [];
  let current = null;
  const flush = () => {
    if (current) raw.push(current);
    current = null;
  };
  lines.forEach((source) => {
    const line = source.trim();
    if (!line) {
      flush();
      return;
    }
    const ul = UL_RE.exec(line);
    const ol = ul ? null : OL_RE.exec(line);
    if (ul || ol) {
      const type = ul ? 'ul' : 'ol';
      if (!current || current.t !== type) {
        flush();
        current = { t: type, items: [] };
      }
      current.items.push((ul || ol)[1]);
      return;
    }
    if (current && current.t !== 'p') {
      const last = current.items.length - 1;
      current.items[last] = joinLine(current.items[last], line);
    } else if (current) {
      current.text = joinLine(current.text, line);
    } else {
      current = { t: 'p', text: line };
    }
  });
  flush();
  return raw.map((b) => (b.t === 'p' ? { t: 'p', c: parseInline(b.text) } : { t: b.t, items: b.items.map(parseInline) }));
}

function spansOf(blocks) {
  return [].concat(...blocks.map((b) => (b.t === 'p' ? b.c : [].concat(...b.items))));
}

function splitParts(lines, where) {
  const found = {};
  let key = null;
  lines.forEach((line) => {
    const m = LABEL_RE.exec(line.trim());
    if (m) {
      key = PART_KEYS.filter((p) => p[0] === m[1])[0][1];
      if (found[key]) throw new Error(`${where}: 「${m[1]}」出现了两次`);
      const rest = line.trim().slice(m[0].length);
      found[key] = { warn: Boolean(m[2]), lines: rest ? [rest] : [] };
      return;
    }
    if (key) found[key].lines.push(line);
  });
  const missing = PART_KEYS.filter((p) => !found[p[1]]).map((p) => p[0]);
  if (missing.length) throw new Error(`${where}: 缺少 ${missing.join('、')}`);
  const parts = {};
  PART_KEYS.forEach(([, k]) => {
    parts[k] = { warn: found[k].warn, blocks: parseBlocks(found[k].lines) };
  });
  return parts;
}

export function parseQbankFile(text, letter, fileName) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const title = TITLE_RE.exec(lines[0] || '');
  if (!title || title[1] !== letter) throw new Error(`${fileName}:1: 第一行应为「# ${letter}. 类别名」`);
  const heads = [];
  lines.forEach((line, i) => {
    const m = QUESTION_RE.exec(line);
    if (m) heads.push({ i, letter: m[1], no: Number(m[2]), title: m[3] });
  });
  if (!heads.length) throw new Error(`${fileName}: 没有找到任何「### ${letter}1. 」形式的题目`);
  heads.forEach((hd, k) => {
    if (hd.letter !== letter || hd.no !== k + 1) {
      throw new Error(`${fileName}:${hd.i + 1}: 题号应为 ${letter}${k + 1}，实际 ${hd.letter}${hd.no}`);
    }
  });
  const id = `iv-${letter.toLowerCase()}`;
  const introLines = lines.slice(1, heads[0].i).filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, ''));
  const intro = parseBlocks([].concat(...introLines.map((l) => [l, ''])));
  const cards = heads.map((hd, k) => {
    const end = k + 1 < heads.length ? heads[k + 1].i : lines.length;
    const parts = splitParts(lines.slice(hd.i + 1, end), `${fileName} ${letter}${hd.no}`);
    const hasTodo = PART_KEYS.some(([, key]) => spansOf(parts[key].blocks).some((s) => s.t === 'todo'));
    return { id: `${id}-c${String(hd.no).padStart(2, '0')}`, domain: id, no: `${letter}${hd.no}`, title: hd.title, parts, hasTodo };
  });
  return { domain: { id, letter, name: title[2].trim(), intro, weight: IV_WEIGHTS[letter] }, cards };
}

export function buildPayload(sources, builtAt) {
  const seen = new Set();
  sources.forEach((s) => {
    if (seen.has(s.letter)) throw new Error(`类别 ${s.letter} 有多个文件`);
    seen.add(s.letter);
  });
  const parsed = sources.map((s) => parseQbankFile(s.text, s.letter, s.fileName));
  const cards = {};
  const questions = {};
  parsed.forEach((p) => {
    cards[p.domain.id] = p.cards;
    questions[p.domain.id] = [];
  });
  return { version: 1, builtAt, domains: parsed.map((p) => p.domain), cards, questions };
}

// ---------- 读取源文件 ----------

export function loadSources(srcDir) {
  const dir = path.join(srcDir, 'qbank');
  if (!fs.existsSync(dir)) throw new Error(`找不到题库目录：${dir}`);
  return fs.readdirSync(dir).filter((n) => FILE_RE.test(n)).sort().map((fileName) => ({
    letter: FILE_RE.exec(fileName)[1],
    fileName,
    text: fs.readFileSync(path.join(dir, fileName), 'utf8'),
  }));
}

export function readExtraTerms(srcDir) {
  const file = path.join(srcDir, 'qbank-app', 'leak-terms.txt');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

// ---------- 防泄漏 ----------

export function leakTerms(payload, extra) {
  const derived = [];
  Object.keys(payload.cards).forEach((d) => payload.cards[d].forEach((card) => {
    derived.push(card.title);
    derived.push(spansOf(card.parts.conclusion.blocks).map((s) => s.s).join('').trim().slice(0, LEAK_PREFIX_CHARS));
  }));
  const long = derived.map((t) => t.trim()).filter((t) => t.length >= MIN_TERM_LENGTH);
  return Array.from(new Set(long.concat(extra.map((t) => t.trim()).filter(Boolean))));
}

export function findLeaks(files, terms) {
  const hits = [];
  files.forEach((f) => terms.forEach((term) => {
    if (f.text.includes(term)) hits.push({ path: f.path, term });
  }));
  return hits;
}

export function repoTextFiles(root) {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' });
  return out.split('\0').filter(Boolean)
    .filter((p) => !BINARY_EXT.has(path.extname(p).toLowerCase()))
    .filter((p) => fs.existsSync(path.join(root, p)))
    .map((p) => ({ path: p, text: fs.readFileSync(path.join(root, p), 'utf8') }));
}

export function isInside(root, target) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// ---------- 加密 ----------

export function checkPassword(password) {
  if (typeof password !== 'string' || Array.from(password).length < MIN_PASSWORD_LENGTH) {
    throw new Error(`密码至少 ${MIN_PASSWORD_LENGTH} 个字符`);
  }
}

export async function encryptInterview(payload, password, options = {}) {
  checkPassword(password);
  const reuse = !options.newSalt && isEnvelope(options.existing);
  const envelope = await encryptPayload(payload, password, {
    iter: options.iter || PBKDF2_ITER,
    salt: reuse ? fromBase64(options.existing.salt) : undefined,
  });
  const check = await unlockWithPassword(envelope, password);
  if (JSON.stringify(check.payload) !== JSON.stringify(payload)) throw new Error('加密自检失败：解密结果与原文不一致');
  return envelope;
}
```

- [ ] **Step 5: 把 `--test-coverage-include=scripts/interview-lib.mjs` 加进 `package.json` 的 `test:cov`**

- [ ] **Step 6: 运行测试，确认通过**

Run: `npm test && npm run test:cov`
Expected: 全部通过，行覆盖率不低于 80%。

- [ ] **Step 7: 提交**

```bash
git add scripts/interview-lib.mjs tests/fixtures/interview tests/unit/interview-lib.test.mjs package.json
git commit -m "feat: parse interview markdown into an encryptable payload"
```

---

### Task 3: 构建与恢复命令、防泄漏测试、README

**Files:**
- Create: `scripts/build-interview.mjs`
- Create: `scripts/decrypt-interview.mjs`
- Create: `tests/unit/no-plaintext.test.mjs`
- Create: `tests/unit/interview-cli.test.mjs`
- Modify: `package.json`（`scripts` 加 `build:interview` 和 `decrypt:interview`）
- Modify: `README.md`（加一节「面试题库（加密）」）

**Interfaces:**
- Consumes: Task 2 的全部导出
- Produces:
  - `npm run build:interview [-- --new-salt]`：需要环境变量 `INTERVIEW_SRC` 和 `INTERVIEW_PASSWORD`，写出 `data/interview.enc`
  - `npm run decrypt:interview -- <仓库外的目录>`：需要环境变量 `INTERVIEW_PASSWORD`，写出 `<目录>/interview-payload.json`
  - 为了测试，两个脚本都支持环境变量 `INTERVIEW_ENC`，用来覆盖密文路径（默认是 `data/interview.enc`），也都支持 `INTERVIEW_ITER`（只在测试中使用；传入的值低于 `PBKDF2_ITER` 时，只有同时设置了 `INTERVIEW_TEST=1` 才会生效）

- [ ] **Step 1: 先写失败的测试** `tests/unit/interview-cli.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { unlockWithPassword } from '../../js/crypto.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'interview');
const PASSWORD = 'fixture-password-2026';

function run(script, env, args = []) {
  return spawnSync(process.execPath, [path.join(ROOT, 'scripts', script)].concat(args), {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, INTERVIEW_TEST: '1', INTERVIEW_ITER: '1000', ...env },
  });
}

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iv-cli-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('build refuses to run without the source folder or password', (t) => {
  const out = path.join(tempDir(t), 'x.enc');
  assert.match(run('build-interview.mjs', { INTERVIEW_SRC: '', INTERVIEW_ENC: out }).stderr, /INTERVIEW_SRC/);
  assert.match(run('build-interview.mjs', { INTERVIEW_SRC: FIXTURE, INTERVIEW_PASSWORD: '', INTERVIEW_ENC: out }).stderr, /INTERVIEW_PASSWORD/);
  assert.equal(fs.existsSync(out), false);
});

test('build requires all eight category files', (t) => {
  const out = path.join(tempDir(t), 'x.enc');
  const res = run('build-interview.mjs', { INTERVIEW_SRC: FIXTURE, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /缺少类别文件：C、D、E、F、G、H/);
  assert.equal(fs.existsSync(out), false);
});

test('build refuses to write when source text is found in the repo', (t) => {
  const dir = tempDir(t);
  fs.cpSync(FIXTURE, dir, { recursive: true });
  ['C', 'D', 'E', 'F', 'G', 'H'].forEach((l) => {
    const text = `# ${l}. 占位类别\n\n### ${l}1. 占位问题${l}：完全不会出现在仓库里的标题\n\n**结论**：x\n\n**原理**：x\n\n**我在项目里怎么做**：x\n\n**取舍与局限**：x\n`;
    fs.writeFileSync(path.join(dir, 'qbank', `${l}-stub.md`), text);
  });
  const out = path.join(dir, 'x.enc');
  const res = run('build-interview.mjs', { INTERVIEW_SRC: dir, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /tests\/fixtures\/interview\/qbank\/A-sample\.md/);
  assert.equal(fs.existsSync(out), false);
});

test('build writes a working envelope when the repo is clean, and decrypt restores it outside the repo', async (t) => {
  const dir = tempDir(t);
  // 标题只能动态拼出来：写成字面量会被防泄漏扫描在本测试文件里找到
  const title = (l) => `临时问题 ${l} 只存在于系统临时目录`;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((l) => {
    fs.mkdirSync(path.join(dir, 'qbank'), { recursive: true });
    const text = `# ${l}. 临时类别\n\n### ${l}1. ${title(l)}\n\n**结论**：临时结论 ${l}\n\n**原理**：x\n\n**我在项目里怎么做**：x\n\n**取舍与局限**：x\n`;
    fs.writeFileSync(path.join(dir, 'qbank', `${l}-tmp.md`), text);
  });
  const out = path.join(dir, 'x.enc');
  const build = run('build-interview.mjs', { INTERVIEW_SRC: dir, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.equal(build.status, 0, build.stderr);
  assert.match(build.stdout, /8 个类别，8 张卡片/);
  const envelope = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal((await unlockWithPassword(envelope, PASSWORD)).payload.cards['iv-h'][0].no, 'H1');

  const again = run('build-interview.mjs', { INTERVIEW_SRC: dir, INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out });
  assert.equal(again.status, 0, again.stderr);
  assert.equal(JSON.parse(fs.readFileSync(out, 'utf8')).salt, envelope.salt);

  const restoreDir = path.join(dir, 'restore');
  const dec = run('decrypt-interview.mjs', { INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: out }, [restoreDir]);
  assert.equal(dec.status, 0, dec.stderr);
  const restored = JSON.parse(fs.readFileSync(path.join(restoreDir, 'interview-payload.json'), 'utf8'));
  assert.equal(restored.cards['iv-a'][0].title, title('A'));
});

test('decrypt refuses an output folder inside the repo and a wrong password', (t) => {
  const inside = run('decrypt-interview.mjs', { INTERVIEW_PASSWORD: PASSWORD }, [path.join(ROOT, 'tmp-out')]);
  assert.notEqual(inside.status, 0);
  assert.match(inside.stderr, /输出目录必须在仓库之外/);
  assert.equal(fs.existsSync(path.join(ROOT, 'tmp-out')), false);
  const dir = tempDir(t);
  const missing = run('decrypt-interview.mjs', { INTERVIEW_PASSWORD: PASSWORD, INTERVIEW_ENC: path.join(dir, 'none.enc') }, [dir]);
  assert.match(missing.stderr, /找不到密文文件/);
});
```

`tests/unit/no-plaintext.test.mjs`：

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  loadSources, buildPayload, leakTerms, readExtraTerms, repoTextFiles, findLeaks,
} from '../../scripts/interview-lib.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC = process.env.INTERVIEW_SRC;

test('no interview plaintext is tracked or waiting to be committed', { skip: SRC ? false : '未设置 INTERVIEW_SRC，跳过真实题库的防泄漏检查' }, () => {
  const payload = buildPayload(loadSources(SRC), 'check');
  const leaks = findLeaks(repoTextFiles(ROOT), leakTerms(payload, readExtraTerms(SRC)));
  assert.deepEqual(leaks.map((l) => l.path), [], '以上文件含有面试题库原文，不能提交');
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `node --test tests/unit/interview-cli.test.mjs`
Expected: FAIL，因为脚本文件不存在，退出码不是 0，与断言不符。

- [ ] **Step 3: 写** `scripts/build-interview.mjs`

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadSources, buildPayload, leakTerms, readExtraTerms, findLeaks, repoTextFiles, encryptInterview, REQUIRED_LETTERS,
} from './interview-lib.mjs';
import { PBKDF2_ITER } from '../js/crypto.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function iterations() {
  const requested = Number(process.env.INTERVIEW_ITER);
  return process.env.INTERVIEW_TEST === '1' && requested > 0 ? requested : PBKDF2_ITER;
}

async function main() {
  const src = process.env.INTERVIEW_SRC;
  const password = process.env.INTERVIEW_PASSWORD;
  const out = process.env.INTERVIEW_ENC || path.join(ROOT, 'data', 'interview.enc');
  if (!src) throw new Error('请设置环境变量 INTERVIEW_SRC（面试准备目录，里面有 qbank/）');
  if (!password) throw new Error('请设置环境变量 INTERVIEW_PASSWORD');
  const sources = loadSources(src);
  const letters = sources.map((s) => s.letter);
  const missing = REQUIRED_LETTERS.filter((l) => letters.indexOf(l) === -1);
  if (missing.length) throw new Error(`缺少类别文件：${missing.join('、')}`);
  const payload = buildPayload(sources, new Date().toISOString());
  const leaks = findLeaks(repoTextFiles(ROOT), leakTerms(payload, readExtraTerms(src)));
  if (leaks.length) {
    const lines = leaks.map((l) => `  - ${l.path}：「${l.term}」`).join('\n');
    throw new Error(`仓库里发现面试题库原文，已停止构建：\n${lines}`);
  }
  const existing = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const envelope = await encryptInterview(payload, password, {
    existing, newSalt: process.argv.includes('--new-salt'), iter: iterations(),
  });
  const text = `${JSON.stringify(envelope)}\n`;
  fs.writeFileSync(out, text);
  const cards = [].concat(...payload.domains.map((d) => payload.cards[d.id]));
  const todo = cards.filter((c) => c.hasTodo).length;
  process.stdout.write(`已生成 ${path.relative(ROOT, out) || out}：${payload.domains.length} 个类别，${cards.length} 张卡片（${todo} 张含待补），密文 ${(text.length / 1024).toFixed(1)} KB\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 4: 写** `scripts/decrypt-interview.mjs`

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isInside } from './interview-lib.mjs';
import { unlockWithPassword } from '../js/crypto.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const outDir = process.argv[2];
  const password = process.env.INTERVIEW_PASSWORD;
  const enc = process.env.INTERVIEW_ENC || path.join(ROOT, 'data', 'interview.enc');
  if (!outDir) throw new Error('用法：npm run decrypt:interview -- <仓库外的输出目录>');
  if (isInside(ROOT, outDir)) throw new Error('输出目录必须在仓库之外，避免明文被提交');
  if (!password) throw new Error('请设置环境变量 INTERVIEW_PASSWORD');
  if (!fs.existsSync(enc)) throw new Error(`找不到密文文件：${enc}`);
  const { payload } = await unlockWithPassword(JSON.parse(fs.readFileSync(enc, 'utf8')), password);
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 'interview-payload.json');
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  process.stdout.write(`已解密到 ${file}\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 5: 在 `package.json` 的 `scripts` 里加两行**

```json
"build:interview": "node scripts/build-interview.mjs",
"decrypt:interview": "node scripts/decrypt-interview.mjs",
```

- [ ] **Step 6: 在 `README.md` 末尾加一节**

````markdown
## 面试题库（加密）

面试题库的明文只在本机的面试准备目录里（下称 prep 目录，其中 `qbank/` 下是 A 到 H 共 8 个 md 文件）。仓库和线上站点只有密文 `data/interview.enc`。

**构建 / 更新**（在 PowerShell 里执行，密码不要写进任何文件）：

```powershell
$env:INTERVIEW_SRC = "<prep 目录>"
$env:INTERVIEW_PASSWORD = Read-Host "密码"
npm run build:interview          # 改密码时加上 -- --new-salt
Remove-Item Env:INTERVIEW_PASSWORD
npm run bump                      # 发布前递增缓存版本
```

- 密码至少 12 个字符。密文是公开的，别人可以离线反复猜，密码强度是唯一的防线。
- 构建前会自动扫描仓库，发现题库原文就停止。可以在 `<prep 目录>/qbank-app/leak-terms.txt` 里另外列出敏感词，每行一个，只放在本机。
- 同一个密码重复构建时，会沿用原来的 salt，手机上保存的密钥继续有效。改密码时加 `--new-salt`，手机上会重新要求输入密码。
- **旧密文会永久留在 git 历史里**，用旧密码仍然能解开。改密码并不能让旧内容失效。
- **恢复**：`npm run decrypt:interview -- <仓库外的目录>`，会写出 `interview-payload.json`。
- 设置 `INTERVIEW_SRC` 后运行 `npm test`，会额外对真实题库做一次防泄漏检查。
````

- [ ] **Step 7: 运行测试，确认通过**

Run: `npm test`
Expected: 全部通过；`no-plaintext` 测试显示 skipped（因为没有设置 `INTERVIEW_SRC`）。

- [ ] **Step 8: 提交**

```bash
git add scripts/build-interview.mjs scripts/decrypt-interview.mjs tests/unit/interview-cli.test.mjs tests/unit/no-plaintext.test.mjs package.json README.md
git commit -m "feat: add build and restore commands for the encrypted interview bank"
```

---

### Task 4: 面试进度逻辑、可配置存储、按题库校验导入文件

**Files:**
- Create: `js/interview.js`
- Create: `tests/unit/interview.test.mjs`
- Modify: `js/progress.js`（导出 `answersProblem`；`validateImport` 拒绝带 `bank` 字段的文件）
- Modify: `js/storage.js`（`createStore(storage, options)`）
- Modify: `tests/unit/storage.test.mjs`（加一个测试）
- Modify: `sw.js`（`SHELL` 加 `'js/interview.js'`）
- Modify: `package.json`（`test:cov` 加 `--test-coverage-include=js/interview.js`）

**Interfaces:**
- Consumes: `exam.js` 的 `allocate(weights, total)`、`shuffle(list, rng)`；`progress.js` 的 `answersProblem(raw)`（本任务新增）
- Produces（`js/interview.js` 导出）:
  - 常量：
    - `IV_SCHEMA_VERSION = 1`、`IV_BANK = 'interview'`、`IV_STORAGE_KEY = 'acp-interview-progress-v1'`
    - `GRADES = ['known','fuzzy','unknown']`
    - `MOCK_SIZE = 12`、`MOCK_SOFT_LIMIT_MS = 120000`、`MAX_MOCKS = 20`
  - `emptyInterviewProgress()`：返回 `{schemaVersion:1, bank:'interview', answers:{}, wrong:{}, cards:{}, mocks:[], mockDraft:null}`
  - 卡片自评：
    - `gradeCard(progress, cardId, grade, t)`
    - `gradeOf(progress, cardId): grade|null`
    - `isWeakGrade(grade): boolean`
    - `cardSummary(progress, cards): {total, known, fuzzy, unknown, unseen}`
  - 模拟面试：
    - `buildMock(domains, cards, rng?): string[]`
    - `startMock(progress, cardIds, startedAt)`
    - `gradeMock(progress, cardId, grade, ms, t)`
    - `nextMockIndex(draft): number`（全部自评完时返回 -1）
    - `countGrades(results): {known, fuzzy, unknown}`
    - `finishMock(progress, finishedAt)`
    - `pruneMockDraft(progress, hasCard: (id)=>boolean)`
  - 推荐与导入：
    - `recommendInterview(progress, domains, cards)`：返回 `{kind:'review', domain, grade}`、`{kind:'wrong'}`、`{kind:'domain', domain}` 或 `{kind:'mock'}` 之一
    - `interviewExportFileName(date)`
    - `validateInterviewImport(raw)`：返回 `{ok, value|error}`
  - `toBankData(payload)`：返回 `{domains(加 short), cards, questions, questionById, cardById}`
  - 数据结构：
    - 卡片状态 `cards[id] = {grade, t}`
    - 模拟面试草稿 `mockDraft = {startedAt, cardIds, results:{[id]:{grade, ms}}}`
    - 模拟面试记录 `mock = {id, startedAt, finishedAt, cardIds, results, counts}`
- `createStore(storage, options?)`：options 为 `{key, empty, validate}`，都可以不传，默认值即 ACP 现有的行为；损坏数据的备份键为 `${key}-corrupt`。

- [ ] **Step 1: 先写失败的测试** `tests/unit/interview.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyInterviewProgress, gradeCard, gradeOf, isWeakGrade, cardSummary, buildMock, startMock, gradeMock,
  nextMockIndex, countGrades, finishMock, pruneMockDraft, recommendInterview, interviewExportFileName,
  validateInterviewImport, toBankData, MOCK_SIZE, MAX_MOCKS, IV_STORAGE_KEY,
} from '../../js/interview.js';
import { allocate } from '../../js/exam.js';
import { emptyProgress, validateImport, recordAnswer } from '../../js/progress.js';
import { seededRng } from './helpers.mjs';

const DOMAINS = [
  { id: 'iv-a', weight: 20 }, { id: 'iv-b', weight: 18 }, { id: 'iv-c', weight: 8 }, { id: 'iv-d', weight: 12 },
  { id: 'iv-e', weight: 10 }, { id: 'iv-f', weight: 8 }, { id: 'iv-g', weight: 18 }, { id: 'iv-h', weight: 6 },
];
const cardsFor = (domain, n) => Array.from({ length: n }, (_, i) => ({ id: `${domain}-c${String(i + 1).padStart(2, '0')}`, domain }));
const CARDS = [].concat(...DOMAINS.map((d) => cardsFor(d.id, 10)));

test('empty progress has the interview shape and storage key', () => {
  assert.deepEqual(emptyInterviewProgress(), {
    schemaVersion: 1, bank: 'interview', answers: {}, wrong: {}, cards: {}, mocks: [], mockDraft: null,
  });
  assert.equal(IV_STORAGE_KEY, 'acp-interview-progress-v1');
});

test('gradeCard stores the latest grade without mutating', () => {
  const p0 = emptyInterviewProgress();
  const p1 = gradeCard(p0, 'iv-a-c01', 'fuzzy', 10);
  const p2 = gradeCard(p1, 'iv-a-c01', 'known', 20);
  assert.deepEqual(p0.cards, {});
  assert.deepEqual(p1.cards, { 'iv-a-c01': { grade: 'fuzzy', t: 10 } });
  assert.equal(gradeOf(p2, 'iv-a-c01'), 'known');
  assert.equal(gradeOf(p2, 'nope'), null);
  assert.throws(() => gradeCard(p0, 'x', 'maybe', 1), /invalid grade/);
});

test('isWeakGrade and cardSummary', () => {
  assert.deepEqual([null, 'known', 'fuzzy', 'unknown'].map(isWeakGrade), [false, false, true, true]);
  let p = emptyInterviewProgress();
  p = gradeCard(p, 'iv-a-c01', 'known', 1);
  p = gradeCard(p, 'iv-a-c02', 'fuzzy', 1);
  p = gradeCard(p, 'iv-a-c03', 'unknown', 1);
  assert.deepEqual(cardSummary(p, cardsFor('iv-a', 5)), { total: 5, known: 1, fuzzy: 1, unknown: 1, unseen: 2 });
});

test('buildMock picks 12 unique cards following the weights', () => {
  const ids = buildMock(DOMAINS, CARDS, seededRng(1));
  assert.equal(ids.length, MOCK_SIZE);
  assert.equal(new Set(ids).size, MOCK_SIZE);
  const expected = allocate(DOMAINS.map((d) => d.weight), MOCK_SIZE);
  DOMAINS.forEach((d, i) => assert.equal(ids.filter((id) => id.startsWith(`${d.id}-`)).length, expected[i], d.id));
});

test('buildMock takes what exists when a category is small', () => {
  const ids = buildMock([{ id: 'iv-a', weight: 20 }, { id: 'iv-b', weight: 18 }], cardsFor('iv-a', 3).concat(cardsFor('iv-b', 3)), seededRng(2));
  assert.equal(ids.length, 6);
});

test('a mock records grades, updates cards and finishes with counts', () => {
  let p = startMock(emptyInterviewProgress(), ['iv-a-c01', 'iv-b-c01', 'iv-c-c01'], 100);
  assert.equal(nextMockIndex(p.mockDraft), 0);
  p = gradeMock(p, 'iv-a-c01', 'known', 30000, 200);
  p = gradeMock(p, 'iv-b-c01', 'unknown', 90000, 300);
  assert.equal(nextMockIndex(p.mockDraft), 2);
  assert.equal(gradeOf(p, 'iv-b-c01'), 'unknown');
  assert.equal(gradeMock(p, 'not-in-mock', 'known', 1, 1), p);
  p = gradeMock(p, 'iv-c-c01', 'fuzzy', 150000, 400);
  assert.equal(nextMockIndex(p.mockDraft), -1);
  const done = finishMock(p, 500);
  assert.equal(done.mockDraft, null);
  assert.deepEqual(done.mocks[0].counts, { known: 1, fuzzy: 1, unknown: 1 });
  assert.equal(done.mocks[0].id, '500');
  assert.deepEqual(done.mocks[0].results['iv-c-c01'], { grade: 'fuzzy', ms: 150000 });
  assert.equal(finishMock(done, 600), done);
  assert.equal(gradeMock(done, 'iv-a-c01', 'known', 1, 1), done);
});

test('countGrades counts each grade', () => {
  assert.deepEqual(countGrades({}), { known: 0, fuzzy: 0, unknown: 0 });
  assert.deepEqual(countGrades({ a: { grade: 'fuzzy', ms: 1 }, b: { grade: 'fuzzy', ms: 1 } }), { known: 0, fuzzy: 2, unknown: 0 });
});

test('only the latest 20 mocks are kept', () => {
  let p = emptyInterviewProgress();
  for (let i = 0; i < MAX_MOCKS + 1; i += 1) p = finishMock(startMock(p, ['x'], i), 1000 + i);
  assert.equal(p.mocks.length, MAX_MOCKS);
  assert.equal(p.mocks[0].id, '1001');
});

test('pruneMockDraft drops cards that left the bank and keeps the rest', () => {
  let p = startMock(emptyInterviewProgress(), ['a', 'gone', 'b'], 1);
  p = gradeMock(p, 'gone', 'known', 5, 2);
  const has = (id) => id !== 'gone';
  const pruned = pruneMockDraft(p, has);
  assert.deepEqual(pruned.mockDraft.cardIds, ['a', 'b']);
  assert.deepEqual(pruned.mockDraft.results, {});
  assert.equal(pruneMockDraft(pruned, has), pruned);
  assert.equal(pruneMockDraft(emptyInterviewProgress(), has).mockDraft, null);
});

test('recommendation order: unknown cards > wrong MCQs > fuzzy cards > unseen category > mock', () => {
  const domains = [{ id: 'iv-a' }, { id: 'iv-b' }];
  const cards = cardsFor('iv-a', 2).concat(cardsFor('iv-b', 2));
  let p = emptyInterviewProgress();
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'domain', domain: 'iv-a' });
  cards.forEach((c) => { p = gradeCard(p, c.id, 'known', 1); });
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'mock' });
  p = gradeCard(p, 'iv-b-c01', 'fuzzy', 2);
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'review', domain: 'iv-b', grade: 'fuzzy' });
  p = recordAnswer(p, 'iv-a-001', false, 3);
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'wrong' });
  p = gradeCard(p, 'iv-b-c02', 'unknown', 4);
  assert.deepEqual(recommendInterview(p, domains, cards), { kind: 'review', domain: 'iv-b', grade: 'unknown' });
});

test('interviewExportFileName pads the date', () => {
  assert.equal(interviewExportFileName(new Date(2026, 0, 5)), 'interview-progress-20260105.json');
});

test('validateInterviewImport accepts a real progress object', () => {
  let p = startMock(emptyInterviewProgress(), ['a'], 1);
  p = gradeMock(p, 'a', 'fuzzy', 10, 2);
  p = recordAnswer(p, 'iv-a-001', true, 3);
  const res = validateInterviewImport(JSON.parse(JSON.stringify(p)));
  assert.equal(res.ok, true);
  assert.deepEqual(res.value, p);
});

test('validateInterviewImport rejects the other bank and malformed parts', () => {
  const good = emptyInterviewProgress();
  const cases = [
    [null, '文件内容不是进度数据'],
    [emptyProgress(), '这不是面试题库的进度文件'],
    [{ ...good, schemaVersion: 9 }, '不支持的进度版本：9'],
    [{ ...good, answers: [] }, '作答记录（answers）格式错误'],
    [{ ...good, wrong: { x: -1 } }, '错题本（wrong）格式错误'],
    [{ ...good, cards: { x: 'known' } }, '卡片自评（cards）格式错误'],
    [{ ...good, cards: { x: { grade: 'meh', t: 1 } } }, '卡片自评（cards）格式错误'],
    [{ ...good, mocks: [{ id: 1 }] }, '模拟面试记录（mocks）格式错误'],
    [{ ...good, mockDraft: { startedAt: 1, cardIds: [], results: { a: { grade: 'known' } } } }, '模拟面试草稿（mockDraft）格式错误'],
  ];
  cases.forEach(([raw, error]) => assert.deepEqual(validateInterviewImport(raw), { ok: false, error }, error));
});

test('validateInterviewImport keeps only the latest 20 mocks', () => {
  let p = emptyInterviewProgress();
  for (let i = 0; i < MAX_MOCKS; i += 1) p = finishMock(startMock(p, ['x'], i), 1000 + i);
  const raw = { ...p, mocks: p.mocks.concat(p.mocks.slice(0, 3)) };
  assert.equal(validateInterviewImport(raw).value.mocks.length, MAX_MOCKS);
});

test('ACP import rejects an interview progress file', () => {
  assert.deepEqual(validateImport(emptyInterviewProgress()), { ok: false, error: '这不是 ACP 题库的进度文件' });
});

test('toBankData flattens the payload and indexes cards and questions', () => {
  const payload = {
    version: 1,
    domains: [{ id: 'iv-a', letter: 'A', name: '甲', intro: [], weight: 20 }, { id: 'iv-b', letter: 'B', name: '乙', intro: [], weight: 18 }],
    cards: { 'iv-a': cardsFor('iv-a', 2), 'iv-b': cardsFor('iv-b', 1) },
    questions: { 'iv-a': [{ id: 'iv-a-001', domain: 'iv-a' }] },
  };
  const data = toBankData(payload);
  assert.deepEqual(data.cards.map((c) => c.id), ['iv-a-c01', 'iv-a-c02', 'iv-b-c01']);
  assert.equal(data.domains[1].short, 'B 类');
  assert.equal(data.cardById.get('iv-b-c01').domain, 'iv-b');
  assert.equal(data.questionById.get('iv-a-001').domain, 'iv-a');
  assert.deepEqual(toBankData({ ...payload, questions: undefined }).questions, []);
  assert.throws(() => toBankData({ version: 2 }), /面试题库数据格式不正确/);
  assert.throws(() => toBankData(null), /面试题库数据格式不正确/);
});
```

在 `tests/unit/storage.test.mjs` 末尾追加：

```js
test('createStore can use another key, empty value and validator', () => {
  const storage = fakeStorage({ other: '{"bank":"x"}' });
  const store = createStore(storage, {
    key: 'other',
    empty: () => ({ fresh: true }),
    validate: (raw) => (raw.bank === 'ok' ? { ok: true, value: raw } : { ok: false, error: '不对' }),
  });
  const res = store.load();
  assert.deepEqual(res.progress, { fresh: true });
  assert.match(res.error, /不对/);
  assert.equal(storage.peek('other-corrupt'), '{"bank":"x"}');
  assert.equal(store.save({ bank: 'ok' }), true);
  assert.deepEqual(store.load(), { progress: { bank: 'ok' }, ok: true });
});
```

（`fakeStorage` 和 `peek` 已在该测试文件里定义。）

- [ ] **Step 2: 运行测试，确认失败**

Run: `node --test tests/unit/interview.test.mjs tests/unit/storage.test.mjs`
Expected: FAIL（找不到 `interview.js` 模块；storage 新测试也会失败）

- [ ] **Step 3: 修改 `js/progress.js`**

把 `findProblem` 开头关于 answers 和 wrong 的两段检查抽成导出函数，并在 `validateImport` 里加上对题库的判断。

```js
export function answersProblem(raw) {
  const values = (o) => Object.keys(o).map((k) => o[k]);
  if (!isObject(raw.answers) || !values(raw.answers).every((h) => Array.isArray(h) && h.every(isAttempt))) {
    return '作答记录（answers）格式错误';
  }
  if (!isObject(raw.wrong) || !values(raw.wrong).every((s) => Number.isInteger(s) && s >= 0)) {
    return '错题本（wrong）格式错误';
  }
  return null;
}

function findProblem(raw) {
  const values = (o) => Object.keys(o).map((k) => o[k]);
  const base = answersProblem(raw);
  if (base) return base;
  if (!isObject(raw.cards) || !values(raw.cards).every((s) => CARD_STATES.indexOf(s) !== -1)) {
    return '卡片状态（cards）格式错误';
  }
  if (!Array.isArray(raw.exams) || !raw.exams.every(isExamRecord)) return '考试记录（exams）格式错误';
  if (raw.examDraft != null && !isDraft(raw.examDraft)) return '考试草稿（examDraft）格式错误';
  if (raw.examDate != null && !(typeof raw.examDate === 'string' && DATE_RE.test(raw.examDate))) {
    return '考试日期（examDate）格式错误';
  }
  return null;
}
```

在 `validateImport` 中，紧接在 `if (!isObject(raw)) …` 这一行之后插入：

```js
  if (raw.bank !== undefined) return { ok: false, error: '这不是 ACP 题库的进度文件' };
```

- [ ] **Step 4: 修改 `js/storage.js` 的 `createStore`**

```js
export function createStore(storage, options = {}) {
  const key = options.key || STORAGE_KEY;
  const corruptKey = `${key}-corrupt`;
  const empty = options.empty || emptyProgress;
  const validate = options.validate || validateImport;

  function backupAndReset(raw, reason) {
    try {
      storage.setItem(corruptKey, raw);
    } catch (err) {
      console.error('备份损坏的进度失败：', err);
    }
    return { progress: empty(), ok: true, error: `本地进度已损坏（${reason}），已备份并重置` };
  }

  function load() {
    let raw;
    try {
      raw = storage.getItem(key);
    } catch (err) {
      console.error('读取本地存储失败：', err);
      return { progress: empty(), ok: false, error: STORAGE_UNAVAILABLE };
    }
    if (raw === null) return { progress: empty(), ok: true };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return backupAndReset(raw, 'JSON 解析失败');
    }
    const res = validate(parsed);
    return res.ok ? { progress: res.value, ok: true } : backupAndReset(raw, res.error);
  }

  function save(progress) {
    try {
      storage.setItem(key, JSON.stringify(progress));
      return true;
    } catch (err) {
      console.error('写入本地存储失败：', err);
      return false;
    }
  }

  return { load, save };
}
```

`CORRUPT_KEY` 常量保留导出，它的值 `'acp-progress-v1-corrupt'` 与默认的 `${STORAGE_KEY}-corrupt` 相同。

- [ ] **Step 5: 写** `js/interview.js`

```js
import { allocate, shuffle } from './exam.js';
import { answersProblem } from './progress.js';

export const IV_SCHEMA_VERSION = 1;
export const IV_BANK = 'interview';
export const IV_STORAGE_KEY = 'acp-interview-progress-v1';
export const GRADES = ['known', 'fuzzy', 'unknown'];
export const MOCK_SIZE = 12;
export const MOCK_SOFT_LIMIT_MS = 2 * 60 * 1000;
export const MAX_MOCKS = 20;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const values = (o) => Object.keys(o).map((k) => o[k]);

export function emptyInterviewProgress() {
  return { schemaVersion: IV_SCHEMA_VERSION, bank: IV_BANK, answers: {}, wrong: {}, cards: {}, mocks: [], mockDraft: null };
}

// ---------- 卡片自评 ----------

function checkGrade(grade) {
  if (GRADES.indexOf(grade) === -1) throw new Error(`invalid grade: ${grade}`);
}

export function gradeCard(progress, cardId, grade, t) {
  checkGrade(grade);
  return { ...progress, cards: { ...progress.cards, [cardId]: { grade, t } } };
}

export function gradeOf(progress, cardId) {
  const entry = progress.cards[cardId];
  return entry ? entry.grade : null;
}

export function isWeakGrade(grade) {
  return grade === 'fuzzy' || grade === 'unknown';
}

export function cardSummary(progress, cards) {
  const out = { total: cards.length, known: 0, fuzzy: 0, unknown: 0, unseen: 0 };
  cards.forEach((c) => {
    out[gradeOf(progress, c.id) || 'unseen'] += 1;
  });
  return out;
}

// ---------- 模拟面试 ----------

export function buildMock(domains, cards, rng = Math.random) {
  const counts = allocate(domains.map((d) => d.weight), MOCK_SIZE);
  const picked = domains.map((d, i) => shuffle(cards.filter((c) => c.domain === d.id), rng).slice(0, counts[i]).map((c) => c.id));
  return shuffle([].concat(...picked), rng);
}

export function startMock(progress, cardIds, startedAt) {
  return { ...progress, mockDraft: { startedAt, cardIds: cardIds.slice(), results: {} } };
}

export function gradeMock(progress, cardId, grade, ms, t) {
  const draft = progress.mockDraft;
  if (!draft || draft.cardIds.indexOf(cardId) === -1) return progress;
  const graded = gradeCard(progress, cardId, grade, t);
  return { ...graded, mockDraft: { ...draft, results: { ...draft.results, [cardId]: { grade, ms } } } };
}

export function nextMockIndex(draft) {
  return draft.cardIds.findIndex((id) => !draft.results[id]);
}

export function countGrades(results) {
  const counts = { known: 0, fuzzy: 0, unknown: 0 };
  Object.keys(results).forEach((id) => {
    counts[results[id].grade] += 1;
  });
  return counts;
}

export function finishMock(progress, finishedAt) {
  const draft = progress.mockDraft;
  if (!draft) return progress;
  const record = {
    id: String(finishedAt),
    startedAt: draft.startedAt,
    finishedAt,
    cardIds: draft.cardIds,
    results: draft.results,
    counts: countGrades(draft.results),
  };
  return { ...progress, mockDraft: null, mocks: progress.mocks.concat([record]).slice(-MAX_MOCKS) };
}

export function pruneMockDraft(progress, hasCard) {
  const draft = progress.mockDraft;
  if (!draft) return progress;
  const cardIds = draft.cardIds.filter(hasCard);
  if (cardIds.length === draft.cardIds.length) return progress;
  const results = Object.keys(draft.results).filter(hasCard)
    .reduce((acc, id) => ({ ...acc, [id]: draft.results[id] }), {});
  return { ...progress, mockDraft: { ...draft, cardIds, results } };
}

// ---------- 推荐 ----------

export function recommendInterview(progress, domains, cards) {
  const firstWith = (test) => domains.filter((d) => cards.some((c) => c.domain === d.id && test(gradeOf(progress, c.id))))[0];
  const unknown = firstWith((g) => g === 'unknown');
  if (unknown) return { kind: 'review', domain: unknown.id, grade: 'unknown' };
  if (Object.keys(progress.wrong).length > 0) return { kind: 'wrong' };
  const fuzzy = firstWith((g) => g === 'fuzzy');
  if (fuzzy) return { kind: 'review', domain: fuzzy.id, grade: 'fuzzy' };
  const fresh = firstWith((g) => g === null);
  if (fresh) return { kind: 'domain', domain: fresh.id };
  return { kind: 'mock' };
}

// ---------- 文件与导入 ----------

export function interviewExportFileName(date) {
  const p2 = (n) => String(n).padStart(2, '0');
  return `interview-progress-${date.getFullYear()}${p2(date.getMonth() + 1)}${p2(date.getDate())}.json`;
}

const isCardEntry = (e) => isObject(e) && GRADES.indexOf(e.grade) !== -1 && typeof e.t === 'number';
const isResult = (r) => isObject(r) && GRADES.indexOf(r.grade) !== -1 && typeof r.ms === 'number';
const isMockDraft = (d) => isObject(d) && typeof d.startedAt === 'number' && Array.isArray(d.cardIds)
  && isObject(d.results) && values(d.results).every(isResult);
const isMockRecord = (m) => isMockDraft(m) && typeof m.id === 'string' && typeof m.finishedAt === 'number' && isObject(m.counts);

function interviewProblem(raw) {
  const base = answersProblem(raw);
  if (base) return base;
  if (!isObject(raw.cards) || !values(raw.cards).every(isCardEntry)) return '卡片自评（cards）格式错误';
  if (!Array.isArray(raw.mocks) || !raw.mocks.every(isMockRecord)) return '模拟面试记录（mocks）格式错误';
  if (raw.mockDraft != null && !isMockDraft(raw.mockDraft)) return '模拟面试草稿（mockDraft）格式错误';
  return null;
}

export function validateInterviewImport(raw) {
  if (!isObject(raw)) return { ok: false, error: '文件内容不是进度数据' };
  if (raw.bank !== IV_BANK) return { ok: false, error: '这不是面试题库的进度文件' };
  if (raw.schemaVersion !== IV_SCHEMA_VERSION) return { ok: false, error: `不支持的进度版本：${raw.schemaVersion}` };
  const problem = interviewProblem(raw);
  if (problem) return { ok: false, error: problem };
  return {
    ok: true,
    value: {
      schemaVersion: IV_SCHEMA_VERSION,
      bank: IV_BANK,
      answers: raw.answers,
      wrong: raw.wrong,
      cards: raw.cards,
      mocks: raw.mocks.slice(-MAX_MOCKS),
      mockDraft: raw.mockDraft || null,
    },
  };
}

// ---------- 解密后的数据 ----------

export function toBankData(payload) {
  if (!isObject(payload) || payload.version !== 1 || !Array.isArray(payload.domains) || !isObject(payload.cards)) {
    throw new Error('面试题库数据格式不正确');
  }
  const questionMap = isObject(payload.questions) ? payload.questions : {};
  const domains = payload.domains.map((d) => ({ ...d, short: `${d.letter} 类` }));
  const cards = [].concat(...domains.map((d) => payload.cards[d.id] || []));
  const questions = [].concat(...domains.map((d) => questionMap[d.id] || []));
  return {
    domains,
    cards,
    questions,
    questionById: new Map(questions.map((q) => [q.id, q])),
    cardById: new Map(cards.map((c) => [c.id, c])),
  };
}
```

- [ ] **Step 6: 把 `'js/interview.js'` 加进 `sw.js` 的 `SHELL`，再把 `--test-coverage-include=js/interview.js` 加进 `test:cov`**

- [ ] **Step 7: 运行测试，确认通过**

Run: `npm test && npm run test:cov`
Expected: 全部通过（包括 progress 和 storage 的原有测试），行覆盖率不低于 80%。

- [ ] **Step 8: 提交**

```bash
git add js/interview.js js/progress.js js/storage.js tests/unit/interview.test.mjs tests/unit/storage.test.mjs sw.js package.json
git commit -m "feat: add interview progress logic and per-bank storage"
```

---

### Task 5: 路由按题库区分，共用页面的链接改为按题库生成

**Files:**
- Modify: `js/router.js`
- Modify: `tests/unit/router.test.mjs`
- Modify: `js/views/practice.js`、`js/views/wrong.js`、`js/views/settings.js`
- Modify: `js/main.js`（只在 `makeContext` 中加两个字段）

**Interfaces:**
- Consumes: Task 4 的 `validateInterviewImport`、`emptyInterviewProgress`、`interviewExportFileName`
- Produces:
  - `parseHash(hash): {bank:'acp'|'interview', name, params}`：
    - 以 `#/iv` 开头的地址属于 interview 题库，其余属于 acp。
    - `exam`、`examResult` 只在 acp 下有效，`mock`、`mockResult` 只在 interview 下有效，其余路由两个题库共用。
    - `cards` 路由的参数为 `{domain, filter?}`，只有地址为 `learn/<id>/weak` 时才带 `filter: 'weak'`。
  - `linkFor(bank, path): string`：`('acp','')` 返回 `'#/'`，`('acp','learn')` 返回 `'#/learn'`，`('interview','')` 返回 `'#/iv'`，`('interview','learn/iv-a')` 返回 `'#/iv/learn/iv-a'`。
  - `TAB_OF` 增加 `mock: 'exam'`、`mockResult: 'exam'`。
  - ctx 新增字段：`bank`（`'acp'` 或 `'interview'`）、`link(path)`（等价于 `linkFor(ctx.bank, path)`）、`lock()`（返回 Promise，只在 interview 题库中使用，由 Task 6 提供）。

- [ ] **Step 1: 改写测试** `tests/unit/router.test.mjs`（替换整个文件）

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, linkFor, TAB_OF } from '../../js/router.js';

const cases = [
  ['', 'acp', 'home', {}],
  ['#/', 'acp', 'home', {}],
  ['#/settings', 'acp', 'settings', {}],
  ['#/learn', 'acp', 'learn', {}],
  ['#/learn/', 'acp', 'learn', {}],
  ['#/learn/rag', 'acp', 'cards', { domain: 'rag' }],
  ['#/learn/agent-mm', 'acp', 'cards', { domain: 'agent-mm' }],
  ['#/learn/rag/weak', 'acp', 'cards', { domain: 'rag', filter: 'weak' }],
  ['#/practice/app-dev', 'acp', 'practice', { domain: 'app-dev' }],
  ['#/exam', 'acp', 'exam', {}],
  ['#/exam/result/1727400000000', 'acp', 'examResult', { id: '1727400000000' }],
  ['#/wrong', 'acp', 'wrong', {}],
  ['#/wrong/practice', 'acp', 'wrongPractice', {}],
  ['#/wrong/practice/rag', 'acp', 'wrongPractice', { domain: 'rag' }],
  ['#/mock', 'acp', 'home', {}],
  ['#/nope', 'acp', 'home', {}],
  ['#/learn/../x', 'acp', 'home', {}],
  ['#/ivx', 'acp', 'home', {}],
  ['#/iv', 'interview', 'home', {}],
  ['#/iv/', 'interview', 'home', {}],
  ['#/iv/settings', 'interview', 'settings', {}],
  ['#/iv/learn', 'interview', 'learn', {}],
  ['#/iv/learn/iv-a', 'interview', 'cards', { domain: 'iv-a' }],
  ['#/iv/learn/iv-a/weak', 'interview', 'cards', { domain: 'iv-a', filter: 'weak' }],
  ['#/iv/practice/iv-b', 'interview', 'practice', { domain: 'iv-b' }],
  ['#/iv/mock', 'interview', 'mock', {}],
  ['#/iv/mock/result/123', 'interview', 'mockResult', { id: '123' }],
  ['#/iv/wrong', 'interview', 'wrong', {}],
  ['#/iv/wrong/practice/iv-a', 'interview', 'wrongPractice', { domain: 'iv-a' }],
  ['#/iv/exam', 'interview', 'home', {}],
  ['#/iv/nope', 'interview', 'home', {}],
];

cases.forEach(([hash, bank, name, params]) => {
  test(`parseHash(${JSON.stringify(hash)}) -> ${bank}/${name}`, () => {
    assert.deepEqual(parseHash(hash), { bank, name, params });
  });
});

test('linkFor builds hashes that parse back to the same bank', () => {
  assert.equal(linkFor('acp', ''), '#/');
  assert.equal(linkFor('acp', 'learn'), '#/learn');
  assert.equal(linkFor('interview', ''), '#/iv');
  assert.equal(linkFor('interview', 'learn/iv-a'), '#/iv/learn/iv-a');
  assert.deepEqual(parseHash(linkFor('interview', 'mock')), { bank: 'interview', name: 'mock', params: {} });
});

test('every route maps to a tab', () => {
  const names = ['home', 'settings', 'learn', 'cards', 'practice', 'exam', 'examResult', 'mock', 'mockResult', 'wrong', 'wrongPractice'];
  names.forEach((n) => assert.ok(['home', 'learn', 'exam', 'wrong'].indexOf(TAB_OF[n]) !== -1, n));
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `node --test tests/unit/router.test.mjs`
Expected: FAIL（返回结果里缺少 `bank` 字段；`linkFor` 不存在）

- [ ] **Step 3: 改写** `js/router.js`

```js
const ROUTES = [
  { name: 'home', pattern: /^$/, keys: [] },
  { name: 'settings', pattern: /^settings$/, keys: [] },
  { name: 'learn', pattern: /^learn$/, keys: [] },
  { name: 'cards', pattern: /^learn\/([\w-]+)(?:\/(weak))?$/, keys: ['domain', 'filter'] },
  { name: 'practice', pattern: /^practice\/([\w-]+)$/, keys: ['domain'] },
  { name: 'exam', pattern: /^exam$/, keys: [], bank: 'acp' },
  { name: 'examResult', pattern: /^exam\/result\/(\w+)$/, keys: ['id'], bank: 'acp' },
  { name: 'mock', pattern: /^mock$/, keys: [], bank: 'interview' },
  { name: 'mockResult', pattern: /^mock\/result\/(\w+)$/, keys: ['id'], bank: 'interview' },
  { name: 'wrong', pattern: /^wrong$/, keys: [] },
  { name: 'wrongPractice', pattern: /^wrong\/practice(?:\/([\w-]+))?$/, keys: ['domain'] },
];

const PREFIX = { acp: '', interview: 'iv' };

export const TAB_OF = {
  home: 'home',
  settings: 'home',
  learn: 'learn',
  cards: 'learn',
  practice: 'learn',
  exam: 'exam',
  examResult: 'exam',
  mock: 'exam',
  mockResult: 'exam',
  wrong: 'wrong',
  wrongPractice: 'wrong',
};

function splitBank(path) {
  if (path === PREFIX.interview) return { bank: 'interview', rest: '' };
  if (path.indexOf(`${PREFIX.interview}/`) === 0) return { bank: 'interview', rest: path.slice(PREFIX.interview.length + 1) };
  return { bank: 'acp', rest: path };
}

export function parseHash(hash) {
  const path = (hash || '').replace(/^#\/?/, '').replace(/\/$/, '');
  const { bank, rest } = splitBank(path);
  for (let r = 0; r < ROUTES.length; r += 1) {
    const route = ROUTES[r];
    const match = (!route.bank || route.bank === bank) ? route.pattern.exec(rest) : null;
    if (match) {
      const params = {};
      route.keys.forEach((key, i) => {
        if (match[i + 1] !== undefined) params[key] = match[i + 1];
      });
      return { bank, name: route.name, params };
    }
  }
  return { bank, name: 'home', params: {} };
}

export function linkFor(bank, path) {
  const parts = [PREFIX[bank], path].filter(Boolean);
  return `#/${parts.join('/')}`;
}
```

- [ ] **Step 4: 修改 `js/views/practice.js` 的 `renderDomainPractice`**

```js
export function renderDomainPractice(ctx, domainId) {
  const domain = ctx.data.domains.filter((d) => d.id === domainId)[0];
  if (!domain) return emptyState('没有找到这个考点。', ctx.link('learn'), '返回考点列表');
  return renderPractice(ctx, {
    title: domain.name,
    questions: ctx.data.questions.filter((q) => q.domain === domainId),
    emptyText: '这个考点还没有题目。',
    doneHref: ctx.link(`learn/${domainId}`),
  });
}
```

- [ ] **Step 5: 修改 `js/views/wrong.js`**，把 4 处写死的链接换成 `ctx.link`：
  - `emptyState('错题本是空的。答错的题会自动收进来。', ctx.link('learn'), '去练习')`
  - 「只刷错题」按钮的 `href`：`filter === 'all' ? ctx.link('wrong/practice') : ctx.link(\`wrong/practice/${filter}\`)`
  - `renderWrongPractice` 中的 `doneHref: ctx.link('wrong')`

- [ ] **Step 6: 改写 `js/views/settings.js`，按题库区分**（替换整个文件）

```js
import { h } from '../ui.js';
import { setExamDate, validateImport, emptyProgress, exportFileName } from '../progress.js';
import { validateInterviewImport, emptyInterviewProgress, interviewExportFileName } from '../interview.js';

const BANK_OPS = {
  acp: {
    validate: validateImport,
    empty: emptyProgress,
    fileName: exportFileName,
    clearLabel: '清空全部进度',
    clearConfirm: '确定清空全部进度吗？此操作无法撤销，建议先导出备份。',
    cleared: '已清空全部进度',
  },
  interview: {
    validate: validateInterviewImport,
    empty: emptyInterviewProgress,
    fileName: interviewExportFileName,
    clearLabel: '清空面试题库进度',
    clearConfirm: '确定清空面试题库的全部进度吗？此操作无法撤销，建议先导出备份。',
    cleared: '已清空面试题库进度',
  },
};

function group(title, ...children) {
  return h('section', { class: 'settings-group' }, h('h2', {}, title), children);
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importFile(ctx, ops, input, status, onImported) {
  const file = input.files && input.files[0];
  if (!file) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    status.textContent = '导入失败：文件不是有效的 JSON';
    return;
  } finally {
    input.value = '';
  }
  const res = ops.validate(parsed);
  if (!res.ok) {
    status.textContent = `导入失败：${res.error}`;
    return;
  }
  if (!window.confirm('导入会覆盖当前题库的全部进度，确定吗？')) return;
  ctx.update(() => res.value);
  onImported(res.value);
  status.textContent = '导入成功';
}

function examDateGroup(ctx, status, dateInput) {
  dateInput.addEventListener('change', () => {
    ctx.update((p) => setExamDate(p, dateInput.value || null));
    status.textContent = dateInput.value ? '考试日期已保存' : '已清除考试日期';
  });
  return group('考试日期', h('label', { class: 'field-label', for: 'exam-date' }, '设置后首页会显示倒计时'), dateInput);
}

function lockGroup(ctx, status) {
  const lockNow = () => {
    ctx.lock().catch((err) => {
      console.error(err);
      status.textContent = `锁定失败：${err.message}`;
    });
  };
  return group('面试题库',
    h('p', { class: 'muted' }, '锁定后，这台手机需要重新输入密码才能查看面试内容。'),
    h('button', { class: 'btn btn-secondary btn-block', type: 'button', onClick: lockNow }, '锁定面试题库'));
}

export function renderSettings(ctx) {
  const isInterview = ctx.bank === 'interview';
  const ops = BANK_OPS[ctx.bank];
  const status = h('p', { class: 'settings-status muted', role: 'status' });
  const dateInput = isInterview ? null
    : h('input', { class: 'field-input', type: 'date', id: 'exam-date', value: ctx.getProgress().examDate || '' });
  const syncDate = (progress) => {
    if (dateInput) dateInput.value = progress.examDate || '';
  };
  const fileInput = h('input', { class: 'visually-hidden', type: 'file', id: 'import-file', accept: 'application/json,.json' });
  fileInput.addEventListener('change', () => {
    importFile(ctx, ops, fileInput, status, syncDate).catch((err) => {
      console.error(err);
      status.textContent = '导入失败：读取文件出错';
    });
  });
  const exportNow = () => {
    downloadJson(ctx.getProgress(), ops.fileName(new Date()));
    status.textContent = '已导出进度文件，请妥善保存';
  };
  const clearAll = () => {
    if (!window.confirm(ops.clearConfirm)) return;
    syncDate(ctx.update(() => ops.empty()));
    status.textContent = ops.cleared;
  };
  return [
    dateInput ? examDateGroup(ctx, status, dateInput) : null,
    isInterview ? lockGroup(ctx, status) : null,
    group('备份与迁移',
      h('p', { class: 'muted' }, '进度只保存在本机浏览器里，每个题库单独导出。清理浏览器数据或手机管家「一键清理」都会丢失进度，建议定期导出，存到微信文件传输助手或网盘。'),
      h('button', { class: 'btn btn-secondary btn-block', type: 'button', onClick: exportNow }, '导出进度'),
      h('label', { class: 'btn btn-secondary btn-block', for: 'import-file' }, '导入进度'),
      fileInput),
    group('危险操作',
      h('button', { class: 'btn btn-danger btn-block', type: 'button', onClick: clearAll }, ops.clearLabel)),
    status,
  ].filter(Boolean);
}
```

- [ ] **Step 7: 修改 `js/main.js`**

  - 把 import 改成 `import { parseHash, linkFor, TAB_OF } from './router.js';`
  - 在 `makeContext()` 返回的对象里加两个字段：`bank: 'acp'` 和 `link: (path) => linkFor('acp', path)`。

  本任务不改动其他逻辑。在 Task 6 重写 `main.js` 之前，访问 `#/iv` 暂时仍会显示 ACP 首页，这是预期的临时状态。

- [ ] **Step 8: 运行全部测试**

Run: `npm test && npx playwright test`
Expected: 全部通过。ACP 的端到端测试行为不变，设置页的文案「清空全部进度」和「考试日期已保存」保持原样。

- [ ] **Step 9: 提交**

```bash
git add js/router.js tests/unit/router.test.mjs js/views/practice.js js/views/wrong.js js/views/settings.js js/main.js
git commit -m "refactor: make routes and shared views bank-aware"
```

---

### Task 6: 解锁流程、题库切换、面试首页与 main.js 重写

**Files:**
- Create: `js/keystore.js`、`js/iv-session.js`
- Create: `js/views/bank-switch.js`、`js/views/iv-unlock.js`、`js/views/iv-home.js`、`js/views/iv-domain-row.js`
- Create: `tests/e2e/iv-helpers.mjs`、`tests/e2e/iv-unlock.spec.mjs`
- Modify: `js/data.js`（加 `loadEnvelope`）
- Modify: `js/views/home.js`（导出 `stat`、`recommendCard`；顶部加上题库切换控件）
- Modify: `js/main.js`（重写）
- Modify: `css/app.css`（新增设计变量，以及题库切换控件和解锁页的样式）
- Modify: `sw.js`（`SHELL` 加入本任务新建的 6 个 js 文件）

**Interfaces:**
- Consumes：
  - Task 1：`isCryptoSupported`、`decryptWithKey`、`unlockWithPassword`、`WrongKeyError`、`isEnvelope`
  - Task 4：`toBankData`、`IV_STORAGE_KEY`、`emptyInterviewProgress`、`validateInterviewImport`、`cardSummary`、`recommendInterview`、`MOCK_SIZE`
  - Task 5：`parseHash`、`linkFor`、`TAB_OF`，以及 ctx 的约定
- Produces：
  - `js/keystore.js`：`saveKey(key): Promise`、`loadKey(): Promise<CryptoKey|null>`（读取失败时返回 null）、`clearKey(): Promise`
  - `js/data.js`：`loadEnvelope(): Promise<Envelope>`，出错时给出以下提示之一：
    - `'面试题库还没有生成'`（404）
    - `'无法加载面试题库，请联网后重试'`（网络错误）
    - `'加载面试题库失败（HTTP n）'`（其他 HTTP 错误）
    - `'面试题库文件格式不正确'`（文件内容不合法）
  - `js/iv-session.js`：`createInterviewSession()` 返回 `{getData(), tryStoredKey(): Promise<boolean>, unlock(password): Promise, lock(): Promise}`
  - `js/views/bank-switch.js`：`bankSwitch(current: 'acp'|'interview')`，渲染 `nav.bank-switch`，里面是两个 `a.bank-tab`，当前题库的那个带 `aria-current="page"`
  - `js/views/iv-unlock.js`：`renderUnlock({supported, onUnlock})`
  - `js/views/iv-domain-row.js`：`ivDomainRow(ctx, domain)`
  - `js/views/iv-home.js`：`renderIvHome(ctx)`
  - `js/views/home.js` 新增导出：`stat(value, label)`、`recommendCard(href, title, sub)`
  - `main.js` 的 `VIEWS.interview` 注册表：Task 7 往里加 `learn` 和 `cards`，Task 8 加 `mock` 和 `mockResult`
  - localStorage 键 `acp-bank`：记录上次使用的题库。打开 App 时如果地址里没有 hash，并且这个值是 `interview`，就进入 `#/iv`。

- [ ] **Step 1: 写 e2e 辅助函数** `tests/e2e/iv-helpers.mjs`

```js
import path from 'node:path';
import { expect } from '@playwright/test';
import { loadSources, buildPayload } from '../../scripts/interview-lib.mjs';
import { encryptPayload } from '../../js/crypto.js';

export const IV_PASSWORD = 'fixture-password-2026';
const FIXTURE_SRC = path.resolve(import.meta.dirname, '..', 'fixtures', 'interview');
export const FIXTURE_PAYLOAD = buildPayload(loadSources(FIXTURE_SRC), '2026-01-01T00:00:00Z');

let cached = null;
export function fixtureEnvelope() {
  if (!cached) cached = encryptPayload(FIXTURE_PAYLOAD, IV_PASSWORD, { iter: 1000 });
  return cached;
}

export async function serveEnvelope(page, envelope) {
  const body = JSON.stringify(await (envelope || fixtureEnvelope()));
  await page.unroute('**/data/interview.enc');
  await page.route('**/data/interview.enc', (route) => route.fulfill({ status: 200, contentType: 'application/json', body }));
}

export async function unlock(page) {
  await page.goto('./#/iv');
  await page.locator('#iv-password').fill(IV_PASSWORD);
  await page.getByRole('button', { name: '解锁' }).click();
  await expect(page.locator('#iv-password')).toHaveCount(0);
  await expect(page.locator('.domain-row')).toHaveCount(2);
}
```

- [ ] **Step 2: 写失败的 e2e 测试** `tests/e2e/iv-unlock.spec.mjs`

```js
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
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `npx playwright test tests/e2e/iv-unlock.spec.mjs --project=android-360-light`
Expected: FAIL（找不到 `.bank-tab`）

- [ ] **Step 4: 写** `js/keystore.js`

```js
// 把解密密钥（不可导出的 CryptoKey）存进 IndexedDB，下次打开免输密码
const DB_NAME = 'acp-keys';
const STORE = 'keys';
const KEY_ID = 'interview';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, action) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = tx.onerror;
  }));
}

export function saveKey(key) {
  return run('readwrite', (store) => store.put(key, KEY_ID));
}

export function loadKey() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return run('readonly', (store) => store.get(KEY_ID))
    .then((key) => key || null)
    .catch((err) => {
      console.error('读取本机密钥失败：', err);
      return null;
    });
}

export function clearKey() {
  if (typeof indexedDB === 'undefined') return Promise.resolve();
  return run('readwrite', (store) => store.delete(KEY_ID));
}
```

- [ ] **Step 5: 在 `js/data.js` 末尾追加 `loadEnvelope`**（并在文件顶部加上 `import { isEnvelope } from './crypto.js';`）

```js
export async function loadEnvelope() {
  let res;
  try {
    res = await fetch('data/interview.enc');
  } catch (err) {
    console.error('加载面试题库失败：', err);
    throw new Error('无法加载面试题库，请联网后重试');
  }
  if (res.status === 404) throw new Error('面试题库还没有生成');
  if (!res.ok) throw new Error(`加载面试题库失败（HTTP ${res.status}）`);
  const envelope = await res.json().catch(() => null);
  if (!isEnvelope(envelope)) throw new Error('面试题库文件格式不正确');
  return envelope;
}
```

- [ ] **Step 6: 写** `js/iv-session.js`

```js
import { loadEnvelope } from './data.js';
import { decryptWithKey, unlockWithPassword, WrongKeyError } from './crypto.js';
import { loadKey, saveKey, clearKey } from './keystore.js';
import { toBankData } from './interview.js';

export function createInterviewSession() {
  let envelope = null;
  let data = null;
  let opening = null;

  function ensureEnvelope() {
    if (envelope) return Promise.resolve(envelope);
    return loadEnvelope().then((env) => {
      envelope = env;
      return env;
    });
  }

  async function openWithStoredKey() {
    const env = await ensureEnvelope();
    const key = await loadKey();
    if (!key) return false;
    try {
      data = toBankData(await decryptWithKey(env, key));
      return true;
    } catch (err) {
      if (!(err instanceof WrongKeyError)) throw err;
      await clearKey().catch((e) => console.error('清除本机密钥失败：', e));
      return false;
    }
  }

  return {
    getData: () => data,
    tryStoredKey() {
      if (data) return Promise.resolve(true);
      if (!opening) opening = openWithStoredKey().finally(() => { opening = null; });
      return opening;
    },
    async unlock(password) {
      const env = await ensureEnvelope();
      const res = await unlockWithPassword(env, password);
      data = toBankData(res.payload);
      try {
        await saveKey(res.key);
      } catch (err) {
        console.error('保存本机密钥失败：', err);
      }
    },
    async lock() {
      data = null;
      await clearKey();
    },
  };
}
```

- [ ] **Step 7: 写题库切换控件与解锁页**

`js/views/bank-switch.js`：

```js
import { h } from '../ui.js';

const BANKS = [['acp', '#/', 'ACP 认证'], ['interview', '#/iv', 'Agent 面试']];

export function bankSwitch(current) {
  return h('nav', { class: 'bank-switch', 'aria-label': '切换题库' },
    BANKS.map(([bank, href, label]) => h('a', { class: 'bank-tab', href, 'aria-current': bank === current ? 'page' : false }, label)));
}
```

`js/views/iv-unlock.js`：

```js
import { h, emptyState } from '../ui.js';
import { WrongKeyError } from '../crypto.js';
import { bankSwitch } from './bank-switch.js';

export function renderUnlock({ supported, onUnlock }) {
  if (!supported) {
    return [bankSwitch('interview'), emptyState('当前浏览器不支持解密，请用 Chrome 或系统浏览器打开。', '#/', '回到 ACP 题库')];
  }
  const input = h('input', { class: 'field-input', type: 'password', id: 'iv-password', autocomplete: 'current-password' });
  const button = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, '解锁');
  const status = h('p', { class: 'unlock-status', role: 'alert' });
  const form = h('form', { class: 'settings-group unlock' },
    h('h2', {}, '面试题库已加密'),
    h('label', { class: 'field-label', for: 'iv-password' }, '输入密码后在本机解密，之后这台手机不用再输'),
    input, button, status);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input.value) return;
    button.disabled = true;
    button.textContent = '解锁中…';
    status.textContent = '';
    onUnlock(input.value).catch((err) => {
      if (!(err instanceof WrongKeyError)) console.error(err);
      status.textContent = err instanceof WrongKeyError ? '密码不对' : `解锁失败：${err.message}`;
      button.disabled = false;
      button.textContent = '解锁';
    });
  });
  return [bankSwitch('interview'), form];
}
```

- [ ] **Step 8: 修改 `js/views/home.js`**

  - 把 `stat` 改为导出函数。
  - 把 `recommendLink` 里的 `link` 闭包提取为导出函数 `recommendCard(href, title, sub)`，内容保持不变：返回 `a.recommend`，里面依次是 kicker「今日推荐」、title、sub。`recommendLink` 改为调用它。
  - 在 `renderHome` 返回的数组最前面加上 `bankSwitch('acp')`，并 `import { bankSwitch } from './bank-switch.js';`。

```js
export function stat(value, label) {
  return h('div', { class: 'stat' }, h('span', { class: 'stat-value' }, value), h('span', { class: 'stat-label' }, label));
}

export function recommendCard(href, title, sub) {
  return h('a', { class: 'recommend', href },
    h('span', { class: 'recommend-kicker' }, '今日推荐'),
    h('span', { class: 'recommend-title' }, title),
    h('span', { class: 'recommend-sub' }, sub));
}
```

- [ ] **Step 9: 写面试首页**

`js/views/iv-domain-row.js`：

```js
import { h, formatPercent } from '../ui.js';
import { cardSummary } from '../interview.js';
import { domainStats } from '../progress.js';

export function ivDomainRow(ctx, domain) {
  const progress = ctx.getProgress();
  const s = cardSummary(progress, ctx.data.cards.filter((c) => c.domain === domain.id));
  const q = domainStats(progress, ctx.data.questions, domain.id);
  const pct = s.total ? Math.round((s.known / s.total) * 100) : 0;
  const weak = s.fuzzy + s.unknown;
  return h('li', { class: 'domain-row' },
    h('a', { class: 'domain-link', href: ctx.link(`learn/${domain.id}`) },
      h('div', { class: 'domain-head' },
        h('span', { class: 'domain-name' }, `${domain.letter}. ${domain.name}`),
        h('span', { class: 'domain-weight' }, `权重 ${domain.weight}%`)),
      h('div', {
        class: 'bar', role: 'progressbar', 'aria-label': `${domain.name}掌握度`,
        'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct,
      }, h('span', { class: 'bar-fill', style: `width:${pct}%` })),
      h('div', { class: 'domain-meta' },
        h('span', {}, `会 ${s.known}/${s.total}`),
        weak ? h('span', { class: 'domain-acc' }, `待复习 ${weak}`) : null,
        q.total ? h('span', {}, `选择题正确率 ${formatPercent(q.accuracy)}`) : null)));
}
```

`js/views/iv-home.js`：

```js
import { h } from '../ui.js';
import { cardSummary, recommendInterview, MOCK_SIZE } from '../interview.js';
import { stat, recommendCard } from './home.js';
import { bankSwitch } from './bank-switch.js';
import { ivDomainRow } from './iv-domain-row.js';

function recommendLink(ctx, rec) {
  const nameOf = (id) => ctx.data.domains.filter((d) => d.id === id)[0].name;
  if (rec.kind === 'review') {
    const sub = rec.grade === 'unknown' ? '先把「不会」的卡片过一遍' : '再过一遍「模糊」的卡片';
    return recommendCard(ctx.link(`learn/${rec.domain}/weak`), `复习：${nameOf(rec.domain)}`, sub);
  }
  if (rec.kind === 'wrong') {
    const n = Object.keys(ctx.getProgress().wrong).length;
    return recommendCard(ctx.link('wrong/practice'), `复习选择题错题（${n} 道）`, '连续答对 2 次即移出错题本');
  }
  if (rec.kind === 'domain') return recommendCard(ctx.link(`learn/${rec.domain}`), `学习：${nameOf(rec.domain)}`, '先翻卡自测，再做选择题');
  return recommendCard(ctx.link('mock'), '来一轮模拟面试', `${MOCK_SIZE} 题 · 每题约 2 分钟`);
}

export function renderIvHome(ctx) {
  const progress = ctx.getProgress();
  const { domains, cards } = ctx.data;
  const all = cardSummary(progress, cards);
  const last = progress.mocks[progress.mocks.length - 1];
  return [
    bankSwitch('interview'),
    h('section', { class: 'hero' },
      h('div', { class: 'hero-countdown' },
        h('span', { class: 'hero-label' }, '卡片已掌握'),
        h('span', { class: 'hero-number' }, String(all.known), h('span', { class: 'hero-unit' }, `/ ${all.total}`))),
      h('div', { class: 'hero-stats' },
        stat(String(all.fuzzy + all.unknown), '待复习'),
        stat(last ? `${last.counts.known}/${last.cardIds.length}` : '—', '上次模拟面试「会」'))),
    progress.mockDraft ? h('a', { class: 'notice notice-warn', href: ctx.link('mock') }, '有一轮模拟面试还没完成，点此继续 ›') : null,
    recommendLink(ctx, recommendInterview(progress, domains, cards)),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '类别进度'),
      h('ul', { class: 'domain-list' }, domains.map((d) => ivDomainRow(ctx, d)))),
    h('p', { class: 'disclaimer' }, '内容由本人整理并加密发布；答案仅供参考，面试前请核对原始资料。'),
  ].filter(Boolean);
}
```

- [ ] **Step 10: 重写** `js/main.js`（替换整个文件）

```js
import { loadData } from './data.js';
import { createStore, browserStorage } from './storage.js';
import { parseHash, linkFor, TAB_OF } from './router.js';
import { h, showBanner, emptyState } from './ui.js';
import { renderHome } from './views/home.js';
import { renderLearnIndex, renderCards } from './views/learn.js';
import { renderDomainPractice } from './views/practice.js';
import { renderExam } from './views/exam.js';
import { renderResult } from './views/result.js';
import { renderWrong, renderWrongPractice } from './views/wrong.js';
import { renderSettings } from './views/settings.js';
import { renderIvHome } from './views/iv-home.js';
import { renderUnlock } from './views/iv-unlock.js';
import { bankSwitch } from './views/bank-switch.js';
import { setupPwa, offerPendingUpdate, requestPersist, isWeChat } from './pwa.js';
import { remainingMs } from './exam.js';
import { isCryptoSupported } from './crypto.js';
import { IV_STORAGE_KEY, emptyInterviewProgress, validateInterviewImport } from './interview.js';
import { createInterviewSession } from './iv-session.js';

// 每个题库一张视图表；没注册的路由回退到该题库首页
const VIEWS = {
  acp: {
    home: (ctx) => renderHome(ctx),
    learn: (ctx) => renderLearnIndex(ctx),
    cards: (ctx, p) => renderCards(ctx, p.domain),
    practice: (ctx, p) => renderDomainPractice(ctx, p.domain),
    exam: (ctx) => renderExam(ctx),
    examResult: (ctx, p) => renderResult(ctx, p.id),
    settings: (ctx) => renderSettings(ctx),
    wrong: (ctx) => renderWrong(ctx),
    wrongPractice: (ctx, p) => renderWrongPractice(ctx, p.domain),
  },
  interview: {
    home: (ctx) => renderIvHome(ctx),
    practice: (ctx, p) => renderDomainPractice(ctx, p.domain),
    settings: (ctx) => renderSettings(ctx),
    wrong: (ctx) => renderWrong(ctx),
    wrongPractice: (ctx, p) => renderWrongPractice(ctx, p.domain),
  },
};

const BANK_TITLE = { acp: 'ACP 备考', interview: '面试备考' };
const EXAM_TAB_LABEL = { acp: '模拟考', interview: '模拟面试' };
const TAB_PATHS = {
  acp: { home: '', learn: 'learn', exam: 'exam', wrong: 'wrong' },
  interview: { home: '', learn: 'learn', exam: 'mock', wrong: 'wrong' },
};
const TITLES = {
  settings: '设置',
  learn: '学习',
  cards: '速记卡片',
  practice: '练习',
  exam: '模拟考',
  examResult: '考试结果',
  mock: '模拟面试',
  mockResult: '面试结果',
  wrong: '错题本',
  wrongPractice: '错题练习',
};
const BANK_KEY = 'acp-bank';
const LEAVE_EXAM_CONFIRM = '考试进行中，确定离开吗？作答已自动保存，回到「模拟考」可继续。';

const storage = browserStorage();
const banks = {
  acp: { store: createStore(storage), progress: null, data: null },
  interview: {
    store: createStore(storage, { key: IV_STORAGE_KEY, empty: emptyInterviewProgress, validate: validateInterviewImport }),
    progress: null,
    data: null,
  },
};
const session = createInterviewSession();
const state = { route: null, cleanups: [] };

function update(bank, fn) {
  const b = banks[bank];
  b.progress = fn(b.progress);
  if (!b.store.save(b.progress)) showBanner('storage', '无法写入本地存储，本次进度不会保存');
  return b.progress;
}

function navigate(hash) {
  window.location.hash = hash;
}

function lockInterview() {
  return session.lock().then(() => {
    banks.interview.data = null;
    navigate(linkFor('interview', ''));
  });
}

function makeContext(bank) {
  return {
    bank,
    data: banks[bank].data,
    getProgress: () => banks[bank].progress,
    update: (fn) => update(bank, fn),
    navigate,
    link: (path) => linkFor(bank, path),
    onLeave: (fn) => { state.cleanups.push(fn); },
    lock: lockInterview,
  };
}

function hasActiveExam() {
  const draft = banks.acp.progress.examDraft;
  return draft !== null && remainingMs(draft.startedAt, Date.now()) > 0;
}

function isLeavingExam(route) {
  const prev = state.route;
  const stays = route.bank === 'acp' && (route.name === 'exam' || route.name === 'examResult');
  return prev !== null && prev.bank === 'acp' && prev.name === 'exam' && hasActiveExam() && !stays;
}

function runCleanups() {
  state.cleanups.forEach((fn) => fn());
  state.cleanups = [];
}

function rememberBank(bank) {
  try {
    if (storage) storage.setItem(BANK_KEY, bank);
  } catch (err) {
    console.error('保存当前题库失败：', err);
  }
}

function lastBank() {
  try {
    return storage ? storage.getItem(BANK_KEY) : null;
  } catch {
    return null;
  }
}

function updateChrome(route) {
  const bankTitle = BANK_TITLE[route.bank];
  const title = route.name === 'home' ? bankTitle : (TITLES[route.name] || bankTitle);
  document.getElementById('title').textContent = title;
  document.title = route.name === 'home' ? bankTitle : `${title} · ${bankTitle}`;
  const settings = document.getElementById('settings-link');
  settings.hidden = route.name !== 'home';
  settings.setAttribute('href', linkFor(route.bank, 'settings'));
  const tab = TAB_OF[route.name] || 'home';
  document.querySelectorAll('.tab').forEach((el) => {
    const name = el.getAttribute('data-tab');
    el.setAttribute('href', linkFor(route.bank, TAB_PATHS[route.bank][name]));
    if (name === tab) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
  document.querySelector('.tab[data-tab="exam"] span').textContent = EXAM_TAB_LABEL[route.bank];
}

function mount(nodes) {
  const view = document.getElementById('view');
  view.textContent = '';
  view.append(...[].concat(nodes).filter(Boolean));
  view.scrollTop = 0;
}

function showFatal(err) {
  mount(h('div', { class: 'empty' },
    h('p', {}, `页面出错：${err.message}`),
    h('button', { class: 'btn btn-primary', type: 'button', onClick: () => window.location.reload() }, '重试')));
}

function stillOnInterview() {
  return parseHash(window.location.hash).bank === 'interview';
}

function onUnlocked() {
  banks.interview.data = session.getData();
  render();
}

function openInterview() {
  if (!isCryptoSupported()) {
    mount(renderUnlock({ supported: false }));
    return;
  }
  mount(h('p', { class: 'loading' }, '正在打开面试题库…'));
  session.tryStoredKey().then((ok) => {
    if (!stillOnInterview()) return;
    if (ok) {
      onUnlocked();
      return;
    }
    mount(renderUnlock({ supported: true, onUnlock: (password) => session.unlock(password).then(onUnlocked) }));
  }).catch((err) => {
    console.error(err);
    if (stillOnInterview()) mount([bankSwitch('interview'), emptyState(err.message, '#/', '回到 ACP 题库')]);
  });
}

function render() {
  const route = parseHash(window.location.hash);
  if (isLeavingExam(route) && !window.confirm(LEAVE_EXAM_CONFIRM)) {
    navigate('#/exam');
    return;
  }
  runCleanups();
  rememberBank(route.bank);
  state.route = route;
  updateChrome(route);
  try {
    if (!banks[route.bank].data) {
      openInterview();
      return;
    }
    const views = VIEWS[route.bank];
    const renderView = views[route.name] || views.home;
    mount(renderView(makeContext(route.bank), route.params));
    if (!(route.bank === 'acp' && route.name === 'exam')) offerPendingUpdate();
  } catch (err) {
    console.error(err);
    showFatal(err);
  }
}

async function boot() {
  Object.keys(banks).forEach((bank) => {
    const loaded = banks[bank].store.load();
    banks[bank].progress = loaded.progress;
    if (loaded.error) showBanner('storage', loaded.error);
  });
  try {
    banks.acp.data = await loadData();
  } catch (err) {
    console.error(err);
    showFatal(err);
    return;
  }
  if (!window.location.hash && lastBank() === 'interview') {
    window.history.replaceState(null, '', linkFor('interview', ''));
  }
  window.addEventListener('hashchange', render);
  render();
  requestPersist();
  if (isWeChat(navigator.userAgent)) {
    showBanner('wechat', '微信里无法添加到主屏：点右上角「···」选择「在浏览器打开」');
  }
  setupPwa({ isExamRunning: hasActiveExam });
}

boot();
```

- [ ] **Step 11: 追加 CSS**

在 `:root` 中加两个变量：`--todo: #9d174d; --todo-soft: #fce7f3;`。在深色模式的 `:root` 中也加上：`--todo: #f9a8d4; --todo-soft: #4a1d33;`。然后在「通用组件」段之后追加：

```css
/* ===== 题库切换与解锁 ===== */
.bank-switch { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-1); padding: var(--space-1); border-radius: var(--radius-m); background: var(--surface-2); }
.bank-tab { display: flex; align-items: center; justify-content: center; min-height: var(--tap); border-radius: var(--radius-s); color: var(--ink-2); font-weight: 700; text-decoration: none; transition: background var(--dur) var(--ease); }
.bank-tab[aria-current="page"] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow); }
.bank-tab:active { transform: scale(0.98); }
.unlock-status { min-height: 1.6em; text-align: center; color: var(--bad); font-weight: 700; }
```

- [ ] **Step 12: 把本任务新建的 js 文件加进 `sw.js` 的 `SHELL`**：`'js/keystore.js'`、`'js/iv-session.js'`、`'js/views/bank-switch.js'`、`'js/views/iv-unlock.js'`、`'js/views/iv-home.js'`、`'js/views/iv-domain-row.js'`。`data/interview.enc` **不加入预缓存**：这个文件可能还不存在，放进 `addAll` 会让 Service Worker 安装失败；它由现有的 `/data/` 规则（stale-while-revalidate）在首次访问时缓存。

- [ ] **Step 13: 运行全部测试**

Run: `npm test && npx playwright test`
Expected: 全部通过。新增的 6 个 iv-unlock 测试在 4 个视口下都通过，ACP 原有的端到端测试也全部通过。

- [ ] **Step 14: 提交**

```bash
git add js tests/e2e/iv-helpers.mjs tests/e2e/iv-unlock.spec.mjs css/app.css sw.js
git commit -m "feat: unlock the encrypted interview bank and switch between banks"
```

---

### Task 7: 翻卡自评

**Files:**
- Create: `js/rich.js`
- Create: `js/views/iv-learn.js`
- Create: `tests/e2e/iv-learn.spec.mjs`
- Modify: `js/main.js`（`VIEWS.interview` 加 `learn` 和 `cards`）
- Modify: `css/app.css`
- Modify: `sw.js`（`SHELL` 加 `'js/rich.js'`、`'js/views/iv-learn.js'`）

**Interfaces:**
- Consumes：
  - Task 4：`gradeCard`、`gradeOf`、`isWeakGrade`
  - Task 6：`ivDomainRow`、ctx 的约定
  - `ui.js`：`h`、`attachSwipe`、`emptyState`、`scrollViewTop`
- Produces：
  - `js/rich.js`：`inline(spans): Node[]`、`blocks(list): Node[]`、`hasTodoSpan(blocks): boolean`
  - `js/views/iv-learn.js` 导出：
    - `renderIvLearnIndex(ctx)`
    - `renderIvCards(ctx, domainId, filter?)`
    - `cardFace(card, {revealed, onReveal, grade?})`：返回 `article.flashcard.iv-card`
    - `answerParts(card): Node[]`：四个 `details.iv-part`，其中「结论」段和含有待补内容的段默认展开
    - `gradeButtons(current, onGrade)`：返回 `div.grade-actions`，依次是「不会」「模糊」「会」三个按钮
    - `GRADE_LABELS`、`GRADE_CHIP`

- [ ] **Step 1: 写失败的 e2e 测试** `tests/e2e/iv-learn.spec.mjs`

```js
import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap } from './helpers.mjs';
import { serveEnvelope, unlock } from './iv-helpers.mjs';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await serveEnvelope(page);
  await unlock(page);
});

test('learn index lists both categories with card counts', async ({ page }) => {
  await page.locator('.tab[data-tab="learn"]').click();
  await expect(page).toHaveURL(/#\/iv\/learn$/);
  await expect(page.locator('.domain-row')).toHaveCount(2);
  await expect(page.locator('.domain-row').first()).toContainText('会 0/3');
});

test('a card reveals its answer, shows todo marks and records a grade', async ({ page }, testInfo) => {
  await page.goto('./#/iv/learn/iv-a');
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/3');
  await expect(page.locator('.iv-part')).toHaveCount(0);
  await page.getByRole('button', { name: '看答案' }).click();
  await expect(page.locator('.iv-part')).toHaveCount(4);
  await expect(page.locator('.iv-part').first()).toHaveAttribute('open', '');
  await expect(page.locator('mark.todo')).toHaveText('【待补：补一个真实例子】');
  await expect(page.locator('.iv-card .chip-warn')).toHaveText('有待补');
  await page.locator('.iv-part summary', { hasText: '项目做法' }).click();
  await expect(page.locator('.iv-part-body code').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-card-revealed');
  await page.getByRole('button', { name: '不会' }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 2/3');
  await expect(page.getByRole('button', { name: '看答案' })).toBeVisible();
});

test('the weak filter shows only fuzzy and unknown cards and is linked from home', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-a');
  await page.getByRole('button', { name: '看答案' }).click();
  await page.getByRole('button', { name: '模糊' }).click();
  await page.getByRole('button', { name: /只看模糊 \+ 不会 1/ }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/1');
  await expect(page.locator('.flashcard-state')).toHaveText('模糊');
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.recommend')).toContainText('复习：示例类别甲');
  await page.locator('.recommend').click();
  await expect(page).toHaveURL(/#\/iv\/learn\/iv-a\/weak$/);
  await expect(page.locator('.crumb')).toHaveText('示例类别甲 · 1/1');
});

test('swipe and pager move between cards; no practice link without questions', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-b');
  const box = await page.locator('.flashcard').boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.85, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.15, y, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('.crumb')).toHaveText('示例类别乙 · 2/3');
  await page.getByRole('button', { name: '‹ 上一张' }).click();
  await expect(page.locator('.crumb')).toHaveText('示例类别乙 · 1/3');
  await expect(page.getByRole('link', { name: /开始练习/ })).toHaveCount(0);
  await expect(page.locator('.iv-intro')).toHaveCount(0);
});

test('an unknown category shows a way back', async ({ page }) => {
  await page.goto('./#/iv/learn/iv-z');
  await expect(page.locator('.empty')).toContainText('没有找到这个类别');
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx playwright test tests/e2e/iv-learn.spec.mjs --project=android-360-light`
Expected: FAIL（路由回退到首页，找不到 `.crumb`）

- [ ] **Step 3: 写** `js/rich.js`

```js
import { h } from './ui.js';

// 把构建脚本产出的片段 / 块数组渲染成 DOM；全部走 textContent，不解析 HTML
export function inline(spans) {
  return spans.map((s) => {
    if (s.t === 'b') return h('strong', {}, s.s);
    if (s.t === 'code') return h('code', {}, s.s);
    if (s.t === 'todo') return h('mark', { class: 'todo' }, s.s);
    return s.s;
  });
}

export function blocks(list) {
  return list.map((b) => (b.t === 'p'
    ? h('p', {}, inline(b.c))
    : h(b.t, {}, b.items.map((item) => h('li', {}, inline(item))))));
}

export function hasTodoSpan(list) {
  return list.some((b) => (b.t === 'p' ? b.c : [].concat(...b.items)).some((s) => s.t === 'todo'));
}
```

- [ ] **Step 4: 写** `js/views/iv-learn.js`

```js
import { h, attachSwipe, emptyState, scrollViewTop } from '../ui.js';
import { gradeCard, gradeOf, isWeakGrade } from '../interview.js';
import { blocks, hasTodoSpan } from '../rich.js';
import { ivDomainRow } from './iv-domain-row.js';

const PARTS = [['conclusion', '结论'], ['principle', '原理'], ['practice', '项目做法'], ['tradeoff', '取舍与局限']];
export const GRADE_LABELS = { known: '会', fuzzy: '模糊', unknown: '不会' };
export const GRADE_CHIP = { known: 'chip-accent', fuzzy: 'chip-warn', unknown: 'chip-bad' };
const GRADE_ORDER = ['unknown', 'fuzzy', 'known'];

export function renderIvLearnIndex(ctx) {
  return [
    h('p', { class: 'muted' }, '选一个类别：先翻卡自测，再做选择题。'),
    h('ul', { class: 'domain-list' }, ctx.data.domains.map((d) => ivDomainRow(ctx, d))),
  ];
}

export function answerParts(card) {
  return PARTS.map(([key, label], i) => {
    const part = card.parts[key];
    return h('details', { class: 'iv-part', open: i === 0 || hasTodoSpan(part.blocks) },
      h('summary', {}, part.warn ? `${label} ⚠️` : label),
      h('div', { class: 'iv-part-body' }, blocks(part.blocks)));
  });
}

export function cardFace(card, opts) {
  return h('article', { class: 'flashcard iv-card', 'aria-live': 'polite' },
    opts.grade ? h('span', { class: `flashcard-state chip ${GRADE_CHIP[opts.grade]}` }, GRADE_LABELS[opts.grade]) : null,
    h('p', { class: 'iv-no' }, card.no, card.hasTodo ? h('span', { class: 'chip chip-warn' }, '有待补') : null),
    h('h2', { class: 'flashcard-title' }, card.title),
    opts.revealed
      ? answerParts(card)
      : h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: opts.onReveal }, '看答案'));
}

export function gradeButtons(current, onGrade) {
  return h('div', { class: 'grade-actions', role: 'group', 'aria-label': '自评' }, GRADE_ORDER.map((g) => h('button', {
    class: `btn grade-${g}`, type: 'button', 'aria-pressed': String(current === g), onClick: () => onGrade(g),
  }, GRADE_LABELS[g])));
}

export function renderIvCards(ctx, domainId, initialFilter) {
  const domain = ctx.data.domains.filter((d) => d.id === domainId)[0];
  if (!domain) return emptyState('没有找到这个类别。', ctx.link('learn'), '返回类别列表');
  const all = ctx.data.cards.filter((c) => c.domain === domainId);
  const count = ctx.data.questions.filter((q) => q.domain === domainId).length;
  const weakCards = () => all.filter((c) => isWeakGrade(gradeOf(ctx.getProgress(), c.id)));
  const root = h('div', { class: 'stack' });
  let filter = initialFilter === 'weak' ? 'weak' : 'all';
  let list = filter === 'weak' ? weakCards() : all;
  let index = 0;
  let revealed = false;

  const show = (i) => {
    index = i;
    revealed = false;
    draw();
    scrollViewTop();
  };
  const go = (delta) => {
    const next = index + delta;
    if (next >= 0 && next < list.length) show(next);
  };
  const setFilter = (value) => {
    filter = value;
    list = value === 'weak' ? weakCards() : all;
    show(0);
  };
  const grade = (value) => {
    ctx.update((p) => gradeCard(p, list[index].id, value, Date.now()));
    if (index < list.length - 1) show(index + 1);
    else draw();
  };
  const chip = (label, value, n) => h('button', {
    class: 'chip chip-filter', type: 'button', 'aria-pressed': String(filter === value), onClick: () => setFilter(value),
  }, `${label} ${n}`);

  function cardArea() {
    if (!list.length) return [emptyState(filter === 'weak' ? '没有模糊或不会的卡片。' : '这个类别还没有卡片。')];
    const card = list[index];
    const current = gradeOf(ctx.getProgress(), card.id);
    const panel = cardFace(card, { revealed, grade: current, onReveal: () => { revealed = true; draw(); } });
    attachSwipe(panel, { onLeft: () => go(1), onRight: () => go(-1) });
    return [
      h('p', { class: 'crumb' }, `${domain.name} · ${index + 1}/${list.length}`),
      panel,
      revealed ? gradeButtons(current, grade) : null,
      h('div', { class: 'pager' },
        h('button', { class: 'btn btn-ghost', type: 'button', disabled: index === 0, onClick: () => go(-1) }, '‹ 上一张'),
        h('button', { class: 'btn btn-ghost', type: 'button', disabled: index === list.length - 1, onClick: () => go(1) }, '下一张 ›')),
    ];
  }

  function draw() {
    root.textContent = '';
    root.append(...[
      domain.intro.length ? h('details', { class: 'iv-intro' }, h('summary', {}, '类别说明'), blocks(domain.intro)) : null,
      h('div', { class: 'chips', role: 'toolbar', 'aria-label': '筛选卡片' },
        chip('全部', 'all', all.length), chip('只看模糊 + 不会', 'weak', weakCards().length)),
    ].concat(cardArea(), [
      count ? h('a', { class: 'btn btn-outline btn-block', href: ctx.link(`practice/${domainId}`) }, `开始练习（${count} 题）`) : null,
    ]).filter(Boolean));
  }

  draw();
  return root;
}
```

- [ ] **Step 5: 在 `js/main.js` 中注册视图**

加上 `import { renderIvLearnIndex, renderIvCards } from './views/iv-learn.js';`，然后在 `VIEWS.interview` 中加入：

```js
    learn: (ctx) => renderIvLearnIndex(ctx),
    cards: (ctx, p) => renderIvCards(ctx, p.domain, p.filter),
```

- [ ] **Step 6: 追加 CSS**（放在「卡片」段之后）

```css
/* ===== 面试卡片 ===== */
.chip-bad { background: var(--bad-soft); color: var(--bad); }
.iv-no { display: flex; align-items: center; gap: var(--space-2); font-size: 13px; font-weight: 800; letter-spacing: 0.04em; color: var(--accent); }
.iv-part { border-top: 1px solid var(--line); }
.iv-part > summary { display: flex; align-items: center; min-height: var(--tap); font-weight: 800; list-style: none; cursor: pointer; }
.iv-part > summary::-webkit-details-marker { display: none; }
.iv-part > summary::after { content: "＋"; margin-left: auto; color: var(--ink-2); }
.iv-part[open] > summary::after { content: "－"; }
.iv-part-body { display: grid; gap: var(--space-2); padding-bottom: var(--space-3); line-height: 1.65; overflow-wrap: anywhere; }
.iv-part-body p, .iv-part-body ul, .iv-part-body ol, .iv-intro p { margin: 0; }
.iv-part-body ul, .iv-part-body ol { display: grid; gap: var(--space-1); padding-left: 1.2em; }
.iv-part-body code, .iv-intro code { padding: 0 4px; border-radius: 4px; background: var(--surface-2); font-size: 0.9em; overflow-wrap: anywhere; }
mark.todo { padding: 0 2px; border-radius: 4px; background: var(--todo-soft); color: var(--todo); font-weight: 700; }
.iv-intro { display: grid; gap: var(--space-2); font-size: 14px; color: var(--ink-2); }
.iv-intro > summary { display: flex; align-items: center; min-height: var(--tap); font-weight: 700; cursor: pointer; }
.grade-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); }
.grade-unknown { background: var(--bad-soft); color: var(--bad); }
.grade-fuzzy { background: var(--warn-soft); color: var(--warn); }
.grade-known { background: var(--ok-soft); color: var(--ok); }
```

- [ ] **Step 7: 把 `'js/rich.js'` 和 `'js/views/iv-learn.js'` 加进 `sw.js` 的 `SHELL`**

- [ ] **Step 8: 运行全部测试**

Run: `npm test && npx playwright test`
Expected: 全部通过。在 320px 宽度下，长代码路径的卡片也没有横向溢出。

- [ ] **Step 9: 提交**

```bash
git add js/rich.js js/views/iv-learn.js js/main.js css/app.css sw.js tests/e2e/iv-learn.spec.mjs
git commit -m "feat: flip-card self-assessment for the interview bank"
```

---

### Task 8: 模拟面试、结果页、收尾

**Files:**
- Create: `js/views/iv-mock.js`
- Create: `tests/e2e/iv-mock.spec.mjs`
- Modify: `js/main.js`（`VIEWS.interview` 加 `mock` 和 `mockResult`）
- Modify: `css/app.css`
- Modify: `sw.js`（`SHELL` 加 `'js/views/iv-mock.js'`；运行 `npm run bump`）

**Interfaces:**
- Consumes：
  - Task 4：`buildMock`、`startMock`、`gradeMock`、`finishMock`、`pruneMockDraft`、`nextMockIndex`、`isWeakGrade`、`GRADES`、`MOCK_SIZE`、`MOCK_SOFT_LIMIT_MS`
  - Task 7：`cardFace`、`gradeButtons`、`answerParts`、`GRADE_LABELS`、`GRADE_CHIP`
  - Task 6：`stat`（来自 `home.js`）
  - `exam.js`：`allocate`、`formatClock`、`formatDuration`
- Produces：
  - `renderMock(ctx)`、`renderMockResult(ctx, id)`
  - 模拟面试页的 DOM 约定：
    - 进度文本在 `.exam-progress`，格式为「第 i/N 题」
    - 计时器 `.exam-timer`：超过 2 分钟后加 `is-urgent` 类，并显示「+mm:ss」
    - 结果页根节点带 `.iv-result`，其中 `.grade-summary .stat-value` 依次是「会」「模糊」「不会」的数量

- [ ] **Step 1: 写失败的 e2e 测试** `tests/e2e/iv-mock.spec.mjs`

```js
import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, snap } from './helpers.mjs';
import { serveEnvelope, unlock } from './iv-helpers.mjs';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await serveEnvelope(page);
  await unlock(page);
});

async function answer(page, grade) {
  await page.getByRole('button', { name: '看答案' }).click();
  await page.getByRole('button', { name: grade, exact: true }).click();
}

test('a mock interview resumes after reload and ends on a result page', async ({ page }, testInfo) => {
  await page.locator('.tab[data-tab="exam"]').click();
  await expect(page).toHaveURL(/#\/iv\/mock$/);
  await expect(page.locator('.alloc-table tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: '开始模拟面试' }).click();
  await expect(page.locator('.exam-progress')).toHaveText('第 1/6 题');
  await expect(page.locator('.exam-timer')).toHaveText(/^0[12]:\d\d$/);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-mock');
  await answer(page, '会');
  await expect(page.locator('.exam-progress')).toHaveText('第 2/6 题');
  await page.reload();
  await expect(page.locator('.exam-progress')).toHaveText('第 2/6 题');
  await page.locator('.tab[data-tab="home"]').click();
  await expect(page.locator('.notice-warn')).toContainText('模拟面试还没完成');
  await page.locator('.notice-warn').click();
  for (let i = 0; i < 5; i += 1) await answer(page, '模糊');
  await expect(page).toHaveURL(/#\/iv\/mock\/result\/\d+$/);
  await expect(page.locator('.iv-result .grade-summary .stat-value')).toHaveText(['1', '5', '0']);
  await expect(page.locator('.review-list > li')).toHaveCount(6);
  await page.locator('.review-item summary').first().click();
  await expect(page.locator('.review-item[open] .iv-part')).toHaveCount(4);
  await expectNoHorizontalOverflow(page);
  await snap(page, testInfo, 'iv-mock-result');
  await page.getByRole('link', { name: '去复习模糊和不会的卡片' }).click();
  await expect(page).toHaveURL(/#\/iv\/learn\/iv-[ab]\/weak$/);
});

test('ending early keeps the graded answers', async ({ page }) => {
  await page.goto('./#/iv/mock');
  await page.getByRole('button', { name: '开始模拟面试' }).click();
  await answer(page, '不会');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: '结束' }).click();
  await expect(page.locator('.iv-result .grade-summary .stat-value')).toHaveText(['0', '0', '1']);
  await page.getByRole('link', { name: '返回模拟面试' }).click();
  await expect(page.locator('.history li')).toHaveCount(1);
});

test('the soft timer turns red after two minutes', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/iv/mock');
  await page.reload();
  await page.getByRole('button', { name: '开始模拟面试' }).click();
  await page.clock.fastForward('02:05');
  await expect(page.locator('.exam-timer')).toHaveClass(/is-urgent/);
  await expect(page.locator('.exam-timer')).toHaveText(/^\+00:0\d$/);
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npx playwright test tests/e2e/iv-mock.spec.mjs --project=android-360-light`
Expected: FAIL（找不到 `.alloc-table`）

- [ ] **Step 3: 写** `js/views/iv-mock.js`

```js
import { h, emptyState, scrollViewTop, formatDateTime } from '../ui.js';
import { allocate, formatClock, formatDuration } from '../exam.js';
import {
  buildMock, startMock, gradeMock, finishMock, pruneMockDraft, nextMockIndex, isWeakGrade,
  GRADES, MOCK_SIZE, MOCK_SOFT_LIMIT_MS,
} from '../interview.js';
import { cardFace, gradeButtons, answerParts, GRADE_LABELS, GRADE_CHIP } from './iv-learn.js';
import { stat } from './home.js';

const TICK_MS = 1000;
const RECENT_MOCKS = 5;
const RULES = [
  `按类别权重抽 ${MOCK_SIZE} 题，偏重 Agent 核心、RAG 和项目深挖`,
  '先口头作答，建议每题控制在 2 分钟内',
  '说完再看答案，自评：会 / 模糊 / 不会',
  '自评会同步到卡片，模糊和不会的题进入复习',
  '中途离开会自动保存，回来接着答',
];

function finish(ctx) {
  const next = ctx.update((p) => finishMock(p, Date.now()));
  ctx.navigate(ctx.link(`mock/result/${next.mocks[next.mocks.length - 1].id}`));
}

function start(ctx, show) {
  const ids = buildMock(ctx.data.domains, ctx.data.cards);
  if (!ids.length) {
    window.alert('还没有卡片，无法开始模拟面试。');
    return;
  }
  ctx.update((p) => startMock(p, ids, Date.now()));
  show();
}

function intro(ctx, show) {
  const { domains } = ctx.data;
  const counts = allocate(domains.map((d) => d.weight), MOCK_SIZE);
  const recent = ctx.getProgress().mocks.slice(-RECENT_MOCKS).reverse();
  return [
    h('section', { class: 'rules' }, h('h2', { class: 'section-title' }, '模拟面试规则'), h('ul', {}, RULES.map((r) => h('li', {}, r)))),
    h('table', { class: 'alloc-table' },
      h('thead', {}, h('tr', {}, h('th', {}, '类别'), h('th', {}, '题数'))),
      h('tbody', {}, domains.map((d, i) => h('tr', {}, h('td', {}, `${d.letter}. ${d.name}`), h('td', {}, String(counts[i])))))),
    h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: () => start(ctx, show) }, '开始模拟面试'),
    recent.length ? h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '最近记录'),
      h('ul', { class: 'history' }, recent.map((m) => h('li', {}, h('a', { href: ctx.link(`mock/result/${m.id}`) },
        h('span', {}, formatDateTime(m.finishedAt)),
        h('span', {}, `会 ${m.counts.known} · 模糊 ${m.counts.fuzzy} · 不会 ${m.counts.unknown}`)))))) : null,
  ].filter(Boolean);
}

function softClock(elapsed) {
  const left = MOCK_SOFT_LIMIT_MS - elapsed;
  return left >= 0 ? formatClock(left) : `+${formatClock(-left)}`;
}

function running(ctx, show) {
  const draft = ctx.getProgress().mockDraft;
  const index = nextMockIndex(draft);
  const card = ctx.data.cardById.get(draft.cardIds[index]);
  const shownAt = Date.now();
  let revealedMs = null;
  const timer = h('span', { class: 'exam-timer', role: 'timer', 'aria-label': '建议用时' });
  const body = h('div', { class: 'stack' });
  const tick = () => {
    const elapsed = revealedMs === null ? Date.now() - shownAt : revealedMs;
    timer.textContent = softClock(elapsed);
    timer.classList.toggle('is-urgent', elapsed > MOCK_SOFT_LIMIT_MS);
  };
  const handle = setInterval(tick, TICK_MS);
  ctx.onLeave(() => clearInterval(handle));
  const grade = (value) => {
    clearInterval(handle);
    ctx.update((p) => gradeMock(p, card.id, value, revealedMs, Date.now()));
    scrollViewTop();
    show();
  };
  const stop = () => {
    if (!window.confirm('提前结束本轮？已自评的题会计入结果。')) return;
    clearInterval(handle);
    finish(ctx);
  };
  function draw() {
    body.textContent = '';
    body.append(...[
      cardFace(card, { revealed: revealedMs !== null, onReveal: () => { revealedMs = Date.now() - shownAt; tick(); draw(); } }),
      revealedMs !== null ? gradeButtons(null, grade) : null,
    ].filter(Boolean));
  }
  tick();
  draw();
  return [
    h('div', { class: 'exam-bar' }, timer,
      h('span', { class: 'exam-progress' }, `第 ${index + 1}/${draft.cardIds.length} 题`),
      h('button', { class: 'btn btn-ghost btn-small', type: 'button', onClick: stop }, '结束')),
    body,
  ];
}

export function renderMock(ctx) {
  const root = h('div', { class: 'stack' });
  function show() {
    root.textContent = '';
    if (ctx.getProgress().mockDraft) ctx.update((p) => pruneMockDraft(p, (id) => ctx.data.cardById.has(id)));
    const draft = ctx.getProgress().mockDraft;
    if (!draft) root.append(...intro(ctx, show));
    else if (nextMockIndex(draft) === -1) finish(ctx);
    else root.append(...running(ctx, show));
  }
  show();
  return root;
}

function resultItem(card, result, i) {
  if (!card) return h('li', { class: 'muted' }, `第 ${i + 1} 题已从题库移除`);
  return h('li', {}, h('details', { class: result.grade === 'known' ? 'review-item is-correct' : 'review-item' },
    h('summary', {},
      h('span', { class: `review-mark chip ${GRADE_CHIP[result.grade]}` }, GRADE_LABELS[result.grade]),
      h('span', { class: 'review-stem' }, `${card.no}. ${card.title}`),
      h('span', { class: 'muted' }, formatClock(result.ms))),
    h('div', { class: 'iv-review-body' }, answerParts(card))));
}

export function renderMockResult(ctx, id) {
  const record = ctx.getProgress().mocks.filter((m) => m.id === id)[0];
  if (!record) return emptyState('没有找到这次模拟面试记录。', ctx.link('mock'), '返回模拟面试');
  const graded = record.cardIds.filter((cid) => record.results[cid]);
  const weak = graded.map((cid) => ctx.data.cardById.get(cid)).filter((c) => c && isWeakGrade(record.results[c.id].grade))[0];
  return [
    h('section', { class: 'result-hero iv-result' },
      h('div', { class: 'grade-summary' }, GRADES.map((g) => stat(String(record.counts[g]), GRADE_LABELS[g]))),
      h('p', { class: 'muted' }, `共 ${graded.length} 题 · 用时 ${formatDuration(record.finishedAt - record.startedAt)}`)),
    h('section', { class: 'section' },
      h('h2', { class: 'section-title' }, '逐题回看'),
      h('ol', { class: 'review-list' }, graded.map((cid, i) => resultItem(ctx.data.cardById.get(cid), record.results[cid], i)))),
    weak ? h('a', { class: 'btn btn-primary btn-block', href: ctx.link(`learn/${weak.domain}/weak`) }, '去复习模糊和不会的卡片') : null,
    h('a', { class: 'btn btn-secondary btn-block', href: ctx.link('mock') }, '返回模拟面试'),
  ].filter(Boolean);
}
```

- [ ] **Step 4: 在 `js/main.js` 中注册视图**

加上 `import { renderMock, renderMockResult } from './views/iv-mock.js';`，然后在 `VIEWS.interview` 中加入：

```js
    mock: (ctx) => renderMock(ctx),
    mockResult: (ctx, p) => renderMockResult(ctx, p.id),
```

- [ ] **Step 5: 追加 CSS**（放在「模拟考」段之后）

```css
/* ===== 模拟面试 ===== */
.iv-result { border-top-color: var(--accent); }
.grade-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); }
.grade-summary .stat { align-items: center; }
.iv-review-body { padding: 0 var(--space-3) var(--space-3); }
.review-item .review-mark.chip { flex: none; }
```

- [ ] **Step 6: 把 `'js/views/iv-mock.js'` 加进 `sw.js` 的 `SHELL`，然后运行 `npm run bump`**（把 `CACHE_VERSION` 递增到 `acp-v10`）

- [ ] **Step 7: 完整验证**

Run: `npm test && npm run test:cov && npm run validate && npx playwright test && npm run size`
Expected：
- 单元测试和 e2e 全部通过，行覆盖率不低于 80%，ACP 题库校验通过。
- 体积在预算内。此时还没有真实密文，`data/interview.enc` 不存在，这是正常的。

- [ ] **Step 8: 提交**

```bash
git add js/views/iv-mock.js js/main.js css/app.css sw.js tests/e2e/iv-mock.spec.mjs
git commit -m "feat: timed mock interview with self-grading and results"
```

---

## 计划外、需要用户本人完成的步骤（控制方负责提醒）

1. **生成真实密文。** 密码只能由用户输入，所以由用户在自己的 PowerShell 里执行 README 中「构建 / 更新」那一节的命令，指向本机的 prep 目录。
2. **检查并提交。**
   - 设置 `INTERVIEW_SRC` 后运行一次 `npm test`，真实题库的防泄漏测试必须通过。
   - 运行 `npm run size`，确认体积仍在预算内。
   - 然后提交 `data/interview.enc`。
3. **合并与推送。** 合并到 `main`，推送前需要用户确认。
4. **真机验收。** 由用户在安卓手机上完成：解锁、翻卡、一轮模拟面试，然后断网再打开一次。
