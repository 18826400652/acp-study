import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flowLabel } from '../../js/views/flow.js';

test('flowLabel reads lanes in order for screen readers', () => {
  assert.equal(flowLabel([['文档', '切片'], ['问题', '检索', '生成']]), '文档→切片；问题→检索→生成');
  assert.equal(flowLabel([['甲', '乙']]), '甲→乙');
});
