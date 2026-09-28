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
