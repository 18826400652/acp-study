import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateData } from './validate-lib.mjs';

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

async function readJson(rel) {
  const text = await fs.readFile(path.join(DATA, rel), 'utf8');
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${rel}: JSON 解析失败 - ${err.message}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const domainFlag = argv.indexOf('--domain');
  const strictDomain = domainFlag !== -1 ? argv[domainFlag + 1] : null;
  const allowPartial = argv.includes('--allow-partial');
  const domains = await readJson('domains.json');
  if (domainFlag !== -1 && !domains.some((d) => d.id === strictDomain)) {
    console.error(`未知考点：${strictDomain}（可选：${domains.map((d) => d.id).join('、')}）`);
    process.exit(1);
  }
  const cards = {};
  const questions = {};
  for (const d of domains) {
    cards[d.id] = await readJson(`cards/${d.id}.json`);
    questions[d.id] = await readJson(`questions/${d.id}.json`);
  }
  const options = strictDomain ? { strictDomains: [strictDomain] } : { allowPartial };
  const errors = validateData({ domains, cards, questions }, options);
  if (errors.length) {
    console.error(`题库校验失败，共 ${errors.length} 个问题：`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  const count = (m) => Object.values(m).reduce((n, list) => n + list.length, 0);
  const mode = strictDomain ? `（严格检查 ${strictDomain}，其余考点未检查题量）` : allowPartial ? '（部分题库模式：未检查题量）' : '';
  process.stdout.write(`题库校验通过：${count(questions)} 道题，${count(cards)} 张卡片${mode}\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
