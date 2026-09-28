import { loadEnvelope } from './data.js';
import { decryptWithKey, unlockWithPassword, WrongKeyError } from './crypto.js';
import { loadKey, saveKey, clearKey } from './keystore.js';
import { toBankData } from './interview.js';

export function createInterviewSession() {
  let envelope = null;
  let data = null;
  let opening = null;

  function ensureEnvelope() {
    if (envelope) return Promise.resolve(envelope);
    return loadEnvelope().then((env) => {
      envelope = env;
      return env;
    });
  }

  async function openWithStoredKey() {
    const env = await ensureEnvelope();
    const key = await loadKey();
    if (!key) return false;
    try {
      data = toBankData(await decryptWithKey(env, key));
      return true;
    } catch (err) {
      if (!(err instanceof WrongKeyError)) throw err;
      await clearKey().catch((e) => console.error('清除本机密钥失败：', e));
      return false;
    }
  }

  return {
    getData: () => data,
    tryStoredKey() {
      if (data) return Promise.resolve(true);
      if (!opening) opening = openWithStoredKey().finally(() => { opening = null; });
      return opening;
    },
    async unlock(password) {
      const env = await ensureEnvelope();
      const res = await unlockWithPassword(env, password);
      data = toBankData(res.payload);
      try {
        await saveKey(res.key);
      } catch (err) {
        console.error('保存本机密钥失败：', err);
      }
    },
    async lock() {
      data = null;
      await clearKey();
    },
  };
}
