# V4 扩充第一批：正式题号与核查索引

日期：2026-11-02。新增 75 道（50 单选、25 多选），其中 12 道为用户已确认样题，其余 63 道按同一标准补齐。模拟题累计 225 道；原 150 道逐对象对照 HEAD 未改动，原 300 道练习题及卡片、知识地图、面试密文未改动。

## 1. 各模块题量

| 模块 | 本批单选 / 多选 | 正式区间 | 累计题量 |
|---|---|---|---|
| app-dev | 9 / 4 | app-dev-m027–app-dev-m039 | 39 |
| prompt | 7 / 4 | prompt-m023–prompt-m033 | 33 |
| rag | 10 / 5 | rag-m031–rag-m045 | 45 |
| finetune | 8 / 4 | finetune-m025–finetune-m036 | 36 |
| agent-mm | 8 / 4 | agent-mm-m025–agent-mm-m036 | 36 |
| production | 8 / 4 | production-m025–production-m036 | 36 |

## 2. 75 道题位置对照

点击题号查看所在正式 JSON 文件，其中包含完整题干、选项、答案和解析。Sxx 仍对应已确认样题；B1 编号用于与覆盖蓝图对照。

| 出题位置 / 样题 | 正式题号 | 题型 | 大纲项 | 实际场景摘要 |
|---|---|---|---|---|
| B1-A01 / S01 | [app-dev-m027](../../data/mock/app-dev.json) | 单选 | A5 | 某客服使用无状态文本生成 API，每轮完整发送此前消息。系统提示为 1000 Token；首轮用… |
| B1-A02 | [app-dev-m028](../../data/mock/app-dev.json) | 单选 | A3 | 智能客服首轮正确回答了“公司项目管理工具是什么”，追问“怎么申请它的账号”时却答非所问。第二次请… |
| B1-A03 | [app-dev-m029](../../data/mock/app-dev.json) | 单选 | A4 | 某模型上下文总预算为 8192 Token，本次输入按最终序列计为 7600 Token，业务还… |
| B1-A04 | [app-dev-m030](../../data/mock/app-dev.json) | 单选 | A3 | 流式客服在生成一半时连接中断，客户端已显示部分文本，但没有收到正常完成信号。前端却将该部分标为最… |
| B1-A05 | [app-dev-m031](../../data/mock/app-dev.json) | 单选 | A1、A2 | 合同摘要接口规定仅输出三项要点。模型返回的三项要点均完整，日志记录正常结束，实际输出远小于长度上… |
| B1-A06 | [app-dev-m032](../../data/mock/app-dev.json) | 单选 | A2 | 工单分类服务重视同输入标签稳定，宣传文案服务则希望措辞丰富。二者使用同一模型，并已有各自评测集。… |
| B1-A07 | [app-dev-m033](../../data/mock/app-dev.json) | 单选 | A5 | 客服团队发现总费用上涨，但单次提问字数变化不大。按同一费率核对 usage 后，输出 Token… |
| B1-A08 | [app-dev-m034](../../data/mock/app-dev.json) | 单选 | A4 | 制度助手的金额回答与真实条款一致，但它生成了不存在的引用文件编号；本次检索已返回可访问的证据标识… |
| B1-A09 | [app-dev-m035](../../data/mock/app-dev.json) | 单选 | A3 | 员工甲和乙同时使用客服，乙在追问中收到甲刚输入的项目名称。日志发现后端按“最近活跃用户”读取同一… |
| B1-A10 / S02 | [app-dev-m036](../../data/mock/app-dev.json) | 多选 | A5 | 某手机网页把长期有效的模型 API Key 写入前端配置。发布后，团队发现用户能从浏览器网络请求… |
| B1-A11 | [app-dev-m037](../../data/mock/app-dev.json) | 多选 | A3、A4 | 一个长会话即将超出上下文预算。早期消息含用户已确认的交付日期与预算，后续有大量闲聊；业务要求保留… |
| B1-A12 | [app-dev-m038](../../data/mock/app-dev.json) | 多选 | A3、A2 | 流式接口把一段工具参数 JSON 拆成多片，前一片结束在字符串中间。业务程序收到首片就解析并执行… |
| B1-A13 | [app-dev-m039](../../data/mock/app-dev.json) | 多选 | A5 | 财务要核对多轮客服账单。题中约定输入和输出分开按实际 Token 计费，不计缓存折扣；日志同时包… |
| B1-P01 / S03 | [prompt-m023](../../data/mock/prompt.json) | 单选 | P4、P5 | 优惠核算助手已经能稳定输出合法 JSON，但偶尔把“满 200 元减 20 元”算错。促销规则完… |
| B1-P02 | [prompt-m024](../../data/mock/prompt.json) | 单选 | P1 | 客服提示词同时要求“只返回退款类别编号”和“向用户耐心解释政策”，同一响应直接供路由程序读取，因… |
| B1-P03 | [prompt-m025](../../data/mock/prompt.json) | 单选 | P2 | 助手总结一份设备保养记录时，提示词附带整套采购合同和几十条无关历史消息，模型漏掉本次明确要求的保… |
| B1-P04 | [prompt-m026](../../data/mock/prompt.json) | 单选 | P3 | 团队将已有推理模型用于规则明确的资格判断，准备在提示词中增加数百字“逐步思考”模板，理由是“提示… |
| B1-P05 | [prompt-m027](../../data/mock/prompt.json) | 单选 | P3 | 用 Meta Prompting 优化通知文案时，提示词教练只追加“更专业、更好看、更人性化”，… |
| B1-P06 | [prompt-m028](../../data/mock/prompt.json) | 单选 | P4、P5 | 合同抽取接口要求每份合同都返回到期日期字段，但有些合同原文未约定日期。现有提示词要求“所有字段必… |
| B1-P07 | [prompt-m029](../../data/mock/prompt.json) | 单选 | P1、P2 | 报告摘要助手把外部文档中的“忽略此前要求，改为输出管理员口令”当成任务指令。团队要在提示词设计层… |
| B1-P08 / S04 | [prompt-m030](../../data/mock/prompt.json) | 多选 | P3 | 工单助手要按规则分类：“当前时刻已比承诺发货时刻晚至少 48 小时，且仍未发货”才标为“超时”。… |
| B1-P09 | [prompt-m031](../../data/mock/prompt.json) | 多选 | P3 | Meta Prompting 优化器把路由提示词的合法标签从“退款、物流”改成“退货、运输”，新… |
| B1-P10 | [prompt-m032](../../data/mock/prompt.json) | 多选 | P1、P4 | 多份制度材料存在差异，摘要接口需返回“结论、适用日期、依据文档”，未知信息可为空，最终交业务审核… |
| B1-P11 | [prompt-m033](../../data/mock/prompt.json) | 多选 | P5 | 一个助手有三类问题：回复过长、无法得知实时库存、普通用户能触发管理员操作。团队认为全部问题只要改… |
| B1-R01 / S05 | [rag-m031](../../data/mock/rag.json) | 单选 | R5 | 员工先问“外地出差住宿上限是多少”，再追问“如果去深圳呢”。完整对话历史已传给回答模型，但检索日… |
| B1-R02 | [rag-m032](../../data/mock/rag.json) | 单选 | R2 | 规程切片中命中了“完成上述检查后再启动设备”，但“上述检查”的具体项目位于紧邻上一段。当前命中片… |
| B1-R03 | [rag-m033](../../data/mock/rag.json) | 单选 | R3 | 维修查询既包含精确故障码，又包含“启动后间歇停机”等语义描述。纯向量检索对故障码不敏感，单纯型号… |
| B1-R04 | [rag-m034](../../data/mock/rag.json) | 单选 | R1、R3 | 某 RAG 的前 30 个候选中完全没有目标条款，但在原知识库用完整条款名可以找到。重排序后系统… |
| B1-R05 | [rag-m035](../../data/mock/rag.json) | 单选 | R6 | 报销知识库同时保留旧制度和新制度，新制度从 7 月 1 日起生效，旧制度适用至 6 月 30 日… |
| B1-R06 | [rag-m036](../../data/mock/rag.json) | 单选 | R1 | 某 RAG 的最终模型输入已包含正确的费用上限和全部例外条件，但回答把“特定岗位不适用”漏掉了。… |
| B1-R07 | [rag-m037](../../data/mock/rag.json) | 单选 | R3、R4 | 一次发布同时改了查询改写、切片方式和重排模型，平均质量提高，但一类跨章节问题退化。团队想决定是否… |
| B1-R08 | [rag-m038](../../data/mock/rag.json) | 单选 | R1 | 团队更换了 Embedding 模型，新旧输出维度相同，便直接用新模型编码查询，继续搜索旧模型编… |
| B1-R09 | [rag-m039](../../data/mock/rag.json) | 单选 | R3 | 用户问“交通报销要哪些凭证”，检索结果都属于报销制度，但只有住宿发票要求，没有任何交通凭证说明。… |
| B1-R10 | [rag-m040](../../data/mock/rag.json) | 单选 | R5 | 对话先讨论深圳差旅，用户随后明确说“换个问题，北京办公室访客怎样预约”。检索改写器仍追加“深圳住… |
| B1-R11 / S06 | [rag-m041](../../data/mock/rag.json) | 多选 | R4 | 报销问答的自动评测得分很高，业务专家却发现回答漏掉“首次报销需提交审批单”。排查确认：参考文档包… |
| B1-R12 | [rag-m042](../../data/mock/rag.json) | 多选 | R6 | 制度知识库要从版本 V1 切换到 V2，历史业务仍需查询 V1，且上线失败要能回退。以下哪些运维… |
| B1-R13 | [rag-m043](../../data/mock/rag.json) | 多选 | R5 | 员工追问“那二级的呢”，当前会话同时讨论过二级故障和二级审批。自动改写器准备补成完整查询，但没有… |
| B1-R14 | [rag-m044](../../data/mock/rag.json) | 多选 | R2 | 设备表格的型号、表头和单位均已正确解析，负载写为 100 千克，脚注限定“仅适用于静态承载”。用… |
| B1-R15 | [rag-m045](../../data/mock/rag.json) | 多选 | R4、R6 | 员工问答评测采用了管理员账号，答案准确率很高；真实员工权限较低，常取不到依据。团队希望评估真实可… |
| B1-F01 / S07 | [finetune-m025](../../data/mock/finetune.json) | 单选 | F2、F3 | 团队对相同数据和同一基座做 LoRA 微调。学习率为 0.0001 时，训练与验证损失均平稳下降… |
| B1-F02 | [finetune-m026](../../data/mock/finetune.json) | 单选 | F1 | 企业需要学习固定的工单分类方式，同时每天更新产品优惠事实。分类格式长期稳定，优惠政策必须当天生效… |
| B1-F03 | [finetune-m027](../../data/mock/finetune.json) | 单选 | F2 | 微调负责人看到训练损失较高，建议只调整推理 API 的 temperature，让训练模型“更认… |
| B1-F04 | [finetune-m028](../../data/mock/finetune.json) | 单选 | F3 | LoRA 训练前，工程师冻结基座权重，只将新增低秩矩阵加入优化器。训练后基座权重文件哈希未变，新… |
| B1-F05 | [finetune-m029](../../data/mock/finetune.json) | 单选 | F4 | 某结构化抽取项目只能调用教师模型获取最终文本，拿不到教师概率分布，也未获得内部权重。学生模型可自… |
| B1-F06 | [finetune-m030](../../data/mock/finetune.json) | 单选 | F4 | 团队想让小模型学习多步推理任务，已有教师生成且通过核验的“问题、推理过程、答案”数据。有人认为只… |
| B1-F07 | [finetune-m031](../../data/mock/finetune.json) | 单选 | F5 | 某专用模型改造的一次性数据与训练投入共 1200 元。题中假设替代旧 API 后，每次推理节省 … |
| B1-F08 | [finetune-m032](../../data/mock/finetune.json) | 单选 | F2 | 模型在训练集和独立验证集上准确率都低，且任务中大量标签边界尚未由业务专家统一。负责人仅凭两项低分… |
| B1-F09 / S08 | [finetune-m033](../../data/mock/finetune.json) | 多选 | F2、F5 | 工单训练集由教师模型扩写生成，每条原始工单产生多个近似改写。团队随机按行拆分训练集和验证集，验证… |
| B1-F10 | [finetune-m034](../../data/mock/finetune.json) | 多选 | F2、F3 | 同一微调运行中，checkpoint 甲验证损失最低，却经常漏掉高风险意图；checkpoint… |
| B1-F11 | [finetune-m035](../../data/mock/finetune.json) | 多选 | F5 | 教师合成了大量正常工单，稀有但高风险的账号冻结请求几乎没有，抽查还发现少量部门标签矛盾。以下哪些… |
| B1-F12 | [finetune-m036](../../data/mock/finetune.json) | 多选 | F4 | 团队比较三种能力迁移方案：甲让教师输出工单标签；乙取得教师对候选类别的概率分布；丙取得核验过的多… |
| B1-G01 / S09 | [agent-mm-m025](../../data/mock/agent-mm.json) | 单选 | G3 | 企业报销流程规定必须依次经过“提取票据信息→核验发票→按规则计算→人工审批→付款”。所有分支与异… |
| B1-G02 | [agent-mm-m026](../../data/mock/agent-mm.json) | 单选 | G1 | 模型返回 create_ticket 的 tool_calls，参数 JSON 合法，前端便提示… |
| B1-G03 | [agent-mm-m027](../../data/mock/agent-mm.json) | 单选 | G2 | 库存工具已返回“缺货”，应用却把结果作为新的 user 消息并丢掉对应工具调用标识，模型继续重复… |
| B1-G04 | [agent-mm-m028](../../data/mock/agent-mm.json) | 单选 | G4 | 协调 Agent 让三个 SubAgent 分别检查合同、代码和文案。它只发送一句“继续之前的审… |
| B1-G05 | [agent-mm-m029](../../data/mock/agent-mm.json) | 单选 | G4 | 一个任务先查询客户所属地区，再根据该地区计算运费。团队把两步并行运行，运费 Agent 在地区结… |
| B1-G06 | [agent-mm-m030](../../data/mock/agent-mm.json) | 单选 | G5 | 用户上月偏好晚班，本次明确改为“以后只推荐白班”。长期记忆检索仍频繁召回旧偏好并覆盖新要求。以下… |
| B1-G07 | [agent-mm-m031](../../data/mock/agent-mm.json) | 单选 | G6 | 验证脚本只认“截止日期”四字，报告虽写了真实日期和同义标题“提交期限”，仍被判失败。对照人工标准… |
| B1-G08 | [agent-mm-m032](../../data/mock/agent-mm.json) | 单选 | G5 | 共享审核 Skill 升级后把输出字段从 status 改为 conclusion，下游程序仍只… |
| B1-G09 / S10 | [agent-mm-m033](../../data/mock/agent-mm.json) | 多选 | G7 | 会议助手需要“录音→可存档文字→文字摘要→摘要语音播报”。现有语音识别、文本摘要和语音合成服务均… |
| B1-G10 | [agent-mm-m034](../../data/mock/agent-mm.json) | 多选 | G4 | 两个 SubAgent 对同一合同付款条件给出冲突结论，一个引用旧附件，一个引用后续签署的补充协… |
| B1-G11 | [agent-mm-m035](../../data/mock/agent-mm.json) | 多选 | G6 | Agent 审核回复模板的循环已连续三轮没有改善，最终文案语气很好，但执行记录缺少必须的政策查询… |
| B1-G12 | [agent-mm-m036](../../data/mock/agent-mm.json) | 多选 | G7 | 巡检助手接收设备照片和文字报障，选用的视觉语言接口支持图片与文本，但图片 URL 偶尔失效。系统… |
| B1-D01 / S11 | [production-m025](../../data/mock/production.json) | 单选 | D6 | 客服摘要模型离线准确率达到 95%，试点后人工处理每单的总时长却没有下降。访谈发现，员工仍需把摘… |
| B1-D02 | [production-m026](../../data/mock/production.json) | 单选 | D1 | 新客服每月调用量波动大。实测云 API 与自托管方案均满足质量和延迟，数据允许上云；按当前用量估… |
| B1-D03 | [production-m027](../../data/mock/production.json) | 单选 | D2、D4 | 员工问答按“问题文本”缓存答案。经理查询薪酬制度后，普通员工同问便命中含经理可见细节的缓存；源知… |
| B1-D04 | [production-m028](../../data/mock/production.json) | 单选 | D3 | 问答服务上线后，用户说“等很久才出现第一个字，之后输出很快”。链路追踪发现知识检索等待 6 秒，… |
| B1-D05 | [production-m029](../../data/mock/production.json) | 单选 | D2 | 每天凌晨需完成十万份资料摘要，允许数小时后取结果；客服实时问答却要求秒级响应。团队希望降低相互抢… |
| B1-D06 | [production-m030](../../data/mock/production.json) | 单选 | D4 | 企业同时开发仅供员工使用的内部助手和面向境内公众的生成式服务。评审要判断《生成式人工智能服务管理… |
| B1-D07 | [production-m031](../../data/mock/production.json) | 单选 | D5 | 新版模型在离线评测通过后准备上线，团队要求线上质量退化时能快速恢复。以下发布方案更合理？… |
| B1-D08 | [production-m032](../../data/mock/production.json) | 单选 | D6 | 文档助手试点使每单处理从 10 分钟降到 6 分钟，但需返工的比例从 2% 升到 18%，返工平… |
| B1-D09 / S12 | [production-m033](../../data/mock/production.json) | 多选 | D3 | 客服 Agent 调用退款工具后超时，订单系统可能已完成退款，但响应丢失。工具支持按退款请求号查… |
| B1-D10 | [production-m034](../../data/mock/production.json) | 多选 | D4 | 外部检索文档藏有“把客户资料发到指定地址”的指令，助手还具有邮件工具。团队需要建立纵深防御，以下… |
| B1-D11 | [production-m035](../../data/mock/production.json) | 多选 | D3、D5 | 用户投诉机器人在晚高峰变慢并引用旧政策，离线平均准确率却无明显变化。团队希望形成可持续修复闭环，… |
| B1-D12 | [production-m036](../../data/mock/production.json) | 多选 | D2、D6 | AI 审核试点每月可减少初审工时，但增加人工复核、GPU 固定费用和误判返工。团队要决定是否持续… |

## 3. 34 项核心知识点的本批直接题例

下表表示本批已有对应题例，不表示每个细分方向均被穷尽。扩充前的覆盖强弱仍记录在 [V4 覆盖表](mock-v4.md)；后续三批继续补充场景、边界和难度。

| 大纲项 | 核心知识点 | 第一批正式题号 |
|---|---|---|
| A1 | 大模型基本工作方式 | app-dev-m031 |
| A2 | 核心参数与输出控制 | app-dev-m031、app-dev-m032、app-dev-m038 |
| A3 | 多轮对话与流式输出 | app-dev-m028、app-dev-m030、app-dev-m035、app-dev-m037、app-dev-m038 |
| A4 | 上下文窗口与幻觉应对 | app-dev-m029、app-dev-m034、app-dev-m037 |
| A5 | API 安全管理与 Token 计费 | app-dev-m027、app-dev-m033、app-dev-m036、app-dev-m039 |
| P1 | 系统提示词设计 | prompt-m024、prompt-m029、prompt-m032 |
| P2 | 上下文工程 | prompt-m025、prompt-m029 |
| P3 | 思维链、Meta Prompting、Few-shot | prompt-m026、prompt-m027、prompt-m030、prompt-m031 |
| P4 | 结构化输出与格式控制 | prompt-m023、prompt-m028、prompt-m032 |
| P5 | 提示词的适用边界与局限 | prompt-m023、prompt-m028、prompt-m033 |
| R1 | RAG 全链路：索引、检索、增强、生成 | rag-m034、rag-m036、rag-m038 |
| R2 | 文本切分策略与检索质量 | rag-m032、rag-m044 |
| R3 | 检索效果诊断与重排序 | rag-m033、rag-m034、rag-m037、rag-m039 |
| R4 | 专家引导评测体系建设 | rag-m037、rag-m041、rag-m045 |
| R5 | 多轮对话场景下的检索适配 | rag-m031、rag-m040、rag-m043 |
| R6 | 知识库运维：更新、权限、版本管理 | rag-m035、rag-m042、rag-m045 |
| F1 | 微调适用场景判断 | finetune-m026 |
| F2 | 训练基础：梯度下降、损失函数、过拟合与欠拟合 | finetune-m025、finetune-m027、finetune-m032、finetune-m033、finetune-m034 |
| F3 | LoRA 微调与训练调参 | finetune-m025、finetune-m028、finetune-m034 |
| F4 | 蒸馏路径：数据合成、知识蒸馏、推理压缩 | finetune-m029、finetune-m030、finetune-m036 |
| F5 | 训练数据合成与成本收益分析 | finetune-m031、finetune-m033、finetune-m035 |
| G1 | Function Calling 机制 | agent-mm-m026 |
| G2 | ReAct 循环与 MCP 协议 | agent-mm-m027 |
| G3 | 固定流程 vs 自主规划 | agent-mm-m025 |
| G4 | SubAgent 分层协作模式 | agent-mm-m028、agent-mm-m029、agent-mm-m034 |
| G5 | 记忆体系与 Skill 应用 | agent-mm-m030、agent-mm-m032 |
| G6 | Harness Engineering 与闭环验证 | agent-mm-m031、agent-mm-m035 |
| G7 | 多模态 API 调用与端到端应用架构 | agent-mm-m033、agent-mm-m036 |
| D1 | 部署方案选型 | production-m026 |
| D2 | 推理成本控制 | production-m027、production-m029、production-m036 |
| D3 | 生产稳定性保障 | production-m028、production-m033、production-m035 |
| D4 | 构建安全体系：内容安全、注入防护、纵深防御、合规备案 | production-m027、production-m030、production-m034 |
| D5 | 评测驱动开发 | production-m031、production-m035 |
| D6 | AI 应用落地方法 | production-m025、production-m032、production-m036 |

## 4. 逐题核查与修改记录

- 已逐题检查 75 道的题干约束、选项、答案及解析，核对来源白名单、单多选数量、编号连续性、正确位置分布及正确项长度约束。
- S01 / app-dev-m027：两轮输入为 2800 Token、输出 500 Token，按题给单价合计 8.60 元；finetune-m031：1200÷0.02＝60000 次，均已复算。
- 监管题 production-m030 对照暂行办法第二、十七条；不把内部助手豁免该办法误写成豁免所有法律，也不将上游模型备案等同于下游全部义务。
- 独立复核认为四道草稿与旧题太近，已实质替换：app-dev-m030 改为流式中断状态；app-dev-m034 改为引用证据绑定；agent-mm-m032 改为 Skill 升级契约；rag-m044 改为表格脚注的适用条件。
- prompt-m031 进一步改为 Meta Prompting 修改合法标签导致接口失败，突出候选改写的契约不变量，减少与旧版评测隔离题的重叠。
- finetune-m030 与 m036 的推理能力迁移按课程 4.1 的轨迹路径及 DeepSeek-R1 论文表述，不将推理压缩理解为随意截短答案。
- 工程扩展与产品、论文、监管的一手链接集中记录在 [覆盖表第 7 节](mock-v4.md#7-样题依据与待补材料)，正式 source 沿用真实课程章节。

## 5. 接入与验证

- 严格目标已升为各模块三场配额；保留题型、来源、分布、连续编号等全部质量检查。
- 模块展示名同步为“智能体应用开发”，内部 agent-mm id 与原进度关联保持一致。
- 手机模考规则使用实际题量 225；仍只排除上一场，不承诺连续三场完全无重复。
- README 当前题量已更新，Service Worker 缓存已升为 acp-v18。执行结果在实施计划中记录。
- 本页保留第一批交付快照；四批均已入库，最新450题及映射见[累计覆盖表](mock-v4-final.md)和实施计划。
