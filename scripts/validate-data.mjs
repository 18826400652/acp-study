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
  const allowPartial = process.argv.includes('--allow-partial');
  const domains = await readJson('domains.json');
  const cards = {};
  const questions = {};
  for (const d of domains) {
    cards[d.id] = await readJson(`cards/${d.id}.json`);
    questions[d.id] = await readJson(`questions/${d.id}.json`);
  }
  const errors = validateData({ domains, cards, questions }, { allowPartial });
  if (errors.length) {
    console.error(`题库校验失败，共 ${errors.length} 个问题：`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  const count = (m) => Object.values(m).reduce((n, list) => n + list.length, 0);
  const mode = allowPartial ? '（部分题库模式：未检查题量）' : '';
  process.stdout.write(`题库校验通过：${count(questions)} 道题，${count(cards)} 张卡片${mode}\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
