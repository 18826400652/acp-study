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
| 检索优化组合的实验归因（基线、逐项验证、防跷跷板） | rag | rag-m022 |
| PDF 解析结果的质检与润色 | rag | rag-m023 |
| bad case 归因与评测集回填 | rag | rag-m024 |
| 知识库双重加密方案落地（文本 + 向量） | rag | rag-m025 |
| 知识库变更后的索引重建与评测回归 | rag | rag-m026 |
| 改写模板的构建与验证 | rag | rag-m027 |
| 上下文预算与长文档处理 | rag | rag-m028 |
| 知识库投毒防护（入库审批 + 内容预扫描） | rag | rag-m029 |
| DashScopeParse 多项目配置（category_id / Workspace ID） | rag | rag-m030 |
| top_k 调参：FAQ 措辞多样性与候选范围 | app-dev | app-dev-m003 |
| 位置编码与词序区分 | app-dev | app-dev-m004 |
| 流式输出对答案质量与总生成时间的影响 | app-dev | app-dev-m005 |
| 达到最大生成长度导致回答截断 | app-dev | app-dev-m006 |
| top_p 取值范围评审（0, 1]） | app-dev | app-dev-m007 |
| 生成结果先解码为文本再做敏感词审计 | app-dev | app-dev-m008 |
| tool_choice=auto 与无 tool_calls 分支处理 | app-dev | app-dev-m009 |
| Pydantic Union 用 TypeAdapter 校验 | app-dev | app-dev-m010 |
| 解析 JSON 前去除 Markdown 代码块标记 | app-dev | app-dev-m011 |
| AgentScope 的 DashScopeChatModel 与 Formatter 配置 | app-dev | app-dev-m012 |
| AgentScope 异步调用（await / asyncio.run） | app-dev | app-dev-m013 |
| 用工具 description 区分相似工具 | app-dev | app-dev-m014 |
| 工具提供方以 MCP Server 暴露能力 | app-dev | app-dev-m015 |
| MCP Client 连接后注册工具到 Toolkit | app-dev | app-dev-m016 |
| stdio MCP Client 启动本地 Server 子进程 | app-dev | app-dev-m017 |
| JSON Schema 用 required 约束必填参数 | app-dev | app-dev-m018 |
| Function Calling 第二次调用的消息组装 | app-dev | app-dev-m019 |
| 上下文工程三技术的组合选型（RAG / Tool / Memory） | app-dev | app-dev-m020 |
| 工具参数 Schema 的取值说明、应用层校验与必填约束 | app-dev | app-dev-m021 |
| 工具粒度：拆分职责单一的工具 | app-dev | app-dev-m022 |
| 调参步长（±0.2）与 A/B 验证 | app-dev | app-dev-m023 |
| 多轮工具调用（ReAct 循环）实现 | app-dev | app-dev-m024 |
| FastMCP Server 端工具声明与 stdio 启动 | app-dev | app-dev-m025 |
| 路由决策的低温度与结构化输出 | app-dev | app-dev-m026 |

说明：app-dev-m003～m026 均来自 `2_1_用大模型构建新人答疑机器人` 与 `3_1_Agent基础与工具调用`；与官方样题主题（分词与词表、逐 Token 采样）不重复，故列在「其他」区。
