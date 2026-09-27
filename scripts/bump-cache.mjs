import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bumpCacheVersion } from './release-lib.mjs';

const SW = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'sw.js');

try {
  const { text, version } = bumpCacheVersion(await fs.readFile(SW, 'utf8'));
  await fs.writeFile(SW, text, 'utf8');
  process.stdout.write(`CACHE_VERSION 已更新为 ${version}\n`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
