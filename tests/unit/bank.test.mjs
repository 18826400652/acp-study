import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { allocate, EXAM_SIZE } from '../../js/exam.js';
import { buildExam } from '../../js/exam.js';
import { seededRng } from './helpers.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
// 每个考点的模拟题量至少是两套模考的抽题数（2 倍），保证连续两场不重复
const VARIETY_FACTOR = 2;

test('every domain has enough mock questions for two full papers', () => {
  const domains = read('data/domains.json');
  const weights = domains.map((d) => d.weight);
  ['single', 'multi'].forEach((type) => {
    const need = allocate(weights, EXAM_SIZE[type]);
    domains.forEach((d, i) => {
      const have = read(`data/mock/${d.id}.json`).filter((q) => q.type === type).length;
      assert.ok(have >= need[i] * VARIETY_FACTOR, `${d.id} ${type}: ${have} < ${need[i] * VARIETY_FACTOR}`);
    });
  });
});

test('V4 batch four supplies six paper quotas and retains the previous 375 ids', () => {
  const domains = read('data/domains.json');
  const weights = domains.map((d) => d.weight);
  const counts = { single: allocate(weights, 50), multi: allocate(weights, 25) };
  const legacySizes = { 'app-dev': 65, prompt: 55, rag: 75, finetune: 60, 'agent-mm': 60, production: 60 };
  const pool = domains.flatMap((d, i) => {
    const bank = read(`data/mock/${d.id}.json`);
    for (const type of ['single', 'multi']) {
      assert.equal(bank.filter((q) => q.type === type).length, counts[type][i] * 6, `${d.id} ${type}`);
    }
    const ids = new Set(bank.map((q) => q.id));
    for (let n = 1; n <= legacySizes[d.id]; n += 1) assert.ok(ids.has(`${d.id}-m${String(n).padStart(3, '0')}`));
    return bank;
  });
  assert.equal(pool.length, 450);
  const first = buildExam(domains, pool, seededRng(231));
  const second = buildExam(domains, pool, seededRng(232), { excludeIds: first.questionIds });
  assert.equal(first.questionIds.length, 75);
  assert.equal(second.questionIds.length, 75);
  assert.equal(second.reusedCount, 0);
  assert.deepEqual(second.questionIds.filter((id) => first.questionIds.includes(id)), []);
  assert.ok(first.questionIds.some((id) => Number(id.slice(-3)) > legacySizes[id.replace(/-m\d{3}$/, '')]));
});
