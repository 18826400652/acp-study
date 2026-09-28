import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadSources, buildPayload, leakTerms, readExtraTerms, findLeaks, repoTextFiles, encryptInterview, REQUIRED_LETTERS,
} from './interview-lib.mjs';
import { PBKDF2_ITER } from '../js/crypto.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function iterations() {
  const requested = Number(process.env.INTERVIEW_ITER);
  return process.env.INTERVIEW_TEST === '1' && requested > 0 ? requested : PBKDF2_ITER;
}

async function main() {
  const src = process.env.INTERVIEW_SRC;
  const password = process.env.INTERVIEW_PASSWORD;
  const out = process.env.INTERVIEW_ENC || path.join(ROOT, 'data', 'interview.enc');
  if (!src) throw new Error('请设置环境变量 INTERVIEW_SRC（面试准备目录，里面有 qbank/）');
  if (!password) throw new Error('请设置环境变量 INTERVIEW_PASSWORD');
  const sources = loadSources(src);
  const letters = sources.map((s) => s.letter);
  const missing = REQUIRED_LETTERS.filter((l) => letters.indexOf(l) === -1);
  if (missing.length) throw new Error(`缺少类别文件：${missing.join('、')}`);
  const payload = buildPayload(sources, new Date().toISOString());
  const leaks = findLeaks(repoTextFiles(ROOT), leakTerms(payload, readExtraTerms(src)));
  if (leaks.length) {
    const lines = leaks.map((l) => `  - ${l.path}：「${l.term}」`).join('\n');
    throw new Error(`仓库里发现面试题库原文，已停止构建：\n${lines}`);
  }
  const existing = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const envelope = await encryptInterview(payload, password, {
    existing, newSalt: process.argv.includes('--new-salt'), iter: iterations(),
  });
  const text = `${JSON.stringify(envelope)}\n`;
  fs.writeFileSync(out, text);
  const cards = [].concat(...payload.domains.map((d) => payload.cards[d.id]));
  const todo = cards.filter((c) => c.hasTodo).length;
  process.stdout.write(`已生成 ${path.relative(ROOT, out) || out}：${payload.domains.length} 个类别，${cards.length} 张卡片（${todo} 张含待补），密文 ${(text.length / 1024).toFixed(1)} KB\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
