import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ICONS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const VARIANTS = [
  { src: 'icon.svg', out: 'icon-192.png', size: 192 },
  { src: 'icon.svg', out: 'icon-512.png', size: 512 },
  { src: 'icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const v of VARIANTS) {
    const svg = await fs.readFile(path.join(ICONS, v.src), 'utf8');
    await page.setViewportSize({ width: v.size, height: v.size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${v.size}" height="${v.size}" `)}</body></html>`);
    await page.screenshot({ path: path.join(ICONS, v.out), omitBackground: true });
    process.stdout.write(`生成 ${v.out}\n`);
  }
} finally {
  await browser.close();
}
