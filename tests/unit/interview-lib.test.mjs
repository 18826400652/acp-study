import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseInline, parseBlocks, parseQbankFile, buildPayload, loadSources, readExtraTerms,
  leakTerms, leakTermStats, findLeaks, repoTextFiles, isInside, checkPassword, encryptInterview, IV_WEIGHTS,
  loadQuestions, validateInterviewQuestions, IV_MCQ_TARGETS,
} from '../../scripts/interview-lib.mjs';
import { unlockWithPassword, decryptWithKey } from '../../js/crypto.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'interview');
// 统一成 LF：Windows 上 git 可能把夹具检出为 CRLF
const A_TEXT = fs.readFileSync(path.join(FIXTURE, 'qbank', 'A-sample.md'), 'utf8').replace(/\r\n/g, '\n');
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

test('leakTerms filters derived terms with >50% ASCII (generic English definitions), but keeps extra terms', () => {
  // Card title is Chinese and ≥8 chars, should be kept
  const payload = {
    cards: {
      'iv-test': [{
        title: '这是测试的题目标题内容',
        parts: {
          conclusion: {
            blocks: [{ t: 'p', c: [{ t: 'text', s: 'MCP（Model Context Protocol）是一种开放协议，' }] }],
          },
        },
      }],
    },
  };
  // The 20-char conclusion prefix is "MCP（Model Context Pr" which is >50% ASCII, so it's dropped
  // The title "这是测试的题目标题内容" is all Chinese (0% ASCII), so it's kept
  // The extra term "ABCDEFGHIJ" is pure ASCII but from extra, so it's kept (not filtered)
  const terms = leakTerms(payload, ['ABCDEFGHIJ']);
  assert.ok(terms.includes('这是测试的题目标题内容'), `Expected title in ${terms}`);
  assert.ok(!terms.some((t) => t.startsWith('MCP')), `Expected no MCP prefix in ${terms}`);
  assert.ok(terms.includes('ABCDEFGHIJ'), `Expected extra term in ${terms}`);
});

test('leakTermStats counts every derived term and splits checked vs skipped', () => {
  const payload = buildPayload(loadSources(FIXTURE), 'x');
  const stats = leakTermStats(payload, ['甲乙', '  ', '']);
  // 6 张卡片（A、B 各 3 张），每张贡献 2 个衍生词条（标题 + 结论前 20 字）
  assert.equal(stats.total, 12);
  assert.equal(stats.checked + stats.skipped, stats.total);
  assert.equal(stats.extra, 1);
});

test('leakTermStats separates ASCII-heavy/short derived terms from checked ones', () => {
  const payload = {
    cards: {
      'iv-test': [
        {
          title: '这是测试的题目标题内容',
          parts: { conclusion: { blocks: [{ t: 'p', c: [{ t: 'text', s: 'MCP（Model Context Protocol）是一种开放协议，' }] }] } },
        },
        {
          title: '短',
          parts: { conclusion: { blocks: [{ t: 'p', c: [{ t: 'text', s: '这是另一条足够长的结论内容示例文本' }] }] } },
        },
      ],
    },
  };
  const stats = leakTermStats(payload, ['ABCDEFGHIJ', '  ']);
  assert.equal(stats.total, 4);
  // 通过：长标题「这是测试的题目标题内容」+ 长结论前缀「这是另一条足够长的结论内容示例文本」
  // 跳过：MCP 结论前缀（>50% ASCII）+ 「短」标题（<8 字）
  assert.equal(stats.checked, 2);
  assert.equal(stats.skipped, 2);
  assert.equal(stats.extra, 1);
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

test('loadQuestions strips a leading BOM before parsing', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iv-bom-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'qbank-app', 'questions'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'qbank-app', 'questions', 'iv-c.json'), `﻿${JSON.stringify([{ id: 'x' }])}`);
  assert.deepEqual(loadQuestions(dir), { 'iv-c': [{ id: 'x' }] });
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
