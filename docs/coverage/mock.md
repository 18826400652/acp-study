# 模拟题覆盖表

对应设计文档 §6.2 的 20 个官方样题主题。已写题目的填题号，其余标「待补」，由 Task 4–9 按考点分批补齐。

| 主题 | 考点 | 题号 |
|---|---|---|
| 分词与词表大小对 Input Token 的影响 | app-dev | app-dev-m001 |
| 逐 Token 采样导致输出差异 | app-dev | app-dev-m002 |
| 少样本示例 / 结构化输出约束 | prompt | prompt-m001 |
| RAG 权限控制与越权访问 | rag / production | rag-m003 |
| 关键词 + 向量混合检索 | rag | rag-m004 |
| 检索后重排序 | rag | rag-m005 |
| 专业术语库与术语翻译 | prompt / rag | prompt-m002 |
| 表格内容解析与保结构入库 | rag | rag-m002 |
| 相似度阈值过高导致召回不足 | rag | rag-m001 |
| 复杂文档（PPT/流程图）解析 | rag | rag-m006 |
| 过拟合与验证损失 / checkpoint 选择 | finetune | 待补 |
| 微调前的数据质量与基座能力评估 | finetune | finetune-m002 |
| 敏感操作封装为 MCP 工具 + 应用层校验 | agent-mm | agent-mm-m001 |
| 数据不出公有云的本地多模态链路 | production | production-m001（本地部署部分；多模态解析链路由后续任务补充） |
| 关键词拦截误拦与语义意图识别 | production | production-m002 |
| Context Precision / Recall 的变化 | rag | rag-m007 |
| 幻觉控制：RAG 标注出处 + 低置信转人工 | rag / production | rag-m008 |
| 多 Agent 职责边界与关键操作人工确认 | agent-mm | agent-mm-m002 |
| 模型选型（视觉/语音/文本） | agent-mm / production | 待补 |
| 部署与成本/稳定性取舍 | production | 待补 |

说明：本表只记录官方样题主题的覆盖情况；后续任务新增的题目如果不属于这 20 个主题，在表末「其他」区追加，不改动本表原有行。其余「待补」主题由后续任务补齐。

关键词 + 向量混合检索由 rag-m004 以「标签/关键词过滤 + 向量相似度检索」的方式覆盖；RAG 权限控制与越权访问由 rag-m003 覆盖（来源 4_4 的高级 RAG 防护）。

## 其他（不属于官方 20 个主题）

| 主题 | 考点 | 题号 |
|---|---|---|
| LoRA 合并后的 tokenizer / chat_template 处理 | finetune | finetune-m001 |
| 切片过大导致多主题混杂 | rag | rag-m009 |
| 短语类问题的查询扩写 | rag | rag-m010 |
| 基于用户画像扩展检索上下文 | rag | rag-m011 |
| 反问用户澄清歧义 | rag | rag-m012 |
| 生产环境向量存储选型 | rag | rag-m013 |
| 评测先行：先建基线与评测集 | rag | rag-m014 |
| 业务指标与算法指标对齐 | rag | rag-m015 |
| GraphRAG 处理全局总结型问题 | rag | rag-m016 |
| 模块化 RAG 与问题路由 | rag | rag-m017 |
| 生成结果可复现（seed / temperature） | rag | rag-m018 |
| 不支持格式的文档解析（Keynote） | rag | rag-m019 |
| 知识库过期与无关内容清理 | rag | rag-m020 |
| 向量加密（DCPE） | rag | rag-m021 |
