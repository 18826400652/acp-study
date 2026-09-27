const DECLARATION = /const CACHE_VERSION = 'acp-v(\d+)';/;

export function bumpCacheVersion(text) {
  const match = DECLARATION.exec(text);
  if (!match) throw new Error('sw.js 中找不到 CACHE_VERSION 声明');
  const version = `acp-v${Number(match[1]) + 1}`;
  return { text: text.replace(DECLARATION, `const CACHE_VERSION = '${version}';`), version };
}
