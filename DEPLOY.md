# 部署到 Vercel

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

## 3. 生成凭据加密密钥

```bash
npm run keygen
```

**这把钥匙必须备份好。** 换掉之后，所有已接入节点的 `api_secret` 和已生成的 WHIP
stream key 全部解不开，只能让用户重新接入。

## 4. Vercel 环境变量

在 Vercel 项目 → Settings → Environment Variables 配置：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon pooled 连接串 |
| `CREDENTIAL_ENCRYPTION_KEY` | ✅ | 上一步生成的 32 字节 base64 |
| `SETUP_TOKEN` | 强烈建议 | 不设的话，谁先访问 `/setup` 谁就成了管理员 |
| `CRON_SECRET` | 建议 | 保护 `/api/cron/cleanup` |
| `NEXT_PUBLIC_APP_URL` | 可选 | 不设时从请求头推导，preview 部署反而更准 |

`NEXT_PUBLIC_*` 是**构建期内联**的。写死成生产域名后，preview 部署上回显的 webhook
地址会是错的——所以除非有固定自定义域名，建议干脆不设，让它按请求头推导。

## 5. 部署与初始化

推到 Git 即可，无需改构建命令。部署完成后：

1. 打开站点，会自动跳到 `/setup`
2. 填管理员账号 + 内置 LiveKit 节点凭据（保存前会实地打 LiveKit API 验证）
3. 复制页面回显的 webhook 地址，填到 LiveKit 控制台 → 项目 → Settings → Webhooks

每个节点的 webhook 地址都不同（路径里带 `nodeId`），因为验签要用该节点自己的密钥。
用户在控制台接入自己的节点后，那一行也会显示各自的 webhook 地址。

## 6. 定时清理

[vercel.json](vercel.json) 已配好每天一次的清理任务（清过期会话、旧的限流记录和 webhook
去重记录）。Vercel Hobby 计划的 cron **每天只能触发一次**，当前配置正好符合。

---

## 部署相关的已知约束

- **Vercel Hobby 禁止商业用途**。个人自用没问题；要做成对外服务得上 Pro。
- **Neon 免费版 100 CU-hours/月**。0.25 CU 满负荷约 400 小时，而一个月有 730 小时，
  所以**不能让实例常驻唤醒**。本项目已刻意规避：在线状态走 LiveKit SDK 事件 +
  webhook 落库，前端不轮询数据库。如果你之后加轮询，先算一下 CU 账。
- **所有 API 路由都声明了 `runtime = "nodejs"`**。scrypt、AES-GCM、LiveKit server SDK
  都要 Node 运行时，不能跑在 Edge 上。
- **审计日志用 `after()` 写入**。serverless 函数返回响应后可能立刻冻结，裸的
  fire-and-forget promise 会被丢掉；`after()` 保证它跑完。别改回 `void promise`。
- **数据库连接走 neon-http**（每条语句一次 HTTP，无常驻连接）。代价是**不支持交互式
  事务**，所以像首次初始化那种需要原子性的地方用了「条件 UPDATE / insert 抢锁」的写法，
  不要改成 `db.transaction` 里塞多步逻辑。
