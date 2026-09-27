export const POINTS = { single: 1, multi: 2 };
export const PASS_RATIO = 0.8;

export function isCorrect(question, selected) {
  if (!Array.isArray(selected) || selected.length !== question.answer.length) return false;
  if (new Set(selected).size !== selected.length) return false;
  return selected.every((i) => question.answer.indexOf(i) !== -1);
}

export function scoreExam(questions, responses) {
  const byDomain = {};
  let score = 0;
  let max = 0;
  questions.forEach((q) => {
    const points = POINTS[q.type];
    const got = isCorrect(q, responses[q.id] || []) ? points : 0;
    const prev = byDomain[q.domain] || { score: 0, max: 0 };
    byDomain[q.domain] = { score: prev.score + got, max: prev.max + points };
    score += got;
    max += points;
  });
  return { score, max, passed: max > 0 && score >= max * PASS_RATIO, byDomain };
}
