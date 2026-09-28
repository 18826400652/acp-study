import { loadSources, loadQuestions, buildPayload, validateInterviewQuestions } from './interview-lib.mjs';

// 用法：INTERVIEW_SRC=<prep 目录> npm run validate:interview [-- --domains iv-a,iv-b | --domains=iv-a,iv-b | --allow-partial]
function domainsValue(argv) {
  const eq = argv.find((a) => a.startsWith('--domains='));
  if (eq !== undefined) return eq.slice('--domains='.length);
  const flag = argv.indexOf('--domains');
  return flag === -1 ? undefined : argv[flag + 1];
}

function strictFrom(argv, payload) {
  const hasDomains = argv.includes('--domains') || argv.some((a) => a.startsWith('--domains='));
  const hasAllowPartial = argv.includes('--allow-partial');
  if (hasAllowPartial && hasDomains) throw new Error('--allow-partial 和 --domains 不能同时使用');
  if (hasAllowPartial) return [];
  if (!hasDomains) return undefined;
  const ids = String(domainsValue(argv) || '').split(',').filter(Boolean);
  if (!ids.length) throw new Error('--domains 需要类别列表，例如 --domains iv-a,iv-b');
  const known = payload.domains.map((d) => d.id);
  const unknown = ids.filter((id) => known.indexOf(id) === -1);
  if (unknown.length) throw new Error(`未知类别：${unknown.join('、')}（可选：${known.join('、')}）`);
  return ids;
}

function main() {
  const src = process.env.INTERVIEW_SRC;
  if (!src) throw new Error('请设置环境变量 INTERVIEW_SRC（面试准备目录）');
  const questions = loadQuestions(src);
  const payload = buildPayload(loadSources(src), 'validate', questions);
  const errors = validateInterviewQuestions(payload, questions, { strictDomains: strictFrom(process.argv.slice(2), payload) });
  if (errors.length) {
    console.error(`选择题校验失败，共 ${errors.length} 个问题：`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  payload.domains.forEach((d) => {
    const qs = payload.questions[d.id];
    const count = (type) => qs.filter((q) => q.type === type).length;
    process.stdout.write(`${d.id} 单选 ${count('single')} / 多选 ${count('multi')}\n`);
  });
  process.stdout.write('选择题校验通过\n');
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
