async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`加载 ${url} 失败（HTTP ${res.status}）`);
  return res.json();
}

export async function loadData() {
  const domains = await getJson('data/domains.json');
  const lists = await Promise.all([
    Promise.all(domains.map((d) => getJson(`data/cards/${d.id}.json`))),
    Promise.all(domains.map((d) => getJson(`data/questions/${d.id}.json`))),
  ]);
  const cards = [].concat(...lists[0]);
  const questions = [].concat(...lists[1]);
  return { domains, cards, questions, questionById: new Map(questions.map((q) => [q.id, q])) };
}
