import { mapCardIds } from '../js/knowledge-map.js';

export const COUNT_TOLERANCE = 3;
export const OPTION_RANGE = { min: 3, max: 6 };
export const POINT_RANGE = { min: 3, max: 5 };
export const CARD_RANGE = { min: 15, max: 35 };
export const EXPLAIN_LIMITS = { plain: 150, analogy: 60, exam: 80, confuse: 60 };
export const EXPLAIN_REQUIRED = ['plain', 'exam'];
export const FLOW_LIMITS = { lanes: 3, minSteps: 2, maxSteps: 6, stepChars: 10 };
export const MAP_LABEL_MAX_CHARS = 24;
export const MAP_MAX_DEPTH = 4;
// 不属于任何考点、但允许作为卡片出处的章节
export const EXTRA_CHAPTERS = ['5_2_总结与展望'];
export const POINT_MAX_CHARS = 40;
export const TITLE_MAX_CHARS = 24;
export const BALANCE_MIN = { single: 8, multi: 6 };
export const SINGLE_LETTER_MAX_SHARE = 0.4;
export const MULTI_POSITION_MAX_SHARE = 0.75;
export const KEY_LONGEST_MAX_SHARE = 0.35;
// 模拟题库：各考点题量固定，答案分布要求比练习题更严
export const MOCK_TARGETS = {
  'app-dev': { single: 18, multi: 8 }, prompt: { single: 14, multi: 8 }, rag: { single: 20, multi: 10 },
  finetune: { single: 16, multi: 8 }, 'agent-mm': { single: 16, multi: 8 }, production: { single: 16, multi: 8 },
};
export const MOCK_EXPLAIN_MIN_CHARS = 20;
const MOCK_OPTION_COUNT = 4;
const MOCK_MULTI_POSITION_MAX_SHARE = 0.7;
const MOCK_MULTI_TWO_SHARE = { min: 0.6, max: 0.9 };
const LETTERS = 'ABCDEF';
const pct = (x) => Math.round(x * 100);
const ALL_CORRECT_RE = /以上(都|均|全部|皆)?(对|正确|是)/;
const charCount = (s) => [...s].length;

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
  if (!isKnownSource(q.source, chapters)) add(`source 不是已知章节：${q.source}`);
  checkOptions(q, add);
  checkAnswer(q, add);
  return errs;
}

function checkFlow(flow, add) {
  const steps = { min: FLOW_LIMITS.minSteps, max: FLOW_LIMITS.maxSteps };
  const ok = Array.isArray(flow) && inRange(flow.length, { min: 1, max: FLOW_LIMITS.lanes })
    && flow.every((lane) => Array.isArray(lane) && inRange(lane.length, steps)
      && lane.every((s) => nonEmpty(s) && charCount(s) <= FLOW_LIMITS.stepChars));
  if (!ok) {
    add(`explain.flow 应为 1–${FLOW_LIMITS.lanes} 条泳道，每条 ${steps.min}–${steps.max} 步，每步 1–${FLOW_LIMITS.stepChars} 字`);
  }
}

function checkExplain(ex, add, required) {
  if (ex === undefined) {
    if (required) add('缺少 explain');
    return;
  }
  if (!isObject(ex)) {
    add('explain 必须是对象');
    return;
  }
  Object.keys(ex).filter((k) => !(k in EXPLAIN_LIMITS) && k !== 'flow').forEach((k) => add(`explain 有未知字段：${k}`));
  Object.keys(EXPLAIN_LIMITS).forEach((k) => {
    const v = ex[k];
    if (v === undefined && EXPLAIN_REQUIRED.indexOf(k) === -1) return;
    if (!nonEmpty(v)) add(`explain.${k} 不能为空`);
    else if (charCount(v) > EXPLAIN_LIMITS[k]) add(`explain.${k} 超过 ${EXPLAIN_LIMITS[k]} 字`);
  });
  if (ex.flow !== undefined) checkFlow(ex.flow, add);
}

const isKnownSource = (source, chapters) => typeof source === 'string'
  && source.split('、').every((ch) => chapters.has(ch));

function checkCard(c, domainId, chapters, seen, strict) {
  const errs = [];
  const add = reporter(`cards/${domainId}.json ${c && c.id ? c.id : '(无 id)'}`, errs);
  if (!isObject(c)) return [`cards/${domainId}.json: 存在非对象条目`];
  checkId(c.id, new RegExp(`^${domainId}-c\\d{2}$`), seen, add);
  if (c.domain !== domainId) add(`domain 应为 ${domainId}`);
  if (!nonEmpty(c.title)) add('title 不能为空');
  if (!Array.isArray(c.points) || !inRange(c.points.length, POINT_RANGE) || !c.points.every(nonEmpty)) {
    add(`points 数量必须在 ${POINT_RANGE.min}–${POINT_RANGE.max} 之间且不能为空`);
  }
  if (nonEmpty(c.title) && charCount(c.title) > TITLE_MAX_CHARS) add(`title 超过 ${TITLE_MAX_CHARS} 字`);
  if (Array.isArray(c.points)) {
    c.points.forEach((p, i) => {
      if (nonEmpty(p) && charCount(p) > POINT_MAX_CHARS) add(`第 ${i + 1} 条要点超过 ${POINT_MAX_CHARS} 字`);
    });
  }
  if (!isKnownSource(c.source, chapters)) add(`source 不是已知章节：${c.source}`);
  checkExplain(c.explain, add, strict);
  return errs;
}

function checkMapNode(node, depth, ctx) {
  if (!isObject(node)) {
    ctx.add('地图节点必须是对象');
    return;
  }
  if (depth > MAP_MAX_DEPTH) {
    ctx.add(`层级超过 ${MAP_MAX_DEPTH} 层`);
    return;
  }
  if ('card' in node) {
    if (Object.keys(node).length !== 1) ctx.add(`卡片节点只能有 card 字段：${node.card}`);
    if (!ctx.ids.has(node.card)) ctx.add(`引用了不属于本考点的卡片：${node.card}`);
    return;
  }
  if (!nonEmpty(node.label)) ctx.add('分支节点 label 不能为空');
  else if (charCount(node.label) > MAP_LABEL_MAX_CHARS) ctx.add(`label 超过 ${MAP_LABEL_MAX_CHARS} 字：${node.label}`);
  if (!Array.isArray(node.children) || !node.children.length) ctx.add(`分支节点 children 不能为空：${node.label}`);
  else node.children.forEach((child) => checkMapNode(child, depth + 1, ctx));
}

function checkMap(map, domainId, cs, strict) {
  const where = `maps/${domainId}.json`;
  if (map === undefined) return strict ? [`${where}: 缺少知识地图`] : [];
  if (!isObject(map)) return [`${where}: 必须是对象`];
  const errs = [];
  const add = reporter(where, errs);
  if (map.domain !== domainId) add(`domain 应为 ${domainId}`);
  if (!nonEmpty(map.title)) add('title 不能为空');
  if (!Array.isArray(map.children) || !map.children.length) {
    add('children 不能为空');
    return errs;
  }
  const ids = new Set(cs.filter(isObject).map((c) => c.id));
  map.children.forEach((node) => checkMapNode(node, 1, { add, ids }));
  if (strict) {
    const listed = new Set(mapCardIds(map));
    ids.forEach((id) => { if (!listed.has(id)) add(`卡片未出现在地图中：${id}`); });
  }
  return errs;
}

function checkCounts(domain, qs, cs, questionsOnly) {
  const errs = [];
  ['single', 'multi'].forEach((type) => {
    const have = qs.filter((q) => q && q.type === type).length;
    const want = domain.target[type];
    if (Math.abs(have - want) > COUNT_TOLERANCE) {
      errs.push(`questions/${domain.id}.json: ${type} 题数 ${have}，目标 ${want}±${COUNT_TOLERANCE}`);
    }
  });
  if (!questionsOnly && !inRange(cs.length, CARD_RANGE)) {
    errs.push(`cards/${domain.id}.json: 卡片数 ${cs.length}，应在 ${CARD_RANGE.min}–${CARD_RANGE.max} 之间`);
  }
  return errs;
}

function checkDomains(domains, questionsOnly) {
  const errs = [];
  const total = domains.reduce((n, d) => n + d.weight, 0);
  if (!questionsOnly && total !== 100) errs.push(`domains.json: 权重之和为 ${total}，应为 100`);
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

function isKeyStrictlyLongest(q) {
  if (!Array.isArray(q.options)) return false;
  const key = q.options[q.answer[0]];
  if (typeof key !== 'string') return false;
  return q.options.every((o, i) => i === q.answer[0] || (typeof o === 'string' && o.length < key.length));
}

function checkKeyLength(where, singles) {
  const share = singles.filter(isKeyStrictlyLongest).length / singles.length;
  return share > KEY_LONGEST_MAX_SHARE
    ? [`${where}: 单选题中正确答案最长的占 ${pct(share)}%，超过 ${pct(KEY_LONGEST_MAX_SHARE)}%`]
    : [];
}

function checkBalance(domainId, qs) {
  const errs = [];
  const where = `questions/${domainId}.json`;
  const withAnswer = qs.filter((q) => q && Array.isArray(q.answer) && q.answer.length);
  const singles = withAnswer.filter((q) => q.type === 'single');
  if (singles.length >= BALANCE_MIN.single) {
    const counts = countBy(singles, (q) => q.answer[0]);
    Object.keys(counts).forEach((i) => {
      const share = counts[i] / singles.length;
      if (share > SINGLE_LETTER_MAX_SHARE) {
        errs.push(`${where}: 单选题正确答案 ${LETTERS[i]} 占 ${pct(share)}%，超过 ${pct(SINGLE_LETTER_MAX_SHARE)}%`);
      }
    });
    errs.push(...checkKeyLength(where, singles));
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

function checkMockOptions(q, add) {
  const opts = q.options;
  if (!Array.isArray(opts) || opts.length !== MOCK_OPTION_COUNT) {
    add(`选项必须是 ${MOCK_OPTION_COUNT} 个`);
    return;
  }
  if (!opts.every(nonEmpty)) add('选项不能为空');
  if (new Set(opts).size !== opts.length) add('选项有重复');
  if (q.type === 'single' && opts.some((o) => ALL_CORRECT_RE.test(o))) add('单选题不应出现「以上都对」类选项');
}

function checkMockAnswer(q, add) {
  const ans = q.answer;
  const n = Array.isArray(q.options) ? q.options.length : 0;
  if (!Array.isArray(ans) || !ans.every(Number.isInteger)) {
    add('answer 必须是整数数组');
    return;
  }
  if (ans.some((i) => i < 0 || i >= n)) add('answer 下标越界');
  if (new Set(ans).size !== ans.length) add('answer 有重复下标');
  if (q.type === 'single' && ans.length !== 1) add('单选题必须恰好 1 个答案');
  if (q.type === 'multi' && ans.length !== 2 && ans.length !== 3) add('多选题必须有 2 或 3 个答案');
}

function checkMockQuestion(q, domainId, chapters, seen) {
  const errs = [];
  const add = reporter(`mock/${domainId}.json ${q && q.id ? q.id : '(无 id)'}`, errs);
  if (!isObject(q)) return [`mock/${domainId}.json: 存在非对象条目`];
  checkId(q.id, new RegExp(`^${domainId}-m\\d{3}$`), seen, add);
  if (q.domain !== domainId) add(`domain 应为 ${domainId}`);
  if (q.type !== 'single' && q.type !== 'multi') add('type 必须是 single 或 multi');
  if (!nonEmpty(q.stem)) add('stem 不能为空');
  if (!nonEmpty(q.explanation)) add('explanation 不能为空');
  else if (charCount(q.explanation) < MOCK_EXPLAIN_MIN_CHARS) add(`解析至少 ${MOCK_EXPLAIN_MIN_CHARS} 字`);
  if (!isKnownSource(q.source, chapters)) add(`source 不是已知章节：${q.source}`);
  checkMockOptions(q, add);
  checkMockAnswer(q, add);
  return errs;
}

function checkMockBalance(domainId, qs) {
  const errs = [];
  const where = `mock/${domainId}.json`;
  const withAnswer = qs.filter((q) => q && Array.isArray(q.answer) && q.answer.length);
  const singles = withAnswer.filter((q) => q.type === 'single');
  if (singles.length >= BALANCE_MIN.single) {
    const counts = countBy(singles, (q) => q.answer[0]);
    Object.keys(counts).forEach((i) => {
      const share = counts[i] / singles.length;
      if (share > SINGLE_LETTER_MAX_SHARE) {
        errs.push(`${where}: 单选题正确答案 ${LETTERS[i]} 占 ${pct(share)}%，超过 ${pct(SINGLE_LETTER_MAX_SHARE)}%`);
      }
    });
    errs.push(...checkKeyLength(where, singles));
  }
  const multis = withAnswer.filter((q) => q.type === 'multi');
  if (multis.length >= BALANCE_MIN.multi) {
    const twoShare = multis.filter((q) => q.answer.length === 2).length / multis.length;
    if (twoShare < MOCK_MULTI_TWO_SHARE.min || twoShare > MOCK_MULTI_TWO_SHARE.max) {
      errs.push(`${where}: 多选题 2 个答案的题占 ${pct(twoShare)}%，应在 ${pct(MOCK_MULTI_TWO_SHARE.min)}%–${pct(MOCK_MULTI_TWO_SHARE.max)}% 之间`);
    }
    const counts = countBy(multis, (q) => q.answer);
    Object.keys(counts).forEach((i) => {
      const share = counts[i] / multis.length;
      if (share > MOCK_MULTI_POSITION_MAX_SHARE) {
        errs.push(`${where}: 多选题选项 ${LETTERS[i]} 在 ${pct(share)}% 的题目中为正确答案，超过 ${pct(MOCK_MULTI_POSITION_MAX_SHARE)}%`);
      }
    });
  }
  return errs;
}

function checkMockIdSequence(domainId, qs) {
  const prefix = `${domainId}-m`;
  const re = new RegExp(`^${prefix}\\d{3}$`);
  const nums = qs
    .filter((q) => isObject(q) && typeof q.id === 'string' && re.test(q.id))
    .map((q) => Number(q.id.slice(prefix.length)))
    .sort((a, b) => a - b);
  if (!nums.length) return [];
  const continuous = nums.length === nums[nums.length - 1] && nums.every((n, i) => n === i + 1);
  return continuous ? [] : [`mock/${domainId}.json: 题号应从 m001 连续编号`];
}

function checkMockCounts(domainId, qs) {
  const target = MOCK_TARGETS[domainId];
  if (!target) return [`mock/${domainId}.json: 未配置模拟题目标`];
  const errs = [];
  [['single', '单选题'], ['multi', '多选题']].forEach(([type, label]) => {
    const have = qs.filter((q) => q && q.type === type).length;
    const want = target[type];
    if (have !== want) errs.push(`${domainId} ${label} ${have}，应为 ${want}`);
  });
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

// questionsOnly：面试题库只校验选择题，卡片与权重由 interview-lib 自己负责
export function validateData({ domains, cards, questions, maps = {} }, { allowPartial = false, strictDomains = null, questionsOnly = false } = {}) {
  const errors = checkDomains(domains, questionsOnly);
  const chapters = new Set([].concat(...domains.map((d) => d.chapters || [])));
  const cardChapters = new Set([...chapters, ...EXTRA_CHAPTERS]);
  const seen = new Set();
  const countsFor = (id) => (strictDomains ? strictDomains.indexOf(id) !== -1 : !allowPartial);
  domains.forEach((d) => {
    const qs = questions[d.id] || [];
    const cs = questionsOnly ? [] : (cards[d.id] || []);
    const strict = !questionsOnly && countsFor(d.id);
    const titles = new Set();
    cs.forEach((c) => {
      if (!isObject(c) || !nonEmpty(c.title)) return;
      if (titles.has(c.title)) errors.push(`cards/${d.id}.json: 卡片标题重复：${c.title}`);
      titles.add(c.title);
    });
    qs.forEach((q) => errors.push(...checkQuestion(q, d.id, questionsOnly ? chapters : cardChapters, seen)));
    cs.forEach((c) => errors.push(...checkCard(c, d.id, cardChapters, seen, strict)));
    errors.push(...checkBalance(d.id, qs));
    if (!questionsOnly) errors.push(...checkMap(maps[d.id], d.id, cs, strict));
    if (countsFor(d.id)) errors.push(...checkCounts(d, qs, cs, questionsOnly));
  });
  return errors.concat(checkDuplicateStems(domains, questions));
}

// mock 为按考点组织的模拟题库；数量与 MOCK_TARGETS 精确匹配，不做 ±容忍
export function validateMockData({ domains, mock = {} }, { allowPartial = false, strictDomains = null } = {}) {
  const errors = [];
  const chapters = new Set([].concat(...domains.map((d) => d.chapters || [])));
  const knownChapters = new Set([...chapters, ...EXTRA_CHAPTERS]);
  const seen = new Set();
  const countsFor = (id) => (strictDomains ? strictDomains.indexOf(id) !== -1 : !allowPartial);
  domains.forEach((d) => {
    const raw = mock[d.id];
    if (raw !== undefined && !Array.isArray(raw)) errors.push(`mock/${d.id}.json: 题库必须是数组`);
    const qs = Array.isArray(raw) ? raw : [];
    qs.forEach((q) => errors.push(...checkMockQuestion(q, d.id, knownChapters, seen)));
    errors.push(...checkMockIdSequence(d.id, qs));
    errors.push(...checkMockBalance(d.id, qs));
    if (countsFor(d.id)) errors.push(...checkMockCounts(d.id, qs));
  });
  return errors;
}
