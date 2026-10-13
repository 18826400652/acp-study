// 知识地图的纯数据工具：校验脚本和地图页共用
const isNode = (n) => n !== null && typeof n === 'object' && !Array.isArray(n);

export function mapCardIds(node) {
  if (!isNode(node)) return [];
  if (typeof node.card === 'string') return [node.card];
  return Array.isArray(node.children) ? [].concat(...node.children.map(mapCardIds)) : [];
}

export function mapStats(map, cardStates) {
  const ids = [...new Set(mapCardIds(map))];
  return { known: ids.filter((id) => cardStates[id] === 'known').length, total: ids.length };
}
