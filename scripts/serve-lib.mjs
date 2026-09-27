import path from 'node:path';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

export function resolveSafe(root, url, base) {
  const pathname = url.split('?')[0];
  if (!pathname.startsWith(base + '/')) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(pathname.slice(base.length));
  } catch {
    return null;
  }
  const segments = decoded.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) return null;
  const rel = decoded.endsWith('/') ? decoded + 'index.html' : decoded;
  const rootResolved = path.resolve(root);
  const full = path.resolve(rootResolved, '.' + rel);
  if (full !== rootResolved && !full.startsWith(rootResolved + path.sep)) return null;
  return full;
}

export function mimeFor(file) {
  return MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
