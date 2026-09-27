import fs from 'node:fs/promises';

const file = process.argv[2];
if (!file) {
  console.error('用法：node scripts/nb-text.mjs <notebook.ipynb>');
  process.exit(1);
}
const nb = JSON.parse(await fs.readFile(file, 'utf8'));
const out = nb.cells.map((cell) => {
  const text = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
  return cell.cell_type === 'code' ? '```python\n' + text + '\n```' : text;
});
process.stdout.write(out.join('\n\n') + '\n');
