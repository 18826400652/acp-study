import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptPayload, unlockWithPassword, decryptWithKey, deriveKey, isEnvelope, isCryptoSupported,
  toBase64, fromBase64, WrongKeyError, PBKDF2_ITER, MAX_ITER, ENVELOPE_VERSION, KDF_NAME,
} from '../../js/crypto.js';

const FAST = { iter: 1000 };
const PASSWORD = 'correct horse battery';
const PAYLOAD = { version: 1, text: '中文内容 🙂', list: [1, 2, 3] };

test('round-trips a payload with the right password', async () => {
  const env = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  assert.equal(isEnvelope(env), true);
  assert.equal(env.v, ENVELOPE_VERSION);
  assert.equal(env.kdf, KDF_NAME);
  assert.equal(env.iter, 1000);
  assert.deepEqual((await unlockWithPassword(env, PASSWORD)).payload, PAYLOAD);
});

test('a wrong password raises WrongKeyError', async () => {
  const env = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  await assert.rejects(unlockWithPassword(env, 'not the password'), WrongKeyError);
});

test('tampered ciphertext raises WrongKeyError', async () => {
  const env = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  const bytes = fromBase64(env.ct);
  bytes[0] ^= 0xff;
  await assert.rejects(unlockWithPassword({ ...env, ct: toBase64(bytes) }, PASSWORD), WrongKeyError);
});

test('reusing the salt keeps a stored key valid across rebuilds', async () => {
  const first = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  const { key } = await unlockWithPassword(first, PASSWORD);
  const second = await encryptPayload({ ...PAYLOAD, rebuilt: true }, PASSWORD, { ...FAST, salt: fromBase64(first.salt) });
  assert.equal(second.salt, first.salt);
  assert.notEqual(second.iv, first.iv);
  assert.equal((await decryptWithKey(second, key)).rebuilt, true);
});

test('a new salt invalidates a stored key', async () => {
  const first = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  const { key } = await unlockWithPassword(first, PASSWORD);
  const second = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  assert.notEqual(second.salt, first.salt);
  await assert.rejects(decryptWithKey(second, key), WrongKeyError);
});

test('defaults to 600000 iterations, a 16-byte salt and a 12-byte iv', async () => {
  const env = await encryptPayload(PAYLOAD, PASSWORD);
  assert.equal(env.iter, PBKDF2_ITER);
  assert.equal(fromBase64(env.salt).length, 16);
  assert.equal(fromBase64(env.iv).length, 12);
});

test('non-ASCII passwords work', async () => {
  const env = await encryptPayload(PAYLOAD, '密码密码密码密码密码密码', FAST);
  assert.deepEqual((await unlockWithPassword(env, '密码密码密码密码密码密码')).payload, PAYLOAD);
});

test('isEnvelope rejects malformed input', async () => {
  const good = await encryptPayload(PAYLOAD, PASSWORD, FAST);
  const bad = [
    null, 'x', {}, { ...good, v: 2 }, { ...good, kdf: 'scrypt' }, { ...good, iter: 0 }, { ...good, iter: 1.5 },
    { ...good, ct: '' }, { ...good, salt: 1 }, { ...good, iter: MAX_ITER + 1 },
  ];
  bad.forEach((v) => assert.equal(isEnvelope(v), false, JSON.stringify(v)));
  assert.equal(isEnvelope({ ...good, iter: MAX_ITER }), true);
});

test('malformed envelopes fail with a clear message', async () => {
  await assert.rejects(unlockWithPassword({ v: 1 }, PASSWORD), /密文格式不正确/);
  const key = await deriveKey(PASSWORD, new Uint8Array(16), 1000);
  await assert.rejects(decryptWithKey({ v: 1 }, key), /密文格式不正确/);
});

test('base64 helpers round-trip every byte value', () => {
  const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
  assert.deepEqual(fromBase64(toBase64(bytes)), bytes);
});

test('derived keys are not extractable', async () => {
  const key = await deriveKey(PASSWORD, new Uint8Array(16), 1000);
  assert.equal(key.extractable, false);
});

test('Node provides every API the module needs', () => {
  assert.equal(isCryptoSupported(), true);
});

test('isCryptoSupported swallows errors and returns false instead of throwing', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    get() { throw new Error('access to crypto blocked'); },
  });
  try {
    assert.doesNotThrow(() => isCryptoSupported());
    assert.equal(isCryptoSupported(), false);
  } finally {
    Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});
