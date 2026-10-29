import { isEnvelope } from './crypto.js';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`加载 ${url} 失败（HTTP ${res.status}）`);
  return res.json();
}

// 知识地图是辅助内容：单个地图缺失或损坏时只记录并返回 null，不拖垮题库
async function getMap(domainId) {
  try {
    return await getJson(`data/maps/${domainId}.json`);
  } catch (err) {
    console.error(`加载知识地图 ${domainId} 失败：`, err);
    return null;
  }
}

// 模拟题库是独立的可选内容：单个文件缺失或损坏时返回空数组，不影响练习题
async function getMock(domainId) {
  try {
    return await getJson(`data/mock/${domainId}.json`);
  } catch (err) {
    console.error(`加载模拟题库 ${domainId} 失败：`, err);
    return [];
  }
}

export async function loadData() {
  const domains = await getJson('data/domains.json');
  const [cardLists, questionLists, mapList, mockList] = await Promise.all([
    Promise.all(domains.map((d) => getJson(`data/cards/${d.id}.json`))),
    Promise.all(domains.map((d) => getJson(`data/questions/${d.id}.json`))),
    Promise.all(domains.map((d) => getMap(d.id))),
    Promise.all(domains.map((d) => getMock(d.id))),
  ]);
  const cards = [].concat(...cardLists);
  const questions = [].concat(...questionLists);
  const mockQuestions = [].concat(...mockList);
  const allQuestions = questions.concat(mockQuestions);
  const maps = {};
  domains.forEach((d, i) => { maps[d.id] = mapList[i]; });
  return {
    domains, cards, questions, mockQuestions, allQuestions, maps, questionById: new Map(allQuestions.map((q) => [q.id, q])),
  };
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
