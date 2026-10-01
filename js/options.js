import { shuffle } from './exam.js';

const LETTERS = 'ABCDEF';
// 单独出现的选项字母：前后不能紧挨英文、数字或 _-/.，避免误伤 RAG、A/B 测试、v1.A 之类
const LETTER_RE = /(?<![A-Za-z0-9_\-/.])[A-F](?![A-Za-z0-9_\-/.])/g;
// 字母本身是内容（如 LoRA 的矩阵 A、B）的题不打乱，否则改写解析会改坏原意
const FORMULA_RE = /[A-F]\s*[×=]|[×=]\s*[A-F]/;

const hasLetter = (text) => new RegExp(LETTER_RE.source).test(text);

export function canShuffleOptions(q) {
  if (hasLetter(q.stem) || q.options.some(hasLetter)) return false;
  return !FORMULA_RE.test(q.explanation);
}

export function relabel(text, order) {
  return text.replace(LETTER_RE, (letter) => {
    const pos = order.indexOf(LETTERS.indexOf(letter));
    return pos === -1 ? letter : LETTERS[pos];
  });
}

// 返回打乱选项后的新题目：order[k] 是第 k 个显示位置对应的原选项序号，
// 答案和解析里的字母都换算成新位置
export function shuffleOptions(q, rng = Math.random) {
  const identity = q.options.map((_, i) => i);
  if (!canShuffleOptions(q)) return { ...q, order: identity };
  const order = shuffle(identity, rng);
  return {
    ...q,
    order,
    options: order.map((i) => q.options[i]),
    answer: q.answer.map((i) => order.indexOf(i)).sort((a, b) => a - b),
    explanation: relabel(q.explanation, order),
  };
}
