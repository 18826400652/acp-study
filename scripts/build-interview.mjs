import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadSources, buildPayload, leakTerms, leakTermStats, readExtraTerms, findLeaks, repoTextFiles, encryptInterview,
  REQUIRED_LETTERS, loadQuestions, validateInterviewQuestions, IV_MCQ_TARGETS,
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
  const iter = iterations();
  const isDefaultOut = !process.env.INTERVIEW_ENC;
  if (iter < PBKDF2_ITER && isDefaultOut) {
    throw new Error('测试用的迭代次数不能写入正式密文');
  }
  const sources = loadSources(src);
  const letters = sources.map((s) => s.letter);
  const missing = REQUIRED_LETTERS.filter((l) => letters.indexOf(l) === -1);
  if (missing.length) throw new Error(`缺少类别文件：${missing.join('、')}`);
  const questions = loadQuestions(src);
  const payload = buildPayload(sources, new Date().toISOString(), questions);
  const extraTerms = readExtraTerms(src);
  const leaks = findLeaks(repoTextFiles(ROOT), leakTerms(payload, extraTerms));
  if (leaks.length) {
    const lines = leaks.map((l) => `  - ${l.path}：「${l.term}」`).join('\n');
    throw new Error(`仓库里发现面试题库原文，已停止构建：\n${lines}`);
  }
  // 默认严格模式：对每个目标题量 > 0 的类别（A–F）都做题量检查，缺题/改名的文件会让构建失败；
  // --allow-partial 恢复成只检查已经有题目的类别
  const allowPartial = process.argv.includes('--allow-partial');
  const strictDomains = allowPartial ? undefined : payload.domains
    .filter((d) => {
      const target = IV_MCQ_TARGETS[d.letter] || { single: 0, multi: 0 };
      return target.single > 0 || target.multi > 0;
    })
    .map((d) => d.id);
  const questionErrors = validateInterviewQuestions(payload, questions, { strictDomains });
  if (questionErrors.length) {
    throw new Error(`选择题校验失败，共 ${questionErrors.length} 个问题：\n${questionErrors.map((e) => `  - ${e}`).join('\n')}`);
  }
  const existing = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
  const envelope = await encryptInterview(payload, password, {
    existing, newSalt: process.argv.includes('--new-salt'), iter,
  });
  const text = `${JSON.stringify(envelope)}\n`;
  fs.writeFileSync(out, text);
  const cards = [].concat(...payload.domains.map((d) => payload.cards[d.id]));
  const todo = cards.filter((c) => c.hasTodo).length;
  const nq = [].concat(...payload.domains.map((d) => payload.questions[d.id])).length;
  process.stdout.write(`已生成 ${path.relative(ROOT, out) || out}：${payload.domains.length} 个类别，${cards.length} 张卡片（${todo} 张含待补），${nq} 道选择题，密文 ${(text.length / 1024).toFixed(1)} KB\n`);
  const stats = leakTermStats(payload, extraTerms);
  process.stdout.write(`防泄漏扫描：检查了 ${stats.checked}/${stats.total} 个题目衍生词条（跳过 ${stats.skipped} 个过短或偏英文的），另加 ${stats.extra} 个 leak-terms.txt 自定义词条\n`);
  payload.domains.forEach((d) => {
    const qs = payload.questions[d.id];
    const count = (type) => qs.filter((q) => q.type === type).length;
    process.stdout.write(`${d.id} 单选 ${count('single')} / 多选 ${count('multi')}\n`);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
