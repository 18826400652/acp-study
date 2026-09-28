import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isInside } from './interview-lib.mjs';
import { unlockWithPassword } from '../js/crypto.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const outDir = process.argv[2];
  const password = process.env.INTERVIEW_PASSWORD;
  const enc = process.env.INTERVIEW_ENC || path.join(ROOT, 'data', 'interview.enc');
  if (!outDir) throw new Error('用法：npm run decrypt:interview -- <仓库外的输出目录>');
  if (isInside(ROOT, outDir)) throw new Error('输出目录必须在仓库之外，避免明文被提交');
  if (!password) throw new Error('请设置环境变量 INTERVIEW_PASSWORD');
  if (!fs.existsSync(enc)) throw new Error(`找不到密文文件：${enc}`);
  const { payload } = await unlockWithPassword(JSON.parse(fs.readFileSync(enc, 'utf8')), password);
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 'interview-payload.json');
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  process.stdout.write(`已解密到 ${file}\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
