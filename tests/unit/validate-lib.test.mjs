import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData } from '../../scripts/validate-lib.mjs';

const DOMAINS = [{
  id: 'rag', name: '检索增强', short: 'RAG', weight: 100, target: { single: 5, multi: 4 }, chapters: ['2_5_x'],
}];
const q = (n, over = {}) => ({
  id: `rag-${String(n).padStart(3, '0')}`, domain: 'rag', type: 'single', stem: `题干${n}`,
  options: ['甲', '乙', '丙', '丁'], answer: [0], explanation: '解析', source: '2_5_x', ...over,
});
const card = (n, over = {}) => ({
  id: `rag-c${String(n).padStart(2, '0')}`, domain: 'rag', title: '标题', points: ['一', '二', '三'], source: '2_5_x', ...over,
});
function valid() {
  return {
    domains: DOMAINS,
    questions: { rag: [q(1), q(2), q(3), q(4), q(5, { type: 'multi', answer: [0, 1] }), q(6, { type: 'multi', answer: [1, 2] })] },
    cards: { rag: Array.from({ length: 10 }, (_, i) => card(i + 1)) },
  };
}
function withQuestion(over) {
  const data = valid();
  return { ...data, questions: { rag: [q(1, over)].concat(data.questions.rag.slice(1)) } };
}
function expectError(data, fragment, opts) {
  const errors = validateData(data, opts);
  assert.ok(errors.some((e) => e.includes(fragment)), `expected "${fragment}" in:\n${errors.join('\n')}`);
}

test('valid data passes strict mode', () => {
  assert.deepEqual(validateData(valid()), []);
});

test('question rules', () => {
  expectError(withQuestion({ id: 'rag-1' }), 'id 格式');
  expectError(withQuestion({ id: 'rag-002' }), 'id 重复');
  expectError(withQuestion({ domain: 'prompt' }), 'domain 应为 rag');
  expectError(withQuestion({ type: 'judge' }), 'type 必须是');
  expectError(withQuestion({ stem: ' ' }), 'stem 不能为空');
  expectError(withQuestion({ explanation: '' }), 'explanation 不能为空');
  expectError(withQuestion({ source: '9_9_不存在' }), 'source 不是已知章节');
  expectError(withQuestion({ options: ['甲', '乙'] }), 'options 数量');
  expectError(withQuestion({ options: ['甲', '甲', '丙', '丁'] }), 'options 有重复');
  expectError(withQuestion({ options: ['甲', '乙', '丙', '以上都对'] }), '以上都对');
  expectError(withQuestion({ answer: [4] }), 'answer 下标越界');
  expectError(withQuestion({ answer: ['0'] }), 'answer 必须是整数数组');
  expectError(withQuestion({ answer: [0, 1] }), '单选题必须恰好 1 个答案');
  expectError(withQuestion({ type: 'multi', answer: [1] }), '多选题至少 2 个答案');
  expectError(withQuestion({ type: 'multi', answer: [1, 1] }), 'answer 有重复下标');
});

test('multi-choice may use "all of the above"', () => {
  assert.deepEqual(validateData(withQuestion({ type: 'multi', options: ['甲', '乙', '丙', '以上都对'], answer: [0, 3] })), []);
});

test('card rules', () => {
  const data = valid();
  const bad = (over) => ({ ...data, cards: { rag: [card(1, over)].concat(data.cards.rag.slice(1)) } });
  expectError(bad({ id: 'rag-1' }), 'id 格式');
  expectError(bad({ title: '' }), 'title 不能为空');
  expectError(bad({ points: ['一', '二'] }), 'points 数量');
  expectError(bad({ source: 'x' }), 'source 不是已知章节');
});

test('count rules apply in strict mode only', () => {
  const data = valid();
  const few = { ...data, questions: { rag: data.questions.rag.slice(0, 1) }, cards: { rag: data.cards.rag.slice(0, 3) } };
  expectError(few, 'single 题数 1');
  expectError(few, 'multi 题数 0');
  expectError(few, '卡片数 3');
  assert.deepEqual(validateData(few, { allowPartial: true }), []);
});

test('domain weights must sum to 100', () => {
  expectError({ ...valid(), domains: [{ ...DOMAINS[0], weight: 90 }] }, '权重之和');
});

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

function keyLengthBank(longKeyCount) {
  const singles = Array.from({ length: 8 }, (_, i) => {
    const answer = i % 4;
    const options = ['甲甲', '乙乙', '丙丙', '丁丁'];
    if (i < longKeyCount) options[answer] = '正确答案明显更长';
    return q(i + 1, { stem: `长度${i}`, answer: [answer], options });
  });
  const multis = [q(9, { stem: 'm1', type: 'multi', answer: [0, 1] }), q(10, { stem: 'm2', type: 'multi', answer: [1, 2] })];
  return { ...valid(), questions: { rag: singles.concat(multis) } };
}

test('single-choice keys must not usually be the strictly longest option', () => {
  expectError(keyLengthBank(3), '单选题中正确答案最长的占 38%，超过 35%', { allowPartial: true });
});

test('key-length check stays quiet at or below 35% and ignores ties', () => {
  const data = keyLengthBank(2);
  data.questions.rag[2].options = ['正确答案明显更长', '乙乙', '正确答案明显更长', '丁丁'];
  const errors = validateData(data, { allowPartial: true });
  assert.ok(!errors.some((e) => e.includes('正确答案最长')), errors.join('\n'));
});

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
