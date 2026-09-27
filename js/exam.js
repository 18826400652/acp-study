export const EXAM_SIZE = { single: 50, multi: 25 };
export const EXAM_DURATION_MS = 120 * 60 * 1000;
const TYPES = ['single', 'multi'];

// 用整数运算做最大余数法，避免浮点误差（例如 17*50/100 恰好 8.5）
export function allocate(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w, i) => ({
    i, w, floor: Math.floor((w * total) / sum), rem: (w * total) % sum,
  }));
  const counts = parts.map((p) => p.floor);
  let left = total - counts.reduce((a, b) => a + b, 0);
  const order = parts.slice().sort((a, b) => b.rem - a.rem || b.w - a.w || a.i - b.i);
  for (let k = 0; k < order.length && left > 0; k += 1) {
    counts[order[k].i] += 1;
    left -= 1;
  }
  return counts;
}

export function shuffle(list, rng = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function buildExam(domains, questions, rng = Math.random) {
  const weights = domains.map((d) => d.weight);
  const shortfall = [];
  const blocks = TYPES.map((type) => {
    const counts = allocate(weights, EXAM_SIZE[type]);
    const picked = domains.map((d, i) => {
      const pool = questions.filter((q) => q.domain === d.id && q.type === type);
      const chosen = shuffle(pool, rng).slice(0, counts[i]);
      if (chosen.length < counts[i]) {
        shortfall.push({ domain: d.id, type, need: counts[i], have: chosen.length });
      }
      return chosen.map((q) => q.id);
    });
    return shuffle([].concat(...picked), rng);
  });
  return { questionIds: [].concat(...blocks), shortfall };
}

export function remainingMs(startedAt, now) {
  return Math.max(0, EXAM_DURATION_MS - (now - startedAt));
}

const pad2 = (n) => String(n).padStart(2, '0');

export function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)} 分 ${total % 60} 秒`;
}
