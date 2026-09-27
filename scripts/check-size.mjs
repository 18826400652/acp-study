import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHIPPED = ['index.html', 'manifest.json', 'sw.js', 'css', 'js', 'data', 'icons'];
const BUDGET_KB = { transfer: 500, code: 150 };

function walk(p) {
  return fs.statSync(p).isFile() ? [p] : fs.readdirSync(p).flatMap((name) => walk(path.join(p, name)));
}

const files = SHIPPED.flatMap((p) => walk(path.join(ROOT, p)));
const rawKb = (list) => list.reduce((n, f) => n + fs.statSync(f).size, 0) / 1024;
const gzipKb = (list) => list.reduce((n, f) => n + zlib.gzipSync(fs.readFileSync(f)).length, 0) / 1024;
const transfer = gzipKb(files);
const code = rawKb(files.filter((f) => /[\\/](js|css)[\\/]/.test(f)));

process.stdout.write(`站点传输体积（gzip）${transfer.toFixed(1)} KB（预算 ${BUDGET_KB.transfer}）；未压缩 JS+CSS ${code.toFixed(1)} KB（预算 ${BUDGET_KB.code}）；未压缩总计 ${rawKb(files).toFixed(1)} KB\n`);
if (transfer > BUDGET_KB.transfer || code > BUDGET_KB.code) {
  console.error('超出体积预算');
  process.exit(1);
}
