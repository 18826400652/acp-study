import { loadSources, loadQuestions, buildPayload, validateInterviewQuestions } from './interview-lib.mjs';

// 用法：INTERVIEW_SRC=<prep 目录> npm run validate:interview [-- --domains iv-a,iv-b | --allow-partial]
function strictFrom(argv, payload) {
  if (argv.includes('--allow-partial')) return [];
  const flag = argv.indexOf('--domains');
  if (flag === -1) return undefined;
  const ids = String(argv[flag + 1] || '').split(',').filter(Boolean);
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
