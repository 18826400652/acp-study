# V4 扩充第二批：正式题号与核查索引

本批新增 75 道（50 单选、25 多选），模拟题累计 300 道（200 单选、100 多选）。已发布的 225 道模拟题逐对象对照提交 33a8fa8 保持一致，原练习题、卡片、知识地图及面试密文不在本批修改范围。

第二批按已确认题风扩展业务情境、根因证据及方案取舍；不重复提交样题确认，也不自动开始第三批。各题完整答案与逐项解析见对应 JSON。

## 1. 各模块题量

| 模块 | 本批单选 / 多选 | 新题区间 | 累计总量 |
|---|---|---|---|
| app-dev | 9 / 4 | app-dev-m040–app-dev-m052 | 52 |
| prompt | 7 / 4 | prompt-m034–prompt-m044 | 44 |
| rag | 10 / 5 | rag-m046–rag-m060 | 60 |
| finetune | 8 / 4 | finetune-m037–finetune-m048 | 48 |
| agent-mm | 8 / 4 | agent-mm-m037–agent-mm-m048 | 48 |
| production | 8 / 4 | production-m037–production-m048 | 48 |

## 2. 75 道正式题号

| 本批位置 | 正式题号 | 题型 | 大纲项 | 场景与判断线索 |
|---|---|---|---|---|
| B2-A01 | [app-dev-m040](../../data/mock/app-dev.json) | 单选 | A5 | 摘要服务的最大输出额度设为 2000 Token，实际只生成 300 Token。题中费率仅按实… |
| B2-A02 | [app-dev-m041](../../data/mock/app-dev.json) | 单选 | A2 | 摘要在出现“结束检查”之前总是停住，输出远未到长度上限。日志显示命中了团队配置的停止串“结束”；… |
| B2-A03 | [app-dev-m042](../../data/mock/app-dev.json) | 单选 | A3 | 流式摘要依次返回“项目”“已完成”“验收”三个增量片段，网页最终只显示“验收”。接口正常结束，服… |
| B2-A04 | [app-dev-m043](../../data/mock/app-dev.json) | 单选 | A2 | 分类请求在调用处设置 temperature=0.1，线上却仍用 1.0。网关日志确认中间件最后… |
| B2-A05 | [app-dev-m044](../../data/mock/app-dev.json) | 单选 | A3 | 同一会话并发发出两个追问，第二个请求先返回，应用按网络到达顺序写入历史，导致后续对话因果顺序混乱… |
| B2-A06 | [app-dev-m045](../../data/mock/app-dev.json) | 单选 | A5 | 后端允许手机端任意提交 messages 的 role，攻击者把自填内容标成 system 后进… |
| B2-A07 | [app-dev-m046](../../data/mock/app-dev.json) | 单选 | A5 | 迁移接入地域后模型鉴权失败。日志确认 Base URL 指向地域乙，API Key 来自地域甲；… |
| B2-A08 | [app-dev-m047](../../data/mock/app-dev.json) | 单选 | A2 | 长篇导览反复出现同一句过渡语。事实和检索均正确，团队想测试抑制已出现内容的重复倾向，接口已确认支… |
| B2-A09 | [app-dev-m048](../../data/mock/app-dev.json) | 单选 | A1、A2 | 某生成步骤的候选概率依次为 0.60、0.25、0.10、0.05。本题按降序保留到累计概率首次… |
| B2-A10 | [app-dev-m049](../../data/mock/app-dev.json) | 多选 | A3 | 用户在另一台手机继续已有会话，后端只在单台进程内保存消息；重启后上下文消失。业务允许授权用户跨设… |
| B2-A11 | [app-dev-m050](../../data/mock/app-dev.json) | 多选 | A3、A5 | 流式客户端只处理非空正文片段，把包含 usage 的末尾事件直接丢弃，导致费用日志为空。接口文档… |
| B2-A12 | [app-dev-m051](../../data/mock/app-dev.json) | 多选 | A1、A4 | 同一提示连续调用三次，回答措辞一致但都引用错误事实。有人据此认定低温度已经保证正确。以下哪些判断… |
| B2-A13 | [app-dev-m052](../../data/mock/app-dev.json) | 多选 | A5 | 调用日志需要支持重现问题，又不能暴露凭据或跨用户历史。以下哪些记录方式合理？… |
| B2-P01 | [prompt-m034](../../data/mock/prompt.json) | 单选 | P4 | 抽取助手返回的 JSON 在名称含双引号时才解析失败，普通名称均正常。字段与数值都完整。以下改进… |
| B2-P02 | [prompt-m035](../../data/mock/prompt.json) | 单选 | P1、P4 | 抽取报表把“合同额 2 万元”输出为 amount=2，下游约定金额一律按元解释，导致数量级错误… |
| B2-P03 | [prompt-m036](../../data/mock/prompt.json) | 单选 | P1、P5 | 提示词要求“正文不超过 50 字”，又规定 5 个段落且每段至少 20 字，不允许省略。模型总违… |
| B2-P04 | [prompt-m037](../../data/mock/prompt.json) | 单选 | P2、P3 | 少样本库包含不同任务的示例。报销分类调用被塞入大量诗歌和翻译样例，分类标签反而漂移；相关分类样例… |
| B2-P05 | [prompt-m038](../../data/mock/prompt.json) | 单选 | P5 | 同一对回答交给 AI 裁判，调换展示顺序后它仍总选排第一的答案。参考标准未变，人工判断两答案各有… |
| B2-P06 | [prompt-m039](../../data/mock/prompt.json) | 单选 | P3、P5 | 提示词优化器把失败日志中的真实姓名与订单号抄进公共模板，后续所有用户都能看到。任务只需学习失败模… |
| B2-P07 | [prompt-m040](../../data/mock/prompt.json) | 单选 | P1、P3 | 翻译助手把用户提供的产品型号 X-01 改成了 X01，认为这样更自然。该字段必须与订单精确匹配… |
| B2-P08 | [prompt-m041](../../data/mock/prompt.json) | 多选 | P4 | 审核助手需要分别给出“原文摘录”和“改写建议”，但现在把建议写进摘录字段，造成来源不可核对。哪些… |
| B2-P09 | [prompt-m042](../../data/mock/prompt.json) | 多选 | P2 | 长合同的付款条款引用附件定义，团队打算让模型分段审查再汇总，但担心独立段落漏掉跨段条件。哪些设计… |
| B2-P10 | [prompt-m043](../../data/mock/prompt.json) | 多选 | P5 | 答案评测只要求是否含退款二字，长篇无关回答也常被判通过。团队希望裁判真正检查业务完成情况，哪些调… |
| B2-P11 | [prompt-m044](../../data/mock/prompt.json) | 多选 | P1、P4 | 一个模板供多个部门使用，部门名称、语气和输出字段经常人工复制修改，出现旧字段残留。保持同一业务规… |
| B2-R01 | [rag-m046](../../data/mock/rag.json) | 单选 | R1、R2 | 知识库多个章节都叫“注意事项”，切片正文都以先检查环境开头。用户问发布阶段注意事项，却召回需求分… |
| B2-R02 | [rag-m047](../../data/mock/rag.json) | 单选 | R1 | 扫描手册的 OCR 把型号 B18 识别为 818。系统准确召回并忠实回答解析文本，用户仍指出型… |
| B2-R03 | [rag-m048](../../data/mock/rag.json) | 单选 | R2、R3 | 检索前十条中有八条来自同一 FAQ 的重复副本，例外规定被挤出最终上下文。副本内容一致，重复导入… |
| B2-R04 | [rag-m049](../../data/mock/rag.json) | 单选 | R3 | 产品查询能在无过滤的候选中找到目标手册，但加了 product_id 过滤后为空。日志显示查询提… |
| B2-R05 | [rag-m050](../../data/mock/rag.json) | 单选 | R6 | 知识库源文件已删除，问答仍能召回其旧切片。日志确认向量库中的记录未删，其他文档索引正常。最合理的… |
| B2-R06 | [rag-m051](../../data/mock/rag.json) | 单选 | R5 | 助手上一轮误称补贴上限为 900 元。用户追问“这个金额依据在哪”，查询改写器把900设为必须包… |
| B2-R07 | [rag-m052](../../data/mock/rag.json) | 单选 | R1、R3 | 用户比较产品甲乙的质保范围，相关文档均存在。最终上下文前五条全是甲的高相似片段，乙未进入，回答因… |
| B2-R08 | [rag-m053](../../data/mock/rag.json) | 单选 | R3 | 更换重排模型后分数整体变小，团队沿用旧模型0.8阈值，过滤了很多人工确认相关的片段。新旧分数标尺… |
| B2-R09 | [rag-m054](../../data/mock/rag.json) | 单选 | R4 | 某回答逐字复述检索资料，Faithfulness 很高，但资料本身把现行费率写错，专家答案因此判… |
| B2-R10 | [rag-m055](../../data/mock/rag.json) | 单选 | R5 | 知识库有“按工作地”与“按出差目的地”两类补贴规则。用户明确问深圳常驻员工的本地通勤补贴，改写器… |
| B2-R11 | [rag-m056](../../data/mock/rag.json) | 多选 | R6 | 一份技术报告同时有公共段落与仅研发可见的附录。当前权限标签只放在文档根节点，部分附录切片入库时丢… |
| B2-R12 | [rag-m057](../../data/mock/rag.json) | 多选 | R4 | 评测集中一半问题是近乎相同的常见 FAQ，长尾业务几乎没有。系统总分很高，长尾投诉却持续。哪些改… |
| B2-R13 | [rag-m058](../../data/mock/rag.json) | 多选 | R1、R6 | 短切片正确命中甲文档，扩展窗口却取回乙文档的段落。排查发现两份文档复用了相同切片编号，程序只按编… |
| B2-R14 | [rag-m059](../../data/mock/rag.json) | 多选 | R6 | 制度文档更新后，答案引用编号仍能打开，却指向上周旧快照。团队需要追溯用户当时究竟看到了哪个版本，… |
| B2-R15 | [rag-m060](../../data/mock/rag.json) | 多选 | R3、R5 | 团队准备将专业词汇改写为同义短语来改善检索，但词库中编号与否定条件必须保持。哪些验证合理？… |
| B2-F01 | [finetune-m037](../../data/mock/finetune.json) | 单选 | F2 | 工单中普通咨询占98%，冻结账号占2%。模型总输出普通咨询，总准确率仍98%，但冻结请求全部漏掉… |
| B2-F02 | [finetune-m038](../../data/mock/finetune.json) | 单选 | F2 | SFT 样本角色和标签内容正确，但训练掩码把所有 assistant 回答都排除在损失之外，只训… |
| B2-F03 | [finetune-m039](../../data/mock/finetune.json) | 单选 | F2、F5 | 长工单训练时被统一截断到固定长度，日志显示很多样本尾部的正确答案被全部切掉。业务任务需要这些长工… |
| B2-F04 | [finetune-m040](../../data/mock/finetune.json) | 单选 | F3 | 训练中断后，团队只加载导出的权重重新初始化优化器，声称这与从完整 checkpoint 精确续训… |
| B2-F05 | [finetune-m041](../../data/mock/finetune.json) | 单选 | F3 | 同架构两个基座版本参数形状相同，LoRA 只在版本甲上训练。部署时误挂到版本乙，加载无报错但效果… |
| B2-F06 | [finetune-m042](../../data/mock/finetune.json) | 单选 | F2、F3 | 一轮 LoRA 实验日志显示可训练参数数为0，所有权重梯度都被禁用。损失可计算但参数始终不变。下… |
| B2-F07 | [finetune-m043](../../data/mock/finetune.json) | 单选 | F2 | 两个模型在不同分词器、不同验证文本上分别得到平均损失0.8与1.1。团队仅凭0.8较低就判断其目… |
| B2-F08 | [finetune-m044](../../data/mock/finetune.json) | 单选 | F1、F5 | 分类模型只训练过四个业务标签，新政策新增第五类。旧模型仍把新类强行归到原四类，JSON 完全合规… |
| B2-F09 | [finetune-m045](../../data/mock/finetune.json) | 多选 | F2、F5 | 团队对低频高风险类过采样后训练，但希望验证真实上线表现。哪些做法合理？… |
| B2-F10 | [finetune-m046](../../data/mock/finetune.json) | 多选 | F3 | 微调模型量化后部署，显存下降，但部分专业术语提取变差。团队不能明显牺牲这些关键任务质量。哪些验证… |
| B2-F11 | [finetune-m047](../../data/mock/finetune.json) | 多选 | F3 | 两张卡训练，每卡 micro-batch 从2降为1，梯度累积从2步升为4步。本题有效批量为卡数… |
| B2-F12 | [finetune-m048](../../data/mock/finetune.json) | 多选 | F2 | 学生输出的两个意图顺序与标准答案相反，但集合完全相同；评测脚本按整段 JSON 字符串完全匹配判… |
| B2-G01 | [agent-mm-m037](../../data/mock/agent-mm.json) | 单选 | G4 | 三个 SubAgent 分别检查安全、性能和成本，安全代理超时未返回。汇总器却将另外两份报告拼成… |
| B2-G02 | [agent-mm-m038](../../data/mock/agent-mm.json) | 单选 | G2 | MCP Server 更新了工具参数，客户端仍缓存旧清单，持续生成已废弃字段；直接读取服务器新清… |
| B2-G03 | [agent-mm-m039](../../data/mock/agent-mm.json) | 单选 | G1、G2 | 订单查询工具返回明确错误码“订单不存在”，Agent 却给用户回复已成功查询且配送中。工具没有网… |
| B2-G04 | [agent-mm-m040](../../data/mock/agent-mm.json) | 单选 | G2 | ReAct Agent 对同一不存在的订单反复调用查询工具，输入、返回值均未变化，也无新的信息来… |
| B2-G05 | [agent-mm-m041](../../data/mock/agent-mm.json) | 单选 | G5 | Agent 启动时把二十个 Skill 的所有脚本说明与参考全文一次性装进上下文，当前只做发票抽… |
| B2-G06 | [agent-mm-m042](../../data/mock/agent-mm.json) | 单选 | G5 | 写作助手读到用户提供的小说片段“我喜欢危险驾驶”，就把它写为该用户的长期偏好。用户其实只是要求改… |
| B2-G07 | [agent-mm-m043](../../data/mock/agent-mm.json) | 单选 | G3 | 用户取消任务后，协调者已停止对话，但后台 Worker 仍准备调用外部发布工具。应用支持在调用前… |
| B2-G08 | [agent-mm-m044](../../data/mock/agent-mm.json) | 单选 | G7 | 视频巡检每10秒抽一帧，漏掉原视频中一次持续0.5秒的阀门动作。业务已确认动作所在时间段，并允许… |
| B2-G09 | [agent-mm-m045](../../data/mock/agent-mm.json) | 多选 | G6 | 验证器发现上一次运行的截图文件仍存在，就把本次网页验收判为通过；本次其实没有打开页面。哪些验证设… |
| B2-G10 | [agent-mm-m046](../../data/mock/agent-mm.json) | 多选 | G1、G2 | 两个只读工具可独立并行查询库存和物流，库存成功而物流超时。业务允许部分结果先展示。哪些处理合理？… |
| B2-G11 | [agent-mm-m047](../../data/mock/agent-mm.json) | 多选 | G2 | 第三方 MCP Server 把一个删除工具标注成只读，应用打算仅凭该提示自动放行所有调用。哪些… |
| B2-G12 | [agent-mm-m048](../../data/mock/agent-mm.json) | 多选 | G4 | 多个 Agent 同时改共享计划，后写入者覆盖了另一代理新增的关键步骤。各自草稿均正确，但合并结… |
| B2-D01 | [production-m037](../../data/mock/production.json) | 单选 | D3 | 平均延迟保持2秒，但晚高峰有5%的请求超过20秒，用户大量投诉。团队只看平均值认定满足性能目标。… |
| B2-D02 | [production-m038](../../data/mock/production.json) | 单选 | D2 | 库存助手对同一问题缓存一天，早上还有货、下午售罄，系统仍答有货。权限隔离正常，业务要求接近实时库… |
| B2-D03 | [production-m039](../../data/mock/production.json) | 单选 | D3 | 模型 API 临时失败时，SDK 最多尝试3次，外层网关对整个SDK调用也最多尝试3次。忽略其他… |
| B2-D04 | [production-m040](../../data/mock/production.json) | 单选 | D1、D3 | 主模型与备用模型部署在同一故障区域，还共用同一个不可用网关。演练中切模型没有恢复服务。以下容灾改… |
| B2-D05 | [production-m041](../../data/mock/production.json) | 单选 | D3 | 模型实例进程启动即被负载均衡接流，但权重加载和首次预热还要数十秒，新实例持续超时。已有空闲算力，… |
| B2-D06 | [production-m042](../../data/mock/production.json) | 单选 | D4 | 业务库已加密，但监控链路把完整用户材料写入普通日志，备份长期明文保留。安全评审应怎样判断？… |
| B2-D07 | [production-m043](../../data/mock/production.json) | 单选 | D2 | 两模型质量和SLO均达标，每次输入1000、输出500 Token。假设甲输入2元/百万、输出8… |
| B2-D08 | [production-m044](../../data/mock/production.json) | 单选 | D6 | 试点只选简单咨询，效果很好；计划推广到含复杂投诉的全部工单，但这类流程尚未验证。预算允许继续小规… |
| B2-D09 | [production-m045](../../data/mock/production.json) | 多选 | D2、D3 | 模型服务报警预算即将用尽，但业务只关心页面访问量，无法定位实际消耗来源。哪些成本归因方式合理？… |
| B2-D10 | [production-m046](../../data/mock/production.json) | 多选 | D3 | 同一日志错误被多个服务各重试，系统越忙失败越多。哪些稳定性设计有助于控制扩散？… |
| B2-D11 | [production-m047](../../data/mock/production.json) | 多选 | D4 | 安全分类器上线后，正常用户被误拦的比例上升；高风险请求也有漏检。团队要调整策略，哪些评估合理？… |
| B2-D12 | [production-m048](../../data/mock/production.json) | 多选 | D6 | 团队展示演示效果后就要承诺全面提效，尚未记录旧流程耗时、错误率和人工接管量。哪些落地准备合理？… |

## 3. 大纲映射

本批直接补充 32 项核心知识点的场景变式；未新增题例的项目仍由已有题覆盖，不把同一主题重复计为新能力。基线审计及第一批题例见 [V4 覆盖表](mock-v4.md)和[第一批索引](mock-v4-batch1.md)。

| 大纲项 | 核心知识点 | 第二批题号 |
|---|---|---|
| A1 | 大模型基本工作方式 | app-dev-m048、app-dev-m051 |
| A2 | 核心参数与输出控制 | app-dev-m041、app-dev-m043、app-dev-m047、app-dev-m048 |
| A3 | 多轮对话与流式输出 | app-dev-m042、app-dev-m044、app-dev-m049、app-dev-m050 |
| A4 | 上下文窗口与幻觉应对 | app-dev-m051 |
| A5 | API 安全管理与 Token 计费 | app-dev-m040、app-dev-m045、app-dev-m046、app-dev-m050、app-dev-m052 |
| P1 | 系统提示词设计 | prompt-m035、prompt-m036、prompt-m040、prompt-m044 |
| P2 | 上下文工程 | prompt-m037、prompt-m042 |
| P3 | 思维链、Meta Prompting、Few-shot | prompt-m037、prompt-m039、prompt-m040 |
| P4 | 结构化输出与格式控制 | prompt-m034、prompt-m035、prompt-m041、prompt-m044 |
| P5 | 提示词的适用边界与局限 | prompt-m036、prompt-m038、prompt-m039、prompt-m043 |
| R1 | RAG 全链路：索引、检索、增强、生成 | rag-m046、rag-m047、rag-m052、rag-m058 |
| R2 | 文本切分策略与检索质量 | rag-m046、rag-m048 |
| R3 | 检索效果诊断与重排序 | rag-m048、rag-m049、rag-m052、rag-m053、rag-m060 |
| R4 | 专家引导评测体系建设 | rag-m054、rag-m057 |
| R5 | 多轮对话场景下的检索适配 | rag-m051、rag-m055、rag-m060 |
| R6 | 知识库运维：更新、权限、版本管理 | rag-m050、rag-m056、rag-m058、rag-m059 |
| F1 | 微调适用场景判断 | finetune-m044 |
| F2 | 训练基础：梯度下降、损失函数、过拟合与欠拟合 | finetune-m037、finetune-m038、finetune-m039、finetune-m042、finetune-m043、finetune-m045、finetune-m048 |
| F3 | LoRA 微调与训练调参 | finetune-m040、finetune-m041、finetune-m042、finetune-m046、finetune-m047 |
| F4 | 蒸馏路径：数据合成、知识蒸馏、推理压缩 | 本批未新增；沿用已有题例 |
| F5 | 训练数据合成与成本收益分析 | finetune-m039、finetune-m044、finetune-m045 |
| G1 | Function Calling 机制 | agent-mm-m039、agent-mm-m046 |
| G2 | ReAct 循环与 MCP 协议 | agent-mm-m038、agent-mm-m039、agent-mm-m040、agent-mm-m046、agent-mm-m047 |
| G3 | 固定流程 vs 自主规划 | agent-mm-m043 |
| G4 | SubAgent 分层协作模式 | agent-mm-m037、agent-mm-m048 |
| G5 | 记忆体系与 Skill 应用 | agent-mm-m041、agent-mm-m042 |
| G6 | Harness Engineering 与闭环验证 | agent-mm-m045 |
| G7 | 多模态 API 调用与端到端应用架构 | agent-mm-m044 |
| D1 | 部署方案选型 | production-m040 |
| D2 | 推理成本控制 | production-m038、production-m043、production-m045 |
| D3 | 生产稳定性保障 | production-m037、production-m039、production-m040、production-m041、production-m045、production-m046 |
| D4 | 构建安全体系：内容安全、注入防护、纵深防御、合规备案 | production-m042、production-m047 |
| D5 | 评测驱动开发 | 本批未新增；沿用已有题例 |
| D6 | AI 应用落地方法 | production-m044、production-m048 |

## 4. 来源核查与工程应用边界

正式 source 沿用真实课程章节。下列文档补充本地教程未展开的协议或机制，查询于本批编写期间；题中明确的价格、概率、比例和业务情境均为给定条件，不代表产品现价或线上真实事故。

- [百炼 Chat Completions API](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)：app-dev-m041 的停止串与终止原因。app-dev-m040 的计费由题干明确限定为实际用量收费，不泛化为所有模型服务的计费规则。
- [百炼流式输出](https://help.aliyun.com/zh/model-studio/stream)：app-dev-m042 的增量拼接、m050 的用量事件与请求关联。
- [百炼 API Key 与地域](https://help.aliyun.com/zh/model-studio/get-api-key)：app-dev-m046 的域名、凭据和模型地域匹配。
- [LLM-as-a-Judge 原始研究](https://arxiv.org/abs/2306.05685)：prompt-m038 的位置偏差；只考偏差识别与验证，不将论文某一基准成绩当作通用保证。
- [Pinecone 删除数据](https://docs.pinecone.io/guides/manage-data/delete-data)：rag-m050 的源文件与索引记录删除区别；不声称所有向量库都自动同步源目录。
- [Hugging Face SFT Trainer](https://huggingface.co/docs/trl/sft_trainer)：finetune-m038、m039 的监督范围及训练序列截断检查；题目给定掩码或截断结果，不要求记框架参数名。
- [Hugging Face Trainer](https://huggingface.co/docs/transformers/main_classes/trainer)：finetune-m040 的恢复训练状态及 m047 的批量与累积策略；题中直接给出有效批量公式，不预设特定多卡实现。
- [分类指标定义](https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics)：finetune-m037、m045 的类别指标与分布视角；同时对照课程4.1的评测说明。
- [MCP Tools 规范](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)：agent-mm-m038 的工具清单更新、m047 的第三方注解可信边界；第三方注解不能自动授予应用权限。
- 其他根因与处置对照课程2.1、2.3、2.4、2.5、3.1至3.8、4.1至4.4及5.1现有正文。并发会话次序、父段关联键、跨阶段状态等是对题给日志的工程应用，不冒充某款产品自动具备的功能。

## 5. 计算、去重与兼容核查

- app-dev-m048 按题定累计概率规则，0.60不足0.80，加第二项达到0.85，保留前两项；不把概率质量混为候选数量。
- finetune-m047 的有效批量：调整前2×2×2＝8，调整后2×1×4＝8；不据此保证训练质量必然不变。
- production-m039 的两层尝试均包含首次，每层最多3次，最坏3×3＝9次。
- production-m043 按题给百万Token费率，甲为0.006元，乙为0.007元；不能只比较输入单价。
- 初稿 rag-m058 与旧rag-m032过近，已改为跨文档切片编号冲突导致父段误配，检查关联键与来源一致性，根因不再是缺少窗口扩展。
- agent-mm-m040 明确检测相同调用和观察的无进展循环，与旧m014的质量评分迭代停止条件区分。
- 所有新增题保留四个选项、一个或二至三个答案及来源；严格校验未放宽答案分布、最长选项、重复编号与来源约束。
- 新题仍由现有数据加载、按权重组卷、解析、错题本与离线预缓存使用，无需另建页面或修改评分规则。当前总题量300不等于连续四场绝无重复，算法仍只避开上一场。

## 6. 验证记录

严格校验、单元测试、四种手机视口端到端测试和站点体积结果统一记录于 [实施计划](../superpowers/plans/2026-11-02-v4-mock-expansion.md)。当前缓存版本为acp-v19。第二批沿用上一批确认的 main 合并与 GitHub Pages 发布流程，线上生效以对应部署记录及文件核验为准。
