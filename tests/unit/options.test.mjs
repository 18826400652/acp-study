import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffleOptions, relabel, canShuffleOptions } from '../../js/options.js';
import { isCorrect } from '../../js/scoring.js';
import { seededRng } from './helpers.mjs';

const Q = {
  id: 'rag-001',
  domain: 'rag',
  type: 'multi',
  stem: '下列说法正确的是？',
  options: ['甲', '乙', '丙', '丁'],
  answer: [0, 2],
  explanation: '课程指出甲（A）和丙（C）正确。B 错：乙不对。D 错：丁不对。RAG 与 A/B 测试不受影响。',
};

test('shuffleOptions keeps each option paired with its correctness', () => {
  for (let seed = 1; seed < 30; seed += 1) {
    const view = shuffleOptions(Q, seededRng(seed));
    assert.deepEqual([...view.options].sort(), [...Q.options].sort());
    assert.deepEqual(view.answer.map((i) => view.options[i]).sort(), ['丙', '甲']);
    assert.deepEqual(view.order.map((i) => Q.options[i]), view.options);
    assert.equal(isCorrect(view, view.answer), true);
  }
});

test('shuffleOptions actually changes the order for some seeds', () => {
  const orders = new Set(Array.from({ length: 20 }, (_, s) => shuffleOptions(Q, seededRng(s + 1)).order.join()));
  assert.ok(orders.size > 1);
});

test('shuffleOptions rewrites letters in the explanation and leaves the input alone', () => {
  const before = JSON.stringify(Q);
  const view = shuffleOptions(Q, () => 0);
  // rng 恒为 0 时 order = [1,2,3,0]：原 A→D，B→A，C→B，D→C
  assert.deepEqual(view.order, [1, 2, 3, 0]);
  assert.deepEqual(view.answer, [1, 3]);
  assert.equal(view.explanation, '课程指出甲（D）和丙（B）正确。A 错：乙不对。C 错：丁不对。RAG 与 A/B 测试不受影响。');
  assert.equal(JSON.stringify(Q), before);
});

test('relabel ignores letters beyond the option count and letters inside words', () => {
  assert.equal(relabel('E 也错，A 对，AB 和 B2 不变', [1, 0, 2, 3]), 'E 也错，B 对，AB 和 B2 不变');
});

test('questions whose letters are content keep their original order', () => {
  const matrix = { ...Q, options: ['只训练矩阵 A 和 B', '乙', '丙', '丁'] };
  const formula = { ...Q, explanation: 'W = A×B，故 A 正确。' };
  const stem = { ...Q, stem: '方案 A 与方案 B 相比？' };
  [matrix, formula, stem].forEach((q) => {
    assert.equal(canShuffleOptions(q), false);
    const view = shuffleOptions(q, () => 0);
    assert.deepEqual(view.order, [0, 1, 2, 3]);
    assert.deepEqual(view.options, q.options);
    assert.equal(view.explanation, q.explanation);
  });
  assert.equal(canShuffleOptions(Q), true);
});

test('every ACP question survives shuffling; only letter-as-content questions stay fixed', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.resolve(import.meta.dirname, '..', '..', 'data', 'questions');
  const bank = [].concat(...fs.readdirSync(dir).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))));
  bank.forEach((q, n) => {
    const view = shuffleOptions(q, seededRng(n + 1));
    assert.equal(isCorrect(view, view.answer), true, q.id);
    assert.deepEqual(view.answer.map((i) => view.order[i]).sort((a, b) => a - b), q.answer, q.id);
  });
  assert.deepEqual(bank.filter((q) => !canShuffleOptions(q)).map((q) => q.id).sort(), ['app-dev-010', 'app-dev-042', 'finetune-005']);
});
