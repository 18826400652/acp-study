# V4 扩充第四批：正式题号与核查索引

本批新增75道（50单选、25多选），累计450道（300单选、150多选）。沿用V4大纲及官网样题的业务场景、证据诊断、约束取舍题风。题中费率、资源量和业务数据均为给定的教学条件，不代表产品现价或真实事故。

已发布300道逐对象对照提交07298b9保持一致；第四批另与第三批375道快照对照。完整选项、答案、解析及课程来源见各模块JSON。

## 模块题量

| 模块 | 本批单选 / 多选 | 新题区间 | 累计总量 |
|---|---|---|---|
| app-dev | 9 / 4 | app-dev-m066–app-dev-m078 | 78 |
| prompt | 7 / 4 | prompt-m056–prompt-m066 | 66 |
| rag | 10 / 5 | rag-m076–rag-m090 | 90 |
| finetune | 8 / 4 | finetune-m061–finetune-m072 | 72 |
| agent-mm | 8 / 4 | agent-mm-m061–agent-mm-m072 | 72 |
| production | 8 / 4 | production-m061–production-m072 | 72 |

## 75道正式题号

| 本批位置 | 正式题号 | 题型 | 大纲项 | 场景与判断线索 |
|---|---|---|---|---|
| B4-A01 | [app-dev-m066](../../data/mock/app-dev.json) | 单选 | A4 | 某模型总上下文预算为16000 Token，最终输入12000，输出预算3000，协议开销已计入输入… |
| B4-A02 | [app-dev-m067](../../data/mock/app-dev.json) | 单选 | A3、A5 | 用户点击停止后网页不再显示文字，但后端仍保持生成请求直到结束，监控发现Token继续增加。要使停止动… |
| B4-A03 | [app-dev-m068](../../data/mock/app-dev.json) | 单选 | A3 | 模型服务正常返回多段流事件，某些事件只有角色或结束状态，没有正文。客户端遇到空正文立即终止，导致后续… |
| B4-A04 | [app-dev-m069](../../data/mock/app-dev.json) | 单选 | A1、A4 | 输入文本仅有200个汉字，团队按200 Token通过本地长度检查，模型接口却报告超出限制；实际请求… |
| B4-A05 | [app-dev-m070](../../data/mock/app-dev.json) | 单选 | A5 | 账单核对时，工程师把“输入2元/百万Token、输出8元/百万Token”误当成每千Token费率。… |
| B4-A06 | [app-dev-m071](../../data/mock/app-dev.json) | 单选 | A5 | 网关显示同一业务请求触发两次模型生成，两次均实际产生输入输出。题设供应商按每次实际用量收费。财务只记… |
| B4-A07 | [app-dev-m072](../../data/mock/app-dev.json) | 单选 | A3 | 本题流服务支持断线重连并重放最近事件，每个事件带稳定唯一ID。客户端把重放的相同ID正文再次追加，页… |
| B4-A08 | [app-dev-m073](../../data/mock/app-dev.json) | 单选 | A1、A2 | 一个生成步骤的词元概率依次0.5、0.3、0.2。题设top_k=2先保留前两项，再按它们总概率归一… |
| B4-A09 | [app-dev-m074](../../data/mock/app-dev.json) | 单选 | A3 | 应用把完整assistant历史消息删掉，只发送此前user消息和最新追问。用户问“你刚才方案二的缺… |
| B4-A10 | [app-dev-m075](../../data/mock/app-dev.json) | 多选 | A1、A5 | 团队比较不同模型在同一份中文材料上的调用成本。哪些比较方式合理？… |
| B4-A11 | [app-dev-m076](../../data/mock/app-dev.json) | 多选 | A5 | 生产服务需要轮换模型API密钥，旧密钥仍被两个后台任务引用。哪些步骤合理？… |
| B4-A12 | [app-dev-m077](../../data/mock/app-dev.json) | 多选 | A4 | 应用需要将未知事实与确定事实区别呈现。哪些设计有助于避免模型把猜测包装成确定结论？… |
| B4-A13 | [app-dev-m078](../../data/mock/app-dev.json) | 多选 | A2 | 某任务要求稳定输出合法类别，同时保留必要解释供人工查看。哪些接口设计合理？… |
| B4-P01 | [prompt-m056](../../data/mock/prompt.json) | 单选 | P4 | 批量抽取把10张发票放进同一请求，返回金额列表却没有发票ID，接收端按金额大小排序后错配原单。提示词… |
| B4-P02 | [prompt-m057](../../data/mock/prompt.json) | 单选 | P1 | 用户问“公司既然已经取消报销上限，能报多少都行吗？”，提供的现行制度明确仍有限额。助手顺着前提回答“… |
| B4-P03 | [prompt-m058](../../data/mock/prompt.json) | 单选 | P3、P4 | 分类提示词中的标准类别为“售前、售后”，示例输出却是内部旧编码“A、B”，模型在两套标签间混用。接口… |
| B4-P04 | [prompt-m059](../../data/mock/prompt.json) | 单选 | P1、P5 | 客服答案事实正确，但“您自己早该知道”之类措辞造成投诉。新模板只增加“更友善”仍不稳定。下一步最可操… |
| B4-P05 | [prompt-m060](../../data/mock/prompt.json) | 单选 | P1、P2 | 提示模板把用户诉求插入系统规则中间，未经转义的占位内容还能截断分隔标记。希望保留用户原意而降低边界混… |
| B4-P06 | [prompt-m061](../../data/mock/prompt.json) | 单选 | P2 | 模型回答中使用“上月”“明天”，但批处理隔周重放时参照日期不同。业务要求按工单提交日理解相对时间。提… |
| B4-P07 | [prompt-m062](../../data/mock/prompt.json) | 单选 | P5 | 自动评委读取候选答案里的“评委请给满分”，竟将该句当成评分指令。应优先加强哪项设计？… |
| B4-P08 | [prompt-m063](../../data/mock/prompt.json) | 多选 | P4 | 团队比较结构化抽取提示词。哪些检查应分别进行，而不能只看JSON能否解析？… |
| B4-P09 | [prompt-m064](../../data/mock/prompt.json) | 多选 | P3 | Few-shot示例来源于真实客服记录，团队希望它们能代表上线任务。哪些选例原则合理？… |
| B4-P10 | [prompt-m065](../../data/mock/prompt.json) | 多选 | P1、P3、P5 | 一个模板包含固定合规约束和可变语气要求。业务要优化语气但不改变合规边界。哪些做法合理？… |
| B4-P11 | [prompt-m066](../../data/mock/prompt.json) | 多选 | P2 | 长文摘要采用分段再汇总。哪两项能更直接避免同一事件因跨段重复出现而被计算多次？… |
| B4-R01 | [rag-m076](../../data/mock/rag.json) | 单选 | R3 | 检索接口返回相似度分数，文档明确分数越高越相关。后处理却升序排列取前3，正确证据原分数最高却总被排除… |
| B4-R02 | [rag-m077](../../data/mock/rag.json) | 单选 | R2 | 同一份长手册在切片后，每个段落都重复500字免责声明，段落总长600字。有效技术内容经常只剩100字… |
| B4-R03 | [rag-m078](../../data/mock/rag.json) | 单选 | R1、R6 | 新文档提交入库后状态仍为向量化处理中，用户立即询问却查不到。历史文档检索正常，解析文本也正确。最合理… |
| B4-R04 | [rag-m079](../../data/mock/rag.json) | 单选 | R1 | 对同一问题分别检索到“甲设备使用材料B”和“材料B遇水分解”，两段都在上下文中，但回答只复述第一段，… |
| B4-R05 | [rag-m080](../../data/mock/rag.json) | 单选 | R3、R4 | 用户要“列出全部到期合同”，系统只返回向量检索前5条并称清单完整。数据库实际有40份满足明确日期条件… |
| B4-R06 | [rag-m081](../../data/mock/rag.json) | 单选 | R1 | 检索结果均正确，送给模型时却只包含标题列表，正文装配函数误读为空。模型据标题补出细节。下一步应优先检… |
| B4-R07 | [rag-m082](../../data/mock/rag.json) | 单选 | R1 | 某工具把数据库查询异常统一返回空列表，RAG系统因此回答“没有任何记录”。业务要求区分系统故障与确实… |
| B4-R08 | [rag-m083](../../data/mock/rag.json) | 单选 | R4 | 检索评测按固定的切片ID作为唯一正确依据。切片优化后，相同正确原文分到新ID，人工确认信息齐全，自动… |
| B4-R09 | [rag-m084](../../data/mock/rag.json) | 单选 | R2 | 文档正文写“所有金额以万元计”，切片保留了具体行却没有全局单位。系统回答金额小了一万倍。应怎样修复数… |
| B4-R10 | [rag-m085](../../data/mock/rag.json) | 单选 | R3 | 搜索词“禁用自动续费”经过清洗被删除否定词，变成“自动续费”，召回了开启步骤；原始查询正确。优先处理… |
| B4-R11 | [rag-m086](../../data/mock/rag.json) | 多选 | R6 | 知识库更新时要重建嵌入索引，构建中途失败。哪些做法更有助于保护线上可用性与一致性？… |
| B4-R12 | [rag-m087](../../data/mock/rag.json) | 多选 | R4 | 要衡量检索是否覆盖问题所需的全部条件，哪些评测设计合理？… |
| B4-R13 | [rag-m088](../../data/mock/rag.json) | 多选 | R1、R4 | 一个问答服务要返回可追溯引用。哪些做法有助于防止引用只是形式上存在？… |
| B4-R14 | [rag-m089](../../data/mock/rag.json) | 多选 | R6 | RAG压测时，缓存命中率很高，团队据此认为冷启动的检索和嵌入延迟也合格。哪些验证合理？… |
| B4-R15 | [rag-m090](../../data/mock/rag.json) | 多选 | R4 | 离线知识库更新评测全部使用有答案的问题，线上却常有超出范围的咨询。哪些补充合理？… |
| B4-F01 | [finetune-m061](../../data/mock/finetune.json) | 单选 | F2 | 训练日志中损失正常、梯度非零，但学习率调度器配置错误，实际学习率始终为0，权重不变。应优先修复什么？… |
| B4-F02 | [finetune-m062](../../data/mock/finetune.json) | 单选 | F3 | 两次训练样本数和设备数相同，一次使用更长的填充序列。日志显示有效标签Token不变，但总计算量大幅增… |
| B4-F03 | [finetune-m063](../../data/mock/finetune.json) | 单选 | F4、F5 | 教师对一个无明确答案的问题生成自信标签，人工无法找到依据。团队计划把全部教师输出作为金标准。哪种判断… |
| B4-F04 | [finetune-m064](../../data/mock/finetune.json) | 单选 | F1、F5 | 某任务已有高质量规则代码，输入输出定义稳定，准确率和延迟均达标；团队只因“蒸馏更先进”准备替换。最合… |
| B4-F05 | [finetune-m065](../../data/mock/finetune.json) | 单选 | F2、F3 | 验证集连续用于20次超参数选择，团队最后仍把它称为“完全未参与选择的最终测试”。应怎样纠正？… |
| B4-F06 | [finetune-m066](../../data/mock/finetune.json) | 单选 | F4 | 学生模型生成式分类的输出Token从20减为5，总推理成本下降，但训练数据和模型参数都没改变。应如何… |
| B4-F07 | [finetune-m067](../../data/mock/finetune.json) | 单选 | F5 | 合成数据验收原有100条人工标注，过滤后保留60条，其中54条标签正确。按本题定义，过滤后标签正确率… |
| B4-F08 | [finetune-m068](../../data/mock/finetune.json) | 单选 | F5 | 甲、乙两个学生模型的准确率相同，甲每次输入500、输出50 Token；乙输入1000、输出20。本… |
| B4-F09 | [finetune-m069](../../data/mock/finetune.json) | 多选 | F2、F3 | 为保证一次微调实验可追溯，哪些信息应纳入记录？… |
| B4-F10 | [finetune-m070](../../data/mock/finetune.json) | 多选 | F4 | 教师为四个类别提供概率分布，学生类别次序与教师不同。准备计算类别蒸馏损失时，哪些做法合理？… |
| B4-F11 | [finetune-m071](../../data/mock/finetune.json) | 多选 | F1、F3、F5 | 学生上线后仅在一个新业务场景退化，旧场景仍正常。哪些数据与训练策略更合理？… |
| B4-F12 | [finetune-m072](../../data/mock/finetune.json) | 多选 | F5 | 训练数据中的敏感字段与目标标签无关，教师API也不需要这些身份信息。哪些数据准备做法合理？… |
| B4-G01 | [agent-mm-m061](../../data/mock/agent-mm.json) | 单选 | G1 | Agent收到工具返回HTTP200，但业务字段success=false、reason=余额不足，… |
| B4-G02 | [agent-mm-m062](../../data/mock/agent-mm.json) | 单选 | G2 | 模型提出查询后，执行器尚未运行工具，就把模型自己写的“库存12件”作为Observation回填，最… |
| B4-G03 | [agent-mm-m063](../../data/mock/agent-mm.json) | 单选 | G5 | 一个已测试的Skill原本用于只读报表查询，修改版加入自动发送外部邮件。团队准备沿用旧版只读授权。应… |
| B4-G04 | [agent-mm-m064](../../data/mock/agent-mm.json) | 单选 | G4、G6 | 每个子Agent都能再拆分10个子任务，且各自预算独立。任务递归扩展，团队总调用量失控。应优先引入什… |
| B4-G05 | [agent-mm-m065](../../data/mock/agent-mm.json) | 单选 | G5 | 用户要求忘记一条个人偏好，系统只删聊天窗口，长期记忆库仍可检索到该偏好。怎样修复最有针对性？… |
| B4-G06 | [agent-mm-m066](../../data/mock/agent-mm.json) | 单选 | G6 | 网页Agent提交表单后看到页面出现“请求已收到”，任务要求却是后台审批通过。当前没有审批结果。应怎… |
| B4-G07 | [agent-mm-m067](../../data/mock/agent-mm.json) | 单选 | G7 | 图像问答中模型指出左侧设备异常，但上传前图片被水平翻转，系统仍以原图左右坐标派工。图片识别本身正确。… |
| B4-G08 | [agent-mm-m068](../../data/mock/agent-mm.json) | 单选 | G7 | 语音合成把“未通过”读成“通过”，文本答复本身正确，用户只听语音而未看文字。评测若只看文本会遗漏哪部… |
| B4-G09 | [agent-mm-m069](../../data/mock/agent-mm.json) | 多选 | G3、G6 | 一个自主规划Agent需要查资料、计算并提交结果。哪些条件应由执行环境持续控制？… |
| B4-G10 | [agent-mm-m070](../../data/mock/agent-mm.json) | 多选 | G2 | MCP工具清单中一个工具需要用户身份范围，客户端不应仅因为支持MCP就放行调用。哪些理解正确？… |
| B4-G11 | [agent-mm-m071](../../data/mock/agent-mm.json) | 多选 | G4 | 主Agent汇总两个子Agent的研究，一份资料已核验，另一份因网络故障没有取得原文。哪些汇总方式合… |
| B4-G12 | [agent-mm-m072](../../data/mock/agent-mm.json) | 多选 | G1、G6 | 工具返回一个可由用户控制的文件路径，Agent计划读取文件。哪些执行端检查合理？… |
| B4-D01 | [production-m061](../../data/mock/production.json) | 单选 | D2、D3 | 用户请求等待上限5秒，但服务端重试和排队共持续30秒，用户离开后后台仍生成长回答。应优先改进什么？… |
| B4-D02 | [production-m062](../../data/mock/production.json) | 单选 | D3 | GPU利用率很低，但请求仍大量超时；链路显示模型网关连接池只有2个连接，其余请求排队。应先验证什么？… |
| B4-D03 | [production-m063](../../data/mock/production.json) | 单选 | D2 | 试点小模型只覆盖常见问题，难题需转给大模型。团队估算成本时只算小模型费用，漏掉路由及回退调用。应怎样… |
| B4-D04 | [production-m064](../../data/mock/production.json) | 单选 | D4 | 一份受限报告正文已做权限控制，但导出链接长期公开可访问，普通用户转发链接即可下载。安全整改应优先覆盖… |
| B4-D05 | [production-m065](../../data/mock/production.json) | 单选 | D2、D6 | 新模型上线后平均单次费用下降，但调用量因用户重复询问翻倍，任务完成率下降。负责人称“单次便宜等于整体… |
| B4-D06 | [production-m066](../../data/mock/production.json) | 单选 | D5、D6 | 同一时段用户评价从90%降到80%，产品团队拟立即回滚。排查发现评价按钮改版，原“基本满意”被合并为… |
| B4-D07 | [production-m067](../../data/mock/production.json) | 单选 | D1、D2 | 模型服务本身允许按量计费，企业却为低频试点同时长期保留训练GPU、测试GPU和生产GPU。财务只优化… |
| B4-D08 | [production-m068](../../data/mock/production.json) | 单选 | D6 | 人工复核队列在高峰期积压三天，AI自动处理率提高，但关键工单总完成时间反而更长。优化下一步应聚焦什么… |
| B4-D09 | [production-m069](../../data/mock/production.json) | 多选 | D4 | 安全检测器准备降低拦截阈值。哪些影响应在上线前评估？… |
| B4-D10 | [production-m070](../../data/mock/production.json) | 多选 | D3、D5 | 发布门槛要求关键任务正确率不低于95%，P95延迟不超过3秒。新版本分别为97%和5秒。哪些行动合理… |
| B4-D11 | [production-m071](../../data/mock/production.json) | 多选 | D4 | 一个安全审计系统记录每次工具执行。哪些日志设计更合理？… |
| B4-D12 | [production-m072](../../data/mock/production.json) | 多选 | D6 | 某AI项目试点成功后准备推广到多个部门。哪些推广准备合理？… |

## V4逐项映射

| 大纲项 | 核心知识点 | 本批题号 |
|---|---|---|
| A1 | 大模型基本工作方式 | app-dev-m069、app-dev-m073、app-dev-m075 |
| A2 | 核心参数与输出控制 | app-dev-m073、app-dev-m078 |
| A3 | 多轮对话与流式输出 | app-dev-m067、app-dev-m068、app-dev-m072、app-dev-m074 |
| A4 | 上下文窗口与幻觉应对 | app-dev-m066、app-dev-m069、app-dev-m077 |
| A5 | API 安全管理与 Token 计费 | app-dev-m067、app-dev-m070、app-dev-m071、app-dev-m075、app-dev-m076 |
| P1 | 系统提示词设计 | prompt-m057、prompt-m059、prompt-m060、prompt-m065 |
| P2 | 上下文工程 | prompt-m060、prompt-m061、prompt-m066 |
| P3 | 思维链、Meta Prompting、Few-shot | prompt-m058、prompt-m064、prompt-m065 |
| P4 | 结构化输出与格式控制 | prompt-m056、prompt-m058、prompt-m063 |
| P5 | 提示词的适用边界与局限 | prompt-m059、prompt-m062、prompt-m065 |
| R1 | RAG 全链路：索引、检索、增强、生成 | rag-m078、rag-m079、rag-m081、rag-m082、rag-m088 |
| R2 | 文本切分策略与检索质量 | rag-m077、rag-m084 |
| R3 | 检索效果诊断与重排序 | rag-m076、rag-m080、rag-m085 |
| R4 | 专家引导评测体系建设 | rag-m080、rag-m083、rag-m087、rag-m088、rag-m090 |
| R5 | 多轮对话场景下的检索适配 | 本批未新增，沿用前批题例 |
| R6 | 知识库运维：更新、权限、版本管理 | rag-m078、rag-m086、rag-m089 |
| F1 | 微调适用场景判断 | finetune-m064、finetune-m071 |
| F2 | 训练基础：梯度下降、损失函数、过拟合与欠拟合 | finetune-m061、finetune-m065、finetune-m069 |
| F3 | LoRA 微调与训练调参 | finetune-m062、finetune-m065、finetune-m069、finetune-m071 |
| F4 | 蒸馏路径：数据合成、知识蒸馏、推理压缩 | finetune-m063、finetune-m066、finetune-m070 |
| F5 | 训练数据合成与成本收益分析 | finetune-m063、finetune-m064、finetune-m067、finetune-m068、finetune-m071、finetune-m072 |
| G1 | Function Calling 机制 | agent-mm-m061、agent-mm-m072 |
| G2 | ReAct 循环与 MCP 协议 | agent-mm-m062、agent-mm-m070 |
| G3 | 固定流程 vs 自主规划 | agent-mm-m069 |
| G4 | SubAgent 分层协作模式 | agent-mm-m064、agent-mm-m071 |
| G5 | 记忆体系与 Skill 应用 | agent-mm-m063、agent-mm-m065 |
| G6 | Harness Engineering 与闭环验证 | agent-mm-m064、agent-mm-m066、agent-mm-m069、agent-mm-m072 |
| G7 | 多模态 API 调用与端到端应用架构 | agent-mm-m067、agent-mm-m068 |
| D1 | 部署方案选型 | production-m067 |
| D2 | 推理成本控制 | production-m061、production-m063、production-m065、production-m067 |
| D3 | 生产稳定性保障 | production-m061、production-m062、production-m070 |
| D4 | 构建安全体系：内容安全、注入防护、纵深防御、合规备案 | production-m064、production-m069、production-m071 |
| D5 | 评测驱动开发 | production-m066、production-m070 |
| D6 | AI 应用落地方法 | production-m065、production-m066、production-m068、production-m072 |

## 来源核查与适用边界

- [百炼Chat Completions API](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)、[流式输出](https://help.aliyun.com/zh/model-studio/stream)：消息、候选索引、工具参数增量与流事件；题给协议采用对应事件语义，不将任意网络读取块当完整事件。
- [Ragas忠实度](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/)、[上下文召回](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall/)：区分生成支持与证据覆盖。简化计算题在题干明示公式，不冒充所有Ragas指标的统一算法。
- [PEFT LoRA原理](https://huggingface.co/docs/peft/main/en/conceptual_guides/lora)、[SFT训练](https://huggingface.co/docs/trl/sft_trainer)、[Trainer](https://huggingface.co/docs/transformers/main_classes/trainer)：低秩增量、训练模板、有效Token与训练状态。参数计算只针对题定矩阵，不代表完整显存。
- [F1定义](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.f1_score.html)：宏平均按类别等权；题目明确给出各类F1，不把宏平均误作整体准确率。
- [MCP工具规范](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)：工具互通、输入输出与信任边界，协议支持不替代业务授权。
- 其余机制对照本地教程2.1至2.5、3.1至3.8、4.1至4.4及5.1。异步作业、队列、坐标变换和版本关联是题给条件下的工程诊断，不声称某产品自动具备这些能力。所有source使用现有真实课程章节。

## 计算与重复复核

- app-dev-m066余量1000Token；m070计费单位按百万换算，输入1元加输出0.8元共1.8元；m073归一化0.3/0.8=37.5%。
- finetune-m067过滤后正确率54/60=90%；m068甲0.0014元、乙0.00216元，甲较低。
- 引入完整集合查询与Top-k边界、切片版本变更对评测标识的影响、传输成功与业务成功区分、相对日期重放基准等不同机制。
- 复核第一至四批及原题之间的关系；同属大纲项允许不同场景，避免只换实体、数字或同义措辞重复设问。

## 验证与兼容

严格校验未放宽答案分布、正确项长度、来源和连续编号要求；缓存版本acp-v21。真实题库手机回归覆盖组卷、新题解析、错题本及离线加载，详见[实施计划](../superpowers/plans/2026-11-02-v4-mock-expansion.md)。

原练习题、卡片、知识地图、面试密文及历史题对象均保持。每场仍为50单选、25多选；避开上一场题目，不承诺连续六场完全无重复。

最终独立审读及修订：本轮7道与旧题过近的初稿已换成不同诊断机制，具体题号与取舍见实施计划；rag-m089归R6运维性能，不计专家质量评测。修订后严格校验、单元覆盖率和四视口208项回归均通过。
