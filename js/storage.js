import { emptyProgress, validateImport } from './progress.js';

export const STORAGE_KEY = 'acp-progress-v1';
export const CORRUPT_KEY = 'acp-progress-v1-corrupt';
export const STORAGE_UNAVAILABLE = '无法访问本地存储（可能是隐私模式），本次进度不会保存';

export function createStore(storage) {
  function backupAndReset(raw, reason) {
    try {
      storage.setItem(CORRUPT_KEY, raw);
    } catch (err) {
      console.error('备份损坏的进度失败：', err);
    }
    return { progress: emptyProgress(), ok: true, error: `本地进度已损坏（${reason}），已备份并重置` };
  }

  function load() {
    let raw;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      return { progress: emptyProgress(), ok: false, error: STORAGE_UNAVAILABLE };
    }
    if (raw === null) return { progress: emptyProgress(), ok: true };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return backupAndReset(raw, 'JSON 解析失败');
    }
    const res = validateImport(parsed);
    return res.ok ? { progress: res.value, ok: true } : backupAndReset(raw, res.error);
  }

  function save(progress) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch {
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
