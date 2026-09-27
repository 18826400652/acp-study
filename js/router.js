const ROUTES = [
  { name: 'home', pattern: /^$/, keys: [] },
  { name: 'settings', pattern: /^settings$/, keys: [] },
  { name: 'learn', pattern: /^learn$/, keys: [] },
  { name: 'cards', pattern: /^learn\/([\w-]+)$/, keys: ['domain'] },
  { name: 'practice', pattern: /^practice\/([\w-]+)$/, keys: ['domain'] },
  { name: 'exam', pattern: /^exam$/, keys: [] },
  { name: 'examResult', pattern: /^exam\/result\/(\w+)$/, keys: ['id'] },
  { name: 'wrong', pattern: /^wrong$/, keys: [] },
  { name: 'wrongPractice', pattern: /^wrong\/practice(?:\/([\w-]+))?$/, keys: ['domain'] },
];

export const TAB_OF = {
  home: 'home',
  settings: 'home',
  learn: 'learn',
  cards: 'learn',
  practice: 'learn',
  exam: 'exam',
  examResult: 'exam',
  wrong: 'wrong',
  wrongPractice: 'wrong',
};

export function parseHash(hash) {
  const path = (hash || '').replace(/^#\/?/, '').replace(/\/$/, '');
  for (let r = 0; r < ROUTES.length; r += 1) {
    const match = ROUTES[r].pattern.exec(path);
    if (match) {
      const params = {};
      ROUTES[r].keys.forEach((key, i) => {
        if (match[i + 1] !== undefined) params[key] = match[i + 1];
      });
      return { name: ROUTES[r].name, params };
    }
  }
  return { name: 'home', params: {} };
}
