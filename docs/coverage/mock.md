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
| 过拟合与验证损失 / checkpoint 选择 | finetune | finetune-m018 |
| 微调前的数据质量与基座能力评估 | finetune | finetune-m002 |
| 敏感操作封装为 MCP 工具 + 应用层校验 | agent-mm | agent-mm-m001 |
| 数据不出公有云的本地多模态链路 | production | production-m001（本地部署部分；多模态解析链路由后续任务补充） |
| 关键词拦截误拦与语义意图识别 | production | production-m002 |
| Context Precision / Recall 的变化 | rag | rag-m007 |
| 幻觉控制：RAG 标注出处 + 低置信转人工 | rag / production | rag-m008 |
| 多 Agent 职责边界与关键操作人工确认 | agent-mm | agent-mm-m002 |
| 模型选型（视觉/语音/文本） | agent-mm / production | agent-mm-m016 |
| 部署与成本/稳定性取舍 | production | 待补 |

说明：本表只记录官方样题主题的覆盖情况；后续任务新增的题目如果不属于这 20 个主题，在表末「其他」区追加，不改动本表原有行。其余「待补」主题由后续任务补齐。

关键词 + 向量混合检索由 rag-m004 以「标签/关键词过滤 + 向量相似度检索」的方式覆盖；RAG 权限控制与越权访问由 rag-m003 覆盖（来源 4_4 的高级 RAG 防护）。

## 其他（不属于官方 20 个主题）

| 主题 | 考点 | 题号 |
|---|---|---|
| LoRA 合并后的 tokenizer / chat_template 处理 | finetune | finetune-m001 |
| 蒸馏训练数据的 messages 三角色格式 | finetune | finetune-m003 |
| 数据合成流水线：生成提问 → 教师标注 → 过滤格式化 | finetune | finetune-m004 |
| 教师 system prompt 的 schema 与字段取值约束 | finetune | finetune-m005 |
| LoRA 降低微调显存与存储开销 | finetune | finetune-m006 |
| 意图漏判的样本补充排查 | finetune | finetune-m007 |
| 训练产物定位（images/、runs/、checkpoint） | finetune | finetune-m008 |
| vLLM 部署与并发优化 | finetune | finetune-m009 |
| wrk 并发压测方案 | finetune | finetune-m010 |
| 嵌入式系统部署 | finetune | finetune-m011 |
| 百炼已部署模型的调用方式 | finetune | finetune-m012 |
| GPU 型 DSW 实例完成本地推理与训练 | finetune | finetune-m013 |
| 训练结束后停止空闲 GPU 实例 | finetune | finetune-m014 |
| 合成提问中的真实公司名约束 | finetune | finetune-m015 |
| 质量过滤规则从 Qwen Code 固化为 Python | finetune | finetune-m016 |
| 按创建时间选择待合并 checkpoint | finetune | finetune-m017 |
| LoRA rank 选择与数据量/任务复杂度 | finetune | finetune-m019 |
| 合成数据覆盖验收（意图/部门/线上高频错误） | finetune | finetune-m020 |
| 质量过滤器的坏样本验收与过滤统计 | finetune | finetune-m021 |
| vLLM 端口、OpenAI 兼容接口与压测边界 | finetune | finetune-m022 |
| 显存估算（参数量/精度/KV Cache）与 GPU 计时成本 | finetune | finetune-m023 |
| 训练损失下降缓慢的参数调整 | finetune | finetune-m024 |
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
| 规划与执行分离：外部动作前审查计划、失败后重排 | agent-mm | agent-mm-m003 |
| 长上下文注意力稀释与中间迷失的约束保留 | agent-mm | agent-mm-m004 |
| 深层引用导致信息丢失与扁平化渐进披露 | agent-mm | agent-mm-m005 |
| Skill 校验脚本的结构化输出、修复线索与优雅降级 | agent-mm | agent-mm-m006 |
| MCP 工具与 Skill 的职责分工（实时动作 vs 流程知识） | agent-mm | agent-mm-m007 |
| Agent 过程评测：执行 trace 的关键工具调用检查 | agent-mm | agent-mm-m008 |
| Skill 开发先建裸跑基线与评测用例 | agent-mm | agent-mm-m009 |
| Qwen Code EPCC：Explore 只分析、Plan Mode 审方案 | agent-mm | agent-mm-m010 |
| Qwen Code 任务中途 /compress 与关键细节落盘 | agent-mm | agent-mm-m011 |
| QWEN.md 常见陷阱与跨会话记忆演进 | agent-mm | agent-mm-m012 |
| Harness Loop：同类问题写回 Skill/验证器并回归 | agent-mm | agent-mm-m013 |
| Harness Loop：轮数/分数阈值与停止条件 | agent-mm | agent-mm-m014 |
| Skill 复用：流程要求固化而非口头提醒 | agent-mm | agent-mm-m015 |
| 评测框架复用：RAGAS/DeepEval 的 Agent 评测能力 | agent-mm | agent-mm-m017 |
| 三层记忆分工：短期会话、长期偏好、QWEN.md 项目约束 | agent-mm | agent-mm-m018 |
| 长文档审查：目录提取与按章节分段检查 | agent-mm | agent-mm-m019 |
| 自优化 Skill 包的验收证据链（run log / 验证报告 / 写回记录） | agent-mm | agent-mm-m020 |
| 团队复用后的运行指标归因（通过率、修订轮数、人工介入） | agent-mm | agent-mm-m021 |
| QWEN.md 三级配置层次与合并优先级 | agent-mm | agent-mm-m022 |
| 多模态截图验收：渲染缺陷判断与截图来源校验 | agent-mm | agent-mm-m023 |
| 评测集全量回归与失败案例回填 | agent-mm | agent-mm-m024 |
| 提示词优化的迭代流程（运行—分析—改进） | prompt | prompt-m003 |
| 任务目标要素与模糊需求的拆解 | prompt | prompt-m004 |
| 错别字审查中的判定例外规则 | prompt | prompt-m005 |
| 优化者只返回新提示词 | prompt | prompt-m006 |
| 评分员 JSON 解析容错与默认低分 | prompt | prompt-m007 |
| AI 裁判驱动循环的最大迭代次数 | prompt | prompt-m008 |
| 先构建 AI 裁判再优化生成提示词 | prompt | prompt-m009 |
| 标注样本上传平台创建评估集 | prompt | prompt-m010 |
| AI 裁判训练没有固定轮数、人工决定停止 | prompt | prompt-m011 |
| 从对话历史挑选少样本示例 | prompt | prompt-m012 |
| 提示词模板更新需要调用应用接口 | prompt | prompt-m013 |
| 知识填充与行为引导的问题归因 | prompt | prompt-m014 |
| 大模型审查场景的筛选（流程瓶颈/数据密集） | prompt | prompt-m015 |
| 分隔符划分参考信息与任务指令（合同审查） | prompt | prompt-m016 |
| 角色与受众定制回答风格和深度 | prompt | prompt-m017 |
| 思维链做多步计算与推理模型选择 | prompt | prompt-m018 |
| 少样本示例的覆盖面、均衡与标注一致性 | prompt | prompt-m019 |
| Meta Prompting 教练的共性问题分析与回归验证 | prompt | prompt-m020 |
| AI 裁判的评判标准、输出约束与版本管理 | prompt | prompt-m021 |
| 自动优化流程的验证集拆分与参考答案修正 | prompt | prompt-m022 |

说明：app-dev-m003～m026 均来自 `2_1_用大模型构建新人答疑机器人` 与 `3_1_Agent基础与工具调用`；与官方样题主题（分词与词表、逐 Token 采样）不重复，故列在「其他」区。

说明：agent-mm-m003～m015、m017～m024 为 `3_2`～`3_8` 的规划、Memory、Skill、评测、Qwen Code 与 Harness Loop 内容；m016 以多模态售后场景覆盖官方主题「模型选型（视觉/语音/文本）」，来源 `4_3` §1.1；m023 的多模态截图验收另引 `4_3` 的多模态模型说明。

说明：finetune-m018 以「过拟合监控信号 → 回退到验证损失最低的 checkpoint」覆盖官方主题「过拟合与验证损失 / checkpoint 选择」；finetune-m003～m017、m019～m024 为 4_1、4_2、4_3 中除官方样题主题外的工程细节（数据格式、诊断、部署与成本操作），故列在「其他」区。

说明：prompt-m003～m022 为 `2_3_优化提示词改善答疑机器人回答质量` 中除官方主题（少样本示例/结构化输出约束、专业术语库与术语翻译）外的提示词迭代、任务目标、判定例外、优化器输出约束、评分员容错、AI 裁判循环与训练停止、标注样本管理、推理模型示例来源、模板生效、知识填充与行为引导分工、审查场景筛选、分隔符、角色与受众、思维链、少样本选例、Meta Prompting 验证、AI 裁判规则与版本、自动优化验证等内容，与已有练习题不重复，故列在「其他」区。官方 prompt 主题行仍由 prompt-m001、prompt-m002 覆盖，未重复填号。
