import { isEnvelope } from './crypto.js';

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

export async function loadEnvelope() {
  let res;
  try {
    res = await fetch('data/interview.enc');
  } catch (err) {
    console.error('加载面试题库失败：', err);
    throw new Error('无法加载面试题库，请联网后重试');
  }
  if (res.status === 404) throw new Error('面试题库还没有生成');
  if (!res.ok) throw new Error(`加载面试题库失败（HTTP ${res.status}）`);
  const envelope = await res.json().catch(() => null);
  if (!isEnvelope(envelope)) throw new Error('面试题库文件格式不正确');
  return envelope;
}
