import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  encryptPayload, unlockWithPassword, isEnvelope, fromBase64, MIN_PASSWORD_LENGTH, PBKDF2_ITER,
} from '../js/crypto.js';

export const IV_WEIGHTS = { A: 20, B: 18, C: 8, D: 12, E: 10, F: 8, G: 18, H: 6 };
export const REQUIRED_LETTERS = Object.keys(IV_WEIGHTS);
export const LEAK_PREFIX_CHARS = 20;
export const MIN_TERM_LENGTH = 8;
const PART_KEYS = [['结论', 'conclusion'], ['原理', 'principle'], ['我在项目里怎么做', 'practice'], ['取舍与局限', 'tradeoff']];
const FILE_RE = /^([A-H])-[\w-]+\.md$/;
const TITLE_RE = /^# ([A-H])\. (.+?)(?:（\d+ 题）)?\s*$/;
const QUESTION_RE = /^### ([A-H])(\d+)\. (.+?)\s*$/;
const LABEL_RE = /^\*\*(结论|原理|我在项目里怎么做|取舍与局限)\*\*\s*(⚠️)?\s*[：:]?\s*/;
const UL_RE = /^[-*] (.*)$/;
const OL_RE = /^\d+\. (.*)$/;
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|【待[^】]*】)/;
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2']);
const ASCII_END = /[\x21-\x7e]$/;
const ASCII_START = /^[\x21-\x7e]/;

// ---------- md 解析 ----------

export function parseInline(text) {
  return text.split(INLINE_RE).filter((s) => s !== '').map((s) => {
    if (/^\*\*[^*]+\*\*$/.test(s)) return { t: 'b', s: s.slice(2, -2) };
    if (/^`[^`]+`$/.test(s)) return { t: 'code', s: s.slice(1, -1) };
    if (/^【待[^】]*】$/.test(s)) return { t: 'todo', s };
    return { t: 'text', s };
  });
}

// 中文续行直接拼接；两侧都是 ASCII 时补一个空格，与 md 渲染一致
function joinLine(a, b) {
  return ASCII_END.test(a) && ASCII_START.test(b) ? `${a} ${b}` : a + b;
}

export function parseBlocks(lines) {
  const raw = [];
  let current = null;
  const flush = () => {
    if (current) raw.push(current);
    current = null;
  };
  lines.forEach((source) => {
    const line = source.trim();
    if (!line) {
      flush();
      return;
    }
    const ul = UL_RE.exec(line);
    const ol = ul ? null : OL_RE.exec(line);
    if (ul || ol) {
      const type = ul ? 'ul' : 'ol';
      if (!current || current.t !== type) {
        flush();
        current = { t: type, items: [] };
      }
      current.items.push((ul || ol)[1]);
      return;
    }
    if (current && current.t !== 'p') {
      const last = current.items.length - 1;
      current.items[last] = joinLine(current.items[last], line);
    } else if (current) {
      current.text = joinLine(current.text, line);
    } else {
      current = { t: 'p', text: line };
    }
  });
  flush();
  return raw.map((b) => (b.t === 'p' ? { t: 'p', c: parseInline(b.text) } : { t: b.t, items: b.items.map(parseInline) }));
}

function spansOf(blocks) {
  return [].concat(...blocks.map((b) => (b.t === 'p' ? b.c : [].concat(...b.items))));
}

function splitParts(lines, where) {
  const found = {};
  let key = null;
  lines.forEach((line) => {
    const m = LABEL_RE.exec(line.trim());
    if (m) {
      key = PART_KEYS.filter((p) => p[0] === m[1])[0][1];
      if (found[key]) throw new Error(`${where}: 「${m[1]}」出现了两次`);
      const rest = line.trim().slice(m[0].length);
      found[key] = { warn: Boolean(m[2]), lines: rest ? [rest] : [] };
      return;
    }
    if (key) found[key].lines.push(line);
  });
  const missing = PART_KEYS.filter((p) => !found[p[1]]).map((p) => p[0]);
  if (missing.length) throw new Error(`${where}: 缺少 ${missing.join('、')}`);
  const parts = {};
  PART_KEYS.forEach(([, k]) => {
    parts[k] = { warn: found[k].warn, blocks: parseBlocks(found[k].lines) };
  });
  return parts;
}

export function parseQbankFile(text, letter, fileName) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const title = TITLE_RE.exec(lines[0] || '');
  if (!title || title[1] !== letter) throw new Error(`${fileName}:1: 第一行应为「# ${letter}. 类别名」`);
  const heads = [];
  lines.forEach((line, i) => {
    const m = QUESTION_RE.exec(line);
    if (m) heads.push({ i, letter: m[1], no: Number(m[2]), title: m[3] });
  });
  if (!heads.length) throw new Error(`${fileName}: 没有找到任何「### ${letter}1. 」形式的题目`);
  heads.forEach((hd, k) => {
    if (hd.letter !== letter || hd.no !== k + 1) {
      throw new Error(`${fileName}:${hd.i + 1}: 题号应为 ${letter}${k + 1}，实际 ${hd.letter}${hd.no}`);
    }
  });
  const id = `iv-${letter.toLowerCase()}`;
  const introLines = lines.slice(1, heads[0].i).filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, ''));
  const intro = parseBlocks([].concat(...introLines.map((l) => [l, ''])));
  const cards = heads.map((hd, k) => {
    const end = k + 1 < heads.length ? heads[k + 1].i : lines.length;
    const parts = splitParts(lines.slice(hd.i + 1, end), `${fileName} ${letter}${hd.no}`);
    const hasTodo = PART_KEYS.some(([, key]) => spansOf(parts[key].blocks).some((s) => s.t === 'todo'));
    return { id: `${id}-c${String(hd.no).padStart(2, '0')}`, domain: id, no: `${letter}${hd.no}`, title: hd.title, parts, hasTodo };
  });
  return { domain: { id, letter, name: title[2].trim(), intro, weight: IV_WEIGHTS[letter] }, cards };
}

export function buildPayload(sources, builtAt) {
  const seen = new Set();
  sources.forEach((s) => {
    if (seen.has(s.letter)) throw new Error(`类别 ${s.letter} 有多个文件`);
    seen.add(s.letter);
  });
  const parsed = sources.map((s) => parseQbankFile(s.text, s.letter, s.fileName));
  const cards = {};
  const questions = {};
  parsed.forEach((p) => {
    cards[p.domain.id] = p.cards;
    questions[p.domain.id] = [];
  });
  return { version: 1, builtAt, domains: parsed.map((p) => p.domain), cards, questions };
}

// ---------- 读取源文件 ----------

export function loadSources(srcDir) {
  const dir = path.join(srcDir, 'qbank');
  if (!fs.existsSync(dir)) throw new Error(`找不到题库目录：${dir}`);
  return fs.readdirSync(dir).filter((n) => FILE_RE.test(n)).sort().map((fileName) => ({
    letter: FILE_RE.exec(fileName)[1],
    fileName,
    text: fs.readFileSync(path.join(dir, fileName), 'utf8'),
  }));
}

export function readExtraTerms(srcDir) {
  const file = path.join(srcDir, 'qbank-app', 'leak-terms.txt');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

// ---------- 防泄漏 ----------

export function leakTerms(payload, extra) {
  const derived = [];
  Object.keys(payload.cards).forEach((d) => payload.cards[d].forEach((card) => {
    derived.push(card.title);
    derived.push(spansOf(card.parts.conclusion.blocks).map((s) => s.s).join('').trim().slice(0, LEAK_PREFIX_CHARS));
  }));
  const long = derived.map((t) => t.trim()).filter((t) => t.length >= MIN_TERM_LENGTH);
  return Array.from(new Set(long.concat(extra.map((t) => t.trim()).filter(Boolean))));
}

export function findLeaks(files, terms) {
  const hits = [];
  files.forEach((f) => terms.forEach((term) => {
    if (f.text.includes(term)) hits.push({ path: f.path, term });
  }));
  return hits;
}

export function repoTextFiles(root) {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' });
  return out.split('\0').filter(Boolean)
    .filter((p) => !BINARY_EXT.has(path.extname(p).toLowerCase()))
    .filter((p) => fs.existsSync(path.join(root, p)))
    .map((p) => ({ path: p, text: fs.readFileSync(path.join(root, p), 'utf8') }));
}

export function isInside(root, target) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// ---------- 加密 ----------

export function checkPassword(password) {
  if (typeof password !== 'string' || Array.from(password).length < MIN_PASSWORD_LENGTH) {
    throw new Error(`密码至少 ${MIN_PASSWORD_LENGTH} 个字符`);
  }
}

export async function encryptInterview(payload, password, options = {}) {
  checkPassword(password);
  const reuse = !options.newSalt && isEnvelope(options.existing);
  const envelope = await encryptPayload(payload, password, {
    iter: options.iter || PBKDF2_ITER,
    salt: reuse ? fromBase64(options.existing.salt) : undefined,
  });
  const check = await unlockWithPassword(envelope, password);
  if (JSON.stringify(check.payload) !== JSON.stringify(payload)) throw new Error('加密自检失败：解密结果与原文不一致');
  return envelope;
}
