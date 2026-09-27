import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHIPPED = ['index.html', 'manifest.json', 'sw.js', 'css', 'js', 'data', 'icons'];
const BUDGET_KB = { total: 500, code: 150 };

function walk(p) {
  return fs.statSync(p).isFile() ? [p] : fs.readdirSync(p).flatMap((name) => walk(path.join(p, name)));
}

const files = SHIPPED.flatMap((p) => walk(path.join(ROOT, p)));
const kb = (list) => list.reduce((n, f) => n + fs.statSync(f).size, 0) / 1024;
const total = kb(files);
const code = kb(files.filter((f) => /[\\/](js|css)[\\/]/.test(f)));

process.stdout.write(`站点总体积 ${total.toFixed(1)} KB（预算 ${BUDGET_KB.total}）；JS+CSS ${code.toFixed(1)} KB（预算 ${BUDGET_KB.code}）\n`);
if (total > BUDGET_KB.total || code > BUDGET_KB.code) {
  console.error('超出体积预算');
  process.exit(1);
}
