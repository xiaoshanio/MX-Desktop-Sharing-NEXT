# 任务组

**状态：功能开发完成，可部署。** `npm run typecheck`、`npm test`（54 项，含 22 项跑在真 Postgres 上）、
`npm run build`（25 条路由，零环境变量裸构建）全部通过。

**只需两个环境变量**：`DATABASE_URL` + `ADMIN_PASSWORD`。

✅ = 已实现并验证，⬜ = 未做（末尾「有意不做」一节说明取舍）。

---

## G0 · 地基 ✅

- [x] Next.js 15 App Router + TypeScript strict + 路径别名 `@/*`
- [x] Neon HTTP driver + Drizzle ORM，**惰性初始化**（模块加载不碰 env，否则裸构建会挂）
- [x] 12 张表 + 迁移 `drizzle/0000_*.sql`、`drizzle/0001_*.sql`
- [x] 统一 route handler 包装与错误约定（`src/lib/http.ts`）
- [x] 凭据加密 AES-256-GCM（`src/lib/crypto.ts`）
- [x] 密码 scrypt + 定长比较（`src/lib/password.ts`）
- [x] Cookie 会话，库里只存 token 的 sha256
- [x] 分层：`validation.ts` 是零依赖纯 schema 模块，`parseOr400` 归 `http.ts`

## G1 · 零配置启动 ✅

- [x] **管理员账户自动创建**（`src/lib/bootstrap.ts`，在 login/health/me 惰性触发），
      邮箱取 `ADMIN_EMAIL`（默认 `admin@localhost`），密码取 `ADMIN_PASSWORD`
- [x] env 是密码的唯一事实来源：改了 `ADMIN_PASSWORD` 重启即生效
- [x] 用指纹比对避免每次冷启动都跑 scrypt（只在 env 变化时重新哈希写库）
- [x] 引导会确保管理员始终是「启用状态的 admin」，防止被误操作锁在门外
- [x] **加密密钥自动供给**：`CREDENTIAL_ENCRYPTION_KEY` 没设就生成一把存进
      `app_config`，抢占式插入 + 回读，避免并发冷启动各生成一把
- [x] 引导失败不抛出，站点仍能起来并给出可读错误
- [x] **登录/注册按原因分状态码**，不再让配置问题掉进笼统的 500：
      `503 not_configured`（库连不上/变量缺失）、`503 admin_not_configured`
      （`ADMIN_PASSWORD` 为空，账户压根没建）、`401 invalid_credentials`（密码不对）。
      入参校验排在配置闸门之前，所以坏参数照样回 400
- [x] `ADMIN_PASSWORD` 纯空白按未配置处理（`.env.example` 照抄下来忘填是最常见踩坑），
      过短只警告不阻断 —— 拦死会把人锁在门外
- [x] `emailSchema` 放宽到接受无点单标签域名，否则默认的 `admin@localhost`
      被 zod 的 `.email()` 判非法，账户建得出来却永远登不进去
- [x] 公开端点回显的底层错误一律过 `redactSecrets()`，避免抖出连接串里的口令
- [x] `/api/health` 加 `tables` 一项：拿 `information_schema` 对着 schema 推导出的表名
      做差集，直接列出缺哪几张，不靠猜报错字符串。表名从 schema 模块推导，不另维护清单
- [x] **`drizzle/meta/` 必须提交** —— 早期被 .gitignore 挡掉了，导致 clone 出来的仓库
      没有 `_journal.json`。drizzle-kit 遇到缺失的 journal 不报错，而是默默建一个
      entries 为空的（源码里的 `dryJournal`），于是 `npm run db:migrate` 一声不响地
      什么都不干、库里一张表都没有 —— 而文档让所有人跑这条命令。
      已重建 journal 并补上当前 schema 的 snapshot，`tests/migrations.test.mts`
      用真实 migrator + PGlite 守着（journal 缺失时会红）
- [x] **构建期自动跑迁移**（`scripts/migrate-on-build.mjs` 挂在 `build` 前面）：配好
      `DATABASE_URL` 推代码就建好表，不用本地操作。没配 `DATABASE_URL` 就跳过（沙箱/CI
      只想编译不该被数据库卡住），迁移报错则让构建失败 —— 宁可部署不出去，也别上线
      一个半残的库。**刻意不做「首次登录时初始化」**：serverless 可能多实例同时冷启动，
      而 neon-http 不支持交互式事务，并发 `CREATE TABLE` 会有一个炸在 already exists
      上、把库留在半残状态；构建期只有一个进程、每次部署一次，天然没有并发
- [x] `drizzle.config.ts` 借 `@next/env` 加载环境变量：drizzle-kit 自己只认 `.env`，
      不认 `.env.local`，而文档让大家把连接串写进 `.env.local` —— 照着做的人会撞上
      一句没头没尾的 `url: undefined`。顺手在缺 `DATABASE_URL` 时给出可操作的报错
- [x] `describeDbError()` 顺着 `cause` 链挖真实原因：drizzle 把驱动异常包进
      `DrizzleQueryError`，最外层的 message 只有 `Failed query: <SQL>\nparams: <参数>`，
      既没用又会把 SQL 和参数抖给公开端点。按 SQLSTATE（`42P01` 等）补可操作的指引
- [x] 「表不存在」类报错自动补一句「跑 npm run db:migrate」
- [x] 刻意**不用** `instrumentation.ts`：它会让 webpack 把 `node:crypto` 拖进不支持
      `node:` scheme 的编译目标，dev 下每个请求都 500（已实测确认并移除）
- [x] 引导与密钥加载都缓存 promise，失败不缓存以便重试
- [x] **`/api/health`** 逐项诊断缺哪个变量、数据库通不通、密钥来自哪里
- [x] 删掉了 `/setup` 向导和 `SETUP_TOKEN` —— 没有向导就没有「被人抢先初始化」的风险
- [x] 管理后台：改节点 `allowPublic`/`maxRooms`/启停，**把任一节点「设为内置」**
- [x] 用户管理：停用/启用、升降管理员；停用时连带作废其所有会话
- [x] 守卫：不能改自己的角色/状态；不能把最后一个管理员降级

## G2 · LiveKit 节点接入 ✅

- [x] `livekit_nodes` 区分 `builtin`/`user`，`api_secret` 加密存储
- [x] `POST /api/nodes` 接入，落库前体检
- [x] `POST /api/nodes/[id]` 重新体检并写回
- [x] **`PATCH /api/nodes/[id]` 改名 / 换密钥**（换密钥先体检，两个字段必须同时给）
- [x] `DELETE`：内置节点不可删，有活跃房间时拒绝
- [x] 体检区分能力：`listRooms` 失败=凭据错；`ingress` 失败只降级不阻断
- [x] 地址容错：`https://` 自动转 `wss://`、剥路径尾斜杠（有测试覆盖）
- [x] 「三分钟开一个免费 LiveKit Cloud 节点」内置引导
- [x] 每个节点在控制台显示各自的 webhook 地址（一键复制）
- [x] Secret 只写不读

## G3 · 房间与鉴权 ✅

- [x] 房间绑定节点，媒体流量与额度归该节点
- [x] 建房节点三选一：现场接新凭据 / 选已有 / 落到内置
- [x] `assertNodeUsable`：不能用别人的节点；内置受 `allowPublic`+`maxRooms` 约束
- [x] 房间码无歧义字母表、全库唯一，同时作 LiveKit room name（有测试）
- [x] 建房先 `ensureRoom`，客户端 token 无需 `roomCreate`
- [x] **签 token 是鉴权收口**：`requireMember` + `VideoGrant.room` 只写一个房间名
- [x] 非成员返回 404 而非 403，不让人拿房间码探测
- [x] 成员增删；踢人三步做全（删成员行 + `RemoveParticipant` + 删 ingress）
- [x] 关闭房间：清所有 ingress + `is_active=false`
- [x] **邀请链接**：`room_invites` 表，token 存哈希，支持有效期/次数上限/撤销
- [x] 兑换用条件 UPDATE 原子占名额，并发下 `max_uses` 不会被击穿
- [x] `/join/[token]` 落地页：未登录先跳登录（`next` 参数做了 open-redirect 防护）
- [x] **token 到期前 5 分钟自动续签**，长时间观看不再莫名掉线

## G4 · OBS 推流 ✅

- [x] 生成绑定「该用户+该房间」的 WHIP 地址，一人一址
- [x] **`enableTranscoding: false`** —— WHIP 直通，不吃 60 分钟/月的 transcode 额度
- [x] `?rotate=1` 重新生成、`DELETE` 撤销
- [x] `stream_key` 加密落库，只对本人解密回显，前端默认打码
- [x] identity 带 `obs:` 前缀，webhook 侧据此区分推流端/观众
- [x] 未撤销 ingress 每 (房间,用户) 只允许一条（partial unique index）
- [x] 节点 ingress 不可用时前端明确降级提示
- [x] `createRtmpIngress` 备用实现（protobuf oneof 写法正确）
- [x] OBS 配置指引 + 一键复制 + simulcast 说明（直通需 OBS 32.1.0+ 自行开启）

## G5 · 上线检测 ✅

- [x] `POST /api/webhooks/livekit/[nodeId]`，**路径带 nodeId**——验签要用该节点自己的密钥
- [x] `WebhookReceiver.receive()` 验 JWT 签名 + body 摘要
- [x] 校验房间确实属于该节点，防止跨节点污染状态
- [x] **事件去重**（`webhook_events` 主键冲突即跳过），LiveKit 重投不会写乱在线状态
- [x] `room_presence` upsert；`room_finished` 整房标下线
- [x] 前端在线状态走 SDK 事件，**不轮询数据库**（Neon CU-hours 考虑）

## G6 · 前端 ✅

- [x] `/` 分流、`/login`（登录/注册合一，支持 `next` 回跳，防 open redirect）
- [x] `/dashboard` 房间列表 + 建房（节点选择器）+ 节点管理 + webhook 地址
- [x] `/room/[code]` 画面（优先屏幕共享）+ OBS 面板 + 邀请面板 + 成员面板 + 日志面板
- [x] `/admin` 管理后台
- [x] `/join/[token]` 邀请落地页
- [x] **浏览器直接共享屏幕**（1920×1080@15fps，桌面共享优先分辨率而非帧率）
- [x] 复制组件（密钥默认打码）
- [x] **审计日志查看**（房间内可展开）

## G7 · 安全与运维 ✅

- [x] **登录限流**：邮箱 15 分钟 8 次 / IP 15 分钟 30 次，在校验密码之前拦截
- [x] 登录成功清空失败计数；对不存在的邮箱也走一遍 hash 防时序探测
- [x] 审计日志用 **`after()`** 写入——serverless 返回后会冻结，裸 promise 会丢
- [x] 审计不记录任何密钥
- [x] **定时清理**（`/api/cron/cleanup` + `vercel.json`）：过期会话、旧限流记录、旧去重记录
- [x] cron 端点用 `CRON_SECRET` 定长比较保护
- [x] **54 项测试**（`npm test`）：AES-GCM 往返/篡改检测、scrypt 往返/Unicode 归一化/畸形输入、零配置密钥供给路径、
      URL 归一化、房间码字符集与碰撞、schema 默认值与边界
- [x] 停用用户时连带作废会话

## 部署 ✅

- [x] 零环境变量裸构建通过（db 惰性化的直接结果）
- [x] 全部 25 条路由声明 `runtime = "nodejs"`
- [x] `vercel.json` cron（Hobby 每天一次的限制已适配）
- [x] webhook 地址在未设 `NEXT_PUBLIC_APP_URL` 时从请求头推导，preview 部署也正确
- [x] [DEPLOY.md](DEPLOY.md) 完整步骤与约束

---

## 有意不做（及原因）

- **密钥轮换工具**：`CREDENTIAL_ENCRYPTION_KEY` 换掉需要全表重新加密。做对需要
  双密钥并行期，工程量不小而收益低。当前策略是文档里反复强调备份。
- **额度看板**：LiveKit 的用量 API 与免费层可见性不稳定，做个会骗人的仪表盘不如不做。
  DEPLOY.md 和 README 里给了实算表，让人自己心里有数。
- **节点定时体检**：Hobby 版 cron 每天只能一次，一天一次的体检意义有限；
  控制台上的手动「检测」按钮更实用。升到 Pro 后值得加。
- **E2E 测试**：需要真实 LiveKit 项目和真实 Neon 库，跑在 CI 里要塞真凭据。
  当前把测试重心放在纯函数和安全原语上。

## 上线前仍需你决策的

1. **Vercel Hobby 禁止商业用途** —— 对外运营需上 Pro（$20/月）。
2. **Neon 免费版 100 CU-hours/月** —— 别加数据库轮询，会烧穿。
3. **`CREDENTIAL_ENCRYPTION_KEY` 的取舍** —— 默认自动生成存库（零配置），
   生产建议显式设置让密钥待在库外。**只能在还没接入任何节点时切换**。
