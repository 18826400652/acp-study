# ACP 备考站

阿里云「大模型高级工程师 ACP 认证」备考用的手机网页：速记卡片、分考点练习、模拟考（50 单选 + 25 多选，120 分钟）、错题本。可添加到安卓主屏，离线使用。

题库：约 300 道题（单选约 200、多选约 100），72 张速记卡片，按考试大纲权重覆盖 6 个考点。

> 题目根据 [aliyun_acp_learning](https://github.com/AlibabaCloudDocs/aliyun_acp_learning) 课程笔记（Apache-2.0）编写，**并非官方题库**。每题标注出处章节。

## 本地开发

    npm install
    npx playwright install chromium
    npm run serve          # http://localhost:5173/acp-study/
    npm test               # 单元测试
    npm run test:cov       # 覆盖率（≥ 80%）
    npm run validate       # 题库校验（单个考点：-- --domain <id>）
    npm run e2e            # 安卓视口端到端测试
    npm run size           # 体积预算

本地服务器默认只监听 `127.0.0.1`；用手机在同一 Wi-Fi 下访问，用 `HOST=0.0.0.0 npm run serve`。

## 发布

1. 修改题库或代码后运行 `npm run bump`，把 `sw.js` 的 `CACHE_VERSION` 加 1，否则手机上不会提示更新。
2. 跑通 `npm test`、`npm run validate`、`npm run e2e`。
3. `git push`，GitHub Pages 会在 1–2 分钟内生效。

## 数据

- `data/domains.json`：6 个考点、权重、目标题量、对应章节
- `data/questions/<考点>.json`、`data/cards/<考点>.json`：题目与卡片，格式见 `docs/specs/`
- **题目和卡片的 id 发布后不要修改**，进度记录靠 id 关联。

## 面试题库（加密）

面试题库的明文只在本机的面试准备目录里（下称 prep 目录，其中 `qbank/` 下是 A 到 H 共 8 个 md 文件）。仓库和线上站点只有密文 `data/interview.enc`。

**构建 / 更新**（在 PowerShell 里执行，密码不要写进任何文件）：

```powershell
$env:INTERVIEW_SRC = "<prep 目录>"
$s = Read-Host "密码" -AsSecureString
$env:INTERVIEW_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
npm run build:interview          # 改密码时加上 -- --new-salt
Remove-Item Env:INTERVIEW_PASSWORD
npm run bump                      # 发布前递增缓存版本
```

- 密码至少 12 个字符。密文是公开的，别人可以离线反复猜，密码强度是唯一的防线。
- 构建前会自动扫描仓库，发现题库原文就停止；**但自动扫描只覆盖每题的标题和"结论"部分的前 20 个字**（跳过太短或大半是英文的词条），"原理""我在项目里怎么做""取舍与局限"里出现的项目名、单位名、同事名等，自动扫描看不到。这些词只能靠 `<prep 目录>/qbank-app/leak-terms.txt` 里手工列出的敏感词覆盖，每行一个，只放在本机，请题库所有者自行补全。
- 同一个密码重复构建时，会沿用原来的 salt，手机上保存的密钥继续有效。改密码时加 `--new-salt`，手机上会重新要求输入密码。
- **旧密文会永久留在 git 历史里**，用旧密码仍然能解开。改密码并不能让旧内容失效。
- **恢复**：`npm run decrypt:interview -- <仓库外的目录>`，会写出 `interview-payload.json`。
- 设置 `INTERVIEW_SRC` 后运行 `npm test`，会额外对真实题库做一次防泄漏检查。
