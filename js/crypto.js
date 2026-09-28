// 浏览器与 Node 通用：只依赖 Web Crypto、CompressionStream、Blob/Response 和 btoa/atob
export const ENVELOPE_VERSION = 1;
export const KDF_NAME = 'PBKDF2-SHA256';
export const PBKDF2_ITER = 600000;
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_ITER = 10000000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const ENVELOPE_FIELDS = ['salt', 'iv', 'ct'];

const subtle = () => globalThis.crypto.subtle;

export class WrongKeyError extends Error {
  constructor() {
    super('密码不对');
    this.name = 'WrongKeyError';
  }
}

export function isCryptoSupported() {
  try {
    return Boolean(globalThis.crypto && globalThis.crypto.subtle
      && typeof globalThis.CompressionStream === 'function'
      && typeof globalThis.DecompressionStream === 'function');
  } catch {
    return false;
  }
}

export function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromBase64(text) {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

const gzip = (bytes) => pipe(bytes, new CompressionStream('gzip'));
const gunzip = (bytes) => pipe(bytes, new DecompressionStream('gzip'));
const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

export async function deriveKey(password, salt, iter) {
  const base = await subtle().importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function isEnvelope(v) {
  return v !== null && typeof v === 'object' && v.v === ENVELOPE_VERSION && v.kdf === KDF_NAME
    && Number.isInteger(v.iter) && v.iter > 0 && v.iter <= MAX_ITER
    && ENVELOPE_FIELDS.every((k) => typeof v[k] === 'string' && v[k].length > 0);
}

export async function encryptPayload(payload, password, options = {}) {
  const iter = options.iter || PBKDF2_ITER;
  const salt = options.salt || randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveKey(password, salt, iter);
  const plain = await gzip(new TextEncoder().encode(JSON.stringify(payload)));
  const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, plain));
  return { v: ENVELOPE_VERSION, kdf: KDF_NAME, iter, salt: toBase64(salt), iv: toBase64(iv), ct: toBase64(ct) };
}

export async function decryptWithKey(envelope, key) {
  if (!isEnvelope(envelope)) throw new Error('密文格式不正确');
  let plain;
  try {
    plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.iv) }, key, fromBase64(envelope.ct));
  } catch {
    throw new WrongKeyError();
  }
  return JSON.parse(new TextDecoder().decode(await gunzip(new Uint8Array(plain))));
}

export async function unlockWithPassword(envelope, password) {
  if (!isEnvelope(envelope)) throw new Error('密文格式不正确');
  const key = await deriveKey(password, fromBase64(envelope.salt), envelope.iter);
  return { key, payload: await decryptWithKey(envelope, key) };
}
