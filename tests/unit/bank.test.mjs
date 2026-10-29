import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { allocate, EXAM_SIZE } from '../../js/exam.js';

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
