// 把解密密钥（不可导出的 CryptoKey）存进 IndexedDB，下次打开免输密码
const DB_NAME = 'acp-keys';
const STORE = 'keys';
const KEY_ID = 'interview';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, action) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = tx.onerror;
  }));
}

export function saveKey(key) {
  return run('readwrite', (store) => store.put(key, KEY_ID));
}

export function loadKey() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return run('readonly', (store) => store.get(KEY_ID))
    .then((key) => key || null)
    .catch((err) => {
      console.error('读取本机密钥失败：', err);
      return null;
    });
}

export function clearKey() {
  if (typeof indexedDB === 'undefined') return Promise.resolve();
  return run('readwrite', (store) => store.delete(KEY_ID));
}
