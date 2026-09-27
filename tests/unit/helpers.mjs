export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DOMAINS = [
  { id: 'app-dev', weight: 17 },
  { id: 'prompt', weight: 15 },
  { id: 'rag', weight: 20 },
  { id: 'finetune', weight: 16 },
  { id: 'agent-mm', weight: 16 },
  { id: 'production', weight: 16 },
];

export function makeQuestions(domainId, singles, multis) {
  return Array.from({ length: singles + multis }, (_, i) => {
    const type = i < singles ? 'single' : 'multi';
    return {
      id: `${domainId}-${String(i + 1).padStart(3, '0')}`,
      domain: domainId,
      type,
      stem: `题干 ${i + 1}`,
      options: ['A', 'B', 'C', 'D'],
      answer: type === 'single' ? [0] : [0, 2],
      explanation: '解析',
      source: '2_5_优化RAG应用提升问答准确度',
    };
  });
}
