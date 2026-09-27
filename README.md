# ACP 备考站

阿里云「大模型高级工程师 ACP 认证」备考用的手机网页：速记卡片、分考点练习、模拟考（50 单选 + 25 多选，120 分钟）、错题本。可添加到安卓主屏，离线使用。

> 题目根据 [aliyun_acp_learning](https://github.com/AlibabaCloudDocs/aliyun_acp_learning) 课程笔记（Apache-2.0）编写，**并非官方题库**。每题标注出处章节。

## 本地开发

    npm install
    npx playwright install chromium
    npm run serve          # http://localhost:5173/acp-study/
    npm test               # 单元测试
    npm run test:cov       # 覆盖率（≥ 80%）
    npm run validate       # 题库校验（题库补全前加 -- --allow-partial）
    npm run e2e            # 安卓视口端到端测试
    npm run size           # 体积预算

本地服务器默认只监听 `127.0.0.1`；用手机在同一 Wi-Fi 下访问，用 `HOST=0.0.0.0 npm run serve`。

## 发布

1. 修改题库或代码后，把 `sw.js` 里的 `CACHE_VERSION` 加 1（例如 `acp-v1` → `acp-v2`），否则手机上不会提示更新。
2. 跑通 `npm test`、`npm run validate`（题库补全前用 `npm run validate -- --allow-partial`）、`npm run e2e`。
3. `git push`，GitHub Pages 会在 1–2 分钟内生效。

## 数据

- `data/domains.json`：6 个考点、权重、目标题量、对应章节
- `data/questions/<考点>.json`、`data/cards/<考点>.json`：题目与卡片，格式见 `docs/specs/`
- **题目和卡片的 id 发布后不要修改**，进度记录靠 id 关联。
