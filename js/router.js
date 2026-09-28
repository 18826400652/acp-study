const ROUTES = [
  { name: 'home', pattern: /^$/, keys: [] },
  { name: 'settings', pattern: /^settings$/, keys: [] },
  { name: 'learn', pattern: /^learn$/, keys: [] },
  { name: 'cards', pattern: /^learn\/([\w-]+)(?:\/(weak))?$/, keys: ['domain', 'filter'] },
  { name: 'practice', pattern: /^practice\/([\w-]+)$/, keys: ['domain'] },
  { name: 'exam', pattern: /^exam$/, keys: [], bank: 'acp' },
  { name: 'examResult', pattern: /^exam\/result\/(\w+)$/, keys: ['id'], bank: 'acp' },
  { name: 'mock', pattern: /^mock$/, keys: [], bank: 'interview' },
  { name: 'mockResult', pattern: /^mock\/result\/(\w+)$/, keys: ['id'], bank: 'interview' },
  { name: 'wrong', pattern: /^wrong$/, keys: [] },
  { name: 'wrongPractice', pattern: /^wrong\/practice(?:\/([\w-]+))?$/, keys: ['domain'] },
];

const PREFIX = { acp: '', interview: 'iv' };

export const TAB_OF = {
  home: 'home',
  settings: 'home',
  learn: 'learn',
  cards: 'learn',
  practice: 'learn',
  exam: 'exam',
  examResult: 'exam',
  mock: 'exam',
  mockResult: 'exam',
  wrong: 'wrong',
  wrongPractice: 'wrong',
};

function splitBank(path) {
  if (path === PREFIX.interview) return { bank: 'interview', rest: '' };
  if (path.indexOf(`${PREFIX.interview}/`) === 0) return { bank: 'interview', rest: path.slice(PREFIX.interview.length + 1) };
  return { bank: 'acp', rest: path };
}

export function parseHash(hash) {
  const path = (hash || '').replace(/^#\/?/, '').replace(/\/$/, '');
  const { bank, rest } = splitBank(path);
  for (let r = 0; r < ROUTES.length; r += 1) {
    const route = ROUTES[r];
    const match = (!route.bank || route.bank === bank) ? route.pattern.exec(rest) : null;
    if (match) {
      const params = {};
      route.keys.forEach((key, i) => {
        if (match[i + 1] !== undefined) params[key] = match[i + 1];
      });
      return { bank, name: route.name, params };
    }
  }
  return { bank, name: 'home', params: {} };
}

export function linkFor(bank, path) {
  const parts = [PREFIX[bank], path].filter(Boolean);
  return `#/${parts.join('/')}`;
}
