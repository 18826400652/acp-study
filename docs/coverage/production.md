# 生产环境应用实践（production）覆盖表

说明：多选题可能同时涉及多个小节，只在主要小节计数；卡片列出与该小节相关的卡片。4_0_走向生产环境、5_1_培养品味用AI为业务提效没有正文，不作为来源。

| 章节 | 小节（笔记标题） | 计划题数 | 题目 id | 卡片 id |
|---|---|---|---|---|
| 4_3_大模型应用生产实践 | 前言 / 课程目标 | 0 | — | — |
| 4_3_大模型应用生产实践 | 1. 业务需求分析 / 1.1 模型的功能性需求 / 1.2 模型的非功能性需求 | 2 | production-006, production-019 | production-c04 |
| 4_3_大模型应用生产实践 | 2. 性能优化（SLO：TTFT / TPOT） | 1 | production-007 | production-c04 |
| 4_3_大模型应用生产实践 | 2.1 系统性能提升 / 2.1.1 更快地处理请求 | 1 | production-008 | production-c01 |
| 4_3_大模型应用生产实践 | 2.1.2 减少大模型处理请求数和运算量 | 2 | production-009, production-010 | production-c01, production-c07 |
| 4_3_大模型应用生产实践 | 2.1.3 减少 Tokens 的输入和输出 | 2 | production-001, production-011 | production-c01, production-c05 |
| 4_3_大模型应用生产实践 | 2.1.4 并行化处理（含 CPU 与 GPU 对比） | 1 | production-012（另见 production-005 选项 B） | production-c05 |
| 4_3_大模型应用生产实践 | 2.1.5 不要默认依赖大模型 | 0 | — | production-c01 |
| 4_3_大模型应用生产实践 | 2.2 用户感知优化 / 2.2.1 流式输出 | 1 | production-013 | production-c07 |
| 4_3_大模型应用生产实践 | 2.2.2 分块处理 / 2.2.3 展示任务进度 / 2.2.4 完善错误处理机制 / 2.2.5 用户反馈 | 1 | production-020 | production-c07 |
| 4_3_大模型应用生产实践 | 3. 成本优化 / 3.1 优化系统性能时节约成本 | 0 | —（数字见 production-009、production-010 解析） | production-c07 |
| 4_3_大模型应用生产实践 | 3.2 云上部署成本优化 / 3.2.1 选择合适的GPU实例规格 | 2 | production-014, production-018 | production-c06 |
| 4_3_大模型应用生产实践 | 3.2.2 选择合适的计费方式 | 1 | production-015（另见 production-005 选项 E） | production-c06 |
| 4_3_大模型应用生产实践 | 4. 稳定性 / 4.1 降低用户请求的资源消耗 | 0 | — | — |
| 4_3_大模型应用生产实践 | 4.2 自动化扩缩容 / 4.5 容灾性设计 | 1 | production-021（另见 production-005 选项 A） | production-c02 |
| 4_3_大模型应用生产实践 | 4.3 评测基线管理 | 2 | production-005, production-016 | production-c02 |
| 4_3_大模型应用生产实践 | 4.4 模型实时监控与告警 | 0 | — | production-c02 |
| 4_3_大模型应用生产实践 | 5. 可观测性 / 5.1 观测应用运行 | 2 | production-002, production-022 | production-c02 |
| 4_3_大模型应用生产实践 | 5.2 部署建议 | 1 | production-017 | production-c02 |
| 4_3_大模型应用生产实践 | 本节小结（PD 分离、MLOps 等拓展） | 0 | — | — |
| 4_4_大模型应用安全合规 | 前言 / 课程目标 | 0 | — | — |
| 4_4_大模型应用安全合规 | 1.1 提示词注入攻击 / 1.2 指令注入攻击（智能体行为攻击） | 1 | production-003 | production-c03 |
| 4_4_大模型应用安全合规 | 1.3 初步防御措施（关键词过滤法） | 0 | —（另见 production-004 选项 A） | production-c03 |
| 4_4_大模型应用安全合规 | 1.4 从技术漏洞到业务危机的警钟 | 1 | production-048 | — |
| 4_4_大模型应用安全合规 | 2.1 使用AI安全护栏 | 1 | production-029 | production-c12 |
| 4_4_大模型应用安全合规 | 2.2 防护文本内容 | 1 | production-028 | production-c12 |
| 4_4_大模型应用安全合规 | 2.3 集中管理你的安全规则 / 2.4 防护图像内容 / 2.5 多种风险防护能力 | 1 | production-047 | production-c12 |
| 4_4_大模型应用安全合规 | 3. 攻击案例梳理 / 3.1.1 训练数据中的风险 | 1 | production-024 | production-c08 |
| 4_4_大模型应用安全合规 | 3.1.2 干扰大模型令其做出错误的决策 / 4.3.1 防御训练数据风险 / 4.3.2 防御对抗性攻击 | 1 | production-039 | production-c08 |
| 4_4_大模型应用安全合规 | 3.1.3 窃取模型能力 / 4.3.3 防御模型窃取 | 1 | production-040 | production-c08 |
| 4_4_大模型应用安全合规 | 3.1.4 如何防护大模型的“弱点”：数据依赖 | 1 | production-037 | production-c08 |
| 4_4_大模型应用安全合规 | 3.2.1 诱导大模型服务输出有风险的内容 | 1 | production-023 | production-c09 |
| 4_4_大模型应用安全合规 | 3.2.2 诱导智能体应用输出有风险的内容 | 2 | production-027, production-042 | production-c09 |
| 4_4_大模型应用安全合规 | 3.2.3 诱导智能体应用执行高风险操作 | 2 | production-026, production-041 | production-c09 |
| 4_4_大模型应用安全合规 | 3.3.1 DDoS攻击瘫痪你的AI服务 | 1 | production-025 | production-c10 |
| 4_4_大模型应用安全合规 | 3.3.2 攻击AI基础设施，从底层取走数据 | 1 | production-032 | production-c11 |
| 4_4_大模型应用安全合规 | 3.4 大模型及AI应用安全风险总览 | 0 | — | — |
| 4_4_大模型应用安全合规 | 4. 纵深防御体系 / 4.1 资产盘点与布防 | 2 | production-030, production-043 | production-c10 |
| 4_4_大模型应用安全合规 | 4.2.1 传统云安全加固 | 1 | production-031 | production-c10 |
| 4_4_大模型应用安全合规 | 4.2.2 下一代防御（零信任、加密所有数据、可信计算、机密计算、远程证明） | 3 | production-033, production-034, production-044 | production-c11 |
| 4_4_大模型应用安全合规 | 4.2.2 赋能多方协作（隐私计算） | 1 | production-035 | production-c11 |
| 4_4_大模型应用安全合规 | 4.4.1 实时三层防御 | 1 | production-004 | production-c03 |
| 4_4_大模型应用安全合规 | 4.4.2 高级RAG防护 | 1 | production-045 | production-c03 |
| 4_4_大模型应用安全合规 | 4.5 合规与备案 / 4.5.1 算法备案 / 4.5.2 全球市场主要合规框架 | 1 | production-036 | production-c03, production-c12 |
| 4_4_大模型应用安全合规 | 4.5.3 企业合规行动指南 | 1 | production-046 | production-c12 |
| 4_4_大模型应用安全合规 | 课后小测验（4.4.2 间接提示词注入） | 1 | production-038 | — |

合计：4_3 共 20 道（单选 15、多选 5），4_4 共 28 道（单选 17、多选 11）；总计 48 道（单选 32、多选 16），卡片 12 张（4_3：c01、c02、c04–c07；4_4：c03、c08–c12）。
