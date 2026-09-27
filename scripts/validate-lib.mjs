export const COUNT_TOLERANCE = 3;
export const OPTION_RANGE = { min: 3, max: 6 };
export const POINT_RANGE = { min: 3, max: 5 };
export const CARD_RANGE = { min: 10, max: 15 };
export const BALANCE_MIN = { single: 8, multi: 6 };
export const SINGLE_LETTER_MAX_SHARE = 0.4;
export const MULTI_POSITION_MAX_SHARE = 0.75;
const LETTERS = 'ABCDEF';
const pct = (x) => Math.round(x * 100);
const ALL_CORRECT_RE = /以上(都|均|全部|皆)?(对|正确|是)/;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
const inRange = (n, r) => n >= r.min && n <= r.max;

function reporter(where, errs) {
  return (msg) => errs.push(`${where}: ${msg}`);
}

function checkId(id, re, seen, add) {
  if (typeof id !== 'string' || !re.test(id)) add(`id 格式应匹配 ${re}`);
  else if (seen.has(id)) add('id 重复');
  seen.add(id);
}

function checkOptions(q, add) {
  const opts = q.options;
  if (!Array.isArray(opts) || !inRange(opts.length, OPTION_RANGE)) {
    add(`options 数量必须在 ${OPTION_RANGE.min}–${OPTION_RANGE.max} 之间`);
    return;
  }
  if (!opts.every(nonEmpty)) add('options 不能有空选项');
  if (new Set(opts).size !== opts.length) add('options 有重复');
  if (q.type === 'single' && opts.some((o) => ALL_CORRECT_RE.test(o))) add('单选题不应出现「以上都对」类选项');
}

function checkAnswer(q, add) {
  const ans = q.answer;
  const n = Array.isArray(q.options) ? q.options.length : 0;
  if (!Array.isArray(ans) || !ans.every(Number.isInteger)) {
    add('answer 必须是整数数组');
    return;
  }
  if (ans.some((i) => i < 0 || i >= n)) add('answer 下标越界');
  if (new Set(ans).size !== ans.length) add('answer 有重复下标');
  if (q.type === 'single' && ans.length !== 1) add('单选题必须恰好 1 个答案');
  if (q.type === 'multi' && ans.length < 2) add('多选题至少 2 个答案');
}

function checkQuestion(q, domainId, chapters, seen) {
  const errs = [];
  const add = reporter(`questions/${domainId}.json ${q && q.id ? q.id : '(无 id)'}`, errs);
  if (!isObject(q)) return [`questions/${domainId}.json: 存在非对象条目`];
  checkId(q.id, new RegExp(`^${domainId}-\\d{3}$`), seen, add);
  if (q.domain !== domainId) add(`domain 应为 ${domainId}`);
  if (q.type !== 'single' && q.type !== 'multi') add('type 必须是 single 或 multi');
  if (!nonEmpty(q.stem)) add('stem 不能为空');
  if (!nonEmpty(q.explanation)) add('explanation 不能为空');
  if (!chapters.has(q.source)) add(`source 不是已知章节：${q.source}`);
  checkOptions(q, add);
  checkAnswer(q, add);
  return errs;
}

function checkCard(c, domainId, chapters, seen) {
  const errs = [];
  const add = reporter(`cards/${domainId}.json ${c && c.id ? c.id : '(无 id)'}`, errs);
  if (!isObject(c)) return [`cards/${domainId}.json: 存在非对象条目`];
  checkId(c.id, new RegExp(`^${domainId}-c\\d{2}$`), seen, add);
  if (c.domain !== domainId) add(`domain 应为 ${domainId}`);
  if (!nonEmpty(c.title)) add('title 不能为空');
  if (!Array.isArray(c.points) || !inRange(c.points.length, POINT_RANGE) || !c.points.every(nonEmpty)) {
    add(`points 数量必须在 ${POINT_RANGE.min}–${POINT_RANGE.max} 之间且不能为空`);
  }
  if (!chapters.has(c.source)) add(`source 不是已知章节：${c.source}`);
  return errs;
}

function checkCounts(domain, qs, cs) {
  const errs = [];
  ['single', 'multi'].forEach((type) => {
    const have = qs.filter((q) => q.type === type).length;
    const want = domain.target[type];
    if (Math.abs(have - want) > COUNT_TOLERANCE) {
      errs.push(`questions/${domain.id}.json: ${type} 题数 ${have}，目标 ${want}±${COUNT_TOLERANCE}`);
    }
  });
  if (!inRange(cs.length, CARD_RANGE)) {
    errs.push(`cards/${domain.id}.json: 卡片数 ${cs.length}，应在 ${CARD_RANGE.min}–${CARD_RANGE.max} 之间`);
  }
  return errs;
}

function checkDomains(domains) {
  const errs = [];
  const total = domains.reduce((n, d) => n + d.weight, 0);
  if (total !== 100) errs.push(`domains.json: 权重之和为 ${total}，应为 100`);
  domains.forEach((d) => {
    if (!isObject(d.target) || !Number.isInteger(d.target.single) || !Number.isInteger(d.target.multi)) {
      errs.push(`domains.json ${d.id}: target 必须含整数 single/multi`);
    }
    if (!Array.isArray(d.chapters) || !d.chapters.length) errs.push(`domains.json ${d.id}: chapters 不能为空`);
  });
  return errs;
}

function countBy(list, keyFn) {
  const counts = {};
  list.forEach((item) => [].concat(keyFn(item)).forEach((k) => { counts[k] = (counts[k] || 0) + 1; }));
  return counts;
}

function checkBalance(domainId, qs) {
  const errs = [];
  const where = `questions/${domainId}.json`;
  const withAnswer = qs.filter((q) => Array.isArray(q.answer) && q.answer.length);
  const singles = withAnswer.filter((q) => q.type === 'single');
  if (singles.length >= BALANCE_MIN.single) {
    const counts = countBy(singles, (q) => q.answer[0]);
    Object.keys(counts).forEach((i) => {
      const share = counts[i] / singles.length;
      if (share > SINGLE_LETTER_MAX_SHARE) {
        errs.push(`${where}: 单选题正确答案 ${LETTERS[i]} 占 ${pct(share)}%，超过 ${pct(SINGLE_LETTER_MAX_SHARE)}%`);
      }
    });
  }
  const multis = withAnswer.filter((q) => q.type === 'multi');
  if (multis.length >= BALANCE_MIN.multi) {
    const counts = countBy(multis, (q) => q.answer);
    Object.keys(counts).forEach((i) => {
      const share = counts[i] / multis.length;
      if (share > MULTI_POSITION_MAX_SHARE) {
        errs.push(`${where}: 多选题选项 ${LETTERS[i]} 在 ${pct(share)}% 的题目中为正确答案，超过 ${pct(MULTI_POSITION_MAX_SHARE)}%`);
      }
    });
    const sizes = Object.keys(countBy(multis, (q) => q.answer.length));
    if (sizes.length < 2) errs.push(`${where}: 多选题正确答案个数全部为 ${sizes[0]} 个，应有变化`);
  }
  return errs;
}

function checkDuplicateStems(domains, questions) {
  const errs = [];
  const seen = new Map();
  domains.forEach((d) => (questions[d.id] || []).forEach((q) => {
    if (!q || typeof q.stem !== 'string') return;
    const key = q.stem.replace(/\s+/g, '');
    if (seen.has(key)) errs.push(`questions/${d.id}.json ${q.id}: 题干与 ${seen.get(key)} 重复`);
    else seen.set(key, q.id);
  }));
  return errs;
}

export function validateData({ domains, cards, questions }, { allowPartial = false, strictDomains = null } = {}) {
  const errors = checkDomains(domains);
  const chapters = new Set([].concat(...domains.map((d) => d.chapters || [])));
  const seen = new Set();
  const countsFor = (id) => (strictDomains ? strictDomains.indexOf(id) !== -1 : !allowPartial);
  domains.forEach((d) => {
    const qs = questions[d.id] || [];
    const cs = cards[d.id] || [];
    qs.forEach((q) => errors.push(...checkQuestion(q, d.id, chapters, seen)));
    cs.forEach((c) => errors.push(...checkCard(c, d.id, chapters, seen)));
    errors.push(...checkBalance(d.id, qs));
    if (countsFor(d.id)) errors.push(...checkCounts(d, qs, cs));
  });
  return errors.concat(checkDuplicateStems(domains, questions));
}
