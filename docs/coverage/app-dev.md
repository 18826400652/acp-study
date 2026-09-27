# 大模型应用开发（app-dev）覆盖表

| 章节 | 小节（笔记标题） | 计划题数 | 题目 id | 卡片 id |
|---|---|---|---|---|
| 2_1_用大模型构建新人答疑机器人 | 前言 / 课程目标 / 环境准备 / 1.1 确认 Python 环境 / 1.2 获取 API Key | 0 | — | — |
| 2_1_用大模型构建新人答疑机器人 | 1.3 配置 API Key | 1 | app-dev-006 | app-dev-c04 |
| 2_1_用大模型构建新人答疑机器人 | 1.4 基础对话调用 | 2 | app-dev-007, app-dev-008 | app-dev-c04 |
| 2_1_用大模型构建新人答疑机器人 | 1.5 多轮对话（多轮对话的工作原理） | 2 | app-dev-009, app-dev-024 | app-dev-c05 |
| 2_1_用大模型构建新人答疑机器人 | 1.6 流式输出 | 2 | app-dev-010, app-dev-011 | app-dev-c04 |
| 2_1_用大模型构建新人答疑机器人 | 1.7 观察与思考 / 2. 大模型是如何工作的 | 0 | — | — |
| 2_1_用大模型构建新人答疑机器人 | 1.2. 大模型的文本生成工作流程（分词、向量化、推理、解码与自回归、输出） | 7 | app-dev-001, app-dev-012, app-dev-013, app-dev-014, app-dev-025, app-dev-028, app-dev-029 | app-dev-c01, app-dev-c06 |
| 2_1_用大模型构建新人答疑机器人 | 2.2.1 temperature：调整候选Token集合的概率分布 | 3 | app-dev-015, app-dev-016, app-dev-017 | app-dev-c02 |
| 2_1_用大模型构建新人答疑机器人 | 2.2.2 top_p：控制候选Token集合的采样范围 | 1 | app-dev-018 | app-dev-c02 |
| 2_1_用大模型构建新人答疑机器人 | 2.2.3 小结（同时调参、top_k、seed、残余随机性） | 3 | app-dev-019, app-dev-026, app-dev-030 | app-dev-c07 |
| 2_1_用大模型构建新人答疑机器人 | 3. 让大模型能够回答私域知识问题 / 3.1 初步方案：在提示词中“喂”入知识 | 1 | app-dev-031 | app-dev-c08 |
| 2_1_用大模型构建新人答疑机器人 | 3.2 核心瓶颈：有限的上下文窗口 | 1 | app-dev-020 | app-dev-c08 |
| 2_1_用大模型构建新人答疑机器人 | 3.3 解决之道：上下文工程 (Context Engineering) | 3 | app-dev-004, app-dev-021, app-dev-027 | app-dev-c08 |
| 2_1_用大模型构建新人答疑机器人 | 3.4 技术方案：RAG（3.4.1 建立索引 / 3.4.2 检索与生成） | 0 | —（已由 rag 考点覆盖，避免重复） | — |
| 2_1_用大模型构建新人答疑机器人 | 4. 本节小结 / 扩展阅读（enable_search、Qwen3 思考模型） | 2 | app-dev-022, app-dev-023 | app-dev-c04 |
| 2_1_用大模型构建新人答疑机器人 | 课后小测验 / 评价反馈 | 0 | — | — |
| 3_1_Agent基础与工具调用 | 前言 / 课程目标 | 2 | app-dev-032, app-dev-033 | — |
| 3_1_Agent基础与工具调用 | 1.1 硬编码方案 / 1.2 局限性分析 | 1 | app-dev-045 | app-dev-c09 |
| 3_1_Agent基础与工具调用 | 2.1 脆弱的关键词匹配 / 2.2 基于大模型的意图识别 | 1 | app-dev-034 | app-dev-c09 |
| 3_1_Agent基础与工具调用 | 3.1 为什么需要结构化 / 3.2 构建"引导-校验-重试"闭环 | 3 | app-dev-035, app-dev-036, app-dev-046 | app-dev-c10 |
| 3_1_Agent基础与工具调用 | 4.1 Function Calling 的工作原理 | 4 | app-dev-002, app-dev-037, app-dev-047, app-dev-048 | app-dev-c03, app-dev-c09 |
| 3_1_Agent基础与工具调用 | 4.2 ReAct 模式：思考-行动-观察（含 AgentScope） | 4 | app-dev-005, app-dev-038, app-dev-039, app-dev-049 | app-dev-c11 |
| 3_1_Agent基础与工具调用 | 5.1 工具复用的挑战 | 1 | app-dev-050 | — |
| 3_1_Agent基础与工具调用 | 5.2 MCP 的解耦思想 | 3 | app-dev-040, app-dev-041, app-dev-051 | app-dev-c03, app-dev-c12 |
| 3_1_Agent基础与工具调用 | 5.3.1 本地调试 MCP Client：stdio | 2 | app-dev-042, app-dev-043 | app-dev-c12 |
| 3_1_Agent基础与工具调用 | 5.3.2 接入线上 MCP 服务：Streamable HTTP | 2 | app-dev-003, app-dev-044 | app-dev-c03, app-dev-c12 |
| 3_1_Agent基础与工具调用 | 6 总结 / 课后小测验 / 评价反馈 | 0 | — | — |
| 2_2_扩展答疑机器人的知识范围 | （多轮对话等内容已由 rag 考点 rag-010/011/015 覆盖） | 0 | — | — |

合计：2_1 共 28 道（单选 19、多选 9），3_1 共 23 道（单选 15、多选 8），2_2 未使用；卡片 12 张（2_1 共 7 张，3_1 共 5 张）。
