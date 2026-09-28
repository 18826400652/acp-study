import { emptyProgress, validateImport } from './progress.js';

export const STORAGE_KEY = 'acp-progress-v1';
export const CORRUPT_KEY = 'acp-progress-v1-corrupt';
export const STORAGE_UNAVAILABLE = '无法访问本地存储（可能是隐私模式），本次进度不会保存';

export function createStore(storage, options = {}) {
  const key = options.key || STORAGE_KEY;
  const corruptKey = `${key}-corrupt`;
  const empty = options.empty || emptyProgress;
  const validate = options.validate || validateImport;

  function backupAndReset(raw, reason) {
    try {
      storage.setItem(corruptKey, raw);
    } catch (err) {
      console.error('备份损坏的进度失败：', err);
    }
    return { progress: empty(), ok: true, error: `本地进度已损坏（${reason}），已备份并重置` };
  }

  function load() {
    let raw;
    try {
      raw = storage.getItem(key);
    } catch (err) {
      console.error('读取本地存储失败：', err);
      return { progress: empty(), ok: false, error: STORAGE_UNAVAILABLE };
    }
    if (raw === null) return { progress: empty(), ok: true };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return backupAndReset(raw, 'JSON 解析失败');
    }
    const res = validate(parsed);
    return res.ok ? { progress: res.value, ok: true } : backupAndReset(raw, res.error);
  }

  function save(progress) {
    try {
      storage.setItem(key, JSON.stringify(progress));
      return true;
    } catch (err) {
      console.error('写入本地存储失败：', err);
      return false;
    }
  }

  return { load, save };
}

export function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
