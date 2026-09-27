import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSafe, mimeFor } from './serve-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5173;
const BASE = '/acp-study';

const server = http.createServer(async (req, res) => {
  if (req.url === '/' || req.url === BASE) {
    res.writeHead(302, { Location: BASE + '/' });
    res.end();
    return;
  }
  const file = resolveSafe(ROOT, req.url, BASE);
  if (!file) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mimeFor(file), 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch (err) {
    const missing = err.code === 'ENOENT' || err.code === 'EISDIR';
    if (!missing) console.error(`读取 ${file} 失败：`, err);
    res.writeHead(missing ? 404 : 500);
    res.end(missing ? 'Not found' : 'Server error');
  }
});

server.listen(PORT, () => {
  process.stdout.write(`Serving ${ROOT} at http://localhost:${PORT}${BASE}/\n`);
});
