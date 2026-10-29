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
test('single keys that are usually the longest option are rejected', () => {
  const data = valid();
  data.mock.rag.slice(0, 20).forEach((q, i) => {
    if (i < 8) q.options[q.answer[0]] = '明显更长的正确选项文本';
  });
  expectError(data, '单选题中正确答案最长的占 40%，超过 35%');
});
test('multiple chapters may be joined with 、', () => {
  const data = valid();
  data.mock.rag[0] = { ...data.mock.rag[0], source: '2_5_x、5_2_总结与展望' };
  assert.deepEqual(validateMockData(data), []);
});
test('ids must be continuous from m001', () => {
  const gap = valid();
  gap.mock.rag = gap.mock.rag.filter((q) => q.id !== 'rag-m010');
  expectError(gap, '题号应从 m001 连续编号', { allowPartial: true });
  const zero = valid();
  zero.mock.rag[0] = { ...zero.mock.rag[0], id: 'rag-m000' };
  expectError(zero, '题号应从 m001 连续编号', { allowPartial: true });
});
test('non-object entries are reported without throwing', () => {
  const errors = validateMockData({ domains: DOMAINS, mock: { rag: [null] } }, { allowPartial: true });
  assert.ok(errors.some((e) => e.includes('存在非对象条目')), errors.join('\n'));
});
test('a multi-choice option may not dominate the answers', () => {
  const data = valid();
  const answers = [[0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1, 2], [0, 1, 2], [0, 1, 2]];
  data.mock.rag.slice(20).forEach((q, i) => { q.answer = answers[i]; });
  expectError(data, '多选题选项 A 在 100% 的题目中为正确答案，超过 70%');
});
test('strict mode reports a domain without a mock target', () => {
  const domains = [{ ...DOMAINS[0], id: 'unknown-domain' }];
  const data = { domains, mock: { 'unknown-domain': [] } };
  expectError(data, '未配置模拟题目标');
  assert.deepEqual(validateMockData(data, { allowPartial: true }), []);
});
