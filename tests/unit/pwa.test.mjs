import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isWeChat } from '../../js/pwa.js';

test('isWeChat detects the WeChat in-app browser', () => {
  assert.equal(isWeChat('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 MicroMessenger/8.0.40'), true);
  assert.equal(isWeChat('Mozilla/5.0 (Linux; Android 13) Chrome/120.0 Mobile Safari/537.36'), false);
  assert.equal(isWeChat(undefined), false);
});
