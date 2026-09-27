import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData } from '../../scripts/validate-lib.mjs';

const DOMAINS = [{
  id: 'rag', name: '检索增强', short: 'RAG', weight: 100, target: { single: 5, multi: 4 }, chapters: ['2_5_x'],
}];
const q = (n, over = {}) => ({
  id: `rag-${String(n).padStart(3, '0')}`, domain: 'rag', type: 'single', stem: '题干',
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
