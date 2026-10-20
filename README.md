# 知耕 · 2027考研复习

面向北京农学院341《农业知识综合三（智慧农业技术）》与821《现代农业与农业信息化》的个人复习系统。

**学生总结为主，所提供的最新考纲确定范围，教材辅助核对。** 已提供的两份考纲PDF内未标招生年份，本项目不将其擅自宣称为已经核验的2027官方新版本。学校若更新考纲，应先比较范围再调整题库。

## 已整理内容

| 模块 | 复习主题 | 考纲内练习 |
| --- | ---: | ---: |
| 341 程序设计 | 7 | 42 |
| 341 人工智能 | 11 | 40 |
| 341 农学概论 | 13 | 49 |
| 821 现代农业与农业信息化 | 14 | 82 |
| 合计 | 45 | 213 |

共258个题目条目：213道考纲内题、16道相关拓展、29道旧纲归档。其中123条来自历年回忆材料（包括缺题干条目和归档题），45道为考点整理题，90道为新编变式。**258不等于258道完整真题。**

- 20条考纲原文索引，包含821“考试要求”中的决策支持系统与专家系统。
- 每道整理题及回忆题标记考点编号、对应依据、来源、参考思路和范围状态。
- 7份学生资料拆为42个阅读章节，约40.9万字符，可按模块、来源和全文关键词搜索。
- 人工智能两个同名Word文件分别标注简短版、详细版；思维导图4页已阅读，选定易错点已添加辅助核对说明。
- 回忆题不补造缺失选项、数值和评分标准。重构题、新编变式有明确标识。
- 旧341的编程题按新纲保留，计算机网络和数据库专题归档。821中的同名技术按农业信息化背景单独判断。

## 使用方式

1. 从“模块学习”掌握答题骨架，再到“资料书架”展开原笔记。
2. 在题目详情里先写自己的答案，再展开参考要点与易错提醒。
3. 对照考纲原文，做同主题两道变式，练习更换条件和应用场景。
4. “主动回忆”按照到期题优先、新题随后生成队列。可单独复习待巩固题或收藏题。
5. 核对后选择还不会、有点模糊、基本会答、能举一反三，保存进度并安排下次复习。
6. 定期在“学习记录”导出JSON备份，换设备后导入合并。

主观题以自评为准，不提供AI判分；程序示例供阅读和练习，不在网页执行。默认复习队列仅包含“考纲内”题目。旧纲归档题保留题目与排除依据。

## 教材辅助核对范围

教材原PDF和截图不发布到仓库或网站；题目中提供已确认的定位和简短概念说明。

| 教材 | 已核对概念 | 书页 | PDF文件页（从1开始） |
| --- | --- | --- | --- |
| 李存东《农学概论》第二版 | 间作、混作、套作 | 216—217 | 225—226 |
| 王玉洁《农业信息化导论》 | 遥感机制与农业应用 | 79—81 | 91—93 |
| 同上 | GPS三部分及定位作用 | 81 | 93 |
| 同上 | 专家系统知识库、推理机及其他组成 | 256—257 | 268—269 |

仅以上概念完成了选页视觉核对，**没有完成全书或全部学生答案校订**。具体设备参数、历史统计、法规标准、发展现状等不能直接从旧资料当作当年事实背诵。原笔记和系统整理答案均不是官方标准答案。

## 本地运行

需要Node.js 20或更新版本，建议22。没有第三方运行依赖，无须`npm install`。

```sh
npm run build
npm run dev
```

打开 `http://127.0.0.1:4173`。修改源文件后重新运行构建并刷新页面。此 Node 静态预览不运行 Pages Functions，因此注册、登录和 WPS 写入需要在 Cloudflare Pages 上验证；题库正文可在本地预览。

构建输出在`dist/`。`dist/study-guide.md`为45个主题的复习提纲，`dist/question-index.md`为全部题目与考纲的对照索引。

## Cloudflare Pages发布

Cloudflare项目由使用者自行创建。本次代码提交不代表网站已经上线。

在Cloudflare的Workers & Pages页面选择创建应用，进入**Pages**，导入GitHub仓库`fuzong01-cloud/kaoyanfuxi`，填入：

| 设置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 框架预设 | `None` |
| 构建命令 | `npm run build` |
| 构建输出目录 | `dist` |
| 根目录 | 留空（仓库根目录） |
| 环境变量 | `NODE_VERSION=22`（如需显式指定） |

网站正文是静态资源，**需要执行构建**以生成题库JSON；不能直接把`public/`当完整成品。本站账号和 WPS 数据同步由`functions/`下的 Pages Functions 提供。无需安装 cloudflared 隧道。

保存并部署后，Cloudflare会给出实际`pages.dev`地址。后续推送main可自动构建发布。流程参考[Cloudflare静态HTML部署文档](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)。

如需 WPS 同步，请使用 GitHub 集成部署；Cloudflare 控制台的拖拽 Direct Upload 不支持 Pages Functions，因而不包含`/api/sync`后端。Cloudflare 官方说明见[Pages Functions 部署指南](https://developers.cloudflare.com/pages/functions/get-started/)。仅发布静态站点时，手工 Direct Upload 仍可用，但不启用云同步。

## 账号与 WPS 数据配置

考生注册的是**本站账号**，无需 WPS 账号。注册和登录由本站完成，复习进度按账号分别保存到一份由系统所有者授权的 WPS 多维表格中。系统所有者只需完成一次数据服务配置；不需要逐个审批或创建考生账号。

### 一次性系统配置

1. 登录 WPS 网页端，新建一份仅系统所有者持有的**多维表格**，创建名为`用户数据`的数据表。新建六个文本字段，名称严格为`user_id`、`username`、`username_key`、`password_salt`、`password_hash`、`payload`；`payload`选择多行文本。
2. 打开这份表格的 AirScript 编辑器，创建**文档共享脚本**，粘贴仓库中的[`wps/airscript-sync.js`](wps/airscript-sync.js)并保存，复制 webhook 地址。[WPS AirScript 脚本令牌与 webhook 说明](https://airsheet.wps.cn/docs/apitoken/intro.html)、[多维表记录 API](https://airsheet.wps.cn/docs/api/dbsheet/Record.html)
3. 在 WPS AirScript 编辑器生成个人脚本令牌。WPS 要求账号完成实名认证；令牌默认有效期为180天，可延期。脚本令牌和 webhook 能访问这份表格，请像密码一样保管。
4. 在 Cloudflare Pages 项目 **Settings → Variables and Secrets** 的生产环境设置以下变量。`WPS_SCRIPT_TOKEN`和`SESSION_SECRET`都设为 Secret；会话密钥需使用至少32个字符的随机值。

| 变量 | 值 |
| --- | --- |
| `WPS_SYNC_URL` | AirScript 文档共享脚本 HTTPS webhook 地址 |
| `WPS_SCRIPT_TOKEN` | WPS AirScript 个人脚本令牌（Secret） |
| `SESSION_SECRET` | 至少32字符的随机会话签名密钥（Secret） |

5. 保存并重新部署 Pages。部署后，考生即可在登录页注册用户名和密码；登录后，进度会自动同步到对应的 WPS 用户行。Cloudflare Pages 必须通过 Git 集成部署以启用`functions/api/auth.js`和`functions/api/sync.js`。

本站使用 PBKDF2 对密码加盐哈希后再写入 WPS，不保存明文密码。会话使用 HttpOnly Cookie；用户进度按本站账号 ID 隔离。忘记密码暂不支持自助找回。原来未绑定账号的本机记录在该浏览器首次登录后转入第一个登录的本站账号；建议共用设备前先导出备份。

## 数据与隐私

学习进度包括自评、草稿、笔记、收藏、每日目标；登录用户会在当前浏览器保存一份，并同步到 WPS 中按账号隔离的记录。WPS 表格所有者能够查看表格内的账号名、密码哈希和学习数据。退出登录不会删除云端记录；如需删除账号数据，需由系统所有者在 WPS 表格中清理。清除浏览器数据不会删除云端记录。JSON备份也含个人笔记，请自行保管。

WPS 脚本令牌只存在 Cloudflare Pages Secret 中，前端源码不包含这些凭证。复习评价按较新的评价合并，笔记和草稿按本地编辑时间合并，收藏取并集，历史记录去重；同一笔记在多台设备同时改动时，较晚同步的内容可能覆盖较早版本，重要记录请保留 JSON 备份。

“稳定掌握”表示间隔阶段达到3且最近自评至少“基本会答”，并非考试成绩预测。到期提醒仅在打开网站时显示，无后台通知。

## 内容维护

| 文件 | 用途 |
| --- | --- |
| `data/syllabus.mjs` | 考纲原文、模块、来源清单 |
| `data/topics.mjs` | 45个主题、答题骨架、易错点、变式 |
| `data/recalls.mjs` | 历年回忆条目及范围判断 |
| `data/evidence.mjs` | 教材定位与思维导图核对说明 |
| `data/examples.mjs` | Java示例 |
| `data/library.json` | 学生原笔记阅读章节 |
| `public/app.js` | 界面、筛选、学习流程 |
| `public/progress-model.js` | 间隔复习与备份合并 |
| `functions/api/auth.js` | 本站账号注册、登录和会话接口 |
| `functions/api/sync.js` | Cloudflare Pages Function：按账号同步 WPS 数据 |
| `functions/_utils/wps.js` | WPS 调用与签名会话工具 |
| `wps/airscript-sync.js` | 需要粘贴到 WPS 的 AirScript 共享脚本 |
| `public/style.css` | 电脑和手机样式 |
| `tools/build.mjs` | 构建静态文件和离线提纲 |
| `wrangler.toml` | Pages输出目录配置 |

新增或校正题目时保留既有题目ID，避免已有进度失联。更新考纲须同时更新映射依据与范围状态。原学生笔记不是逐题校订的题库，阅读章节覆盖量不能当作考纲掌握率。
