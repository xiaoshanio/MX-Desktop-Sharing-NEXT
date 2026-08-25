# 部署到 Vercel

## 环境变量：只有两个必填

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon pooled 连接串 |
| `ADMIN_PASSWORD` | ✅ | 首次启动自动创建管理员账户。**必须非空**，空字符串等于没设 |
| `ADMIN_EMAIL` | | 管理员邮箱，默认 `admin@localhost`（可以直接用它登录） |
| `CREDENTIAL_ENCRYPTION_KEY` | | 不填则自动生成并存入数据库（见下） |
| `NEXT_PUBLIC_APP_URL` | | 不填则从请求头推导，preview 部署反而更准 |
| `CRON_SECRET` | | 保护 `/api/cron/cleanup` |

**LiveKit 不需要任何环境变量** —— 节点在网页里配。

### 写在 .env.local 里要不要加引号

不用。`DATABASE_URL=postgresql://...` 和 `DATABASE_URL="postgresql://..."` 解析结果完全一样，
引号会被剥掉，`?` `&` `@` `/` 都不用转义。

**唯一的例外是 `#`**：不加引号时它会被当成行内注释，从 `#` 开始的部分被静默丢掉，
不报任何错。密码里带 `#` 就必须加引号。另外不加引号时首尾空白会被 trim，加了则原样保留。

注意 Next 只读 `.env` 和 `.env.local`，**不读 `.env.example`** —— 那是模板，
改它本身不生效。必须先复制成 `.env.local`。

## 1. 准备 Neon 数据库

Neon 控制台建 project → Connection string → 勾 **Pooled connection**，形如：

```
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

建议把 Neon 的 region 选在和 Vercel 函数同一地区，跨区每条查询要多花几十毫秒。

## 2. 建表

迁移**不在** Vercel 构建时跑（每次部署都跑迁移会在并发构建下打架）。本地对着生产库执行一次：

```bash
DATABASE_URL="<你的 Neon 连接串>" npm run db:migrate
```

**这一步漏掉是最常见的翻车点，而且症状很有迷惑性**：连接是好的，但凡是碰到表的接口
全挂。因为「连得上」和「建过表」是两件独立的事。`/api/health` 的 `tables` 那一项
专门查这个，会直接列出缺哪几张表。

## 3. 部署

在 Vercel 配好 `DATABASE_URL` 和 `ADMIN_PASSWORD`，推到 Git 即可，无需改构建命令。

第一个需要数据库的请求会惰性触发一次启动引导（`src/lib/bootstrap.ts`），完成：

- 创建管理员账户（邮箱取 `ADMIN_EMAIL`，默认 `admin@localhost`）
- 供给凭据加密密钥（`CREDENTIAL_ENCRYPTION_KEY` 没设就生成一把存进数据库）

两步都是幂等的，每次冷启动都会校验，但只在需要时写库。引导刻意**不**放在
`instrumentation.ts` 里 —— 那会把 `node:crypto` 拖进不支持 `node:` 前缀的编译目标，
dev 下每个请求都 500。

## 4. 登录并配置 LiveKit 节点

用 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 登录 → 侧栏「LiveKit 节点」→「接入节点」，填 LiveKit
的 URL / API Key / API Secret（怎么拿见 [README](README.md#部署一个-livekit-节点)）。

想让**所有用户**共享这个节点，到 `/admin` 把它「设为内置」并设个房间上限。
不设内置节点也完全可以用 —— 那样每个用户都得接自己的 LiveKit 项目，
这其实是更推荐的模式（额度各烧各的）。

## 5. 配 webhook

「LiveKit 节点」页面里每个节点下方会显示它专属的回调地址，复制到 LiveKit 控制台 → 项目 →
Settings → Webhooks。每个节点地址不同，因为验签要用该节点自己的密钥。

## 6. 定时清理

[vercel.json](vercel.json) 已配好每天一次的清理任务。Vercel Hobby 计划的 cron
**每天只能触发一次**，当前配置正好符合。

## 排查

**任何配置问题都先看 `/api/health`** —— 它按依赖顺序逐项检查，前面没过就跳过后面，
所以永远只需要修最上面那个红的：

| 检查项 | 查什么 |
| --- | --- |
| `databaseUrl` | 环境变量有没有设 |
| `database` | 能不能连上（`select 1`） |
| `tables` | **12 张表建没建**，缺哪几张会列出来 |
| `adminPassword` | 有没有设，空字符串算没设 |
| `bootstrap` | 管理员账户和加密密钥就绪没 |

不需要登录。回显的驱动错误会先顺着 cause 链挖出真实原因、按 SQLSTATE 补一句
可操作的指引，并抹掉连接串里的口令。

登录接口按失败原因分开了状态码，照着对：

| 返回 | 含义 | 怎么修 |
| --- | --- | --- |
| `503 not_configured` | 库连不上、表没建，或必填变量缺失 | 看 `/api/health` 最上面那个红的 |
| `503 admin_not_configured` | 库和表都好，但 `ADMIN_PASSWORD` 为空，管理员账户压根没建 | 设一个非空值再重启 |
| `401 invalid_credentials` | 账户存在，密码不对 | 改 `ADMIN_PASSWORD` 后重启会自动同步 |
| `429 rate_limited` | 同一邮箱 15 分钟内失败 8 次（或同 IP 30 次） | 等 15 分钟 |
| `500 internal` | 剩下的意外情况 | 看服务端日志里的 `[api] 未捕获异常` |

改了 `ADMIN_PASSWORD` 想生效？重新部署（或触发一次冷启动）即可，引导会检测到
指纹变化并同步新密码。


---

## 关于自动生成的加密密钥

节点的 `api_secret` 和 WHIP stream key 都以 AES-256-GCM 加密存储。密钥来源两种：

- **设了 `CREDENTIAL_ENCRYPTION_KEY`**：密钥待在数据库之外，隔离性最好。生产建议这样。
- **没设（默认）**：首次启动生成一把存进 `app_config` 表。**零配置可用**，但密钥和
  密文在同一个库里 —— 能挡住日志泄露、单表导出、截图这类局部泄露，挡不住整库被拖。

这是「开箱即用」和「密钥隔离」之间的取舍，默认选了前者。要切换到前一种，
用 `npm run keygen` 生成后填入环境变量 —— 但**只能在还没接入任何节点时切换**，
否则已存的凭据会解不开（没有轮换工具）。

## 其他部署约束

- **Vercel Hobby 禁止商业用途**。个人自用没问题；要做成对外服务得上 Pro。
- **Neon 免费版 100 CU-hours/月**。0.25 CU 满负荷约 400 小时，而一个月有 730 小时，
  所以**不能让实例常驻唤醒**。本项目已刻意规避：在线状态走 LiveKit SDK 事件 +
  webhook 落库，前端不轮询数据库。如果你之后加轮询，先算一下 CU 账。
- **所有 API 路由都声明了 `runtime = "nodejs"`**。scrypt、AES-GCM、LiveKit server SDK
  都要 Node 运行时，不能跑在 Edge 上。
- **审计日志用 `after()` 写入**。serverless 函数返回响应后可能立刻冻结，裸的
  fire-and-forget promise 会被丢掉；`after()` 保证它跑完。别改回 `void promise`。
- **数据库连接走 neon-http**（每条语句一次 HTTP，无常驻连接）。代价是**不支持交互式
  事务**，所以需要原子性的地方用了「条件 UPDATE / insert 抢锁」的写法，
  不要改成 `db.transaction` 里塞多步逻辑。
